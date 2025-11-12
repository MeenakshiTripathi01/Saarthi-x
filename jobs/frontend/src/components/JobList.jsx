import React, { useEffect, useState } from "react";
import axios from "axios";
import { fetchJobs } from "../api/jobApi"; // <-- this is your RapidAPI helper

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        // Fetch jobs from MongoDB backend
        const localResponse = await axios.get("http://localhost:8080/api/jobs");

        // Fetch jobs from RapidAPI
        const externalJobs = await fetchJobs("software developer in India");

        // ✅ Normalize both datasets (because RapidAPI fields differ)
        const localJobs = localResponse.data.map((job) => ({
          id: job.id,
          title: job.title,
          description: job.description,
          company: job.company,
          location: job.location,
          source: "Local", // mark source
        }));

        const rapidJobs = externalJobs.map((job) => ({
          id: job.job_id,
          title: job.job_title,
          description: job.job_description,
          company: job.employer_name,
          location: `${job.job_city || ""}, ${job.job_country || ""}`,
          source: "External", // mark source
        }));

        // ✅ Combine both
        setJobs([...localJobs, ...rapidJobs]);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  if (loading) return <p className="text-center mt-4">Loading jobs...</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">
        🚀 Available Jobs
      </h1>

      {jobs.length === 0 ? (
        <p className="text-center text-gray-600">No jobs found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-4 bg-white shadow-md rounded-lg hover:shadow-lg transition"
            >
              <h2 className="text-lg font-semibold">{job.title}</h2>
              <p className="text-gray-700">{job.company}</p>
              <p className="text-sm text-gray-500 mb-2">{job.location}</p>
              <p className="text-sm text-gray-600">
                {job.description?.slice(0, 100)}...
              </p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                  {job.source}
                </span>
                <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
