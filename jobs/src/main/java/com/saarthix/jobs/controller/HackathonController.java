package com.saarthix.jobs.controller;

import org.springframework.web.bind.annotation.GetMapping;
import java.util.List;

import com.saarthix.jobs.model.Hackathon;
import com.saarthix.jobs.model.User;

import com.saarthix.jobs.repository.HackathonRepository;
import com.saarthix.jobs.repository.UserRepository;
import com.saarthix.jobs.repository.HackathonApplicationRepository;
import com.saarthix.jobs.service.AIProblemStatementService;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Base64;

@RestController
@RequestMapping("/api/hackathons")
@CrossOrigin(origins = "http://localhost:2003", allowCredentials = "true")
public class HackathonController {

    private final HackathonRepository hackathonRepository;
    private final UserRepository userRepository;
    private final HackathonApplicationRepository applicationRepository;
    private final AIProblemStatementService aiProblemStatementService;

    public HackathonController(HackathonRepository hackathonRepository, UserRepository userRepository, HackathonApplicationRepository applicationRepository, AIProblemStatementService aiProblemStatementService) {
        this.hackathonRepository = hackathonRepository;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.aiProblemStatementService = aiProblemStatementService;
    }

    /**
     * Helper method to extract user from Saarthix token (token-based auth only)
     */
    private User resolveUser(String authHeader) {
        System.out.println("=== HackathonController.resolveUser ===");
        System.out.println("AuthHeader: " + (authHeader != null ? (authHeader.length() > 50 ? authHeader.substring(0, 50) + "..." : authHeader) : "null"));
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.err.println("No Bearer token found in Authorization header");
            return null;
        }
        
        String token = authHeader.substring(7);
        System.out.println("Token length: " + token.length());
        
