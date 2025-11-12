package com.saarthix.jobs.controller;

import com.saarthix.jobs.model.Job;
import com.saarthix.jobs.repository.JobRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class JobController {

    private final JobRepository jobRepository;

    public JobController(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    // ✅ GET all jobs (public)
    @GetMapping
    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    // ✅ GET a single job by ID
    @GetMapping("/{id}")
    public Optional<Job> getJobById(@PathVariable String id) {
        return jobRepository.findById(id);
    }

    // ✅ POST a new job (will be made protected later)
    @PostMapping
    public Job createJob(@RequestBody Job job) {
        return jobRepository.save(job);
    }

    // ✅ PUT update a job
    @PutMapping("/{id}")
    public Job updateJob(@PathVariable String id, @RequestBody Job updatedJob) {
        return jobRepository.findById(id)
            .map(job -> {
                job.setTitle(updatedJob.getTitle());
                job.setDescription(updatedJob.getDescription());
                job.setCompany(updatedJob.getCompany());
                job.setLocation(updatedJob.getLocation());
                job.setActive(updatedJob.isActive());
                return jobRepository.save(job);
            })
            .orElseThrow(() -> new RuntimeException("Job not found"));
    }

    // ✅ DELETE a job
    @DeleteMapping("/{id}")
    public String deleteJob(@PathVariable String id) {
        jobRepository.deleteById(id);
        return "Job deleted successfully";
    }
}
