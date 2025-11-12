package com.saarthix.jobs.service;

import com.saarthix.jobs.model.Job;
import com.saarthix.jobs.repository.JobRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

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
}
