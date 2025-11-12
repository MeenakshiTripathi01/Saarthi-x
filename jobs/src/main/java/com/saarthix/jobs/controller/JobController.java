package com.saarthix.jobs.controller;

import com.saarthix.jobs.model.Job;
import com.saarthix.jobs.service.JobService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    // 🔹 Get all jobs
    @GetMapping
    public List<Job> getAllJobs() {
        return jobService.getAllJobs();
    }

    // 🔹 Get a single job by ID
    @GetMapping("/{id}")
    public Job getJobById(@PathVariable String id) {
        return jobService.getJobById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + id));
    }

    // 🔹 Create new job
    @PostMapping
    public Job createJob(@RequestBody Job job) {
        return jobService.createJob(job);
    }

    // 🔹 Update existing job
    @PutMapping("/{id}")
    public Job updateJob(@PathVariable String id, @RequestBody Job updatedJob) {
        return jobService.updateJob(id, updatedJob);
    }

    // 🔹 Delete job
    @DeleteMapping("/{id}")
    public String deleteJob(@PathVariable String id) {
        jobService.deleteJob(id);
        return "Job deleted successfully.";
    }
}
