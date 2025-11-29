import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { fetchJobs, fetchJobDetails } from "../api/jobApi";
import { loginWithGoogle } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import JobApplicationForm from "./JobApplicationForm";

// Component to format and display job description in an organized way
function FormattedJobDescription({ description }) {
  if (!description || description === "No description available.") {
    return (
      <p className="text-gray-500 italic text-sm">No description available.</p>
    );
  }

  // Function to parse and organize the description
  const parseDescription = (desc) => {
    // First, try to extract text from HTML while preserving line breaks
    let textOnly = desc;
    
    // Replace common HTML list tags with markers
    textOnly = textOnly.replace(/<ul[^>]*>/gi, '\n').replace(/<\/ul>/gi, '\n');
    textOnly = textOnly.replace(/<ol[^>]*>/gi, '\n').replace(/<\/ol>/gi, '\n');
    textOnly = textOnly.replace(/<li[^>]*>/gi, '• ').replace(/<\/li>/gi, '\n');
    textOnly = textOnly.replace(/<p[^>]*>/gi, '\n').replace(/<\/p>/gi, '\n');
    textOnly = textOnly.replace(/<br\s*\/?>/gi, '\n');
    textOnly = textOnly.replace(/<div[^>]*>/gi, '\n').replace(/<\/div>/gi, '\n');
    textOnly = textOnly.replace(/<h[1-6][^>]*>/gi, '\n### ').replace(/<\/h[1-6]>/gi, '\n');
    textOnly = textOnly.replace(/<strong[^>]*>/gi, '**').replace(/<\/strong>/gi, '**');
    textOnly = textOnly.replace(/<b[^>]*>/gi, '**').replace(/<\/b>/gi, '**');
    textOnly = textOnly.replace(/<em[^>]*>/gi, '*').replace(/<\/em>/gi, '*');
    textOnly = textOnly.replace(/<i[^>]*>/gi, '*').replace(/<\/i>/gi, '*');
    
    // Remove remaining HTML tags
    textOnly = textOnly.replace(/<[^>]*>/g, '');
    
    // Clean up whitespace but preserve line breaks
    textOnly = textOnly.replace(/[ \t]+/g, ' '); // Multiple spaces to single
    textOnly = textOnly.replace(/\n{3,}/g, '\n\n'); // Multiple newlines to double
    textOnly = textOnly.trim();
    
    // Common section headers to look for (improved patterns)
    const sectionPatterns = [
      { pattern: /(?:^|\n)\s*(?:about\s+(?:the\s+)?(?:role|position|job)|overview|summary|introduction|job\s+summary)[:•\-]?\s*/i, title: "About the Role" },
      { pattern: /(?:^|\n)\s*(?:responsibilities|what\s+you'?ll\s+do|key\s+responsibilities|duties|role\s+and\s+responsibilities|what\s+we\s+do)[:•\-]?\s*/i, title: "Responsibilities" },
      { pattern: /(?:^|\n)\s*(?:requirements|qualifications|what\s+we'?re\s+looking\s+for|must\s+have|required|skills?\s+required|key\s+requirements)[:•\-]?\s*/i, title: "Requirements" },
      { pattern: /(?:^|\n)\s*(?:preferred|nice\s+to\s+have|bonus|additional|pluses?)[:•\-]?\s*/i, title: "Preferred Qualifications" },
      { pattern: /(?:^|\n)\s*(?:benefits?|perks?|what\s+we\s+offer|compensation|salary|rewards?)[:•\-]?\s*/i, title: "Benefits & Perks" },
      { pattern: /(?:^|\n)\s*(?:education|degree|academic|bachelor|master|phd)[:•\-]?\s*/i, title: "Education" },
      { pattern: /(?:^|\n)\s*(?:experience|years?\s+of\s+experience|work\s+experience|professional\s+experience)[:•\-]?\s*/i, title: "Experience" },
    ];

    // Try to split by common patterns
    let sections = [];
    let remainingText = textOnly;

    // Find all section headers
    const foundSections = [];
    sectionPatterns.forEach(({ pattern, title }) => {
      const match = remainingText.search(pattern);
      if (match !== -1) {
        foundSections.push({ index: match, title, pattern });
      }
    });

    // Sort by index
    foundSections.sort((a, b) => a.index - b.index);

    // If we found sections, split accordingly
    if (foundSections.length > 0) {
      foundSections.forEach((section, idx) => {
        const startIndex = section.index;
        const endIndex = idx < foundSections.length - 1 ? foundSections[idx + 1].index : remainingText.length;
        let content = remainingText.substring(startIndex, endIndex)
          .replace(section.pattern, '')
          .trim();
        
        // Split content into items (by bullets, numbers, or lines)
        const items = content.split(/\n+/)
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.match(/^###/)); // Remove empty and headers
        
        if (items.length > 0) {
          sections.push({ title: section.title, content: items });
        }
      });
      
      // Add content before first section if any
      if (foundSections[0].index > 0) {
        const intro = remainingText.substring(0, foundSections[0].index).trim();
        if (intro.length > 20) { // Only if substantial content
          sections.unshift({ title: "Job Overview", content: [intro] });
        }
      }
    }

    // If no sections found, try to split by bullet points or numbered lists
    if (sections.length === 0) {
      // Check if it's a bullet list (look for lines starting with bullets)
      const lines = textOnly.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const bulletLines = lines.filter(line => 
        /^[•·▪▫◦‣⁃\-\*]\s/.test(line) || 
        /^\d+[\.\)]\s/.test(line) ||
        line.startsWith('•') || 
        line.startsWith('-') ||
        line.startsWith('*')
      );
      
      if (bulletLines.length > 2) {
        // It's a list, organize by context
        const listItems = bulletLines.map(item => 
          item.replace(/^[•·▪▫◦‣⁃\-\*\d+\.\)]\s*/, '').trim()
        ).filter(item => item.length > 0);
        
        // Try to group by keywords
        const responsibilities = [];
        const requirements = [];
        const benefits = [];
        const other = [];

        listItems.forEach(item => {
          const lower = item.toLowerCase();
          if (lower.includes('responsibilit') || lower.includes('develop') || lower.includes('build') || 
              lower.includes('create') || lower.includes('design') || lower.includes('implement') ||
              lower.includes('maintain') || lower.includes('collaborate') || lower.includes('work with')) {
            responsibilities.push(item);
          } else if (lower.includes('requirement') || lower.includes('qualification') || 
                     lower.includes('experience') || lower.includes('skill') || lower.includes('degree') ||
                     lower.includes('bachelor') || lower.includes('master') || lower.includes('years') ||
                     lower.includes('proficient') || lower.includes('knowledge') || lower.includes('familiar')) {
            requirements.push(item);
          } else if (lower.includes('benefit') || lower.includes('perk') || lower.includes('salary') ||
                     lower.includes('compensation') || lower.includes('insurance') || lower.includes('remote') ||
                     lower.includes('health') || lower.includes('vacation') || lower.includes('pto')) {
            benefits.push(item);
          } else {
            other.push(item);
          }
        });

        if (responsibilities.length > 0) sections.push({ title: "Responsibilities", content: responsibilities });
        if (requirements.length > 0) sections.push({ title: "Requirements", content: requirements });
        if (benefits.length > 0) sections.push({ title: "Benefits & Perks", content: benefits });
        if (other.length > 0 && other.length < 10) sections.push({ title: "Additional Information", content: other });
        if (other.length >= 10) {
          // Too many items, split into responsibilities and requirements
          const split = Math.ceil(other.length / 2);
          if (sections.length === 0) {
            sections.push({ title: "Key Points", content: other.slice(0, split) });
            sections.push({ title: "Additional Details", content: other.slice(split) });
          } else {
            sections.push({ title: "Additional Information", content: other });
          }
        }
      } else {
        // Just plain text, split into paragraphs
        const paragraphs = lines.filter(p => p.length > 20); // Only substantial paragraphs
        if (paragraphs.length > 1) {
          sections.push({ title: "Job Overview", content: paragraphs });
        } else {
          sections.push({ title: "Job Description", content: [textOnly] });
        }
      }
    }

    // If still no sections, just return the text as a single section
    if (sections.length === 0) {
      sections.push({ title: "Job Description", content: [textOnly] });
    }

    return sections;
  };

  const sections = parseDescription(description);

  return (
    <div className="space-y-6">
      {sections.map((section, sectionIdx) => (
        <div key={sectionIdx} className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
          <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {section.title}
          </h4>
          <div className="space-y-2.5 ml-10">
            {Array.isArray(section.content) ? (
              section.content.map((item, itemIdx) => (
                <div key={itemIdx} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed group hover:bg-blue-50/50 rounded-md p-2 -m-2 transition-colors">
                  <span className="text-blue-500 mt-1.5 flex-shrink-0 font-bold">•</span>
                  <span className="flex-1">{item}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{section.content}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

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
        raw: {
          ...job,
          skills: job.skills || [],
          employmentType: job.employmentType,
          jobMinSalary: job.jobMinSalary,
          jobMaxSalary: job.jobMaxSalary,
          jobSalaryCurrency: job.jobSalaryCurrency,
          createdAt: job.createdAt,
        },
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
        job_employment_type: job.raw?.employmentType || job.raw?.employmentType || "",
        job_min_salary: job.raw?.job_min_salary || job.raw?.jobMinSalary,
        job_max_salary: job.raw?.job_max_salary || job.raw?.jobMaxSalary,
        job_salary_currency: job.raw?.job_salary_currency || job.raw?.jobSalaryCurrency || "USD",
        job_posted_at_datetime_utc: job.raw?.createdAt,
        skills: job.raw?.skills || [],
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

            <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
              {/* Header Section */}
              <div className="mb-6 flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  selectedJob.source === 'Local' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {selectedJob.source}
                </span>
                {detailsLoading && (
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                    Loading details...
                  </span>
                )}
              </div>

              {/* Job Title */}
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {jobDetails?.job_title || selectedJob.title}
              </h2>

              {/* Company Name */}
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-lg text-gray-700 font-semibold">
                  {jobDetails?.employer_name || selectedJob.company}
                </p>
              </div>

              {detailsError && (
                <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {detailsError}
                </div>
              )}

              {detailsLoading ? (
                <div className="mt-8 flex justify-center py-12">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Key Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
                    {/* Location - Fixed to show only once */}
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</p>
                        <p className="text-sm font-medium text-gray-900">
                          {(() => {
                            const locationParts = [
                              jobDetails?.job_city,
                              jobDetails?.job_country,
                              selectedJob.location && !jobDetails?.job_city ? selectedJob.location : null
                            ].filter(Boolean);
                            return locationParts.length > 0 ? locationParts.join(", ") : "Location not specified";
                          })()}
                        </p>
                      </div>
                    </div>

                    {/* Employment Type */}
                    {(jobDetails?.job_employment_type || selectedJob.raw?.employmentType) && (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Employment Type</p>
                          <p className="text-sm font-medium text-gray-900">
                            {jobDetails?.job_employment_type || selectedJob.raw?.employmentType}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Salary Range */}
                    {(jobDetails?.job_min_salary || jobDetails?.job_max_salary || selectedJob.raw?.jobMinSalary || selectedJob.raw?.jobMaxSalary) && (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Salary Range</p>
                          <p className="text-sm font-medium text-gray-900">
                            {(() => {
                              const minSalary = jobDetails?.job_min_salary || selectedJob.raw?.jobMinSalary;
                              const maxSalary = jobDetails?.job_max_salary || selectedJob.raw?.jobMaxSalary;
                              const currency = jobDetails?.job_salary_currency || selectedJob.raw?.jobSalaryCurrency || "USD";
                              if (minSalary && maxSalary) {
                                return `${currency === "USD" ? "$" : currency} ${minSalary.toLocaleString()} - ${maxSalary.toLocaleString()}`;
                              } else if (minSalary) {
                                return `${currency === "USD" ? "$" : currency} ${minSalary.toLocaleString()}+`;
                              } else if (maxSalary) {
                                return `Up to ${currency === "USD" ? "$" : currency} ${maxSalary.toLocaleString()}`;
                              }
                              return "Salary not specified";
                            })()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Posted Date */}
                    {(jobDetails?.job_posted_at_datetime_utc || selectedJob.raw?.createdAt) && (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Posted Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {(() => {
                              const dateStr = jobDetails?.job_posted_at_datetime_utc || selectedJob.raw?.createdAt;
                              if (dateStr) {
                                try {
                                  const date = new Date(dateStr);
                                  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                                } catch {
                                  return dateStr;
                                }
                              }
                              return "Date not available";
                            })()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Skills Section */}
                  {((jobDetails?.skills && jobDetails.skills.length > 0) || (selectedJob.raw?.skills && selectedJob.raw.skills.length > 0)) && (
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h3 className="text-lg font-bold text-gray-900">Required Skills</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {((jobDetails?.skills || selectedJob.raw?.skills) || []).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-sm font-medium text-blue-700 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Job Description */}
                  <div className="p-5 bg-white rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-lg font-bold text-gray-900">Job Description</h3>
                    </div>
                    <FormattedJobDescription 
                      description={jobDetails?.job_description || selectedJob.description || "No description available."}
                    />
                  </div>

                  {/* Job Highlights (for external jobs) */}
                  {jobDetails?.job_highlights && (
                    <div className="p-5 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <h3 className="text-lg font-bold text-gray-900">Job Highlights</h3>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(jobDetails.job_highlights).map(([key, values]) => (
                          <div key={key}>
                            <p className="font-semibold text-gray-900 mb-2 capitalize flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              {key.replace(/_/g, " ")}
                            </p>
                            <ul className="ml-6 space-y-1.5">
                              {Array.isArray(values) ? (
                                values.map((value, idx) => (
                                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="text-amber-600 mt-1.5">•</span>
                                    <span>{value}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-amber-600 mt-1.5">•</span>
                                  <span>{values}</span>
                                </li>
                              )}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Apply Buttons */}
                  {!isIndustry && (
                    <div className="pt-4 flex flex-col gap-3 sm:flex-row">
                      {selectedJob.source === "External" ? (
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
                        <button
                          onClick={() => handleApply(selectedJob, jobDetails)}
                          className={`flex-1 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 ${
                            isAuthenticated
                              ? "bg-gray-900 text-white hover:bg-gray-800"
                              : "bg-gray-300 text-gray-600 cursor-not-allowed shadow-none hover:translate-y-0"
                          }`}
                          disabled={!isAuthenticated}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {isAuthenticated ? "Apply Now" : "Sign in to Apply"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
