package com.saarthix.jobs.controller;

import com.saarthix.jobs.model.User;
import com.saarthix.jobs.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for user management - save role during OAuth signup
 */
@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public static record RoleSelectionRequest(String email, String name, String pictureUrl, String userType) {}

    /**
     * Save user with selected role (APPLICANT or INDUSTRY)
     */
    @PostMapping("/save-role")
    public ResponseEntity<?> saveUserRole(@RequestBody RoleSelectionRequest req) {
        // Validate input
        if (req.email() == null || req.email().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        if (req.userType() == null || (!req.userType().equals("APPLICANT") && !req.userType().equals("INDUSTRY"))) {
            return ResponseEntity.badRequest().body("Invalid user type. Must be APPLICANT or INDUSTRY");
        }

        // Check if user already exists
        User existingUser = userRepository.findByEmail(req.email()).orElse(null);
        if (existingUser != null) {
            // If user exists but has no role set, allow updating the role
            if (existingUser.getUserType() == null || existingUser.getUserType().isEmpty()) {
                existingUser.setUserType(req.userType());
                existingUser.setName(req.name() != null ? req.name() : existingUser.getName());
                if (req.pictureUrl() != null && !req.pictureUrl().isEmpty()) {
                    existingUser.setPictureUrl(req.pictureUrl());
                }
                userRepository.save(existingUser);
                return ResponseEntity.ok("User role updated to " + req.userType());
            }
            // User already has a role - should use update-profile endpoint instead
            return ResponseEntity.badRequest().body("User already has a role. Use update-profile endpoint to change it.");
        }

        // Create new user with selected role
        User newUser = new User();
        newUser.setName(req.name() != null ? req.name() : req.email().split("@")[0]);
        newUser.setEmail(req.email().toLowerCase().trim());
        newUser.setPictureUrl(req.pictureUrl());
        newUser.setPassword(null);  // Google OAuth users have no password
        newUser.setUserType(req.userType());

        userRepository.save(newUser);

        return ResponseEntity.ok("User registered as " + req.userType());
    }

    /**
     * Get current user info (called by AuthContext.jsx on page load)
     * Returns the logged-in user with their role
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication auth) {
        // Check if user is authenticated via OAuth
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        // Get OAuth user principal
        Object principal = auth.getPrincipal();
        if (!(principal instanceof org.springframework.security.oauth2.core.user.OAuth2User)) {
            return ResponseEntity.status(401).body("Not an OAuth user");
        }

        org.springframework.security.oauth2.core.user.OAuth2User oauthUser = 
            (org.springframework.security.oauth2.core.user.OAuth2User) principal;

        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");
        String picture = oauthUser.getAttribute("picture");

        // Find user in database by email
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // User not found (shouldn't happen if authenticated)
            return ResponseEntity.status(401).body("User not found in database");
        }

        // Return user with role information
        return ResponseEntity.ok(new UserResponse(
            user.getId(),
            name != null ? name : user.getName(),
            email,
            picture != null ? picture : user.getPictureUrl(),
            user.getUserType(),  // This is the role: APPLICANT or INDUSTRY
            true  // authenticated
        ));
    }

    /**
     * Update user profile (including userType)
     */
    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        // Check if user is authenticated via OAuth
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        // Get OAuth user principal
        Object principal = auth.getPrincipal();
        if (!(principal instanceof org.springframework.security.oauth2.core.user.OAuth2User)) {
            return ResponseEntity.status(401).body("Not an OAuth user");
        }

        org.springframework.security.oauth2.core.user.OAuth2User oauthUser = 
            (org.springframework.security.oauth2.core.user.OAuth2User) principal;

        String email = oauthUser.getAttribute("email");
        
        // Find user in database by email
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        // Update userType if provided
        String newUserType = body.get("userType");
        if (newUserType != null) {
            if (!newUserType.equals("APPLICANT") && !newUserType.equals("INDUSTRY")) {
                return ResponseEntity.badRequest().body("Invalid user type. Must be APPLICANT or INDUSTRY");
            }
            
            // Restrict applicants from changing their role - only industry users can change
            if ("APPLICANT".equals(user.getUserType()) && !newUserType.equals(user.getUserType())) {
                return ResponseEntity.status(403).body("Applicants cannot change their role. Please contact support if you need assistance.");
            }
            
            user.setUserType(newUserType);
        }

        // Save updated user
        userRepository.save(user);

        // Return updated user info
        return ResponseEntity.ok(new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getPictureUrl(),
            user.getUserType(),
            true
        ));
    }

    // Helper class to return user info
    public static record UserResponse(
        String id,
        String name,
        String email,
        String picture,
        String userType,
        boolean authenticated
    ) {}
}

