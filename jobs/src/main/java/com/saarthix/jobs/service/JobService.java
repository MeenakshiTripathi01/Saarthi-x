package com.saarthix.jobs.service;

import com.saarthix.jobs.model.Job;
import com.saarthix.jobs.model.UserProfile;
import com.saarthix.jobs.repository.JobRepository;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class JobService {

    private final JobRepository jobRepository;

    public JobService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    // Get all jobs
    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    // Get job by ID
    public Optional<Job> getJobById(String id) {
        return jobRepository.findById(id);
    }

    // Create new job
    public Job createJob(Job job) {
        return jobRepository.save(job);
    }

    // Update existing job
    public Job updateJob(String id, Job updatedJob) {
        return jobRepository.findById(id).map(job -> {
            job.setTitle(updatedJob.getTitle());
            job.setDescription(updatedJob.getDescription());
            job.setCompany(updatedJob.getCompany());
            job.setLocation(updatedJob.getLocation());
            job.setPostedBy(updatedJob.getPostedBy());
            job.setActive(updatedJob.isActive());
            job.setSkills(updatedJob.getSkills());
            job.setIndustry(updatedJob.getIndustry());
            job.setEmploymentType(updatedJob.getEmploymentType());
            job.setJobMinSalary(updatedJob.getJobMinSalary());
            job.setJobMaxSalary(updatedJob.getJobMaxSalary());
            job.setJobSalaryCurrency(updatedJob.getJobSalaryCurrency());
            return jobRepository.save(job);
        }).orElseThrow(() -> new RuntimeException("Job not found with id: " + id));
    }

    // Delete job
    public void deleteJob(String id) {
        if (!jobRepository.existsById(id)) {
            throw new RuntimeException("Job not found with id: " + id);
        }
        jobRepository.deleteById(id);
    }

    /**
     * Get recommended jobs for an applicant based on their skills and location preferences
     */
    public List<Map<String, Object>> getRecommendedJobs(UserProfile userProfile) {
        List<Job> allJobs = jobRepository.findAll();
        
        // Extract user preferences
        List<String> userSkills = userProfile.getSkills() != null ? 
            userProfile.getSkills().stream()
                .map(String::toLowerCase)
                .collect(Collectors.toList()) : new ArrayList<>();
        
        List<String> preferredLocations = userProfile.getPreferredLocations() != null ? 
            userProfile.getPreferredLocations().stream()
                .map(String::toLowerCase)
                .collect(Collectors.toList()) : new ArrayList<>();
        
        // Add single preferred location if it exists
        if (userProfile.getPreferredLocation() != null && !userProfile.getPreferredLocation().isEmpty()) {
            preferredLocations.add(userProfile.getPreferredLocation().toLowerCase());
        }
        
        // Add current location if no preferred locations
        if (preferredLocations.isEmpty() && userProfile.getCurrentLocation() != null) {
            preferredLocations.add(userProfile.getCurrentLocation().toLowerCase());
        }

        // Calculate match percentage for each job
        List<Map<String, Object>> jobsWithMatch = allJobs.stream()
            .map(job -> {
                double matchPercentage = calculateJobMatch(job, userSkills, preferredLocations);
                Map<String, Object> jobWithMatch = new HashMap<>();
                jobWithMatch.put("job", job);
                jobWithMatch.put("matchPercentage", matchPercentage);
                return jobWithMatch;
            })
            .filter(jobMap -> (double) jobMap.get("matchPercentage") > 0)
            .sorted((a, b) -> Double.compare((double) b.get("matchPercentage"), (double) a.get("matchPercentage")))
            .collect(Collectors.toList());

        return jobsWithMatch;
    }

    /**
     * Calculate match percentage between a job and user profile
     */
    private double calculateJobMatch(Job job, List<String> userSkills, List<String> preferredLocations) {
        double matchScore = 0.0;
        double maxScore = 100.0;

        // Skills matching (60% weight)
        double skillsMatchScore = calculateSkillsMatch(job, userSkills);
        matchScore += skillsMatchScore * 0.60;

        // Location matching (40% weight)
        double locationMatchScore = calculateLocationMatch(job, preferredLocations);
        matchScore += locationMatchScore * 0.40;

        return Math.min(matchScore, maxScore); // Cap at 100%
    }

    /**
     * Calculate skills match percentage
     */
    private double calculateSkillsMatch(Job job, List<String> userSkills) {
        if (userSkills == null || userSkills.isEmpty()) {
            return 0.0;
        }

        List<String> jobSkills = job.getSkills() != null ? 
            job.getSkills().stream()
                .map(String::toLowerCase)
                .collect(Collectors.toList()) : new ArrayList<>();

        if (jobSkills.isEmpty()) {
            return 50.0; // Partial credit if job doesn't list skills
        }

        // Calculate percentage of job skills that match user skills
        long matchedSkills = jobSkills.stream()
            .filter(skill -> userSkills.stream()
                .anyMatch(userSkill -> skill.contains(userSkill.trim()) || userSkill.contains(skill.trim())))
            .count();

        return (matchedSkills / (double) jobSkills.size()) * 100.0;
    }

    /**
     * Calculate location match percentage
     */
    private double calculateLocationMatch(Job job, List<String> preferredLocations) {
        if (preferredLocations == null || preferredLocations.isEmpty()) {
            return 50.0; // Neutral score if no preferences
        }

        String jobLocation = job.getLocation() != null ? job.getLocation().toLowerCase() : "";
        
        // Check for exact or partial location match
        boolean isLocationMatch = preferredLocations.stream()
            .anyMatch(loc -> jobLocation.contains(loc) || loc.contains(jobLocation));

        // Check for remote opportunities if user has no location specified
        if (!isLocationMatch && jobLocation.contains("remote")) {
            return 75.0;
        }

        return isLocationMatch ? 100.0 : 0.0;
    }
}
