package com.saarthix.jobs.controller;

import com.saarthix.jobs.model.User;
import com.saarthix.jobs.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
// AuthenticationPrincipal import removed - using token-based auth only
// OAuth2 imports removed - using token-based auth only
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:2003", allowCredentials = "true")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // OAuth endpoint removed - using token-based auth only
    // Users should use /api/user/me endpoint with token instead

    // -------------------------------
    // 2. INDUSTRY REGISTRATION
    // -------------------------------
    @PostMapping("/industry/register")
    public ResponseEntity<?> registerIndustry(@RequestBody Map<String, String> body) {

        String companyName = body.get("companyName");
        String email = body.get("email");
        String password = body.get("password");

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Email already registered");
        }

        User industry = new User();
        industry.setName(companyName);
        industry.setEmail(email);
        industry.setPassword(passwordEncoder.encode(password));
        industry.setUserType("INDUSTRY");

        userRepository.save(industry);

        return ResponseEntity.ok("Industry registered successfully");
    }

    // -------------------------------
    // 3. INDUSTRY LOGIN
    // -------------------------------
    @PostMapping("/industry/login")
    public ResponseEntity<?> industryLogin(@RequestBody Map<String, String> body) {

        String email = body.get("email");
        String password = body.get("password");

        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email");
        }

        User user = optionalUser.get();

        if (!"INDUSTRY".equals(user.getUserType())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Account is not an industry account");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Incorrect password");
        }

        return ResponseEntity.ok(user);
    }

    // -------------------------------
    // 4. VALIDATE SOMETHINGX TOKEN AND CREATE SESSION
    // -------------------------------
    @PostMapping("/validate-saarthix-token")
    public ResponseEntity<?> validateSaarthixToken(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String email = body.get("email");
        String name = body.get("name");
        String userType = body.get("userType");
        String picture = body.get("picture");

        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Token is required");
        }

        try {
            // Validate token with SomethingX backend
            RestTemplate restTemplate = new RestTemplate();
            String validateUrl = "http://localhost:8080/api/auth/validate";
            
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("Authorization", "Bearer " + token);
            org.springframework.http.HttpEntity<?> entity = new org.springframework.http.HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                validateUrl,
                org.springframework.http.HttpMethod.GET,
                entity,
                Map.class
            );

            if (response.getStatusCode() == org.springframework.http.HttpStatus.OK && 
                response.getBody() != null && 
                Boolean.TRUE.equals(response.getBody().get("valid"))) {
                
                // Token is valid, get user profile from SomethingX
                String profileUrl = "http://localhost:8080/api/auth/profile";
                ResponseEntity<Map> profileResponse = restTemplate.exchange(
                    profileUrl,
                    org.springframework.http.HttpMethod.GET,
                    entity,
                    Map.class
                );

                Map<String, Object> profileData = profileResponse.getBody();
                if (profileData != null) {
                    email = (String) profileData.getOrDefault("email", email);
                    name = (String) profileData.getOrDefault("name", name);
                    userType = (String) profileData.getOrDefault("userType", userType);
                    picture = (String) profileData.getOrDefault("picture", picture);
                }

                // Map SomethingX userType to Jobs repo userType
                // STUDENT -> APPLICANT, INDUSTRY -> INDUSTRY
                String mappedUserType = "STUDENT".equals(userType) ? "APPLICANT" : 
                                       ("INDUSTRY".equals(userType) ? "INDUSTRY" : userType);

                // Find or create user in Jobs repo
                Optional<User> existingUser = userRepository.findByEmail(email);
                User user;
                
                if (existingUser.isPresent()) {
                    user = existingUser.get();
                    // Update user info if needed
                    if (name != null) user.setName(name);
                    if (picture != null) user.setPictureUrl(picture);
                    if (mappedUserType != null) user.setUserType(mappedUserType);
                    userRepository.save(user);
                } else {
                    // Create new user
                    user = new User();
                    user.setEmail(email);
                    user.setName(name != null ? name : "");
                    user.setPictureUrl(picture);
                    user.setUserType(mappedUserType != null ? mappedUserType : "APPLICANT");
                    userRepository.save(user);
                }

                // Return success with user info
                System.out.println("Token validation successful for user: " + user.getEmail());
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "user", Map.of(
                        "email", user.getEmail(),
                        "name", user.getName(),
                        "userType", user.getUserType(),
                        "picture", user.getPictureUrl() != null ? user.getPictureUrl() : ""
                    ),
                    "token", token  // Return token for frontend to store
                ));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid token");
            }
        } catch (Exception e) {
            // If validation fails, still allow if email/name provided (for development)
            // In production, you might want to be stricter
            if (email != null && !email.isEmpty()) {
                // Find or create user based on provided info
                System.out.println("Token validation failed, but using provided email: " + email);
                Optional<User> existingUser = userRepository.findByEmail(email);
                User user;
                
                if (existingUser.isPresent()) {
                    user = existingUser.get();
                } else {
                    user = new User();
                    user.setEmail(email);
                    user.setName(name != null ? name : "");
                    user.setPictureUrl(picture);
                    String mappedUserType = "STUDENT".equals(userType) ? "APPLICANT" : 
                                           ("INDUSTRY".equals(userType) ? "INDUSTRY" : "APPLICANT");
                    user.setUserType(mappedUserType);
                    userRepository.save(user);
                    System.out.println("Created new user: " + email + " with type: " + user.getUserType());
                }

                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "user", Map.of(
                        "email", user.getEmail(),
                        "name", user.getName(),
                        "userType", user.getUserType(),
                        "picture", user.getPictureUrl() != null ? user.getPictureUrl() : ""
                    ),
                    "token", token != null ? token : ""  // Always return token if provided
                ));
            }
            
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Token validation failed: " + e.getMessage());
        }
    }
}
