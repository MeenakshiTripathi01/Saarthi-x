import React, { useEffect, useState } from "react";
import axios from "axios";
import { fetchJobs, fetchJobDetails, recordJobApplication } from "../api/jobApi";
import { loginWithGoogle } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");
  const [filterCompany, setFilterCompany] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const { isAuthenticated } = useAuth();

  // Define loadJobs outside useEffect so it can be called manually
  const loadJobs = async () => {
    try {
      if (!refreshing) setLoading(true);
      setError(null);

      const [localResult, externalResult] = await Promise.allSettled([
        axios.get("http://localhost:8080/api/jobs", {
          withCredentials: true,
        }),
        fetchJobs("software developer in India"),
      ]);

      const localData =
        localResult.status === "fulfilled" ? localResult.value.data : [];
      const externalJobs =
        externalResult.status === "fulfilled" ? externalResult.value : [];
      console.log(localData, externalJobs);

      const localJobs = (Array.isArray(localData) ? localData : []).map(
        (job, idx) => ({
        id:
          job.id ??
          job._id ??
          `local-${idx}-${Math.random().toString(36).slice(2, 8)}`,
        title: job.title,
        description: job.description,
        company: job.company,
        location: job.location || "Remote",
        source: "Local",
        raw: job,
      }));

      const rapidJobs = (Array.isArray(externalJobs) ? externalJobs : []).map((job) => ({
        id: job.job_id,
        title: job.job_title,
        description: job.job_description,
        company: job.employer_name,
        location: [job.job_city, job.job_country].filter(Boolean).join(", "),
        source: "External",
        raw: job,
      }));

      setJobs([...localJobs, ...rapidJobs]);

      if (
        localResult.status === "rejected" &&
        externalResult.status === "fulfilled"
      ) {
        console.warn("Failed to load local jobs:", localResult.reason);
      }
      if (
        externalResult.status === "rejected" &&
        localResult.status === "fulfilled"
      ) {
        console.warn("Failed to load external jobs:", externalResult.reason);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Unable to load jobs right now. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
  };

  // Get unique locations and companies from jobs
  const locations = ["All", ...new Set(jobs.map((job) => job.location))];
  const companies = ["All", ...new Set(jobs.map((job) => job.company).filter(Boolean))];

  // Filter jobs based on search query, source, location, and company
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = filterSource === "All" || job.source === filterSource;
    const matchesLocation = filterLocation === "All" || job.location === filterLocation;
    const matchesCompany = filterCompany === "All" || job.company === filterCompany;
    return matchesSearch && matchesSource && matchesLocation && matchesCompany;
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const handleViewDetails = async (job) => {
    setSelectedJob(job);
    setJobDetails(null);
    setDetailsError(null);

    if (job.source !== "External") {
      setJobDetails({
        job_title: job.title,
        job_description: job.description,
        employer_name: job.company,
        job_city: job.location,
        job_country: "",
        job_apply_link: job.raw?.applyLink || "",
        job_employment_type: job.raw?.employmentType || "",
        job_min_salary: job.raw?.job_min_salary,
        job_max_salary: job.raw?.job_max_salary,
        job_salary_currency: job.raw?.job_salary_currency,
        job_posted_at_datetime_utc: job.raw?.createdAt,
      });
      return;
    }

    setDetailsLoading(true);
    try {
      const details = await fetchJobDetails(job.id);
      if (details) {
        setJobDetails(details);
      } else {
        setDetailsError("No additional details available for this job.");
      }
    } catch (err) {
      console.error("Failed to load job details:", err);
      setDetailsError("Failed to load job details. Please try again.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleApply = async (job, details) => {
    if (!isAuthenticated) {
      if (
        window.confirm("Please sign in with Google to apply. Continue to login?")
      ) {
        loginWithGoogle();
      }
      return;
    }

    try {
      console.log("Recording application for job:", job.id);
      
      // Record application in tracker
      try {
        const response = await recordJobApplication({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
        });
        console.log("Application recorded successfully in database:", response);
      } catch (apiError) {
        console.error("API Error recording application:", apiError);
        const errorMessage = apiError.response?.data?.message || apiError.response?.data || apiError.message;
        console.error("Error details:", errorMessage);
        
        // Show specific error message to user
        if (apiError.response?.status === 401) {
          alert("Please sign in to apply for jobs.");
          return;
        } else if (apiError.response?.status === 403) {
          alert("Only job seekers can apply to jobs. Please update your profile.");
          return;
        } else if (apiError.response?.status === 400) {
          alert("You have already applied to this job.");
          return;
        }
        
        // Fallback: Save to local storage if API fails
        const localApplications = JSON.parse(localStorage.getItem("localApplications") || "[]");
        const newApplication = {
          id: `local_${job.id}_${Date.now()}`,
          jobId: job.id,
          jobTitle: job.title,
          company: job.company || "Company confidential",
          location: job.location || "Location not specified",
          jobDescription: job.description || "",
          status: "pending",
          appliedAt: new Date().toISOString(),
          isLocal: true,
        };
        localApplications.push(newApplication);
        localStorage.setItem("localApplications", JSON.stringify(localApplications));
        console.log("Application saved to local storage as fallback");
        alert("⚠️ Application saved locally. Please check your connection and try again later.");
      }

      // Show success message
      alert("✅ Application recorded! You can track it in 'My Applications'");

      // Open application link if available
      const applyLink =
        details?.job_apply_link || job.raw?.job_apply_link || job.raw?.applyLink;

      if (applyLink) {
        window.open(applyLink, "_blank", "noopener,noreferrer");
      } else {
        console.log("No application link available for job:", job.id);
      }
      
      // Close the modal after successful apply
      setTimeout(() => {
        closeModal();
      }, 500);
    } catch (error) {
      console.error("Unexpected error in handleApply:", error);
      alert("Application recorded but there was an issue. Please refresh and check 'My Applications'");
    }
  };

  const closeModal = () => {
    setSelectedJob(null);
    setJobDetails(null);
    setDetailsError(null);
    setDetailsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 text-sm">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Job Opportunities
          </h1>
          <p className="mt-2 text-gray-600 text-sm">
            Explore positions from Saarthix and partner organizations.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            {/* Search Bar - Left Side */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>

            {/* Filter Options - Right Side */}
            <div className="flex gap-2 flex-wrap items-end">
              {/* Source Filter */}
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                <option value="All">All Sources</option>
                <option value="Local">Local</option>
                <option value="External">External</option>
              </select>

              {/* Location Filter */}
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location === "All" ? "All Locations" : location}
                  </option>
                ))}
              </select>

              {/* Company Filter */}
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                {companies.map((company) => (
                  <option key={company} value={company}>
                    {company === "All" ? "All Companies" : company}
                  </option>
                ))}
              </select>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-900 transition disabled:cursor-not-allowed"
                title="Refresh jobs list"
              >
                {refreshing ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent"></div>
                  </span>
                ) : (
                  "Refresh"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        {(searchQuery || filterSource !== "All" || filterLocation !== "All" || filterCompany !== "All") && (
          <p className="mb-4 text-sm text-gray-600">
            Found <span className="font-semibold text-gray-900">{filteredJobs.length}</span> job{filteredJobs.length !== 1 ? "s" : ""} matching your filters
          </p>
        )}

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm">
            {error}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-md border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600 text-sm">No jobs available at the moment. Please check back later.</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-md border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600 text-sm">No jobs match your search criteria. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-6 transition hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex-1">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-100 px-2.5 py-1 rounded">
                      {job.source}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {job.title}
                  </h2>
                  <p className="text-gray-700 font-medium text-sm mb-1">
                    {job.company || "Company confidential"}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {job.location || "Location not specified"}
                  </p>
                  {job.description && (
                    <p className="line-clamp-2 text-sm text-gray-600">
                      {job.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleViewDetails(job)}
                  className="mt-6 w-full rounded-md bg-gray-800 hover:bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 text-3xl text-gray-400 hover:text-gray-600 transition"
              aria-label="Close"
            >
              ×
            </button>

            <div className="max-h-[80vh] overflow-y-auto p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {selectedJob.source}
                </span>
                {detailsLoading && (
                  <span className="text-sm text-gray-500">
                    Loading details...
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {jobDetails?.job_title || selectedJob.title}
              </h2>
              <p className="text-lg text-gray-700 font-semibold mb-1">
                {jobDetails?.employer_name || selectedJob.company}
              </p>
              <p className="text-sm text-gray-600 mb-6">
                {[
                  jobDetails?.job_city || selectedJob.raw?.job_city,
                  jobDetails?.job_country || selectedJob.raw?.job_country,
                  selectedJob.location,
                ]
                  .filter(Boolean)
                  .join(", ") || "Location not specified"}
              </p>

              {detailsError && (
                <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {detailsError}
                </div>
              )}

              {detailsLoading ? (
                <div className="mt-6 flex justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-transparent"></div>
                </div>
              ) : (
                <>
                  <div className="mt-6 space-y-4 text-sm text-gray-700">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html:
                          jobDetails?.job_description ||
                          selectedJob.description ||
                          "No description available.",
                      }}
                    />

                    {jobDetails?.job_highlights && (
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Highlights
                        </h3>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                          {Object.entries(jobDetails.job_highlights).map(
                            ([key, values]) => (
                              <li key={key}>
                                <span className="font-medium capitalize">
                                  {key}:
                                </span>{" "}
                                {Array.isArray(values)
                                  ? values.join(", ")
                                  : values}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {(jobDetails?.job_min_salary ||
                      jobDetails?.job_max_salary) && (
                      <div className="rounded-md bg-gray-100 px-4 py-3">
                        <span className="font-semibold text-gray-900">
                          {jobDetails?.job_min_salary
                            ? `$${jobDetails.job_min_salary.toLocaleString()}`
                            : "N/A"}{" "}
                          -{" "}
                          {jobDetails?.job_max_salary
                            ? `$${jobDetails.job_max_salary.toLocaleString()}`
                            : "N/A"}{" "}
                          {jobDetails?.job_salary_currency || "USD"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => handleApply(selectedJob, jobDetails)}
                      className={`flex-1 rounded-md px-6 py-3 text-sm font-semibold transition ${
                        isAuthenticated
                          ? "bg-gray-800 text-white hover:bg-gray-900"
                          : "bg-gray-300 text-gray-600 cursor-not-allowed"
                      }`}
                      disabled={!isAuthenticated}
                    >
                      {isAuthenticated ? "Apply Now" : "Sign in to Apply"}
                    </button>

                    {jobDetails?.job_apply_link && (
                      <a
                        href={jobDetails.job_apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-md border border-gray-400 px-6 py-3 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                      >
                        View Original
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
