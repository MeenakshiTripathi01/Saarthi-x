package com.saarthix.jobs.controller;

import com.saarthix.jobs.repository.UserProfileRepository;
import com.saarthix.jobs.repository.UserRepository;
import com.saarthix.jobs.repository.ApplicationRepository;
import com.saarthix.jobs.repository.HackathonApplicationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class TestController {
    
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final HackathonApplicationRepository hackathonApplicationRepository;
    
    public TestController(
            UserProfileRepository userProfileRepository,
            UserRepository userRepository,
            ApplicationRepository applicationRepository,
            HackathonApplicationRepository hackathonApplicationRepository) {
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.hackathonApplicationRepository = hackathonApplicationRepository;
    }
    
    /**
     * Test MongoDB connection and data availability
     */
    @GetMapping("/database")
    public ResponseEntity<?> testDatabase() {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // Count records in each collection
            long userCount = userRepository.count();
            long profileCount = userProfileRepository.count();
            long applicationCount = applicationRepository.count();
            long hackathonAppCount = hackathonApplicationRepository.count();
            
            // Count by user type
            long applicantCount = userRepository.findAll().stream()
                    .filter(u -> "APPLICANT".equals(u.getUserType()))
                    .count();
            long industryCount = userRepository.findAll().stream()
                    .filter(u -> "INDUSTRY".equals(u.getUserType()))
                    .count();
            
            result.put("status", "Connected ✅");
            result.put("database", "saarthix");
            result.put("collections", Map.of(
                "users", userCount,
                "user_profiles", profileCount,
                "applications", applicationCount,
                "hackathon_applications", hackathonAppCount
            ));
            result.put("userTypes", Map.of(
                "APPLICANT", applicantCount,
                "INDUSTRY", industryCount,
                "TOTAL", userCount
            ));
            result.put("message", "MongoDB is connected and accessible");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "Error ❌");
            error.put("message", "Failed to connect to database");
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Test student data availability
     */
    @GetMapping("/students-data")
    public ResponseEntity<?> testStudentsData() {
        try {
            Map<String, Object> result = new HashMap<>();
            
            long totalProfiles = userProfileRepository.count();
            
            // Count profiles with specific fields
            long profilesWithResume = userProfileRepository.findAll().stream()
                    .filter(p -> p.getResumeBase64() != null && !p.getResumeBase64().isEmpty())
                    .count();
            
            long profilesWithSkills = userProfileRepository.findAll().stream()
                    .filter(p -> p.getSkills() != null && !p.getSkills().isEmpty())
                    .count();
            
            long profilesWithEducation = userProfileRepository.findAll().stream()
                    .filter(p -> p.getEducationEntries() != null && !p.getEducationEntries().isEmpty())
                    .count();
            
            long profilesWithPhoto = userProfileRepository.findAll().stream()
                    .filter(p -> p.getProfilePictureBase64() != null && !p.getProfilePictureBase64().isEmpty())
                    .count();
            
            result.put("totalProfiles", totalProfiles);
            result.put("profilesWithResume", profilesWithResume);
            result.put("profilesWithSkills", profilesWithSkills);
            result.put("profilesWithEducation", profilesWithEducation);
            result.put("profilesWithPhoto", profilesWithPhoto);
            
            if (totalProfiles == 0) {
                result.put("warning", "No student profiles found. Please create profiles first.");
                result.put("instructions", "Login as APPLICANT and go to 'Build Profile'");
            } else {
                result.put("status", "Student data available ✅");
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "Error ❌");
            error.put("message", "Failed to fetch student data");
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get sample student data
     */
    @GetMapping("/sample-student")
    public ResponseEntity<?> getSampleStudent() {
        try {
            var profiles = userProfileRepository.findAll();
            
            if (profiles.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("status", "No Data ⚠️");
                error.put("message", "No student profiles found in database");
                error.put("instructions", "Please create a profile by logging in as APPLICANT");
                return ResponseEntity.ok(error);
            }
            
            var sampleProfile = profiles.get(0);
            
            Map<String, Object> result = new HashMap<>();
            result.put("status", "Sample found ✅");
            result.put("profile", Map.of(
                "id", sampleProfile.getId(),
                "name", sampleProfile.getFullName() != null ? sampleProfile.getFullName() : "N/A",
                "email", sampleProfile.getApplicantEmail() != null ? sampleProfile.getApplicantEmail() : "N/A",
                "hasResume", sampleProfile.getResumeBase64() != null,
                "skillCount", sampleProfile.getSkills() != null ? sampleProfile.getSkills().size() : 0,
                "educationCount", sampleProfile.getEducationEntries() != null ? sampleProfile.getEducationEntries().size() : 0,
                "experienceCount", sampleProfile.getProfessionalExperiences() != null ? sampleProfile.getProfessionalExperiences().size() : 0,
                "projectCount", sampleProfile.getProjects() != null ? sampleProfile.getProjects().size() : 0
            ));
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "Error ❌");
            error.put("message", "Failed to fetch sample student");
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "OK ✅");
        result.put("message", "Backend is running");
        result.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(result);
    }
}