        // Decode custom SomethingX JWT token format
        try {
            String[] parts = token.split("\\.");
            System.out.println("Token parts count: " + parts.length);
            
            if (parts.length >= 2) {
                // Decode the payload (first part)
                String payload = new String(Base64.getDecoder().decode(parts[0]), 
                    java.nio.charset.StandardCharsets.UTF_8);
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
                    System.out.println("Extracted email: " + email);
                    Optional<User> userOpt = userRepository.findByEmail(email);
                    if (userOpt.isPresent()) {
                        System.out.println("User found: " + userOpt.get().getEmail() + " (type: " + userOpt.get().getUserType() + ")");
                        return userOpt.get();
                    } else {
                        System.err.println("User not found in database for email: " + email);
                    }
                } else {
                    System.err.println("Email not found in token claims");
                }
            } else {
                System.err.println("Token does not have expected format (expected at least 2 parts)");
            }
        } catch (Exception e) {
            System.err.println("Error decoding token in HackathonController: " + e.getMessage());
            e.printStackTrace();
        }
        
        return null;
    }

    // GET all hackathons (public)
    @GetMapping
    public List<Hackathon> getAll() {
        List<Hackathon> hackathons = hackathonRepository.findAll();
        // Update resultsPublished status based on whether any application has finalRank
        for (Hackathon hackathon : hackathons) {
            updateResultsPublishedStatus(hackathon);
        }
        return hackathons;
    }
    
    // Helper method to check and update resultsPublished status
    private void updateResultsPublishedStatus(Hackathon hackathon) {
        // Check if any application for this hackathon has a finalRank (results published)
        boolean hasPublishedResults = applicationRepository.findByHackathonId(hackathon.getId())
            .stream()
            .anyMatch(app -> app.getFinalRank() != null && app.getFinalRank() > 0);
        
        // Update the hackathon's resultsPublished field if it differs
        if (hackathon.getResultsPublished() != hasPublishedResults) {
            hackathon.setResultsPublished(hasPublishedResults);
            hackathonRepository.save(hackathon);
        }
    }

    // GET hackathons posted by the authenticated industry user
    @GetMapping("/my-hackathons")
    public ResponseEntity<?> getMyHackathons(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            User user = resolveUser(authHeader);

            if (user == null) {
                System.err.println("User resolution failed - no valid token");
                return ResponseEntity.status(401).body("Authentication failed. Please log in again.");
            }

            if (user.getId() == null || user.getId().isEmpty()) {
                System.err.println("User ID is null or empty");
                return ResponseEntity.status(401).body("User ID not found. Please log in again.");
            }

            if (!"INDUSTRY".equals(user.getUserType())) {
                System.err.println("User type check failed: " + user.getUserType());
                return ResponseEntity.status(403)
                        .body("Only industry users can view their hackathons. You are: " + user.getUserType());
            }

            List<Hackathon> hackathons = hackathonRepository.findByCreatedByIndustryId(user.getId());
            // Update resultsPublished status based on whether any application has finalRank
            for (Hackathon hackathon : hackathons) {
                updateResultsPublishedStatus(hackathon);
            }
            System.out.println("Retrieved " + hackathons.size() + " hackathons for industry: " + user.getId());
            return ResponseEntity.ok(hackathons);
        } catch (NullPointerException e) {
            System.err.println("NullPointerException in getMyHackathons: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Null pointer error: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error retrieving hackathons: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error retrieving hackathons: " + e.getMessage());
        }
    }

    // POST improve problem statement with AI (must be before /{hackathonId} to avoid path conflict)
    @PostMapping("/improve-problem-statement")
    public ResponseEntity<?> improveProblemStatement(@RequestBody Map<String, String> request, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            User user = resolveUser(authHeader);

            if (user == null) {
                return ResponseEntity.status(401).body("User not found. Please log in again.");
            }

            if (!"INDUSTRY".equals(user.getUserType())) {
                return ResponseEntity.status(403).body("Only INDUSTRY users can use this feature. Your account type is: " + (user.getUserType() != null ? user.getUserType() : "unknown"));
            }

            String originalStatement = request.get("problemStatement");
            if (originalStatement == null || originalStatement.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Problem statement is required");
            }

            String improvedStatement = aiProblemStatementService.improveProblemStatement(originalStatement);

            Map<String, String> response = new HashMap<>();
            response.put("improvedStatement", improvedStatement);
            response.put("originalStatement", originalStatement);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error improving problem statement: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error improving problem statement: " + e.getMessage());
        }
    }

    // POST improve eligibility criteria with AI
    @PostMapping("/improve-eligibility")
    public ResponseEntity<?> improveEligibility(@RequestBody Map<String, String> request, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            User user = resolveUser(authHeader);

            if (user == null) {
                return ResponseEntity.status(401).body("User not found. Please log in again.");
            }

            if (!"INDUSTRY".equals(user.getUserType())) {
                return ResponseEntity.status(403).body("Only INDUSTRY users can use this feature. Your account type is: " + (user.getUserType() != null ? user.getUserType() : "unknown"));
            }

            String originalEligibility = request.get("eligibility");
            if (originalEligibility == null || originalEligibility.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Eligibility criteria is required");
            }

            String improvedEligibility = aiProblemStatementService.improveEligibilityCriteria(originalEligibility);

            Map<String, String> response = new HashMap<>();
            response.put("improvedEligibility", improvedEligibility);
            response.put("originalEligibility", originalEligibility);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error improving eligibility criteria: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error improving eligibility criteria: " + e.getMessage());
        }
    }

    // POST improve submission guidelines with AI
    @PostMapping("/improve-submission-guidelines")
    public ResponseEntity<?> improveSubmissionGuidelines(@RequestBody Map<String, String> request, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            User user = resolveUser(authHeader);

            if (user == null) {
                return ResponseEntity.status(401).body("User not found. Please log in again.");
            }

            if (!"INDUSTRY".equals(user.getUserType())) {
                return ResponseEntity.status(403).body("Only INDUSTRY users can use this feature. Your account type is: " + (user.getUserType() != null ? user.getUserType() : "unknown"));
            }

            String originalGuidelines = request.get("submissionGuidelines");
            if (originalGuidelines == null || originalGuidelines.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Submission guidelines is required");
            }

            String improvedGuidelines = aiProblemStatementService.improveSubmissionGuidelines(originalGuidelines);

            Map<String, String> response = new HashMap<>();
            response.put("improvedGuidelines", improvedGuidelines);
            response.put("originalGuidelines", originalGuidelines);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error improving submission guidelines: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error improving submission guidelines: " + e.getMessage());
        }
    }

    // GET single hackathon by ID
    @GetMapping("/{hackathonId}")
    public ResponseEntity<?> getHackathonById(@PathVariable String hackathonId, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            User user = resolveUser(authHeader);

            if (user == null) {
                return ResponseEntity.status(401).body("Authentication failed. Please log in again.");
            }

            var hackathon = hackathonRepository.findById(hackathonId);
            if (hackathon.isEmpty()) {
                return ResponseEntity.status(404).body("Hackathon not found");
            }

            Hackathon foundHackathon = hackathon.get();

            // Update resultsPublished status based on whether any application has finalRank
            updateResultsPublishedStatus(foundHackathon);

            // Only allow industry users to fetch their own hackathons for editing
            if ("INDUSTRY".equals(user.getUserType())
                    && !user.getId().equals(foundHackathon.getCreatedByIndustryId())) {
                return ResponseEntity.status(403).body("You can only view your own hackathons");
            }

            return ResponseEntity.ok(foundHackathon);
        } catch (Exception e) {
            System.err.println("Error fetching hackathon by ID: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error fetching hackathon: " + e.getMessage());
        }
    }

    // POST increment views for a hackathon (public endpoint)
    @PostMapping("/{hackathonId}/increment-views")
    public ResponseEntity<?> incrementViews(@PathVariable String hackathonId) {
        try {
            var hackathonOpt = hackathonRepository.findById(hackathonId);
            if (hackathonOpt.isEmpty()) {
                return ResponseEntity.status(404).body("Hackathon not found");
            }

            Hackathon hackathon = hackathonOpt.get();
            hackathon.setViews(hackathon.getViews() + 1);
            hackathonRepository.save(hackathon);

            return ResponseEntity.ok(Map.of("views", hackathon.getViews()));
        } catch (Exception e) {
            System.err.println("Error incrementing views: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error incrementing views: " + e.getMessage());
        }
    }

    // POST create hackathon (industry only)
    @PostMapping
    public ResponseEntity<?> createHackathon(@RequestBody Hackathon hackathon, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            User user = resolveUser(authHeader);

            if (user == null) {
                System.err.println("User resolution failed - no valid token");
                return ResponseEntity.status(401).body("Authentication failed. Please log in again.");
            }

            if (user.getId() == null || user.getId().isEmpty()) {
                System.err.println("User ID is null or empty");
                return ResponseEntity.status(401).body("User ID not found. Please log in again.");
            }

            if (!"INDUSTRY".equals(user.getUserType())) {
                System.err.println("User type check failed: " + user.getUserType());
                return ResponseEntity.status(403)
                        .body("Only industry users can create hackathons. You are: " + user.getUserType());
            }

            // Validate problem statement length
            if (hackathon.getProblemStatement() != null) {
                String[] words = hackathon.getProblemStatement().trim().split("\\s+");
                if (words.length < 50) {
                    return ResponseEntity.badRequest().body("Problem statement must be at least 50 words");
                }
            }

            hackathon.setCreatedByIndustryId(user.getId());
            hackathon.setViews(0);

            Hackathon saved = hackathonRepository.save(hackathon);
            System.out.println("Hackathon saved with ID: " + saved.getId() + " for industry: " + user.getId());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.err.println("Error saving hackathon: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error saving hackathon: " + e.getMessage());
        }
    }

    // PUT update hackathon (industry only)
    @PutMapping("/{hackathonId}")
    public ResponseEntity<?> updateHackathon(@PathVariable String hackathonId, @RequestBody Hackathon updatedHackathon,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        User user = resolveUser(authHeader);

        if (user == null || !"INDUSTRY".equals(user.getUserType())) {
            return ResponseEntity.status(403).body("Only industry users can update hackathons");
        }

        var hackathon = hackathonRepository.findById(hackathonId);
        if (hackathon.isEmpty()) {
            return ResponseEntity.status(404).body("Hackathon not found");
        }

        Hackathon existingHackathon = hackathon.get();

        // Check if the user owns this hackathon
        if (!user.getId().equals(existingHackathon.getCreatedByIndustryId())) {
            return ResponseEntity.status(403).body("You can only update your own hackathons");
        }

        // Validate problem statement length
        if (updatedHackathon.getProblemStatement() != null) {
            String[] words = updatedHackathon.getProblemStatement().trim().split("\\s+");
            if (words.length < 50) {
                return ResponseEntity.badRequest().body("Problem statement must be at least 50 words");
            }
        }

        // Update fields
        existingHackathon.setTitle(updatedHackathon.getTitle());
        existingHackathon.setDescription(updatedHackathon.getDescription());
        existingHackathon.setCompany(updatedHackathon.getCompany());
        existingHackathon.setIndustry(updatedHackathon.getIndustry());
        existingHackathon.setPrize(updatedHackathon.getPrize());
        existingHackathon.setFirstPrize(updatedHackathon.getFirstPrize());
        existingHackathon.setSecondPrize(updatedHackathon.getSecondPrize());
        existingHackathon.setThirdPrize(updatedHackathon.getThirdPrize());
        existingHackathon.setMinTeamSize(updatedHackathon.getMinTeamSize());
        existingHackathon.setTeamSize(updatedHackathon.getTeamSize());
        existingHackathon.setSubmissionUrl(updatedHackathon.getSubmissionUrl());

        // Update new fields
        existingHackathon.setProblemStatement(updatedHackathon.getProblemStatement());
        existingHackathon.setSkills(updatedHackathon.getSkills());
        existingHackathon.setPhases(updatedHackathon.getPhases());
        existingHackathon.setEligibility(updatedHackathon.getEligibility());
        existingHackathon.setStartDate(updatedHackathon.getStartDate());
        existingHackathon.setEndDate(updatedHackathon.getEndDate());
        existingHackathon.setMode(updatedHackathon.getMode());
        existingHackathon.setLocation(updatedHackathon.getLocation());
        existingHackathon.setReportingDate(updatedHackathon.getReportingDate());
        existingHackathon.setSubmissionGuidelines(updatedHackathon.getSubmissionGuidelines());
        existingHackathon.setMaxTeams(updatedHackathon.getMaxTeams());
        existingHackathon.setAllowIndividual(updatedHackathon.getAllowIndividual());

        return ResponseEntity.ok(hackathonRepository.save(existingHackathon));
    }

    // DELETE hackathon (industry only)
    @DeleteMapping("/{hackathonId}")
    public ResponseEntity<?> deleteHackathon(@PathVariable String hackathonId, @RequestHeader(value = "Authorization", required = false) String authHeader) {

        User user = resolveUser(authHeader);

        if (user == null || !"INDUSTRY".equals(user.getUserType())) {
            return ResponseEntity.status(403).body("Only industry users can delete hackathons");
        }

        var hackathon = hackathonRepository.findById(hackathonId);
        if (hackathon.isEmpty()) {
            return ResponseEntity.status(404).body("Hackathon not found");
        }

        // Check if the user owns this hackathon
        if (!user.getId().equals(hackathon.get().getCreatedByIndustryId())) {
            return ResponseEntity.status(403).body("You can only delete your own hackathons");
        }

        hackathonRepository.deleteById(hackathonId);
        return ResponseEntity.ok("Hackathon deleted successfully");
    }
}
