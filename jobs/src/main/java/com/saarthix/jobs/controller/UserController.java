package com.saarthix.jobs.controller;

import com.saarthix.jobs.model.User;
import com.saarthix.jobs.repository.UserRepository;
import org.springframework.http.ResponseEntity;
// OAuth2 imports removed - using token-based auth only
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for user management - save role during OAuth signup
 */
@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:2003", allowCredentials = "true")
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
        System.out.println("=== SAVE-ROLE REQUEST ===");
        System.out.println("Email: " + req.email());
        System.out.println("Selected Role (from Frontend): " + req.userType());
        
        // Validate input
        if (req.email() == null || req.email().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        if (req.userType() == null || (!req.userType().equals("APPLICANT") && !req.userType().equals("INDUSTRY"))) {
            return ResponseEntity.badRequest().body("Invalid user type. Must be APPLICANT or INDUSTRY");
        }

        // Check if user already exists
        User existingUser = userRepository.findByEmail(req.email()).orElse(null);
        System.out.println("User exists in DB: " + (existingUser != null));
        
        if (existingUser != null) {
            System.out.println("Existing User Registered Role: " + existingUser.getUserType());
            
            // If user exists and has a role, check if trying to login with different role
            if (existingUser.getUserType() != null && !existingUser.getUserType().isEmpty()) {
                System.out.println("Comparing: Registered=" + existingUser.getUserType() + " vs Selected=" + req.userType());
                
                if (!existingUser.getUserType().equals(req.userType())) {
                    System.out.println("MISMATCH DETECTED! Returning 409 error");
                    // User is trying to login with a different role than registered
                    String registeredRole = existingUser.getUserType();
                    String attemptedRole = req.userType();
                    String errorMessage;
                    
                    if (registeredRole.equals("APPLICANT")) {
                        errorMessage = "❌ Role Mismatch Error\n\nYou are only allowed to be a Job Seeker (Applicant) because you are registered as an Applicant. You cannot login as an Industry account.\n\nTo register as Industry, please logout first and create a new account with a different email address.";
                    } else {
                        errorMessage = "❌ Role Mismatch Error\n\nYou are only allowed to be an Industry account because you are registered as Industry. You cannot login as a Job Seeker (Applicant).\n\nTo register as Applicant, please logout first and create a new account with a different email address.";
                    }
                    
                    // Return error as JSON
                    Map<String, String> errorResponse = new java.util.HashMap<>();
                    errorResponse.put("error", errorMessage);
                    errorResponse.put("registeredRole", registeredRole);
                    errorResponse.put("attemptedRole", attemptedRole);
                    
                    return ResponseEntity.status(409).body(errorResponse);
                }
                // User exists with same role - just update info if needed
                existingUser.setName(req.name() != null ? req.name() : existingUser.getName());
                if (req.pictureUrl() != null && !req.pictureUrl().isEmpty()) {
                    existingUser.setPictureUrl(req.pictureUrl());
                }
                userRepository.save(existingUser);
                return ResponseEntity.ok("User role confirmed as " + req.userType());
            }
            
            // If user exists but has no role set, allow setting the role
            existingUser.setUserType(req.userType());
            existingUser.setName(req.name() != null ? req.name() : existingUser.getName());
            if (req.pictureUrl() != null && !req.pictureUrl().isEmpty()) {
                existingUser.setPictureUrl(req.pictureUrl());
            }
            userRepository.save(existingUser);
            return ResponseEntity.ok("User role updated to " + req.userType());
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
     * Returns the logged-in user with their role - now uses token-based auth
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Try to resolve user from token
        User user = resolveUserFromToken(authHeader);
        
        if (user == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        // Return user with role information
        return ResponseEntity.ok(new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getPictureUrl() != null ? user.getPictureUrl() : "",
            user.getUserType(),  // This is the role: APPLICANT or INDUSTRY
            true  // authenticated
        ));
    }
    
    /**
     * Helper method to resolve user from Saarthix token
     */
    private User resolveUserFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        
        String token = authHeader.substring(7);
        
        // Decode custom SomethingX JWT token format
        try {
            String[] parts = token.split("\\.");
            if (parts.length >= 2) {
                // Decode the payload (first part)
                String payload = new String(java.util.Base64.getDecoder().decode(parts[0]), 
                    java.nio.charset.StandardCharsets.UTF_8);
                
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
                
                // Get email from claims
                String email = claims.get("email");
                if (email != null) {
                    return userRepository.findByEmail(email).orElse(null);
                }
            }
        } catch (Exception e) {
            System.err.println("Error decoding token: " + e.getMessage());
        }
        
        return null;
    }

    /**
     * Update user profile (including userType) - now uses token-based auth
     */
    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Try to resolve user from token
        User user = resolveUserFromToken(authHeader);
        
        if (user == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        // User already resolved from token
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        // Update userType if provided
        String newUserType = body.get("userType");
        if (newUserType != null) {
            if (!newUserType.equals("APPLICANT") && !newUserType.equals("INDUSTRY")) {
                return ResponseEntity.badRequest().body("Invalid user type. Must be APPLICANT or INDUSTRY");
            }
            
            // Check if user is trying to change to a different role
            if (!newUserType.equals(user.getUserType())) {
                // Prevent role switching - users must logout and create a new account
                String registeredRole = user.getUserType();
                String attemptedRole = newUserType;
                String errorMessage;
                
                if ("APPLICANT".equals(registeredRole)) {
                    errorMessage = "❌ Role Mismatch Error\n\nYou are only allowed to be a Job Seeker (Applicant) because you are registered as an Applicant. You cannot switch to an Industry account.\n\nTo register as Industry, please logout first and create a new account with a different email address.";
                } else {
                    errorMessage = "❌ Role Mismatch Error\n\nYou are only allowed to be an Industry account because you are registered as Industry. You cannot switch to a Job Seeker (Applicant) account.\n\nTo register as Applicant, please logout first and create a new account with a different email address.";
                }
                
                // Return error as JSON
                Map<String, String> errorResponse = new java.util.HashMap<>();
                errorResponse.put("error", errorMessage);
                errorResponse.put("registeredRole", registeredRole);
                errorResponse.put("attemptedRole", attemptedRole);
                
                return ResponseEntity.status(409).body(errorResponse);
            }
            
            // Only update if same role (for data consistency)
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

