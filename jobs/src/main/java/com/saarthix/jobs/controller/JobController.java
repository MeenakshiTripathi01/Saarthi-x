package com.saarthix.jobs.controller;

import com.saarthix.jobs.model.Application;
import com.saarthix.jobs.model.Job;
import com.saarthix.jobs.model.User;
import com.saarthix.jobs.model.UserProfile;
import com.saarthix.jobs.repository.ApplicationRepository;
import com.saarthix.jobs.repository.JobRepository;
import com.saarthix.jobs.repository.UserProfileRepository;
import com.saarthix.jobs.repository.UserRepository;
import org.springframework.http.ResponseEntity;
// Authentication import removed - using token-based auth only
// OAuth2 imports removed - using token-based auth only
import org.springframework.web.bind.annotation.*;
import com.saarthix.jobs.service.EmailService;
import com.saarthix.jobs.service.JobService;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Base64;
import com.fasterxml.jackson.databind.ObjectMapper;
//job controller
//get all jobs
//get a single job by id
//get recommended jobs for authenticated applicant
//post a new job
//put update a job
//delete a job
//apply to job

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "http://localhost:2003", allowCredentials = "true")
public class JobController {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final EmailService emailService;
    private final JobService jobService;
    private final UserProfileRepository userProfileRepository;

