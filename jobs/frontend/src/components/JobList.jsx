import React, { useEffect, useState } from 'react';
import { fetchJobs, fetchJobDetails } from '../api/jobApi';

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      const data = await fetchJobs('software developer jobs in India');
      setJobs(data);
      setLoading(false);
    };
    loadJobs();
  }, []);

  const handleJobClick = async (jobId) => {
    const details = await fetchJobDetails(jobId);
    setSelectedJob(details);
  };

  if (loading) return <p className="text-center text-lg mt-8">Loading jobs...</p>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">🧑‍💻 Latest Developer Jobs</h1>

      <div className="grid gap-4">
        {jobs.map((job) => (
          <div
            key={job.job_id}
            className="p-4 border rounded-lg shadow-md hover:shadow-lg cursor-pointer"
            onClick={() => handleJobClick(job.job_id)}
          >
            <h2 className="text-xl font-semibold">{job.job_title}</h2>
            <p className="text-gray-700">{job.employer_name}</p>
            <p className="text-sm text-gray-500">{job.job_city}, {job.job_country}</p>
          </div>
        ))}
      </div>

      {selectedJob && (
        <div className="mt-8 p-6 border rounded-lg bg-gray-50">
          <h2 className="text-2xl font-semibold">{selectedJob.job_title}</h2>
          <p className="text-gray-700">{selectedJob.job_description}</p>
          <p className="mt-2 text-sm text-gray-500">
            Location: {selectedJob.job_city}, {selectedJob.job_country}
          </p>
          <a
            href={selectedJob.job_apply_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Apply Now
          </a>
        </div>
      )}
    </div>
  );
}
