package com.saarthix.jobs.controller;

import com.saarthix.jobs.model.Hackathon;
import com.saarthix.jobs.model.HackathonApplication;
import com.saarthix.jobs.model.User;
import com.saarthix.jobs.repository.HackathonApplicationRepository;
import com.saarthix.jobs.repository.HackathonRepository;
import com.saarthix.jobs.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/certificates")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class CertificateController {

    private final HackathonApplicationRepository applicationRepository;
    private final HackathonRepository hackathonRepository;
    private final UserRepository userRepository;

    public CertificateController(HackathonApplicationRepository applicationRepository,
            HackathonRepository hackathonRepository,
            UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.hackathonRepository = hackathonRepository;
        this.userRepository = userRepository;
    }

    // Generate Certificates for an Application
    @PostMapping("/generate/{applicationId}")
    public ResponseEntity<?> generateCertificates(@PathVariable String applicationId) {
        Optional<HackathonApplication> appOpt = applicationRepository.findById(applicationId);
        if (appOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        HackathonApplication app = appOpt.get();
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

        applicationRepository.save(app);
        return ResponseEntity.ok("Certificates generated successfully");
    }

    // View Certificate
    @GetMapping("/view")
    public String viewCertificate(@RequestParam String applicationId,
            @RequestParam(required = false) String email) {
        Optional<HackathonApplication> appOpt = applicationRepository.findById(applicationId);
        if (appOpt.isEmpty()) {
            return "<html><body><h1>Application not found</h1></body></html>";
        }

        HackathonApplication app = appOpt.get();
        Optional<Hackathon> hackOpt = hackathonRepository.findById(app.getHackathonId());
        String hackathonName = hackOpt.map(Hackathon::getTitle).orElse("Hackathon");

        String recipientName = "Participant";

        if (Boolean.TRUE.equals(app.getAsTeam()) && email != null) {
            // Find team member
            Optional<HackathonApplication.TeamMember> memberOpt = app.getTeamMembers().stream()
                    .filter(m -> m.getEmail().equals(email))
                    .findFirst();
            if (memberOpt.isPresent()) {
                recipientName = memberOpt.get().getName();
            }
        } else {
            // Find applicant
            Optional<User> userOpt = userRepository.findById(app.getApplicantId());
            if (userOpt.isPresent()) {
                recipientName = userOpt.get().getName(); // Assuming User has getName(), if not I'll check
            }
        }

        // Simple HTML Template for Certificate
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<style>" +
                "body { font-family: 'Arial', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f0f0; margin: 0; }"
                +
                ".certificate-container { position: relative; width: 800px; height: 600px; background: linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%); padding: 50px; border: 10px solid #daa520; box-shadow: 0 0 20px rgba(0,0,0,0.1); text-align: center; color: #333; }"
                +
                ".header { font-size: 48px; font-weight: bold; margin-bottom: 20px; color: #2c3e50; }" +
                ".sub-header { font-size: 24px; margin-bottom: 40px; color: #7f8c8d; }" +
                ".recipient { font-size: 60px; font-weight: bold; margin: 30px 0; color: #e67e22; border-bottom: 2px solid #ddd; display: inline-block; padding: 0 20px; }"
                +
                ".body-text { font-size: 20px; margin-bottom: 60px; line-height: 1.6; }" +
                ".footer { font-size: 16px; color: #95a5a6; position: absolute; bottom: 50px; width: 100%; left: 0; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class='certificate-container'>" +
                "<div class='header'>Certificate of Participation</div>" +
                "<div class='sub-header'>This is to certify that</div>" +
                "<div class='recipient'>" + recipientName + "</div>" +
                "<div class='body-text'>has successfully participated in the<br><strong>" + hackathonName
                + "</strong></div>" +
                "<div class='footer'>Authorized by Saarthi-x</div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }
}