    public JobController(JobRepository jobRepository, UserRepository userRepository, ApplicationRepository applicationRepository, EmailService emailService, JobService jobService, UserProfileRepository userProfileRepository) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.emailService = emailService;
        this.jobService = jobService;
        this.userProfileRepository = userProfileRepository;
    }

    // ✅ GET all jobs (public - no auth required)
    @GetMapping
    public List<Job> getAllJobs() {
        System.out.println("=========================================");
        System.out.println("GET /api/jobs - getAllJobs() called");
        List<Job> jobs = jobRepository.findAll();
        System.out.println("Found " + jobs.size() + " jobs in database");
        System.out.println("=========================================");
        return jobs;
    }

    // ✅ GET a single job by ID (public - no auth required)
    @GetMapping("/{id}")
    public Optional<Job> getJobById(@PathVariable String id) {
        return jobRepository.findById(id);
    }

    // ✅ GET recommended jobs for authenticated applicant
    @GetMapping("/recommended/jobs")
    public ResponseEntity<?> getRecommendedJobs(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Try to resolve user from token
            User user = resolveUser(authHeader);
            if (user == null) {
                return ResponseEntity.status(401).body("User not found");
            }

            // Check if user is APPLICANT type
            if (!"APPLICANT".equals(user.getUserType())) {
                return ResponseEntity.status(403).body("Only APPLICANT users can view recommended jobs");
            }

            // Get user profile
            Optional<UserProfile> profileOpt = userProfileRepository.findByApplicantEmail(user.getEmail());
            if (profileOpt.isEmpty()) {
                return ResponseEntity.status(404).body("Profile not found. Please create your profile first.");
            }

            UserProfile profile = profileOpt.get();
            List<Map<String, Object>> recommendedJobs = jobService.getRecommendedJobs(profile);

            return ResponseEntity.ok(recommendedJobs);
        } catch (Exception e) {
            System.err.println("Error fetching recommended jobs: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error fetching recommended jobs: " + e.getMessage());
        }
    }

    // ✅ POST a new job (INDUSTRY users only)
    @PostMapping
    public ResponseEntity<?> createJob(@RequestBody Job job,
                                       @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Log the received job data for debugging
            System.out.println("=== Received Job Data ===");
            System.out.println("Title: " + job.getTitle());
            System.out.println("Company: " + job.getCompany());
            System.out.println("Location: " + job.getLocation());
            System.out.println("Description: " + (job.getDescription() != null ? job.getDescription().substring(0, Math.min(50, job.getDescription().length())) + "..." : "null"));
            System.out.println("Skills: " + job.getSkills());
            System.out.println("Employment Type: " + job.getEmploymentType());
            System.out.println("Min Salary: " + job.getJobMinSalary());
            System.out.println("Max Salary: " + job.getJobMaxSalary());
            System.out.println("========================");
            System.out.println("=== Authentication Debug ===");
            System.out.println("Auth header: " + (authHeader != null ? "present" : "null"));
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                System.out.println("Token found in Authorization header");
            }
            System.out.println("AuthHeader: " + (authHeader != null ? (authHeader.length() > 50 ? authHeader.substring(0, 50) + "..." : authHeader) : "null"));
            System.out.println("========================");
            
            // Try to resolve user from token
            User user = resolveUser(authHeader);
            System.out.println("Resolved user: " + (user != null ? user.getEmail() + " (type: " + user.getUserType() + ")" : "null"));
            if (user == null) {
                System.err.println("User resolution failed - returning 401");
                return ResponseEntity.status(401).body("Must be logged in to post jobs");
            }

            // Check if user is INDUSTRY type
            if (!"INDUSTRY".equals(user.getUserType())) {
                return ResponseEntity.status(403).body("Only INDUSTRY users can post jobs. Current type: " + user.getUserType());
            }

            // Set the user/industry who posted the job
            job.setIndustryId(user.getId());
            // Ensure createdAt is set if not provided
            if (job.getCreatedAt() == null) {
                job.setCreatedAt(java.time.LocalDateTime.now());
            }
            // Ensure active is set
            if (!job.isActive() && job.getId() == null) {
                job.setActive(true);
            }
            
            Job savedJob = jobRepository.save(job);
            return ResponseEntity.ok(savedJob);
        } catch (Exception e) {
            // Log the error for debugging
            System.err.println("Error creating job: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(400).body("Error creating job: " + e.getMessage());
        }
    }

    // ✅ PUT update a job (INDUSTRY users only)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateJob(@PathVariable String id, @RequestBody Job updatedJob,
                                       @RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Try to resolve user from token
        User user = resolveUser(authHeader);
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
        job.setSkills(updatedJob.getSkills());
        job.setIndustry(updatedJob.getIndustry());
        job.setEmploymentType(updatedJob.getEmploymentType());
        job.setJobMinSalary(updatedJob.getJobMinSalary());
        job.setJobMaxSalary(updatedJob.getJobMaxSalary());
        job.setJobSalaryCurrency(updatedJob.getJobSalaryCurrency());

        return ResponseEntity.ok(jobRepository.save(job));
    }

    // ✅ DELETE a job (INDUSTRY users only)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteJob(@PathVariable String id, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Try to resolve user from token
        User user = resolveUser(authHeader);
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
    public ResponseEntity<?> applyToJob(@PathVariable String jobId, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Try to resolve user from token
        User user = resolveUser(authHeader);
        if (user == null || !"APPLICANT".equals(user.getUserType())) {
            return ResponseEntity.status(403).body("Only APPLICANT users can apply to jobs. Current type: " + (user != null ? user.getUserType() : "UNKNOWN"));
        }

        Optional<Job> jobOpt = jobRepository.findById(jobId);
        if (jobOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Job not found");
        }

        Job job = jobOpt.get();

        // Check if user already applied to this job
        Optional<Application> existingApp = applicationRepository.findByJobIdAndApplicantEmail(jobId, user.getEmail());
        if (existingApp.isPresent()) {
            return ResponseEntity.status(400).body("You have already applied to this job");
        }

        // Create and save application
        Application application = new Application();
        application.setJobId(jobId);
        application.setApplicantEmail(user.getEmail());
        application.setApplicantId(user.getId());
        application.setJobTitle(job.getTitle());
        application.setCompany(job.getCompany());
        application.setLocation(job.getLocation());
        application.setJobDescription(job.getDescription());
        application.setStatus("pending");

        Application saved = applicationRepository.save(application);

        emailService.sendApplicationConfirmation(user, job, saved);
        
        // Log detailed information about the saved application
        System.out.println("=========================================");
        System.out.println("APPLICATION SAVED TO MONGODB DATABASE");
        System.out.println("Collection: all_applied_jobs");
        System.out.println("Application ID: " + saved.getId());
        System.out.println("Applicant Email: " + saved.getApplicantEmail());
        System.out.println("Applicant ID: " + saved.getApplicantId());
        System.out.println("Job ID: " + saved.getJobId());
        System.out.println("Job Title: " + saved.getJobTitle());
        System.out.println("Company: " + saved.getCompany());
        System.out.println("Location: " + saved.getLocation());
        System.out.println("Status: " + saved.getStatus());
        System.out.println("Applied At: " + saved.getAppliedAt());
        System.out.println("=========================================");

        return ResponseEntity.ok("Applied successfully to job. Application saved to database with ID: " + saved.getId());
    }

    /**
     * Helper method to extract user from Saarthix token (token-based auth only)
     */
    private User resolveUser(String authHeader) {
        // Use Saarthix token from Authorization header
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            System.out.println("Attempting to resolve user from Saarthix token (length: " + token.length() + ")");
            
            // First, try to decode custom SomethingX JWT token format
            // SomethingX uses custom format: Base64(payload).Base64(signature)
            // Payload format: key:value|key:value|
            try {
                String[] parts = token.split("\\.");
                if (parts.length >= 2) {
                    // Decode the payload (first part)
                    String payload = new String(Base64.getDecoder().decode(parts[0]), java.nio.charset.StandardCharsets.UTF_8);
                    System.out.println("Decoded payload: " + payload);
                    
                    // Parse the custom format: key:value|key:value|
                    Map<String, String> claims = new java.util.HashMap<>();
                    String[] claimPairs = payload.split("\\|");
                    for (String pair : claimPairs) {
                        if (pair.contains(":")) {
                            String[] keyValue = pair.split(":", 2);
                            if (keyValue.length == 2) {
                                claims.put(keyValue[0], keyValue[1]);
                            }
                        }
                    }
                    
                    System.out.println("Extracted claims: " + claims);
                    
                    // Get email from claims
                    String email = claims.get("email");
                    if (email != null) {
                        System.out.println("Extracted email from custom JWT: " + email);
                        Optional<User> userOpt = userRepository.findByEmail(email);
                        if (userOpt.isPresent()) {
                            System.out.println("User found in database from custom JWT: " + userOpt.get().getEmail() + " (type: " + userOpt.get().getUserType() + ")");
                            return userOpt.get();
                        } else {
                            System.out.println("User not found in database for email from custom JWT: " + email);
                        }
                    } else {
                        System.out.println("Email not found in custom JWT claims");
                    }
                } else {
                    System.out.println("Token does not have expected format (expected at least 2 parts separated by dots)");
                }
            } catch (Exception e) {
                System.out.println("Could not decode custom JWT token: " + e.getMessage());
                e.printStackTrace();
            }
            
            // If JWT decoding fails, try validating with SomethingX backend
            try {
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                String validateUrl = "http://localhost:8080/api/auth/validate";
                
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.set("Authorization", "Bearer " + token);
                org.springframework.http.HttpEntity<?> entity = new org.springframework.http.HttpEntity<>(headers);
                
                System.out.println("Calling SomethingX validate endpoint: " + validateUrl);
                org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate.exchange(
                    validateUrl,
                    org.springframework.http.HttpMethod.GET,
                    entity,
                    java.util.Map.class
                );

                System.out.println("Validation response status: " + response.getStatusCode());
                System.out.println("Validation response body: " + response.getBody());

                if (response.getStatusCode() == org.springframework.http.HttpStatus.OK && 
                    response.getBody() != null && 
                    Boolean.TRUE.equals(response.getBody().get("valid"))) {
                    
                    // Get user profile from SomethingX
                    String profileUrl = "http://localhost:8080/api/auth/profile";
                    System.out.println("Calling SomethingX profile endpoint: " + profileUrl);
                    org.springframework.http.ResponseEntity<java.util.Map> profileResponse = restTemplate.exchange(
                        profileUrl,
                        org.springframework.http.HttpMethod.GET,
                        entity,
                        java.util.Map.class
                    );

                    java.util.Map<String, Object> profileData = profileResponse.getBody();
                    System.out.println("Profile data: " + profileData);
                    if (profileData != null) {
                        String email = (String) profileData.get("email");
                        String userType = (String) profileData.get("userType");
                        System.out.println("Found email from profile: " + email);
                        System.out.println("User type from profile: " + userType);
                        if (email != null) {
                            Optional<User> userOpt = userRepository.findByEmail(email);
                            if (userOpt.isPresent()) {
                                System.out.println("User found in database: " + userOpt.get().getEmail());
                                return userOpt.get();
                            } else {
                                System.out.println("User not found in database for email: " + email);
                            }
                        }
                    }
                } else {
                    System.err.println("Token validation failed - response not valid");
                }
            } catch (Exception e) {
                System.err.println("Error validating Saarthix token with backend: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("No Bearer token found in Authorization header");
        }
        
        // Last resort: Check if we can get user info from the token itself
        // This would require decoding the JWT token, but for now we'll return null
        // and let the error message guide the user
        
        return null;
    }
    
    // OAuth-based resolveUserFromOAuth removed - using token-based auth only
}
