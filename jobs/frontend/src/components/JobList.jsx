import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { fetchJobs, fetchJobDetails } from "../api/jobApi";
import { loginWithGoogle } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import JobApplicationForm from "./JobApplicationForm";

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
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [jobToApply, setJobToApply] = useState(null);

  const { isAuthenticated, isIndustry } = useAuth();

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
  // Normalize and deduplicate locations
  const uniqueLocations = new Set();
  jobs.forEach((job) => {
    if (job.location && job.location.trim()) {
      uniqueLocations.add(job.location.trim());
    }
  });
  const locations = ["All", ...Array.from(uniqueLocations).sort()];

  // Normalize and deduplicate companies (case-insensitive)
  const companyMap = new Map();
  jobs.forEach((job) => {
    if (job.company && job.company.trim()) {
      const normalized = job.company.trim();
      const lowerKey = normalized.toLowerCase();
      // Keep the first occurrence with original casing
      if (!companyMap.has(lowerKey)) {
        companyMap.set(lowerKey, normalized);
      }
    }
  });
  const companies = ["All", ...Array.from(companyMap.values()).sort((a, b) => a.localeCompare(b))];

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

  const handleApply = (job, details) => {
    // For external jobs, redirect to the company's website
    if (job.source === "External") {
      const applyLink = details?.job_apply_link || job.raw?.job_apply_link || job.raw?.apply_link;
      if (applyLink) {
        window.open(applyLink, '_blank', 'noopener,noreferrer');
        toast.info("Redirecting to company website...", {
          position: "top-right",
          autoClose: 2000,
        });
        return;
      } else {
        toast.warning("Application link not available for this job.", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }
    }

    // For local jobs, show application form (requires authentication)
    if (!isAuthenticated) {
      if (
        window.confirm("Please sign in with Google to apply. Continue to login?")
      ) {
        loginWithGoogle();
      }
      return;
    }

    // Show application form for local jobs only
    setJobToApply({ ...job, details });
    setShowApplicationForm(true);
  };

  const handleApplicationSuccess = () => {
    setShowApplicationForm(false);
    setJobToApply(null);
    closeModal();
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            Job Opportunities
          </h1>
          <p className="mt-2 text-gray-600 text-base font-light">
            Explore positions from Saarthix and partner organizations.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-10 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-fadeIn">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            {/* Search Bar - Left Side */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white pl-12 pr-4 py-3 text-sm text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
              />
            </div>

            {/* Filter Options - Right Side */}
            <div className="flex gap-3 flex-wrap items-end">
              {/* Source Filter */}
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
              >
                <option value="All">All Sources</option>
                <option value="Local">Local</option>
                <option value="External">External</option>
              </select>

              {/* Location Filter */}
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
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
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm hover:shadow-md"
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
                className="rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-900 transition-all duration-200 disabled:cursor-not-allowed shadow-sm hover:shadow-md disabled:shadow-none"
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
          <div className="mb-6 bg-white rounded-xl border border-gray-200 px-5 py-3 shadow-sm animate-fadeIn">
            <p className="text-sm text-gray-700 font-medium">
              Found <span className="font-bold text-gray-900 text-base">{filteredJobs.length}</span> job{filteredJobs.length !== 1 ? "s" : ""} matching your filters
            </p>
          </div>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job, index) => (
              <div
                key={job.id}
                className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 hover:border-gray-300 hover:shadow-xl hover-lift animate-fadeIn"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex-1">
                  <div className="mb-5 flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg ${
                      job.source === 'Local' 
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                        : 'text-blue-700 bg-blue-50 border border-blue-200'
                    }`}>
                      {job.source}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight">
                    {job.title}
                  </h2>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-gray-800 font-semibold text-sm">
                      {job.company || "Company confidential"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mb-5">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm text-gray-600">
                      {job.location || "Location not specified"}
                    </p>
                  </div>
                  {job.description && (
                    <p className="line-clamp-3 text-sm text-gray-600 leading-relaxed">
                      {job.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleViewDetails(job)}
                  className="mt-6 w-full rounded-xl bg-gray-900 hover:bg-gray-800 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl animate-slideIn border border-gray-100">
            <button
              onClick={closeModal}
              className="absolute right-5 top-5 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-200 flex items-center justify-center text-xl font-light shadow-sm hover:shadow-md"
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

                  {/* Only show Apply buttons if user is not an industry user */}
                  {!isIndustry && (
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      {selectedJob.source === "External" ? (
                        // For external jobs, show button to apply on company website
                        <>
                          <button
                            onClick={() => handleApply(selectedJob, jobDetails)}
                            className="flex-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700 px-6 py-3.5 text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Apply on Company Website
                          </button>
                          {jobDetails?.job_apply_link && (
                            <a
                              href={jobDetails.job_apply_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 px-6 py-3.5 text-center text-sm font-semibold text-gray-900 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Original Posting
                            </a>
                          )}
                        </>
                      ) : (
                        // For local jobs, show application form button
                        <button
                          onClick={() => handleApply(selectedJob, jobDetails)}
                          className={`flex-1 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                            isAuthenticated
                              ? "bg-gray-900 text-white hover:bg-gray-800"
                              : "bg-gray-300 text-gray-600 cursor-not-allowed shadow-none hover:translate-y-0"
                          }`}
                          disabled={!isAuthenticated}
                        >
                          {isAuthenticated ? "Apply Now" : "Sign in to Apply"}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Application Form Modal */}
      {showApplicationForm && jobToApply && (
        <JobApplicationForm
          job={jobToApply}
          onClose={() => {
            setShowApplicationForm(false);
            setJobToApply(null);
          }}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
}
