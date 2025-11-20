package com.saarthix.jobs.controller;

import com.saarthix.jobs.model.Job;
import com.saarthix.jobs.model.User;
import com.saarthix.jobs.repository.JobRepository;
import com.saarthix.jobs.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class JobController {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    public JobController(JobRepository jobRepository, UserRepository userRepository) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
    }

    // ✅ GET all jobs (public - no auth required)
    @GetMapping
    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    // ✅ GET a single job by ID (public - no auth required)
    @GetMapping("/{id}")
    public Optional<Job> getJobById(@PathVariable String id) {
        return jobRepository.findById(id);
    }

    // ✅ POST a new job (INDUSTRY users only)
    @PostMapping
    public ResponseEntity<?> createJob(@RequestBody Job job, Authentication auth) {
        // Check if user is authenticated via OAuth
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Must be logged in to post jobs");
        }

        // Get user from OAuth principal
        User user = resolveUserFromOAuth(auth);
        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        // Check if user is INDUSTRY type
        if (!"INDUSTRY".equals(user.getUserType())) {
            return ResponseEntity.status(403).body("Only INDUSTRY users can post jobs. Current type: " + user.getUserType());
        }

        // Set the user/industry who posted the job
        job.setIndustryId(user.getId());
        jobRepository.save(job);

        return ResponseEntity.ok(job);
    }

    // ✅ PUT update a job (INDUSTRY users only)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateJob(@PathVariable String id, @RequestBody Job updatedJob, Authentication auth) {
        // Check authentication
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Must be logged in to update jobs");
        }

        User user = resolveUserFromOAuth(auth);
        if (user == null || !"INDUSTRY".equals(user.getUserType())) {
            return ResponseEntity.status(403).body("Only INDUSTRY users can update jobs");
        }

        Optional<Job> jobOpt = jobRepository.findById(id);
        if (jobOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Job not found");
        }

        Job job = jobOpt.get();

        // Verify user owns the job
        if (!user.getId().equals(job.getIndustryId())) {
            return ResponseEntity.status(403).body("You can only edit your own jobs");
        }

        job.setTitle(updatedJob.getTitle());
        job.setDescription(updatedJob.getDescription());
        job.setCompany(updatedJob.getCompany());
        job.setLocation(updatedJob.getLocation());
        job.setActive(updatedJob.isActive());

        return ResponseEntity.ok(jobRepository.save(job));
    }

    // ✅ DELETE a job (INDUSTRY users only)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteJob(@PathVariable String id, Authentication auth) {
        // Check authentication
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Must be logged in to delete jobs");
        }

        User user = resolveUserFromOAuth(auth);
        if (user == null || !"INDUSTRY".equals(user.getUserType())) {
            return ResponseEntity.status(403).body("Only INDUSTRY users can delete jobs");
        }

        Optional<Job> jobOpt = jobRepository.findById(id);
        if (jobOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Job not found");
        }

        Job job = jobOpt.get();

        // Verify user owns the job
        if (!user.getId().equals(job.getIndustryId())) {
            return ResponseEntity.status(403).body("You can only delete your own jobs");
        }

        jobRepository.deleteById(id);
        return ResponseEntity.ok("Job deleted successfully");
    }

    // ✅ Apply to job (APPLICANT users only)
    @PostMapping("/{jobId}/apply")
    public ResponseEntity<?> applyToJob(@PathVariable String jobId, Authentication auth) {
        // Check authentication
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Must be logged in to apply");
        }

        User user = resolveUserFromOAuth(auth);
        if (user == null || !"APPLICANT".equals(user.getUserType())) {
            return ResponseEntity.status(403).body("Only APPLICANT users can apply to jobs. Current type: " + (user != null ? user.getUserType() : "UNKNOWN"));
        }

        Optional<Job> jobOpt = jobRepository.findById(jobId);
        if (jobOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Job not found");
        }

        // TODO: Record application in database
        return ResponseEntity.ok("Applied successfully to job");
    }

    /**
     * Helper method to extract user from OAuth2 principal
     */
    private User resolveUserFromOAuth(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return null;
        }

        Object principal = auth.getPrincipal();

        if (principal instanceof OAuth2User oauthUser) {
            String email = oauthUser.getAttribute("email");
            if (email != null) {
                return userRepository.findByEmail(email).orElse(null);
            }
        }

        return null;
    }
}
