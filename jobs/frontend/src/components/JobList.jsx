import React, { useEffect, useState } from "react";
import axios from "axios";
import { fetchJobs, fetchJobDetails } from "../api/jobApi";
import { loginWithGoogle } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        setError(null);

        const [localResponse, externalJobs] = await Promise.all([
          axios.get("http://localhost:8080/api/jobs", {
            withCredentials: true,
          }),
          fetchJobs("software developer in India"),
        ]);

        const localJobs = (localResponse.data || []).map((job, idx) => ({
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

        const rapidJobs = (externalJobs || []).map((job) => ({
          id: job.job_id,
          title: job.job_title,
          description: job.job_description,
          company: job.employer_name,
          location: [job.job_city, job.job_country].filter(Boolean).join(", "),
          source: "External",
          raw: job,
        }));

        setJobs([...localJobs, ...rapidJobs]);
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

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-6 text-center text-yellow-700">
            No jobs found. Please try again later.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
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
