package com.saarthix.jobs.controller;

import com.saarthix.jobs.model.User;
import com.saarthix.jobs.model.UserProfile;
import com.saarthix.jobs.repository.UserProfileRepository;
import com.saarthix.jobs.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UserProfileController {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    public UserProfileController(UserProfileRepository userProfileRepository, UserRepository userRepository) {
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get current user's profile
     */
    @GetMapping
    public ResponseEntity<?> getMyProfile(Authentication auth) {
        // Check authentication
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Must be logged in to view profile");
        }

        User user = resolveUserFromOAuth(auth);
        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        Optional<UserProfile> profileOpt = userProfileRepository.findByApplicantEmail(user.getEmail());
        if (profileOpt.isPresent()) {
            return ResponseEntity.ok(profileOpt.get());
        } else {
            return ResponseEntity.status(404).body("Profile not found. Please create your profile first.");
        }
    }

    /**
     * Create or update user profile
     */
    @PostMapping
    public ResponseEntity<?> saveProfile(@RequestBody Map<String, Object> profileData, Authentication auth) {
        try {
            // Check authentication
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).body("Must be logged in to save profile");
            }

            User user = resolveUserFromOAuth(auth);
            if (user == null) {
                return ResponseEntity.status(401).body("User not found");
            }

            // Check if user is APPLICANT type
            if (!"APPLICANT".equals(user.getUserType())) {
                return ResponseEntity.status(403).body("Only APPLICANT users can create profiles");
            }

            // Check if profile already exists
            Optional<UserProfile> existingProfileOpt = userProfileRepository.findByApplicantEmail(user.getEmail());
            UserProfile profile;

            if (existingProfileOpt.isPresent()) {
                // Update existing profile
                profile = existingProfileOpt.get();
            } else {
                // Create new profile
                profile = new UserProfile();
                profile.setApplicantEmail(user.getEmail());
                profile.setApplicantId(user.getId());
            }

            // Update profile fields
            if (profileData.containsKey("fullName")) {
                profile.setFullName((String) profileData.get("fullName"));
            }
            if (profileData.containsKey("phoneNumber")) {
                profile.setPhoneNumber((String) profileData.get("phoneNumber"));
            }
            if (profileData.containsKey("email")) {
                profile.setEmail((String) profileData.get("email"));
            }

            // Resume information
            if (profileData.containsKey("resumeFileName")) {
                profile.setResumeFileName((String) profileData.get("resumeFileName"));
            }
            if (profileData.containsKey("resumeFileType")) {
                profile.setResumeFileType((String) profileData.get("resumeFileType"));
            }
            if (profileData.containsKey("resumeBase64")) {
                profile.setResumeBase64((String) profileData.get("resumeBase64"));
            }
            if (profileData.containsKey("resumeFileSize")) {
                Object resumeFileSize = profileData.get("resumeFileSize");
                if (resumeFileSize instanceof Number) {
                    profile.setResumeFileSize(((Number) resumeFileSize).longValue());
                } else if (resumeFileSize instanceof String) {
                    try {
                        profile.setResumeFileSize(Long.parseLong((String) resumeFileSize));
                    } catch (NumberFormatException e) {
                        // Ignore
                    }
                }
            }

            // Professional information
            if (profileData.containsKey("currentPosition")) {
                profile.setCurrentPosition((String) profileData.get("currentPosition"));
            }
            if (profileData.containsKey("currentCompany")) {
                profile.setCurrentCompany((String) profileData.get("currentCompany"));
            }
            if (profileData.containsKey("experience")) {
                profile.setExperience((String) profileData.get("experience"));
            }
            if (profileData.containsKey("skills")) {
                Object skillsObj = profileData.get("skills");
                if (skillsObj instanceof List) {
                    profile.setSkills((List<String>) skillsObj);
                } else if (skillsObj instanceof String) {
                    // Handle comma-separated string
                    String skillsStr = (String) skillsObj;
                    profile.setSkills(List.of(skillsStr.split(",")));
                }
            }
            if (profileData.containsKey("summary")) {
                profile.setSummary((String) profileData.get("summary"));
            }

            // Location preferences
            if (profileData.containsKey("currentLocation")) {
                profile.setCurrentLocation((String) profileData.get("currentLocation"));
            }
            if (profileData.containsKey("preferredLocation")) {
                profile.setPreferredLocation((String) profileData.get("preferredLocation"));
            }
            if (profileData.containsKey("workPreference")) {
                profile.setWorkPreference((String) profileData.get("workPreference"));
            }
            if (profileData.containsKey("willingToRelocate")) {
                Object willingToRelocate = profileData.get("willingToRelocate");
                if (willingToRelocate instanceof Boolean) {
                    profile.setWillingToRelocate((Boolean) willingToRelocate);
                } else if (willingToRelocate instanceof String) {
                    profile.setWillingToRelocate(Boolean.parseBoolean((String) willingToRelocate));
                }
            }

            // Contact & Links
            if (profileData.containsKey("linkedInUrl")) {
                profile.setLinkedInUrl((String) profileData.get("linkedInUrl"));
            }
            if (profileData.containsKey("portfolioUrl")) {
                profile.setPortfolioUrl((String) profileData.get("portfolioUrl"));
            }
            if (profileData.containsKey("githubUrl")) {
                profile.setGithubUrl((String) profileData.get("githubUrl"));
            }
            if (profileData.containsKey("websiteUrl")) {
                profile.setWebsiteUrl((String) profileData.get("websiteUrl"));
            }

            // Additional information
            if (profileData.containsKey("availability")) {
                profile.setAvailability((String) profileData.get("availability"));
            }
            if (profileData.containsKey("expectedSalary")) {
                profile.setExpectedSalary((String) profileData.get("expectedSalary"));
            }
            if (profileData.containsKey("coverLetterTemplate")) {
                profile.setCoverLetterTemplate((String) profileData.get("coverLetterTemplate"));
            }
            if (profileData.containsKey("education")) {
                profile.setEducation((String) profileData.get("education"));
            }
            if (profileData.containsKey("certifications")) {
                profile.setCertifications((String) profileData.get("certifications"));
            }

            UserProfile saved = userProfileRepository.save(profile);
            
            System.out.println("=========================================");
            System.out.println("USER PROFILE SAVED TO MONGODB DATABASE");
            System.out.println("Collection: user_profiles");
            System.out.println("Profile ID: " + saved.getId());
            System.out.println("Applicant Email: " + saved.getApplicantEmail());
            System.out.println("Applicant ID: " + saved.getApplicantId());
            System.out.println("Full Name: " + saved.getFullName());
            System.out.println("Phone: " + saved.getPhoneNumber());
            System.out.println("Email: " + saved.getEmail());
            System.out.println("Current Position: " + saved.getCurrentPosition());
            System.out.println("Current Company: " + saved.getCurrentCompany());
            System.out.println("Experience: " + saved.getExperience());
            System.out.println("Skills: " + (saved.getSkills() != null ? saved.getSkills().toString() : "Not provided"));
            System.out.println("Summary: " + (saved.getSummary() != null && !saved.getSummary().isEmpty() ? saved.getSummary().substring(0, Math.min(50, saved.getSummary().length())) + "..." : "Not provided"));
            System.out.println("Current Location: " + saved.getCurrentLocation());
            System.out.println("Preferred Location: " + saved.getPreferredLocation());
            System.out.println("Work Preference: " + saved.getWorkPreference());
            System.out.println("Willing to Relocate: " + saved.getWillingToRelocate());
            System.out.println("LinkedIn: " + (saved.getLinkedInUrl() != null && !saved.getLinkedInUrl().isEmpty() ? saved.getLinkedInUrl() : "Not provided"));
            System.out.println("Portfolio: " + (saved.getPortfolioUrl() != null && !saved.getPortfolioUrl().isEmpty() ? saved.getPortfolioUrl() : "Not provided"));
            System.out.println("GitHub: " + (saved.getGithubUrl() != null && !saved.getGithubUrl().isEmpty() ? saved.getGithubUrl() : "Not provided"));
            System.out.println("Website: " + (saved.getWebsiteUrl() != null && !saved.getWebsiteUrl().isEmpty() ? saved.getWebsiteUrl() : "Not provided"));
            System.out.println("Availability: " + saved.getAvailability());
            System.out.println("Expected Salary: " + (saved.getExpectedSalary() != null && !saved.getExpectedSalary().isEmpty() ? saved.getExpectedSalary() : "Not provided"));
            System.out.println("Education: " + (saved.getEducation() != null && !saved.getEducation().isEmpty() ? saved.getEducation() : "Not provided"));
            System.out.println("Certifications: " + (saved.getCertifications() != null && !saved.getCertifications().isEmpty() ? saved.getCertifications() : "Not provided"));
            System.out.println("Resume File: " + (saved.getResumeFileName() != null && !saved.getResumeFileName().isEmpty() ? saved.getResumeFileName() + " (" + (saved.getResumeFileSize() != null ? saved.getResumeFileSize() + " bytes" : "N/A") + ")" : "Not provided"));
            System.out.println("Cover Letter Template Length: " + (saved.getCoverLetterTemplate() != null ? saved.getCoverLetterTemplate().length() + " characters" : "Not provided"));
            System.out.println("Last Updated: " + saved.getLastUpdated());
            System.out.println("=========================================");
            
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.err.println("Error saving profile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error saving profile: " + e.getMessage());
        }
    }

    /**
     * Update user profile (PUT method)
     */
    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> profileData, Authentication auth) {
        // PUT is same as POST for this use case
        return saveProfile(profileData, auth);
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

