package com.saarthix.jobs.controller.Hackathon;

import com.saarthix.jobs.model.Hackathon;
import com.saarthix.jobs.model.HackathonApplication;
import com.saarthix.jobs.model.User;
import com.saarthix.jobs.repository.HackathonApplicationRepository;
import com.saarthix.jobs.repository.HackathonRepository;
import com.saarthix.jobs.repository.UserRepository;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/hackathon-applications")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class HackathonApplicationController {

    private final HackathonApplicationRepository applicationRepository;
    private final HackathonRepository hackathonRepository;
    private final UserRepository userRepository;

    public HackathonApplicationController(
            HackathonApplicationRepository applicationRepository,
            HackathonRepository hackathonRepository,
            UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.hackathonRepository = hackathonRepository;
        this.userRepository = userRepository;
    }

    // --------------------------------------------
    // ✅ APPLY TO HACKATHON (Individual or Team)
    // POST /api/hackathon-applications/{hackathonId}/apply
    // --------------------------------------------
    @PostMapping("/{hackathonId}/apply")
    public ResponseEntity<?> apply(
            @PathVariable String hackathonId,
            @RequestBody HackathonApplication req,
            Authentication auth) {

        try {
            System.out.println("=== Apply endpoint called ===");
            System.out.println("Hackathon ID: " + hackathonId);
            System.out.println("Request body: " + req);
            System.out.println("Auth is null: " + (auth == null));

            // 1️⃣ Validate logged-in user
            User user = resolveUser(auth);
            System.out.println("User resolved: " + (user != null));

            if (user == null) {
                System.err.println("User resolution failed");
                return ResponseEntity.status(401)
                        .body("Authentication failed. Please log in again.");
            }

            System.out.println("User Type: " + user.getUserType());
            if (!"APPLICANT".equals(user.getUserType())) {
                System.err.println("User is not an applicant: " + user.getUserType());
                return ResponseEntity.status(403)
                        .body("Only applicants can apply for hackathons. You are: " + user.getUserType());
            }

            // 2️⃣ Validate hackathon existence
            System.out.println("Checking if hackathon exists: " + hackathonId);
            Optional<Hackathon> hackOpt = hackathonRepository.findById(hackathonId);
            if (hackOpt.isEmpty()) {
                System.err.println("Hackathon not found: " + hackathonId);
                return ResponseEntity.status(404).body("Hackathon not found");
            }
            System.out.println("Hackathon found: " + hackOpt.get().getTitle());

            // 2.5️⃣ Check registration cutoff (server-side enforcement)
            Hackathon hackathon = hackOpt.get();
            if (hackathon.getEndDate() != null && !hackathon.getEndDate().isBlank()) {
                try {
                    LocalDateTime endDate = LocalDateTime.parse(hackathon.getEndDate());
                    LocalDateTime now = LocalDateTime.now();
                    if (now.isAfter(endDate)) {
                        System.err.println("Registration closed. End date: " + endDate + ", Current time: " + now);
                        return ResponseEntity.status(403)
                                .body("Registration period has ended. Applications are no longer accepted.");
                    }
                    System.out.println("Registration is open. End date: " + endDate);
                } catch (Exception e) {
                    System.err.println("Error parsing end date: " + e.getMessage());
                    // Continue if date parsing fails (don't block application)
                }
            }

            // 3️⃣ Team validation
            Boolean isTeam = req.getAsTeam() != null ? req.getAsTeam() : false;
            System.out.println("Is team application: " + isTeam);
            if (Boolean.TRUE.equals(isTeam)) {
                if (req.getTeamName() == null || req.getTeamName().isBlank()) {
                    System.err.println("Team name is missing");
                    return ResponseEntity.badRequest().body("Team name is required for team applications");
                }
                if (req.getTeamSize() <= 1) {
                    System.err.println("Team size is invalid: " + req.getTeamSize());
                    return ResponseEntity.badRequest().body("Team size must be greater than 1");
                }
                System.out.println(
                        "Team application validated - Name: " + req.getTeamName() + ", Size: " + req.getTeamSize());
            } else {
                // Individual mode
                req.setTeamName(null);
                req.setTeamSize(1);
                System.out.println("Individual application set");
            }

            // 4️⃣ Set required fields
            req.setHackathonId(hackathonId);
            req.setApplicantId(user.getId());
            req.setAppliedAt(LocalDateTime.now());
            System.out.println("Application fields set - Applicant ID: " + user.getId());

            // 5️⃣ Save and return
            HackathonApplication saved = applicationRepository.save(req);
            System.out.println("Application saved with ID: " + saved.getId());
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            System.err.println("Error in apply endpoint: " + e.getMessage());
            System.err.println("Exception class: " + e.getClass().getName());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body("Error submitting application: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }
    }

    // --------------------------------------------
    // GET MY HACKATHON APPLICATIONS (Applicant)
    // GET /api/hackathon-applications/my-applications
    // --------------------------------------------
    @GetMapping("/my-applications")
    public ResponseEntity<?> getMyApplications(Authentication auth) {
        try {
            System.out.println("=== getMyApplications called ===");
            System.out.println("Auth is null: " + (auth == null));

            User user = resolveUser(auth);
            System.out.println("User resolved: " + (user != null));

            if (user == null) {
                System.err.println("User resolution failed - auth principal might not be OAuth2User");
                return ResponseEntity.status(401).body("Authentication failed. Please log in again.");
            }

            System.out.println("User ID: " + user.getId());
            System.out.println("User Email: " + user.getEmail());
            System.out.println("User Type: " + user.getUserType());

            if (!"APPLICANT".equals(user.getUserType())) {
                System.err.println("User is not an applicant: " + user.getUserType());
                return ResponseEntity.status(403)
                        .body("Only applicants can view their applications. You are: " + user.getUserType());
            }

            System.out.println("Fetching applications for applicant ID: " + user.getId());
            List<HackathonApplication> applications = applicationRepository.findByApplicantId(user.getId());
            System.out.println("Retrieved " + applications.size() + " hackathon applications");

            return ResponseEntity.ok(applications);
        } catch (NullPointerException e) {
            System.err.println("NullPointerException in getMyApplications: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Null pointer error - check server logs");
        } catch (Exception e) {
            System.err.println("Error retrieving applications: " + e.getMessage());
            System.err.println("Exception class: " + e.getClass().getName());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body("Error retrieving applications: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }
    }

    // --------------------------------------------
    // SUBMIT PHASE SOLUTION (Applicant)
    // POST /api/hackathon-applications/{applicationId}/phases/{phaseId}/submit
    // --------------------------------------------
    @PostMapping("/{applicationId}/phases/{phaseId}/submit")
    public ResponseEntity<?> submitPhase(
            @PathVariable String applicationId,
            @PathVariable String phaseId,
            @RequestBody HackathonApplication.PhaseSubmission submission,
            Authentication auth) {

        User user = resolveUser(auth);
        if (user == null || !"APPLICANT".equals(user.getUserType())) {
            return ResponseEntity.status(403).body("Only applicants can submit solutions.");
        }

        Optional<HackathonApplication> appOpt = applicationRepository.findById(applicationId);
        if (appOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Application not found.");
        }
        HackathonApplication app = appOpt.get();

        if (!app.getApplicantId().equals(user.getId())) {
            return ResponseEntity.status(403).body("You can only submit for your own application.");
        }

        // Check if previous phase is accepted (unless it's the first phase)
        // Logic: If currentPhaseId is set and doesn't match, or if status is REJECTED
        if ("REJECTED".equals(app.getStatus())) {
            return ResponseEntity.status(403).body("Application is rejected.");
        }

        // Update submission
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setStatus("PENDING"); // Reset status on new submission
        app.getPhaseSubmissions().put(phaseId, submission);
        app.setCurrentPhaseId(phaseId); // Update current phase tracking

        applicationRepository.save(app);
        return ResponseEntity.ok(app);
    }

    // --------------------------------------------
    // REVIEW PHASE SOLUTION (Industry)
    // PUT /api/hackathon-applications/{applicationId}/phases/{phaseId}/review
    // --------------------------------------------
    @PutMapping("/{applicationId}/phases/{phaseId}/review")
    public ResponseEntity<?> reviewPhase(
            @PathVariable String applicationId,
            @PathVariable String phaseId,
            @RequestBody HackathonApplication.PhaseSubmission review,
            Authentication auth) {

        User user = resolveUser(auth);
        if (user == null || !"INDUSTRY".equals(user.getUserType())) {
            return ResponseEntity.status(403).body("Only industry users can review submissions.");
        }

        Optional<HackathonApplication> appOpt = applicationRepository.findById(applicationId);
        if (appOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Application not found.");
        }
        HackathonApplication app = appOpt.get();

        // Verify industry owns the hackathon
        Optional<Hackathon> hackOpt = hackathonRepository.findById(app.getHackathonId());
        if (hackOpt.isEmpty() || !hackOpt.get().getCreatedByIndustryId().equals(user.getId())) {
            return ResponseEntity.status(403).body("You can only review applications for your hackathons.");
        }

        HackathonApplication.PhaseSubmission existingSubmission = app.getPhaseSubmissions().get(phaseId);
        if (existingSubmission == null) {
            return ResponseEntity.status(404).body("No submission found for this phase.");
        }

        // Update review details
        existingSubmission.setStatus(review.getStatus());
        existingSubmission.setScore(review.getScore());
        existingSubmission.setRemarks(review.getRemarks());

        // Update overall status if rejected
        if ("REJECTED".equals(review.getStatus())) {
            app.setStatus("REJECTED");
        }

        applicationRepository.save(app);
        return ResponseEntity.ok(app);
    }

    // --------------------------------------------
    // GET APPLICATIONS BY HACKATHON (Industry)
    // GET /api/hackathon-applications/hackathon/{hackathonId}
    // --------------------------------------------
    @GetMapping("/hackathon/{hackathonId}")
    public ResponseEntity<?> getApplicationsByHackathon(
            @PathVariable String hackathonId,
            Authentication auth) {

        User user = resolveUser(auth);
        if (user == null || !"INDUSTRY".equals(user.getUserType())) {
            return ResponseEntity.status(403).body("Only industry users can view applications.");
        }

        Optional<Hackathon> hackOpt = hackathonRepository.findById(hackathonId);
        if (hackOpt.isEmpty() || !hackOpt.get().getCreatedByIndustryId().equals(user.getId())) {
            return ResponseEntity.status(403).body("Access denied.");
        }

        List<HackathonApplication> applications = applicationRepository.findByHackathonId(hackathonId);
        return ResponseEntity.ok(applications);
    }

    // --------------------------------------------
    // GET APPLICATION DETAILS
    // GET /api/hackathon-applications/{applicationId}
    // --------------------------------------------
    @GetMapping("/{applicationId}")
    public ResponseEntity<?> getApplicationDetails(
            @PathVariable String applicationId,
            Authentication auth) {

        User user = resolveUser(auth);
        if (user == null)
            return ResponseEntity.status(401).build();

        Optional<HackathonApplication> appOpt = applicationRepository.findById(applicationId);
        if (appOpt.isEmpty())
            return ResponseEntity.status(404).build();
        HackathonApplication app = appOpt.get();

        // Access control: Applicant or Owner Industry
        boolean isApplicant = app.getApplicantId().equals(user.getId());
        boolean isOwner = false;
        if (!isApplicant) {
            Optional<Hackathon> hackOpt = hackathonRepository.findById(app.getHackathonId());
            if (hackOpt.isPresent() && hackOpt.get().getCreatedByIndustryId().equals(user.getId())) {
                isOwner = true;
            }
        }

        if (!isApplicant && !isOwner) {
            return ResponseEntity.status(403).body("Access denied.");
        }

        return ResponseEntity.ok(app);
    }

    // --------------------------------------------
    // FINALIZE RESULTS & CALCULATE RANKINGS (Industry)
    // POST /api/hackathon-applications/hackathon/{hackathonId}/finalize-results
    // --------------------------------------------
    @PostMapping("/hackathon/{hackathonId}/finalize-results")
    public ResponseEntity<?> finalizeResults(
            @PathVariable String hackathonId,
            @RequestBody(required = false) Map<String, Object> body,
            Authentication auth) {

        User user = resolveUser(auth);
        if (user == null || !"INDUSTRY".equals(user.getUserType())) {
            return ResponseEntity.status(403).body("Only industry users can finalize results");
        }

        // Read certificate customization from request (backend is source of truth)
        String certificateTemplateId = null;
        String logoUrl = null;
        String platformLogoUrl = null;
        String customMessage = null;
        String signatureLeftUrl = null;
        String signatureRightUrl = null;

        if (body != null) {
            if (body.get("certificateTemplateId") != null) {
                certificateTemplateId = String.valueOf(body.get("certificateTemplateId"));
            }
            if (body.get("logoUrl") != null) {
                logoUrl = String.valueOf(body.get("logoUrl"));
            }
            if (body.get("platformLogoUrl") != null) {
                platformLogoUrl = String.valueOf(body.get("platformLogoUrl"));
            }
            if (body.get("customMessage") != null) {
                customMessage = String.valueOf(body.get("customMessage"));
            }
            if (body.get("signatureLeftUrl") != null) {
                signatureLeftUrl = String.valueOf(body.get("signatureLeftUrl"));
            }
            if (body.get("signatureRightUrl") != null) {
                signatureRightUrl = String.valueOf(body.get("signatureRightUrl"));
            }
        }
        System.out.println("[FinalizeResults] hackathonId=" + hackathonId
                + ", template=" + certificateTemplateId
                + ", logoUrl=" + logoUrl
                + ", platformLogoUrl=" + platformLogoUrl
                + ", signatureLeftUrl=" + signatureLeftUrl
                + ", signatureRightUrl=" + signatureRightUrl);

        // Get all applications for this hackathon
        List<HackathonApplication> applications = applicationRepository.findByHackathonId(hackathonId);

        // Calculate total scores for each application
        for (HackathonApplication app : applications) {
            double totalScore = 0.0;
            for (HackathonApplication.PhaseSubmission submission : app.getPhaseSubmissions().values()) {
                if (submission.getScore() != null) {
                    totalScore += submission.getScore();
                }
            }
            app.setTotalScore(totalScore);
        }

        // Sort by total score (descending) for display purposes only
        applications.sort((a, b) -> Double.compare(
                b.getTotalScore() != null ? b.getTotalScore() : 0.0,
                a.getTotalScore() != null ? a.getTotalScore() : 0.0));

        // DO NOT auto-assign ranks - ranks must be explicitly set by industry via PATCH
        // endpoint
        // Only apply certificate customization to all applications
        for (int i = 0; i < applications.size(); i++) {
            HackathonApplication app = applications.get(i);
            // Persist the selected template & design for every application
            if (certificateTemplateId != null && !certificateTemplateId.isBlank()) {
                app.setCertificateTemplateId(certificateTemplateId);
            }
            if (logoUrl != null) {
                app.setCertificateLogoUrl(logoUrl);
            }
            if (platformLogoUrl != null) {
                app.setCertificatePlatformLogoUrl(platformLogoUrl);
            }
            if (customMessage != null) {
                app.setCertificateCustomMessage(customMessage);
            }
            if (signatureLeftUrl != null) {
                app.setCertificateSignatureLeftUrl(signatureLeftUrl);
            }
            if (signatureRightUrl != null) {
                app.setCertificateSignatureRightUrl(signatureRightUrl);
            }
            generateCertificateUrls(app);

            // LOG SAVED CERTIFICATE DATA
            System.out.println("=== [SAVE] Application " + app.getId() + " Certificate Data ===");
            System.out.println("  templateId: " + app.getCertificateTemplateId());
            System.out.println("  logoUrl: " + app.getCertificateLogoUrl());
            System.out.println("  platformLogoUrl: " + app.getCertificatePlatformLogoUrl());
            System.out.println("  customMessage: " + app.getCertificateCustomMessage());
            System.out.println("  signatureLeftUrl: " + app.getCertificateSignatureLeftUrl());
            System.out.println("  signatureRightUrl: " + app.getCertificateSignatureRightUrl());
        }

        // Save all applications
        applicationRepository.saveAll(applications);

        return ResponseEntity.ok("Results finalized successfully");
    }

    private void generateCertificateUrls(HackathonApplication app) {
        String baseUrl = "http://localhost:8080/api/certificates/view";

        if (Boolean.TRUE.equals(app.getAsTeam())) {
            // Generate for each team member
            for (HackathonApplication.TeamMember member : app.getTeamMembers()) {
                String certUrl = baseUrl + "?applicationId=" + app.getId() + "&email=" + member.getEmail();
                member.setCertificateUrl(certUrl);
            }
        } else {
            // Generate for individual
            String certUrl = baseUrl + "?applicationId=" + app.getId();
            app.setCertificateUrl(certUrl);
        }
    }

    // --------------------------------------------
    // PUBLISH SHOWCASE CONTENT (Industry - for top 3)
    // PUT /api/hackathon-applications/{applicationId}/showcase
    // --------------------------------------------
    @PutMapping("/{applicationId}/showcase")
    public ResponseEntity<?> publishShowcase(
            @PathVariable String applicationId,
            @RequestBody HackathonApplication.ShowcaseContent showcase,
            Authentication auth) {

        User user = resolveUser(auth);
        if (user == null || !"INDUSTRY".equals(user.getUserType())) {
            return ResponseEntity.status(403).body("Only industry users can publish showcase");
        }

        Optional<HackathonApplication> appOpt = applicationRepository.findById(applicationId);
        if (appOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        HackathonApplication app = appOpt.get();

        // Only allow for top 3
        if (app.getFinalRank() == null || app.getFinalRank() > 3) {
            return ResponseEntity.status(400).body("Showcase only available for top 3 winners");
        }

        showcase.setPublishedAt(LocalDateTime.now());
        app.setShowcaseContent(showcase);
        applicationRepository.save(app);

        return ResponseEntity.ok(app);
    }

    // --------------------------------------------
    // GET RESULTS (Applicant - view own results)
    // GET /api/hackathon-applications/{applicationId}/results
    // --------------------------------------------
    @GetMapping("/{applicationId}/results")
    public ResponseEntity<?> getResults(
            @PathVariable String applicationId,
            Authentication auth) {

        User user = resolveUser(auth);
        if (user == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }

        Optional<HackathonApplication> appOpt = applicationRepository.findById(applicationId);
        if (appOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        HackathonApplication app = appOpt.get();

        // Applicants can only view their own results
        if ("APPLICANT".equals(user.getUserType()) && !app.getApplicantId().equals(user.getId())) {
            return ResponseEntity.status(403).body("Access denied");
        }

        // LOG CERTIFICATE DATA BEING RETURNED TO APPLICANT
        System.out.println("=== [API RESPONSE] Application " + app.getId() + " Certificate Data ===");
        System.out.println("  rank: " + app.getFinalRank());
        System.out.println("  rankTitle: " + app.getRankTitle());
        System.out.println("  templateId: " + app.getCertificateTemplateId());
        System.out.println("  logoUrl: " + app.getCertificateLogoUrl());
        System.out.println("  platformLogoUrl: " + app.getCertificatePlatformLogoUrl());
        System.out.println("  customMessage: " + app.getCertificateCustomMessage());
        System.out.println("  signatureLeftUrl: " + app.getCertificateSignatureLeftUrl());
        System.out.println("  signatureRightUrl: " + app.getCertificateSignatureRightUrl());

        return ResponseEntity.ok(app);
    }

    // --------------------------------------------
    // GET ALL RESULTS FOR HACKATHON (Industry)
    // GET /api/hackathon-applications/hackathon/{hackathonId}/results
    // --------------------------------------------
    @GetMapping("/hackathon/{hackathonId}/results")
    public ResponseEntity<?> getHackathonResults(
            @PathVariable String hackathonId,
            Authentication auth) {

        User user = resolveUser(auth);
        if (user == null || !"INDUSTRY".equals(user.getUserType())) {
            return ResponseEntity.status(403).body("Only industry users can view all results");
        }

        List<HackathonApplication> applications = applicationRepository.findByHackathonId(hackathonId);

        // Sort by rank (nulls last) then by total score
        applications.sort((a, b) -> {
            if (a.getFinalRank() != null && b.getFinalRank() != null) {
                return Integer.compare(a.getFinalRank(), b.getFinalRank());
            }
            if (a.getFinalRank() != null)
                return -1;
            if (b.getFinalRank() != null)
                return 1;
            return Double.compare(
                    b.getTotalScore() != null ? b.getTotalScore() : 0.0,
                    a.getTotalScore() != null ? a.getTotalScore() : 0.0);
        });

        return ResponseEntity.ok(applications);
    }

    // --------------------------------------------
    // UPDATE APPLICATION RANK (Industry - Manual Selection)
    // PATCH /api/hackathon-applications/{applicationId}
    // --------------------------------------------
    @PatchMapping("/{applicationId}")
    public ResponseEntity<?> updateApplicationRank(
            @PathVariable String applicationId,
            @RequestBody Map<String, Object> updates,
            Authentication auth) {

        User user = resolveUser(auth);
        System.out.println("PATCH /api/hackathon-applications/" + applicationId);
        System.out.println("User: " + (user != null ? user.getEmail() : "null"));
        System.out.println("User Type: " + (user != null ? user.getUserType() : "null"));

        if (user == null || !"INDUSTRY".equals(user.getUserType())) {
            System.out.println("Authorization failed - returning 403");
            return ResponseEntity.status(403).body("Only industry users can update rankings");
        }

        Optional<HackathonApplication> appOpt = applicationRepository.findById(applicationId);
        if (appOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        HackathonApplication app = appOpt.get();

        // Update finalRank if provided
        if (updates.containsKey("finalRank")) {
            Integer rank = (Integer) updates.get("finalRank");
            app.setFinalRank(rank);
            System.out.println("Setting finalRank to: " + rank);
        }

        // Update totalScore if provided
        if (updates.containsKey("totalScore")) {
            Double score = ((Number) updates.get("totalScore")).doubleValue();
            app.setTotalScore(score);
            System.out.println("Setting totalScore to: " + score);
        }

        applicationRepository.save(app);
        System.out.println("Application saved successfully");
        return ResponseEntity.ok(app);
    }

    // --------------------------------------------
    // DELETE APPLICATION (Industry)
    // DELETE /api/hackathon-applications/{applicationId}
    // --------------------------------------------
    @DeleteMapping("/{applicationId}")
    public ResponseEntity<?> deleteApplication(
            @PathVariable String applicationId,
            Authentication auth) {

        User user = resolveUser(auth);
        if (user == null || !"INDUSTRY".equals(user.getUserType())) {
            return ResponseEntity.status(403).body("Only industry users can delete applications");
        }

        Optional<HackathonApplication> appOpt = applicationRepository.findById(applicationId);
        if (appOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        HackathonApplication app = appOpt.get();

        // Verify ownership
        Optional<Hackathon> hackOpt = hackathonRepository.findById(app.getHackathonId());
        if (hackOpt.isEmpty() || !hackOpt.get().getCreatedByIndustryId().equals(user.getId())) {
            return ResponseEntity.status(403).body("You can only delete applications for your hackathons");
        }

        applicationRepository.delete(app);
        return ResponseEntity.ok("Application deleted successfully");
    }

    // --------------------------------------------
    // Helper — resolve logged-in user from OAuth
    // --------------------------------------------
    private User resolveUser(Authentication auth) {
        if (auth == null)
            return null;
        if (auth.getPrincipal() instanceof OAuth2User oauth) {
            String email = oauth.getAttribute("email");
            return userRepository.findByEmail(email).orElse(null);
        }
        return null;
    }
}
