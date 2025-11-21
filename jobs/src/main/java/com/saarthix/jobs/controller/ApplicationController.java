package com.saarthix.jobs.controller;

import com.saarthix.jobs.model.Application;
import com.saarthix.jobs.model.ResumeAndDetails;
import com.saarthix.jobs.model.User;
import com.saarthix.jobs.repository.ApplicationRepository;
import com.saarthix.jobs.repository.ResumeAndDetailsRepository;
import com.saarthix.jobs.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ApplicationController {

    private final ApplicationRepository applicationRepository;
    private final ResumeAndDetailsRepository resumeAndDetailsRepository;
    private final UserRepository userRepository;

    public ApplicationController(ApplicationRepository applicationRepository, 
                                ResumeAndDetailsRepository resumeAndDetailsRepository,
                                UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.resumeAndDetailsRepository = resumeAndDetailsRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get all applications for the current authenticated user
     */
    @GetMapping
    public ResponseEntity<?> getMyApplications(Authentication auth) {
        // Check authentication
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Must be logged in to view applications");
        }

        User user = resolveUserFromOAuth(auth);
        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        // Get applications by email
        List<Application> applications = applicationRepository.findByApplicantEmail(user.getEmail());
        
        // Log for verification
        System.out.println("Retrieved " + applications.size() + " applications from MongoDB collection 'all_applied_jobs' for user: " + user.getEmail());
        
        return ResponseEntity.ok(applications);
    }

    /**
     * Create a new application (alternative endpoint for frontend)
     */
    @PostMapping
    public ResponseEntity<?> createApplication(@RequestBody Map<String, Object> applicationData, Authentication auth) {
        try {
            // Check authentication
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).body("Must be logged in to apply");
            }

            User user = resolveUserFromOAuth(auth);
            if (user == null) {
                return ResponseEntity.status(401).body("User not found");
            }

            // Check if user is APPLICANT type
            if (!"APPLICANT".equals(user.getUserType())) {
                return ResponseEntity.status(403).body("Only APPLICANT users can apply to jobs. Your current type: " + user.getUserType());
            }

            String jobId = (String) applicationData.get("jobId");
            if (jobId == null || jobId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Job ID is required");
            }

            // Check if already applied
            Optional<Application> existingApp = applicationRepository.findByJobIdAndApplicantEmail(jobId, user.getEmail());
            if (existingApp.isPresent()) {
                return ResponseEntity.status(400).body("You have already applied to this job");
            }

            // Create new application
            Application application = new Application();
            application.setJobId(jobId);
            application.setApplicantEmail(user.getEmail());
            application.setApplicantId(user.getId());
            application.setJobTitle((String) applicationData.getOrDefault("jobTitle", ""));
            application.setCompany((String) applicationData.getOrDefault("company", "Company confidential"));
            application.setLocation((String) applicationData.getOrDefault("location", "Location not specified"));
            application.setJobDescription((String) applicationData.getOrDefault("jobDescription", ""));
            application.setStatus((String) applicationData.getOrDefault("status", "pending"));
            
            // Application form fields
            application.setFullName((String) applicationData.getOrDefault("fullName", user.getName()));
            application.setPhoneNumber((String) applicationData.getOrDefault("phoneNumber", ""));
            application.setCoverLetter((String) applicationData.getOrDefault("coverLetter", ""));
            application.setResumeFileName((String) applicationData.getOrDefault("resumeFileName", ""));
            application.setResumeFileType((String) applicationData.getOrDefault("resumeFileType", ""));
            application.setResumeBase64((String) applicationData.getOrDefault("resumeBase64", ""));
            Object resumeFileSize = applicationData.get("resumeFileSize");
            if (resumeFileSize != null) {
                if (resumeFileSize instanceof Number) {
                    application.setResumeFileSize(((Number) resumeFileSize).longValue());
                } else if (resumeFileSize instanceof String) {
                    try {
                        application.setResumeFileSize(Long.parseLong((String) resumeFileSize));
                    } catch (NumberFormatException e) {
                        // Ignore
                    }
                }
            }
            application.setLinkedInUrl((String) applicationData.getOrDefault("linkedInUrl", ""));
            application.setPortfolioUrl((String) applicationData.getOrDefault("portfolioUrl", ""));
            application.setExperience((String) applicationData.getOrDefault("experience", ""));
            application.setAvailability((String) applicationData.getOrDefault("availability", ""));

            Application saved = applicationRepository.save(application);
            
            // Also save to resume_and_details collection
            ResumeAndDetails resumeAndDetails = new ResumeAndDetails();
            resumeAndDetails.setJobId(jobId);
            resumeAndDetails.setJobTitle((String) applicationData.getOrDefault("jobTitle", ""));
            resumeAndDetails.setCompany((String) applicationData.getOrDefault("company", "Company confidential"));
            resumeAndDetails.setLocation((String) applicationData.getOrDefault("location", "Location not specified"));
            resumeAndDetails.setJobDescription((String) applicationData.getOrDefault("jobDescription", ""));
            resumeAndDetails.setApplicantEmail(user.getEmail());
            resumeAndDetails.setApplicantId(user.getId());
            resumeAndDetails.setFullName((String) applicationData.getOrDefault("fullName", user.getName()));
            resumeAndDetails.setPhoneNumber((String) applicationData.getOrDefault("phoneNumber", ""));
            resumeAndDetails.setResumeFileName((String) applicationData.getOrDefault("resumeFileName", ""));
            resumeAndDetails.setResumeFileType((String) applicationData.getOrDefault("resumeFileType", ""));
            resumeAndDetails.setResumeBase64((String) applicationData.getOrDefault("resumeBase64", ""));
            Object resumeFileSizeObj = applicationData.get("resumeFileSize");
            if (resumeFileSizeObj != null) {
                if (resumeFileSizeObj instanceof Number) {
                    resumeAndDetails.setResumeFileSize(((Number) resumeFileSizeObj).longValue());
                } else if (resumeFileSizeObj instanceof String) {
                    try {
                        resumeAndDetails.setResumeFileSize(Long.parseLong((String) resumeFileSizeObj));
                    } catch (NumberFormatException e) {
                        // Ignore
                    }
                }
            }
            resumeAndDetails.setCoverLetter((String) applicationData.getOrDefault("coverLetter", ""));
            resumeAndDetails.setLinkedInUrl((String) applicationData.getOrDefault("linkedInUrl", ""));
            resumeAndDetails.setPortfolioUrl((String) applicationData.getOrDefault("portfolioUrl", ""));
            resumeAndDetails.setExperience((String) applicationData.getOrDefault("experience", ""));
            resumeAndDetails.setAvailability((String) applicationData.getOrDefault("availability", ""));
            resumeAndDetails.setStatus((String) applicationData.getOrDefault("status", "pending"));
            
            ResumeAndDetails savedResume = resumeAndDetailsRepository.save(resumeAndDetails);
            
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
            System.out.println("Full Name: " + saved.getFullName());
            System.out.println("Phone: " + saved.getPhoneNumber());
            System.out.println("Resume File: " + saved.getResumeFileName() + " (" + 
                             (saved.getResumeFileSize() != null ? saved.getResumeFileSize() + " bytes" : "N/A") + ")");
            System.out.println("LinkedIn: " + (saved.getLinkedInUrl() != null && !saved.getLinkedInUrl().isEmpty() ? saved.getLinkedInUrl() : "Not provided"));
            System.out.println("Portfolio: " + (saved.getPortfolioUrl() != null && !saved.getPortfolioUrl().isEmpty() ? saved.getPortfolioUrl() : "Not provided"));
            System.out.println("Experience: " + (saved.getExperience() != null && !saved.getExperience().isEmpty() ? saved.getExperience() : "Not provided"));
            System.out.println("Availability: " + saved.getAvailability());
            System.out.println("Cover Letter Length: " + (saved.getCoverLetter() != null ? saved.getCoverLetter().length() + " characters" : "Not provided"));
            System.out.println("Applied At: " + saved.getAppliedAt());
            System.out.println("=========================================");
            
            // Log resume and details save
            System.out.println("=========================================");
            System.out.println("RESUME AND DETAILS SAVED TO MONGODB DATABASE");
            System.out.println("Collection: resume_and_details");
            System.out.println("Resume ID: " + savedResume.getId());
            System.out.println("Applicant Email: " + savedResume.getApplicantEmail());
            System.out.println("Full Name: " + savedResume.getFullName());
            System.out.println("Phone: " + savedResume.getPhoneNumber());
            System.out.println("Resume File: " + savedResume.getResumeFileName() + " (" + 
                             (savedResume.getResumeFileSize() != null ? savedResume.getResumeFileSize() + " bytes" : "N/A") + ")");
            System.out.println("Resume Type: " + savedResume.getResumeFileType());
            System.out.println("Cover Letter Length: " + (savedResume.getCoverLetter() != null ? savedResume.getCoverLetter().length() + " characters" : "Not provided"));
            System.out.println("LinkedIn: " + (savedResume.getLinkedInUrl() != null && !savedResume.getLinkedInUrl().isEmpty() ? savedResume.getLinkedInUrl() : "Not provided"));
            System.out.println("Portfolio: " + (savedResume.getPortfolioUrl() != null && !savedResume.getPortfolioUrl().isEmpty() ? savedResume.getPortfolioUrl() : "Not provided"));
            System.out.println("Experience: " + (savedResume.getExperience() != null && !savedResume.getExperience().isEmpty() ? savedResume.getExperience() : "Not provided"));
            System.out.println("Availability: " + savedResume.getAvailability());
            System.out.println("Job Title: " + savedResume.getJobTitle());
            System.out.println("Company: " + savedResume.getCompany());
            System.out.println("Applied At: " + savedResume.getAppliedAt());
            System.out.println("=========================================");
            
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.err.println("Error creating application: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error saving application: " + e.getMessage());
        }
    }

    /**
     * Update application status
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateApplicationStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        // Check authentication
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Must be logged in to update applications");
        }

        User user = resolveUserFromOAuth(auth);
        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        Optional<Application> appOpt = applicationRepository.findById(id);
        if (appOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Application not found");
        }

        Application application = appOpt.get();

        // Verify user owns the application
        if (!user.getEmail().equals(application.getApplicantEmail())) {
            return ResponseEntity.status(403).body("You can only update your own applications");
        }

        String newStatus = body.get("status");
        if (newStatus != null) {
            // Validate status
            List<String> validStatuses = List.of("pending", "accepted", "rejected", "interview", "offer");
            if (!validStatuses.contains(newStatus.toLowerCase())) {
                return ResponseEntity.badRequest().body("Invalid status. Must be one of: " + validStatuses);
            }
            application.setStatus(newStatus.toLowerCase());
        }

        Application updated = applicationRepository.save(application);
        return ResponseEntity.ok(updated);
    }

    /**
     * Get applications by email (for admin or user verification)
     */
    @GetMapping("/by-email/{email}")
    public ResponseEntity<?> getApplicationsByEmail(@PathVariable String email, Authentication auth) {
        // Check authentication
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Must be logged in");
        }

        User user = resolveUserFromOAuth(auth);
        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        // Users can only view their own applications
        if (!user.getEmail().equalsIgnoreCase(email)) {
            return ResponseEntity.status(403).body("You can only view your own applications");
        }

        List<Application> applications = applicationRepository.findByApplicantEmail(email);
        return ResponseEntity.ok(applications);
    }

    /**
     * Get all resume and details for the current authenticated user
     */
    @GetMapping("/resume-details")
    public ResponseEntity<?> getMyResumeAndDetails(Authentication auth) {
        // Check authentication
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Must be logged in to view resume and details");
        }

        User user = resolveUserFromOAuth(auth);
        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        // Get resume and details by email
        List<ResumeAndDetails> resumeAndDetails = resumeAndDetailsRepository.findByApplicantEmail(user.getEmail());
        
        // Log for verification
        System.out.println("Retrieved " + resumeAndDetails.size() + " resume and details from MongoDB collection 'resume_and_details' for user: " + user.getEmail());
        
        return ResponseEntity.ok(resumeAndDetails);
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

