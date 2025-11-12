import React, { useEffect, useState } from "react";
import axios from "axios";
import { fetchJobs, fetchJobDetails } from "../api/jobApi";
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

  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const { isAuthenticated } = useAuth();

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
    const loadJobs = async () => {
      try {
        setLoading(true);
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
      }
    };

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

  const handleApply = (job, details) => {
    if (!isAuthenticated) {
      if (
        window.confirm("Please sign in with Google to apply. Continue to login?")
      ) {
        loginWithGoogle();
      }
      return;
    }

    const applyLink =
      details?.job_apply_link || job.raw?.job_apply_link || job.raw?.applyLink;

    if (applyLink) {
      window.open(applyLink, "_blank", "noopener,noreferrer");
    } else {
      alert("Application link not available for this job yet.");
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
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            🚀 Available Jobs
          </h1>
          <p className="mt-2 text-gray-600">
            Showing openings from Saarthix and trusted partners.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          {/* Search Bar - Left Side */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search jobs by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            />
            <div className="pointer-events-none absolute right-3 top-2.5 text-gray-400">
              🔍
            </div>
          </div>

          {/* Filter Options - Right Side */}
          <div className="flex gap-3 flex-wrap">
            {/* Source Filter */}
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              <option value="All">📍 All Sources</option>
              <option value="Local">📍 Local</option>
              <option value="External">📍 External</option>
            </select>

            {/* Location Filter */}
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location === "All" ? "📌 All Locations" : `📌 ${location}`}
                </option>
              ))}
            </select>

            {/* Company Filter */}
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              {companies.map((company) => (
                <option key={company} value={company}>
                  {company === "All" ? "🏢 All Companies" : `🏢 ${company}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Counter */}
        {(searchQuery || filterSource !== "All" || filterLocation !== "All" || filterCompany !== "All") && (
          <p className="mb-4 text-sm text-gray-600">
            Found <span className="font-semibold text-gray-900">{filteredJobs.length}</span> job{filteredJobs.length !== 1 ? "s" : ""} matching your filters
          </p>
        )}

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-6 text-center text-yellow-700">
            No jobs found. Please try again later.
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-6 text-center text-yellow-700">
            No jobs match your search. Try different keywords.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="flex h-full flex-col rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-lg"
              >
                <div className="flex-1">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      {job.source}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {job.title}
                  </h2>
                  <p className="mt-2 text-blue-600 font-medium">
                    {job.company || "Company confidential"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    📍 {job.location || "Location not specified"}
                  </p>
                  {job.description && (
                    <p className="mt-3 line-clamp-3 text-sm text-gray-600">
                      {job.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleViewDetails(job)}
                  className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 text-2xl text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ×
            </button>

            <div className="max-h-[80vh] overflow-y-auto p-6 sm:p-8">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
                  {selectedJob.source}
                </span>
                {detailsLoading && (
                  <span className="text-sm text-gray-500">
                    Fetching latest details...
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-900">
                {jobDetails?.job_title || selectedJob.title}
              </h2>
              <p className="mt-2 text-blue-600 text-lg font-semibold">
                {jobDetails?.employer_name || selectedJob.company}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                📍{" "}
                {[
                  jobDetails?.job_city || selectedJob.raw?.job_city,
                  jobDetails?.job_country || selectedJob.raw?.job_country,
                  selectedJob.location,
                ]
                  .filter(Boolean)
                  .join(", ") || "Location not specified"}
              </p>

              {detailsError && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {detailsError}
                </div>
              )}

              {detailsLoading ? (
                <div className="mt-6 flex justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
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
                      <div className="rounded-md bg-green-50 px-4 py-3 text-green-700">
                        💰{" "}
                        {jobDetails?.job_min_salary
                          ? `$${jobDetails.job_min_salary.toLocaleString()}`
                          : "N/A"}{" "}
                        -{" "}
                        {jobDetails?.job_max_salary
                          ? `$${jobDetails.job_max_salary.toLocaleString()}`
                          : "N/A"}{" "}
                        {jobDetails?.job_salary_currency || "USD"}
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => handleApply(selectedJob, jobDetails)}
                      className={`flex-1 rounded-md px-6 py-3 text-sm font-semibold transition ${
                        isAuthenticated
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      {isAuthenticated ? "Apply Now" : "Login to Apply"}
                    </button>

                    {jobDetails?.job_apply_link && (
                      <a
                        href={jobDetails.job_apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-md border border-blue-600 px-6 py-3 text-center text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                      >
                        View Original Posting
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
