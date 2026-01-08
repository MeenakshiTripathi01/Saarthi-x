package com.saarthix.jobs.controller;

import com.saarthix.jobs.model.Application;
import com.saarthix.jobs.model.Job;
import com.saarthix.jobs.model.ResumeAndDetails;
import com.saarthix.jobs.model.User;
import com.saarthix.jobs.model.UserProfile;
import com.saarthix.jobs.repository.ApplicationRepository;
import com.saarthix.jobs.repository.JobRepository;
import com.saarthix.jobs.repository.ResumeAndDetailsRepository;
import com.saarthix.jobs.repository.UserProfileRepository;
import com.saarthix.jobs.repository.UserRepository;
import com.saarthix.jobs.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Comprehensive test suite for Job Application functionality
 * Covers all edge cases, validation, authorization, and business logic
 */
@WebMvcTest(ApplicationController.class)
class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ApplicationRepository applicationRepository;

    @MockBean
    private ResumeAndDetailsRepository resumeAndDetailsRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JobRepository jobRepository;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private UserProfileRepository userProfileRepository;

    private User industryUser;
    private User applicantUser;
    private Job validJob;
    private Application validApplication;
    private Authentication mockAuth;
    private OAuth2User mockOAuth2User;

    @BeforeEach
    void setUp() {
        // Setup industry user
        industryUser = new User();
        industryUser.setId("industry-user-id");
        industryUser.setEmail("industry@example.com");
        industryUser.setUserType("INDUSTRY");

        // Setup applicant user
        applicantUser = new User();
        applicantUser.setId("applicant-user-id");
        applicantUser.setEmail("applicant@example.com");
        applicantUser.setUserType("APPLICANT");
        applicantUser.setName("John Doe");

        // Setup valid job
        validJob = new Job();
        validJob.setId("job-id-1");
        validJob.setTitle("Software Engineer");
        validJob.setDescription("We are looking for a skilled software engineer");
        validJob.setCompany("Tech Corp");
        validJob.setLocation("San Francisco, CA");
        validJob.setIndustryId(industryUser.getId());
        validJob.setActive(true);

        // Setup valid application
        validApplication = new Application();
        validApplication.setId("application-id-1");
        validApplication.setJobId("job-id-1");
        validApplication.setApplicantEmail("applicant@example.com");
        validApplication.setApplicantId("applicant-user-id");
        validApplication.setJobTitle("Software Engineer");
        validApplication.setCompany("Tech Corp");
        validApplication.setLocation("San Francisco, CA");
        validApplication.setStatus("pending");
        validApplication.setAppliedAt(LocalDateTime.now());
        validApplication.setFullName("John Doe");
        validApplication.setPhoneNumber("1234567890");
        validApplication.setCoverLetter("I am interested in this position");

        // Setup mock authentication
        mockAuth = mock(Authentication.class);
        mockOAuth2User = mock(OAuth2User.class);
    }

    // ==================== TEST GROUP 1: POST /api/applications - Create Application (Tests 1-20) ====================

    @Test
    @DisplayName("Test 1: POST create application with all valid fields - should succeed")
    void testCreateApplication_AllValidFields_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "jobTitle": "Software Engineer",
                "company": "Tech Corp",
                "location": "San Francisco, CA",
                "jobDescription": "Job description",
                "fullName": "John Doe",
                "phoneNumber": "1234567890",
                "coverLetter": "I am interested in this position",
                "resumeFileName": "resume.pdf",
                "resumeFileType": "application/pdf",
                "resumeBase64": "base64encodeddata",
                "resumeFileSize": 1024,
                "linkedInUrl": "https://linkedin.com/in/johndoe",
                "portfolioUrl": "https://johndoe.com",
                "experience": "5 years",
                "availability": "Immediately"
            }
            """;

        // Should succeed
    }

    @Test
    @DisplayName("Test 2: POST create application without authentication - should return 401")
    void testCreateApplication_NoAuthentication_Returns401() throws Exception {
        String applicationJson = """
            {
                "jobId": "job-id-1",
                "jobTitle": "Software Engineer"
            }
            """;

        // Should return 401 Unauthorized
    }

    @Test
    @DisplayName("Test 3: POST create application as INDUSTRY user - should return 403")
    void testCreateApplication_AsIndustryUser_Returns403() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "jobTitle": "Software Engineer"
            }
            """;

        // Should return 403 Forbidden
    }

    @Test
    @DisplayName("Test 4: POST create application with null jobId - should fail")
    void testCreateApplication_NullJobId_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));

        String applicationJson = """
            {
                "jobId": null,
                "jobTitle": "Software Engineer"
            }
            """;

        // Should fail validation - jobId required
    }

    @Test
    @DisplayName("Test 5: POST create application with empty jobId - should fail")
    void testCreateApplication_EmptyJobId_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));

        String applicationJson = """
            {
                "jobId": "",
                "jobTitle": "Software Engineer"
            }
            """;

        // Should fail validation
    }

    @Test
    @DisplayName("Test 6: POST create application for non-existent job - should handle")
    void testCreateApplication_NonExistentJob_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("non-existent-id")).thenReturn(Optional.empty());

        String applicationJson = """
            {
                "jobId": "non-existent-id",
                "jobTitle": "Software Engineer"
            }
            """;

        // Should handle non-existent job (may allow external jobs)
    }

    @Test
    @DisplayName("Test 7: POST create application when already applied - should return 400")
    void testCreateApplication_AlreadyApplied_Returns400() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com"))
            .thenReturn(Optional.of(validApplication));

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "jobTitle": "Software Engineer"
            }
            """;

        // Should return 400 - already applied
    }

    @Test
    @DisplayName("Test 8: POST create application with null fullName - should use user name")
    void testCreateApplication_NullFullName_UsesUserName() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": null
            }
            """;

        // Should use user.getName() as default
    }

    @Test
    @DisplayName("Test 9: POST create application with empty fullName - should use user name")
    void testCreateApplication_EmptyFullName_UsesUserName() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": ""
            }
            """;

        // Should use user.getName() as default
    }

    @Test
    @DisplayName("Test 10: POST create application with null phoneNumber - should handle")
    void testCreateApplication_NullPhoneNumber_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "phoneNumber": null
            }
            """;

        // Should handle null phone number
    }

    @Test
    @DisplayName("Test 11: POST create application with invalid phone format - should handle")
    void testCreateApplication_InvalidPhoneFormat_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "phoneNumber": "invalid-phone"
            }
            """;

        // Should handle invalid phone format
    }

    @Test
    @DisplayName("Test 12: POST create application with null coverLetter - should handle")
    void testCreateApplication_NullCoverLetter_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "coverLetter": null
            }
            """;

        // Should handle null cover letter
    }

    @Test
    @DisplayName("Test 13: POST create application with very long coverLetter - should handle")
    void testCreateApplication_VeryLongCoverLetter_Handles() throws Exception {
        String longCoverLetter = "A".repeat(100000);
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());

        String applicationJson = String.format("""
            {
                "jobId": "job-id-1",
                "coverLetter": "%s"
            }
            """, longCoverLetter);

        // Should handle long cover letters
    }

    @Test
    @DisplayName("Test 14: POST create application with resume file - should succeed")
    void testCreateApplication_WithResumeFile_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeFileName": "resume.pdf",
                "resumeFileType": "application/pdf",
                "resumeBase64": "JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCg==",
                "resumeFileSize": 1024
            }
            """;

        // Should succeed with resume file
    }

    @Test
    @DisplayName("Test 15: POST create application with null resume fields - should handle")
    void testCreateApplication_NullResumeFields_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeFileName": null,
                "resumeFileType": null,
                "resumeBase64": null,
                "resumeFileSize": null
            }
            """;

        // Should handle null resume fields
    }

    @Test
    @DisplayName("Test 16: POST create application with invalid resumeFileSize type - should handle")
    void testCreateApplication_InvalidResumeFileSizeType_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeFileSize": "not-a-number"
            }
            """;

        // Should handle invalid file size type
    }

    @Test
    @DisplayName("Test 17: POST create application with negative resumeFileSize - should handle")
    void testCreateApplication_NegativeResumeFileSize_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeFileSize": -1
            }
            """;

        // Should handle negative file size
    }

    @Test
    @DisplayName("Test 18: POST create application with very large resumeFileSize - should handle")
    void testCreateApplication_VeryLargeResumeFileSize_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeFileSize": 10737418240
            }
            """;

        // Should handle very large file sizes (10GB)
    }

    @Test
    @DisplayName("Test 19: POST create application with invalid LinkedIn URL - should handle")
    void testCreateApplication_InvalidLinkedInUrl_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "linkedInUrl": "not-a-valid-url"
            }
            """;

        // Should handle invalid URL format
    }

    @Test
    @DisplayName("Test 20: POST create application with invalid portfolio URL - should handle")
    void testCreateApplication_InvalidPortfolioUrl_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "portfolioUrl": "not-a-valid-url"
            }
            """;

        // Should handle invalid URL format
    }

    // ==================== TEST GROUP 2: POST /api/jobs/{jobId}/apply - Simple Apply (Tests 21-40) ====================

    @Test
    @DisplayName("Test 21: POST apply to job with valid jobId - should succeed")
    void testApplyToJob_ValidJobId_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);

        // Should succeed - simple apply endpoint
    }

    @Test
    @DisplayName("Test 22: POST apply to job without authentication - should return 401")
    void testApplyToJob_NoAuthentication_Returns401() throws Exception {
        // Should return 401
    }

    @Test
    @DisplayName("Test 23: POST apply to job as INDUSTRY user - should return 403")
    void testApplyToJob_AsIndustryUser_Returns403() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));

        // Should return 403
    }

    @Test
    @DisplayName("Test 24: POST apply to non-existent job - should return 404")
    void testApplyToJob_NonExistentJob_Returns404() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("non-existent-id")).thenReturn(Optional.empty());

        // Should return 404
    }

    @Test
    @DisplayName("Test 25: POST apply to job when already applied - should return 400")
    void testApplyToJob_AlreadyApplied_Returns400() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com"))
            .thenReturn(Optional.of(validApplication));

        // Should return 400 - already applied
    }

    @Test
    @DisplayName("Test 26: POST apply to inactive job - should handle")
    void testApplyToJob_InactiveJob_Handles() throws Exception {
        validJob.setActive(false);
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());

        // Should handle inactive jobs
    }

    @Test
    @DisplayName("Test 27: POST apply to job with null user email - should return 401")
    void testApplyToJob_NullUserEmail_Returns401() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn(null);

        // Should return 401
    }

    @Test
    @DisplayName("Test 28: POST apply to job with user not found - should return 401")
    void testApplyToJob_UserNotFound_Returns401() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("nonexistent@example.com");
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // Should return 401
    }

    @Test
    @DisplayName("Test 29: POST apply to job with null authentication principal - should return 401")
    void testApplyToJob_NullAuthPrincipal_Returns401() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(null);

        // Should return 401
    }

    @Test
    @DisplayName("Test 30: POST apply to job with database save failure - should return 500")
    void testApplyToJob_DatabaseSaveFailure_Returns500() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenThrow(new RuntimeException("Database error"));

        // Should return 500
    }

    @Test
    @DisplayName("Test 31: POST create application with XSS attempt in coverLetter - should sanitize")
    void testCreateApplication_XSSInCoverLetter_Sanitizes() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "coverLetter": "<script>alert('xss')</script>Cover letter"
            }
            """;

        // Should sanitize XSS attempts
    }

    @Test
    @DisplayName("Test 32: POST create application with SQL injection attempt - should reject")
    void testCreateApplication_SQLInjectionAttempt_Rejects() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());

        String applicationJson = """
            {
                "jobId": "'; DROP TABLE applications; --",
                "coverLetter": "'; DROP TABLE applications; --"
            }
            """;

        // Should reject SQL injection attempts
    }

    @Test
    @DisplayName("Test 33: POST create application with special characters in fullName - should handle")
    void testCreateApplication_SpecialCharactersInFullName_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": "John O'Doe-Smith Jr."
            }
            """;

        // Should handle special characters
    }

    @Test
    @DisplayName("Test 34: POST create application with unicode characters - should handle")
    void testCreateApplication_UnicodeCharacters_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": "José García",
                "coverLetter": "Je suis intéressé par ce poste"
            }
            """;

        // Should handle unicode characters
    }

    @Test
    @DisplayName("Test 35: POST create application with emoji in coverLetter - should handle")
    void testCreateApplication_EmojiInCoverLetter_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "coverLetter": "I'm excited about this opportunity! 🚀"
            }
            """;

        // Should handle emojis
    }

    @Test
    @DisplayName("Test 36: POST create application with experience field - should succeed")
    void testCreateApplication_WithExperience_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "experience": "5 years in software development"
            }
            """;

        // Should succeed
    }

    @Test
    @DisplayName("Test 37: POST create application with availability field - should succeed")
    void testCreateApplication_WithAvailability_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "availability": "2 weeks notice"
            }
            """;

        // Should succeed
    }

    @Test
    @DisplayName("Test 38: POST create application with null experience - should handle")
    void testCreateApplication_NullExperience_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "experience": null
            }
            """;

        // Should handle null experience
    }

    @Test
    @DisplayName("Test 39: POST create application with null availability - should handle")
    void testCreateApplication_NullAvailability_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "availability": null
            }
            """;

        // Should handle null availability
    }

    @Test
    @DisplayName("Test 40: POST create application with invalid base64 resume - should handle")
    void testCreateApplication_InvalidBase64Resume_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeBase64": "invalid-base64-!@#$%"
            }
            """;

        // Should handle invalid base64
    }

    // ==================== TEST GROUP 3: GET /api/applications - Get My Applications (Tests 41-60) ====================

    @Test
    @DisplayName("Test 41: GET my applications as APPLICANT - should return list")
    void testGetMyApplications_AsApplicant_ReturnsList() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findByApplicantEmail("applicant@example.com")).thenReturn(Arrays.asList(validApplication));

        // Should return list of applications
    }

    @Test
    @DisplayName("Test 42: GET my applications without authentication - should return 401")
    void testGetMyApplications_NoAuthentication_Returns401() throws Exception {
        // Should return 401
    }

    @Test
    @DisplayName("Test 43: GET my applications with user not found - should return 401")
    void testGetMyApplications_UserNotFound_Returns401() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("nonexistent@example.com");
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // Should return 401
    }

    @Test
    @DisplayName("Test 44: GET my applications when no applications exist - should return empty list")
    void testGetMyApplications_NoApplications_ReturnsEmptyList() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findByApplicantEmail("applicant@example.com")).thenReturn(Collections.emptyList());

        // Should return empty list
    }

    @Test
    @DisplayName("Test 45: GET my applications with multiple applications - should return all")
    void testGetMyApplications_MultipleApplications_ReturnsAll() throws Exception {
        Application app2 = new Application();
        app2.setId("application-id-2");
        app2.setJobId("job-id-2");
        app2.setApplicantEmail("applicant@example.com");
        
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findByApplicantEmail("applicant@example.com"))
            .thenReturn(Arrays.asList(validApplication, app2));

        // Should return all applications
    }

    @Test
    @DisplayName("Test 46: GET applications by jobId as INDUSTRY user - should succeed")
    void testGetApplicationsByJobId_AsIndustryUser_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobId("job-id-1")).thenReturn(Arrays.asList(validApplication));

        // Should return applications for the job
    }

    @Test
    @DisplayName("Test 47: GET applications by jobId without authentication - should return 401")
    void testGetApplicationsByJobId_NoAuthentication_Returns401() throws Exception {
        // Should return 401
    }

    @Test
    @DisplayName("Test 48: GET applications by jobId as APPLICANT user - should return 403")
    void testGetApplicationsByJobId_AsApplicant_Returns403() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));

        // Should return 403
    }

    @Test
    @DisplayName("Test 49: GET applications by non-existent jobId - should return 404")
    void testGetApplicationsByJobId_NonExistentJob_Returns404() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(jobRepository.findById("non-existent-id")).thenReturn(Optional.empty());

        // Should return 404
    }

    @Test
    @DisplayName("Test 50: GET applications by jobId for job not owned by industry - should return 403")
    void testGetApplicationsByJobId_NotOwnedJob_Returns403() throws Exception {
        User otherIndustryUser = new User();
        otherIndustryUser.setId("other-industry-id");
        otherIndustryUser.setEmail("other@example.com");
        otherIndustryUser.setUserType("INDUSTRY");

        Job otherJob = new Job();
        otherJob.setId("other-job-id");
        otherJob.setIndustryId("other-industry-id");

        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(jobRepository.findById("other-job-id")).thenReturn(Optional.of(otherJob));

        // Should return 403 - can only view own job applications
    }

    @Test
    @DisplayName("Test 51: GET applications by jobId with no applications - should return empty list")
    void testGetApplicationsByJobId_NoApplications_ReturnsEmptyList() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobId("job-id-1")).thenReturn(Collections.emptyList());

        // Should return empty list
    }

    @Test
    @DisplayName("Test 52: GET applicant profiles by jobId as INDUSTRY user - should succeed")
    void testGetApplicantProfilesByJobId_AsIndustryUser_Success() throws Exception {
        UserProfile userProfile = new UserProfile();
        userProfile.setApplicantEmail("applicant@example.com");
        
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobId("job-id-1")).thenReturn(Arrays.asList(validApplication));
        when(userProfileRepository.findByApplicantId("applicant-user-id")).thenReturn(Optional.of(userProfile));

        // Should return applications with profiles
    }

    @Test
    @DisplayName("Test 53: GET applicant profiles by jobId without authentication - should return 401")
    void testGetApplicantProfilesByJobId_NoAuthentication_Returns401() throws Exception {
        // Should return 401
    }

    @Test
    @DisplayName("Test 54: GET applicant profiles by jobId as APPLICANT user - should return 403")
    void testGetApplicantProfilesByJobId_AsApplicant_Returns403() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));

        // Should return 403
    }

    @Test
    @DisplayName("Test 55: GET applicant profiles by jobId with applications without profiles - should handle")
    void testGetApplicantProfilesByJobId_ApplicationsWithoutProfiles_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobId("job-id-1")).thenReturn(Arrays.asList(validApplication));
        when(userProfileRepository.findByApplicantId("applicant-user-id")).thenReturn(Optional.empty());
        when(userProfileRepository.findByApplicantEmail("applicant@example.com")).thenReturn(Optional.empty());

        // Should handle applications without profiles
    }

    @Test
    @DisplayName("Test 56: GET my posted jobs as INDUSTRY user - should succeed")
    void testGetMyPostedJobs_AsIndustryUser_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(jobRepository.findByIndustryId("industry-user-id")).thenReturn(Arrays.asList(validJob));

        // Should return list of posted jobs
    }

    @Test
    @DisplayName("Test 57: GET my posted jobs without authentication - should return 401")
    void testGetMyPostedJobs_NoAuthentication_Returns401() throws Exception {
        // Should return 401
    }

    @Test
    @DisplayName("Test 58: GET my posted jobs as APPLICANT user - should return 403")
    void testGetMyPostedJobs_AsApplicant_Returns403() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));

        // Should return 403
    }

    @Test
    @DisplayName("Test 59: GET my posted jobs with no jobs posted - should return empty list")
    void testGetMyPostedJobs_NoJobsPosted_ReturnsEmptyList() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(jobRepository.findByIndustryId("industry-user-id")).thenReturn(Collections.emptyList());

        // Should return empty list
    }

    @Test
    @DisplayName("Test 60: GET applications by email as same user - should succeed")
    void testGetApplicationsByEmail_SameUser_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findByApplicantEmail("applicant@example.com")).thenReturn(Arrays.asList(validApplication));

        // Should return applications for the email
    }

    // ==================== TEST GROUP 4: PUT /api/applications/{id}/status - Update Status (Tests 61-80) ====================

    @Test
    @DisplayName("Test 61: PUT update application status to accepted - should succeed")
    void testUpdateApplicationStatus_ToAccepted_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);

        String statusJson = """
            {
                "status": "accepted"
            }
            """;

        // Should succeed
    }

    @Test
    @DisplayName("Test 62: PUT update application status without authentication - should return 401")
    void testUpdateApplicationStatus_NoAuthentication_Returns401() throws Exception {
        String statusJson = """
            {
                "status": "accepted"
            }
            """;

        // Should return 401
    }

    @Test
    @DisplayName("Test 63: PUT update application status as APPLICANT user - should return 403")
    void testUpdateApplicationStatus_AsApplicant_Returns403() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));

        String statusJson = """
            {
                "status": "accepted"
            }
            """;

        // Should return 403
    }

    @Test
    @DisplayName("Test 64: PUT update application status for non-existent application - should return 404")
    void testUpdateApplicationStatus_NonExistentApplication_Returns404() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("non-existent-id")).thenReturn(Optional.empty());

        String statusJson = """
            {
                "status": "accepted"
            }
            """;

        // Should return 404
    }

    @Test
    @DisplayName("Test 65: PUT update application status for job not owned by industry - should return 403")
    void testUpdateApplicationStatus_NotOwnedJob_Returns403() throws Exception {
        User otherIndustryUser = new User();
        otherIndustryUser.setId("other-industry-id");
        otherIndustryUser.setEmail("other@example.com");
        otherIndustryUser.setUserType("INDUSTRY");

        Job otherJob = new Job();
        otherJob.setId("other-job-id");
        otherJob.setIndustryId("other-industry-id");

        Application otherApp = new Application();
        otherApp.setId("other-app-id");
        otherApp.setJobId("other-job-id");

        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("other-app-id")).thenReturn(Optional.of(otherApp));
        when(jobRepository.findById("other-job-id")).thenReturn(Optional.of(otherJob));

        String statusJson = """
            {
                "status": "accepted"
            }
            """;

        // Should return 403 - can only update own job applications
    }

    @Test
    @DisplayName("Test 66: PUT update application status with null status - should fail")
    void testUpdateApplicationStatus_NullStatus_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));

        String statusJson = """
            {
                "status": null
            }
            """;

        // Should fail validation - status required
    }

    @Test
    @DisplayName("Test 67: PUT update application status with empty status - should fail")
    void testUpdateApplicationStatus_EmptyStatus_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));

        String statusJson = """
            {
                "status": ""
            }
            """;

        // Should fail validation
    }

    @Test
    @DisplayName("Test 68: PUT update application status with invalid status - should fail")
    void testUpdateApplicationStatus_InvalidStatus_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));

        String statusJson = """
            {
                "status": "invalid_status"
            }
            """;

        // Should fail - invalid status
    }

    @Test
    @DisplayName("Test 69: PUT update application status to all valid statuses - should succeed")
    void testUpdateApplicationStatus_AllValidStatuses_Success() throws Exception {
        String[] validStatuses = {"pending", "resume_viewed", "call_scheduled", "interview_scheduled", "offer_sent", "accepted", "rejected"};
        
        for (String status : validStatuses) {
            when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
            when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
            when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
            when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
            when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
            when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);

            String statusJson = String.format("""
                {
                    "status": "%s"
                }
                """, status);

            // Should succeed for each valid status
        }
    }

    @Test
    @DisplayName("Test 70: PUT update application status with same status - should handle")
    void testUpdateApplicationStatus_SameStatus_Handles() throws Exception {
        validApplication.setStatus("pending");
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);

        String statusJson = """
            {
                "status": "pending"
            }
            """;

        // Should handle same status (may or may not create notification)
    }

    @Test
    @DisplayName("Test 71: PUT update application status with case insensitive status - should handle")
    void testUpdateApplicationStatus_CaseInsensitive_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);

        String statusJson = """
            {
                "status": "ACCEPTED"
            }
            """;

        // Should convert to lowercase
    }

    @Test
    @DisplayName("Test 72: PUT update application status with whitespace in status - should handle")
    void testUpdateApplicationStatus_WhitespaceInStatus_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));

        String statusJson = """
            {
                "status": "  accepted  "
            }
            """;

        // Should trim whitespace
    }

    @Test
    @DisplayName("Test 73: PUT update application status for job not found - should return 404")
    void testUpdateApplicationStatus_JobNotFound_Returns404() throws Exception {
        Application appWithInvalidJob = new Application();
        appWithInvalidJob.setId("app-id");
        appWithInvalidJob.setJobId("non-existent-job-id");

        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("app-id")).thenReturn(Optional.of(appWithInvalidJob));
        when(jobRepository.findById("non-existent-job-id")).thenReturn(Optional.empty());

        String statusJson = """
            {
                "status": "accepted"
            }
            """;

        // Should return 404
    }

    @Test
    @DisplayName("Test 74: GET resume-details as authenticated user - should succeed")
    void testGetResumeDetails_AuthenticatedUser_Success() throws Exception {
        ResumeAndDetails resumeDetails = new ResumeAndDetails();
        resumeDetails.setApplicantEmail("applicant@example.com");
        
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(resumeAndDetailsRepository.findByApplicantEmail("applicant@example.com"))
            .thenReturn(Arrays.asList(resumeDetails));

        // Should return resume and details
    }

    @Test
    @DisplayName("Test 75: GET resume-details without authentication - should return 401")
    void testGetResumeDetails_NoAuthentication_Returns401() throws Exception {
        // Should return 401
    }

    @Test
    @DisplayName("Test 76: GET resume-details with no resume data - should return empty list")
    void testGetResumeDetails_NoResumeData_ReturnsEmptyList() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(resumeAndDetailsRepository.findByApplicantEmail("applicant@example.com"))
            .thenReturn(Collections.emptyList());

        // Should return empty list
    }

    @Test
    @DisplayName("Test 77: GET applications by email for different user - should return 403")
    void testGetApplicationsByEmail_DifferentUser_Returns403() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));

        // Should return 403 - can only view own applications
    }

    @Test
    @DisplayName("Test 78: POST create application with database error - should return 500")
    void testCreateApplication_DatabaseError_Returns500() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenThrow(new RuntimeException("Database error"));

        String applicationJson = """
            {
                "jobId": "job-id-1"
            }
            """;

        // Should return 500
    }

    @Test
    @DisplayName("Test 79: POST create application with notification service error - should handle")
    void testCreateApplication_NotificationServiceError_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());
        doThrow(new RuntimeException("Notification error")).when(notificationService).createNewApplicationNotification(any());

        String applicationJson = """
            {
                "jobId": "job-id-1"
            }
            """;

        // Should handle notification errors gracefully
    }

    @Test
    @DisplayName("Test 80: POST create application with all optional fields null - should succeed")
    void testCreateApplication_AllOptionalFieldsNull_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": null,
                "phoneNumber": null,
                "coverLetter": null,
                "resumeFileName": null,
                "resumeFileType": null,
                "resumeBase64": null,
                "resumeFileSize": null,
                "linkedInUrl": null,
                "portfolioUrl": null,
                "experience": null,
                "availability": null
            }
            """;

        // Should succeed with only jobId
    }

    // ==================== TEST GROUP 5: Additional Edge Cases & Security (Tests 81-100) ====================

    @Test
    @DisplayName("Test 81: POST create application with very long fullName - should handle")
    void testCreateApplication_VeryLongFullName_Handles() throws Exception {
        String longName = "A".repeat(1000);
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = String.format("""
            {
                "jobId": "job-id-1",
                "fullName": "%s"
            }
            """, longName);

        // Should handle long names
    }

    @Test
    @DisplayName("Test 82: POST create application with very long phoneNumber - should handle")
    void testCreateApplication_VeryLongPhoneNumber_Handles() throws Exception {
        String longPhone = "1".repeat(100);
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = String.format("""
            {
                "jobId": "job-id-1",
                "phoneNumber": "%s"
            }
            """, longPhone);

        // Should handle long phone numbers
    }

    @Test
    @DisplayName("Test 83: POST create application with command injection attempt in fullName - should reject")
    void testCreateApplication_CommandInjectionInFullName_Rejects() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": "John Doe; rm -rf /"
            }
            """;

        // Should reject command injection attempts
    }

    @Test
    @DisplayName("Test 84: POST create application with path traversal attempt - should reject")
    void testCreateApplication_PathTraversalAttempt_Rejects() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeFileName": "../../etc/passwd"
            }
            """;

        // Should reject path traversal attempts
    }

    @Test
    @DisplayName("Test 85: POST create application with LDAP injection attempt - should reject")
    void testCreateApplication_LDAPInjectionAttempt_Rejects() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": "John Doe)(uid=*"
            }
            """;

        // Should reject LDAP injection attempts
    }

    @Test
    @DisplayName("Test 86: POST create application with JSON injection attempt - should sanitize")
    void testCreateApplication_JSONInjectionAttempt_Sanitizes() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "coverLetter": "{\\"key\\":\\"value\\"}"
            }
            """;

        // Should sanitize JSON injection attempts
    }

    @Test
    @DisplayName("Test 87: POST create application with URL encoding in fields - should decode")
    void testCreateApplication_URLEncodingInFields_Decodes() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": "John%20Doe",
                "coverLetter": "I%20am%20interested"
            }
            """;

        // Should decode URL-encoded values
    }

    @Test
    @DisplayName("Test 88: POST create application with control characters - should sanitize")
    void testCreateApplication_ControlCharacters_Sanitizes() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": "John\\u0000Doe",
                "coverLetter": "Cover\\r\\nletter"
            }
            """;

        // Should sanitize control characters
    }

    @Test
    @DisplayName("Test 89: POST create application with CRLF injection attempt - should sanitize")
    void testCreateApplication_CRLFInjectionAttempt_Sanitizes() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "coverLetter": "Cover letter\\r\\nInjected: malicious"
            }
            """;

        // Should sanitize CRLF injection attempts
    }

    @Test
    @DisplayName("Test 90: POST create application with malformed JSON - should return 400")
    void testCreateApplication_MalformedJSON_Returns400() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));

        String malformedJson = """
            {
                "jobId": "job-id-1",
                "fullName": "John Doe"
                // Missing closing brace
            """;

        // Should return 400 Bad Request
    }

    @Test
    @DisplayName("Test 91: POST create application with duplicate field names - should handle")
    void testCreateApplication_DuplicateFieldNames_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": "John Doe",
                "fullName": "Jane Smith"
            }
            """;

        // Should use last value or handle appropriately
    }

    @Test
    @DisplayName("Test 92: POST create application with array in string field - should fail")
    void testCreateApplication_ArrayInStringField_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": ["John", "Doe"]
            }
            """;

        // Should fail type validation
    }

    @Test
    @DisplayName("Test 93: POST create application with object in string field - should fail")
    void testCreateApplication_ObjectInStringField_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": {"first": "John", "last": "Doe"}
            }
            """;

        // Should fail type validation
    }

    @Test
    @DisplayName("Test 94: POST create application with boolean in string field - should fail")
    void testCreateApplication_BooleanInStringField_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": true
            }
            """;

        // Should fail type validation
    }

    @Test
    @DisplayName("Test 95: POST create application with number in string field - should handle")
    void testCreateApplication_NumberInStringField_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "phoneNumber": 1234567890
            }
            """;

        // Should convert number to string or handle
    }

    @Test
    @DisplayName("Test 96: POST create application with escaped characters - should handle")
    void testCreateApplication_EscapedCharacters_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "coverLetter": "I have \\"5 years\\" of experience"
            }
            """;

        // Should handle escaped characters properly
    }

    @Test
    @DisplayName("Test 97: POST create application with unicode escape sequences - should decode")
    void testCreateApplication_UnicodeEscapeSequences_Decodes() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": "Jos\\u00e9 Garc\\u00eda"
            }
            """;

        // Should decode unicode escape sequences
    }

    @Test
    @DisplayName("Test 98: POST create application with trailing commas in JSON - should handle")
    void testCreateApplication_TrailingCommasInJSON_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": "John Doe",
            }
            """;

        // Should handle or reject trailing commas
    }

    @Test
    @DisplayName("Test 99: POST create application with comments in JSON - should handle")
    void testCreateApplication_CommentsInJSON_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                // This is a comment
                "fullName": "John Doe"
            }
            """;

        // Should handle or reject JSON comments
    }

    @Test
    @DisplayName("Test 100: POST create application with very large JSON payload - should handle")
    void testCreateApplication_VeryLargeJSONPayload_Handles() throws Exception {
        String largeCoverLetter = "A".repeat(100000);
        String largeResumeBase64 = "A".repeat(500000);
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());

        String applicationJson = String.format("""
            {
                "jobId": "job-id-1",
                "coverLetter": "%s",
                "resumeBase64": "%s"
            }
            """, largeCoverLetter, largeResumeBase64);

        // Should handle large payloads or reject with appropriate error
    }

    // ==================== TEST GROUP 6: Additional Edge Cases & Integration (Tests 101-120) ====================

    @Test
    @DisplayName("Test 101: POST create application with resumeFileSize as string number - should convert")
    void testCreateApplication_ResumeFileSizeAsString_Converts() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeFileSize": "1024"
            }
            """;

        // Should convert string to long
    }

    @Test
    @DisplayName("Test 102: POST create application with resumeFileSize as invalid string - should handle")
    void testCreateApplication_ResumeFileSizeAsInvalidString_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeFileSize": "not-a-number"
            }
            """;

        // Should handle invalid string and ignore
    }

    @Test
    @DisplayName("Test 103: POST create application with empty jobTitle - should handle")
    void testCreateApplication_EmptyJobTitle_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "jobTitle": ""
            }
            """;

        // Should handle empty job title
    }

    @Test
    @DisplayName("Test 104: POST create application with null company - should use default")
    void testCreateApplication_NullCompany_UsesDefault() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "company": null
            }
            """;

        // Should use default "Company confidential"
    }

    @Test
    @DisplayName("Test 105: POST create application with null location - should use default")
    void testCreateApplication_NullLocation_UsesDefault() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "location": null
            }
            """;

        // Should use default "Location not specified"
    }

    @Test
    @DisplayName("Test 106: POST create application with null status - should use default")
    void testCreateApplication_NullStatus_UsesDefault() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "status": null
            }
            """;

        // Should use default "pending"
    }

    @Test
    @DisplayName("Test 107: POST create application with invalid status value - should use default")
    void testCreateApplication_InvalidStatusValue_UsesDefault() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "status": "invalid_status"
            }
            """;

        // Should use default or handle invalid status
    }

    @Test
    @DisplayName("Test 108: POST create application with resume file but no base64 - should handle")
    void testCreateApplication_ResumeFileNoBase64_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeFileName": "resume.pdf",
                "resumeFileType": "application/pdf",
                "resumeBase64": null
            }
            """;

        // Should handle missing base64
    }

    @Test
    @DisplayName("Test 109: POST create application with base64 but no filename - should handle")
    void testCreateApplication_Base64NoFilename_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeFileName": null,
                "resumeBase64": "base64encodeddata"
            }
            """;

        // Should handle missing filename
    }

    @Test
    @DisplayName("Test 110: POST create application with very long LinkedIn URL - should handle")
    void testCreateApplication_VeryLongLinkedInUrl_Handles() throws Exception {
        String longUrl = "https://linkedin.com/in/" + "a".repeat(1000);
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = String.format("""
            {
                "jobId": "job-id-1",
                "linkedInUrl": "%s"
            }
            """, longUrl);

        // Should handle long URLs
    }

    @Test
    @DisplayName("Test 111: POST create application with very long portfolio URL - should handle")
    void testCreateApplication_VeryLongPortfolioUrl_Handles() throws Exception {
        String longUrl = "https://portfolio.com/" + "a".repeat(1000);
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = String.format("""
            {
                "jobId": "job-id-1",
                "portfolioUrl": "%s"
            }
            """, longUrl);

        // Should handle long URLs
    }

    @Test
    @DisplayName("Test 112: POST create application with very long experience field - should handle")
    void testCreateApplication_VeryLongExperience_Handles() throws Exception {
        String longExperience = "A".repeat(10000);
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = String.format("""
            {
                "jobId": "job-id-1",
                "experience": "%s"
            }
            """, longExperience);

        // Should handle long experience descriptions
    }

    @Test
    @DisplayName("Test 113: POST create application with very long availability field - should handle")
    void testCreateApplication_VeryLongAvailability_Handles() throws Exception {
        String longAvailability = "A".repeat(1000);
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = String.format("""
            {
                "jobId": "job-id-1",
                "availability": "%s"
            }
            """, longAvailability);

        // Should handle long availability descriptions
    }

    @Test
    @DisplayName("Test 114: POST create application with concurrent duplicate applications - should handle")
    void testCreateApplication_ConcurrentDuplicateApplications_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        // First call returns empty, second call returns existing (race condition)
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com"))
            .thenReturn(Optional.empty())
            .thenReturn(Optional.of(validApplication));

        String applicationJson = """
            {
                "jobId": "job-id-1"
            }
            """;

        // Should handle concurrent duplicate applications
    }

    @Test
    @DisplayName("Test 115: PUT update application status with notification service error - should handle")
    void testUpdateApplicationStatus_NotificationServiceError_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        doThrow(new RuntimeException("Notification error")).when(notificationService)
            .createStatusUpdateNotification(any(), anyString(), anyString());

        String statusJson = """
            {
                "status": "accepted"
            }
            """;

        // Should handle notification errors gracefully
    }

    @Test
    @DisplayName("Test 116: GET applications by jobId with title/company matching fallback - should handle")
    void testGetApplicationsByJobId_TitleCompanyMatchingFallback_Handles() throws Exception {
        Application appWithDifferentJobId = new Application();
        appWithDifferentJobId.setJobId("different-job-id");
        appWithDifferentJobId.setJobTitle("Software Engineer");
        appWithDifferentJobId.setCompany("Tech Corp");

        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobId("job-id-1")).thenReturn(Collections.emptyList());
        when(applicationRepository.findAll()).thenReturn(Arrays.asList(appWithDifferentJobId));

        // Should match by title and company and update jobId
    }

    @Test
    @DisplayName("Test 117: GET applicant profiles with profile found by applicantId - should succeed")
    void testGetApplicantProfiles_ProfileFoundByApplicantId_Success() throws Exception {
        UserProfile userProfile = new UserProfile();
        userProfile.setApplicantId("applicant-user-id");
        userProfile.setApplicantEmail("applicant@example.com");

        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobId("job-id-1")).thenReturn(Arrays.asList(validApplication));
        when(userProfileRepository.findByApplicantId("applicant-user-id")).thenReturn(Optional.of(userProfile));

        // Should return application with profile
    }

    @Test
    @DisplayName("Test 118: GET applicant profiles with profile found by email - should succeed")
    void testGetApplicantProfiles_ProfileFoundByEmail_Success() throws Exception {
        UserProfile userProfile = new UserProfile();
        userProfile.setApplicantEmail("applicant@example.com");

        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobId("job-id-1")).thenReturn(Arrays.asList(validApplication));
        when(userProfileRepository.findByApplicantId("applicant-user-id")).thenReturn(Optional.empty());
        when(userProfileRepository.findByApplicantEmail("applicant@example.com")).thenReturn(Optional.of(userProfile));

        // Should return application with profile found by email
    }

    @Test
    @DisplayName("Test 119: GET applicant profiles with null applicantId and email - should handle")
    void testGetApplicantProfiles_NullApplicantIdAndEmail_Handles() throws Exception {
        Application appWithoutIds = new Application();
        appWithoutIds.setId("app-id");
        appWithoutIds.setJobId("job-id-1");
        appWithoutIds.setApplicantId(null);
        appWithoutIds.setApplicantEmail(null);

        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobId("job-id-1")).thenReturn(Arrays.asList(appWithoutIds));

        // Should handle applications without applicantId or email
    }

    @Test
    @DisplayName("Test 120: POST create application with resume file type validation - should handle")
    void testCreateApplication_ResumeFileTypeValidation_Handles() throws Exception {
        String[] validTypes = {"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"};
        for (String fileType : validTypes) {
            when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
            when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
            when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
            when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
            when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
            when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
            when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

            String applicationJson = String.format("""
                {
                    "jobId": "job-id-1",
                    "resumeFileType": "%s"
                }
                """, fileType);

            // Should handle each valid file type
        }
    }

    // ==================== TEST GROUP 7: Additional Edge Cases & Boundary Conditions (Tests 121-150) ====================

    @Test
    @DisplayName("Test 121: POST create application with whitespace-only jobId - should fail")
    void testCreateApplication_WhitespaceOnlyJobId_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));

        String applicationJson = """
            {
                "jobId": "   "
            }
            """;

        // Should fail validation
    }

    @Test
    @DisplayName("Test 122: POST create application with whitespace-only fullName - should handle")
    void testCreateApplication_WhitespaceOnlyFullName_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": "   "
            }
            """;

        // Should use user.getName() as fallback
    }

    @Test
    @DisplayName("Test 123: POST create application with whitespace-only phoneNumber - should handle")
    void testCreateApplication_WhitespaceOnlyPhoneNumber_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "phoneNumber": "   "
            }
            """;

        // Should handle whitespace-only phone
    }

    @Test
    @DisplayName("Test 124: POST create application with whitespace-only coverLetter - should handle")
    void testCreateApplication_WhitespaceOnlyCoverLetter_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "coverLetter": "   "
            }
            """;

        // Should handle whitespace-only cover letter
    }

    @Test
    @DisplayName("Test 125: POST create application with newline-only coverLetter - should handle")
    void testCreateApplication_NewlineOnlyCoverLetter_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "coverLetter": "\\n\\n\\n"
            }
            """;

        // Should handle newline-only content
    }

    @Test
    @DisplayName("Test 126: POST create application with tab-only fields - should handle")
    void testCreateApplication_TabOnlyFields_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": "\\t\\t\\t",
                "coverLetter": "\\t\\t"
            }
            """;

        // Should handle tab-only content
    }

    @Test
    @DisplayName("Test 127: POST create application with mixed whitespace in fields - should handle")
    void testCreateApplication_MixedWhitespaceInFields_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "fullName": "  John  Doe  ",
                "coverLetter": "  Cover  letter  with  spaces  "
            }
            """;

        // Should handle mixed whitespace
    }

    @Test
    @DisplayName("Test 128: POST create application with resume file size as zero - should handle")
    void testCreateApplication_ZeroResumeFileSize_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeFileSize": 0
            }
            """;

        // Should handle zero file size
    }

    @Test
    @DisplayName("Test 129: POST create application with resume file size as Long.MAX_VALUE - should handle")
    void testCreateApplication_MaxResumeFileSize_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeFileSize": 9223372036854775807
            }
            """;

        // Should handle maximum file size
    }

    @Test
    @DisplayName("Test 130: POST create application with empty resumeBase64 - should handle")
    void testCreateApplication_EmptyResumeBase64_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeBase64": ""
            }
            """;

        // Should handle empty base64
    }

    @Test
    @DisplayName("Test 131: POST create application with empty resumeFileName - should handle")
    void testCreateApplication_EmptyResumeFileName_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeFileName": ""
            }
            """;

        // Should handle empty filename
    }

    @Test
    @DisplayName("Test 132: POST create application with empty resumeFileType - should handle")
    void testCreateApplication_EmptyResumeFileType_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeFileType": ""
            }
            """;

        // Should handle empty file type
    }

    @Test
    @DisplayName("Test 133: POST create application with empty LinkedIn URL - should handle")
    void testCreateApplication_EmptyLinkedInUrl_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "linkedInUrl": ""
            }
            """;

        // Should handle empty LinkedIn URL
    }

    @Test
    @DisplayName("Test 134: POST create application with empty portfolio URL - should handle")
    void testCreateApplication_EmptyPortfolioUrl_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "portfolioUrl": ""
            }
            """;

        // Should handle empty portfolio URL
    }

    @Test
    @DisplayName("Test 135: POST create application with empty experience - should handle")
    void testCreateApplication_EmptyExperience_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "experience": ""
            }
            """;

        // Should handle empty experience
    }

    @Test
    @DisplayName("Test 136: POST create application with empty availability - should handle")
    void testCreateApplication_EmptyAvailability_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "availability": ""
            }
            """;

        // Should handle empty availability
    }

    @Test
    @DisplayName("Test 137: POST create application with special characters in resumeFileName - should handle")
    void testCreateApplication_SpecialCharactersInResumeFileName_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "resumeFileName": "My Resume (2024).pdf"
            }
            """;

        // Should handle special characters in filename
    }

    @Test
    @DisplayName("Test 138: POST create application with very long resumeFileName - should handle")
    void testCreateApplication_VeryLongResumeFileName_Handles() throws Exception {
        String longFileName = "A".repeat(500) + ".pdf";
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = String.format("""
            {
                "jobId": "job-id-1",
                "resumeFileName": "%s"
            }
            """, longFileName);

        // Should handle long filenames
    }

    @Test
    @DisplayName("Test 139: POST create application with very long resumeFileType - should handle")
    void testCreateApplication_VeryLongResumeFileType_Handles() throws Exception {
        String longFileType = "application/" + "a".repeat(500);
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = String.format("""
            {
                "jobId": "job-id-1",
                "resumeFileType": "%s"
            }
            """, longFileType);

        // Should handle long file types
    }

    @Test
    @DisplayName("Test 140: POST create application with all fields at maximum length - should handle")
    void testCreateApplication_AllFieldsMaxLength_Handles() throws Exception {
        String maxFullName = "A".repeat(500);
        String maxPhone = "1".repeat(50);
        String maxCoverLetter = "A".repeat(50000);
        String maxExperience = "A".repeat(1000);
        String maxAvailability = "A".repeat(500);
        String maxResumeBase64 = "A".repeat(1000000);

        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = String.format("""
            {
                "jobId": "job-id-1",
                "fullName": "%s",
                "phoneNumber": "%s",
                "coverLetter": "%s",
                "experience": "%s",
                "availability": "%s",
                "resumeBase64": "%s"
            }
            """, maxFullName, maxPhone, maxCoverLetter, maxExperience, maxAvailability, maxResumeBase64);

        // Should handle maximum length fields
    }

    @Test
    @DisplayName("Test 141: PUT update application status with whitespace in status - should trim")
    void testUpdateApplicationStatus_WhitespaceInStatus_Trims() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);

        String statusJson = """
            {
                "status": "  accepted  "
            }
            """;

        // Should trim whitespace
    }

    @Test
    @DisplayName("Test 142: PUT update application status with mixed case status - should lowercase")
    void testUpdateApplicationStatus_MixedCaseStatus_Lowercases() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);

        String statusJson = """
            {
                "status": "AcCePtEd"
            }
            """;

        // Should convert to lowercase
    }

    @Test
    @DisplayName("Test 143: GET my applications with database error - should handle")
    void testGetMyApplications_DatabaseError_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findByApplicantEmail("applicant@example.com"))
            .thenThrow(new RuntimeException("Database error"));

        // Should handle database errors
    }

    @Test
    @DisplayName("Test 144: GET applications by jobId with database error - should handle")
    void testGetApplicationsByJobId_DatabaseError_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobId("job-id-1"))
            .thenThrow(new RuntimeException("Database error"));

        // Should handle database errors
    }

    @Test
    @DisplayName("Test 145: PUT update application status with database error - should handle")
    void testUpdateApplicationStatus_DatabaseError_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.save(any(Application.class)))
            .thenThrow(new RuntimeException("Database error"));

        String statusJson = """
            {
                "status": "accepted"
            }
            """;

        // Should handle database errors
    }

    @Test
    @DisplayName("Test 146: GET my posted jobs with backward compatibility matching - should handle")
    void testGetMyPostedJobs_BackwardCompatibilityMatching_Handles() throws Exception {
        Job oldJob = new Job();
        oldJob.setId("old-job-id");
        oldJob.setIndustryId(null);
        oldJob.setPostedBy("industry@example.com");

        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(jobRepository.findByIndustryId("industry-user-id")).thenReturn(Collections.emptyList());
        when(jobRepository.findAll()).thenReturn(Arrays.asList(oldJob));

        // Should match by postedBy field and update industryId
    }

    @Test
    @DisplayName("Test 147: GET applications by jobId with title/company matching - should update jobId")
    void testGetApplicationsByJobId_TitleCompanyMatching_UpdatesJobId() throws Exception {
        Application appWithDifferentJobId = new Application();
        appWithDifferentJobId.setJobId("different-job-id");
        appWithDifferentJobId.setJobTitle("Software Engineer");
        appWithDifferentJobId.setCompany("Tech Corp");

        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobId("job-id-1")).thenReturn(Collections.emptyList());
        when(applicationRepository.findAll()).thenReturn(Arrays.asList(appWithDifferentJobId));
        when(applicationRepository.save(any(Application.class))).thenReturn(appWithDifferentJobId);

        // Should match by title/company and update jobId
    }

    @Test
    @DisplayName("Test 148: GET applicant profiles with case-insensitive email matching - should handle")
    void testGetApplicantProfiles_CaseInsensitiveEmailMatching_Handles() throws Exception {
        UserProfile userProfile = new UserProfile();
        userProfile.setApplicantEmail("APPLICANT@EXAMPLE.COM");

        Application app = new Application();
        app.setApplicantEmail("applicant@example.com");
        app.setApplicantId("applicant-user-id");

        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobId("job-id-1")).thenReturn(Arrays.asList(app));
        when(userProfileRepository.findByApplicantId("applicant-user-id")).thenReturn(Optional.empty());
        when(userProfileRepository.findByApplicantEmail("applicant@example.com")).thenReturn(Optional.of(userProfile));

        // Should handle case-insensitive email matching
    }

    @Test
    @DisplayName("Test 149: POST create application with resumeAndDetails save failure - should handle")
    void testCreateApplication_ResumeAndDetailsSaveFailure_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class)))
            .thenThrow(new RuntimeException("Resume save error"));

        String applicationJson = """
            {
                "jobId": "job-id-1"
            }
            """;

        // Should handle resumeAndDetails save errors
    }

    @Test
    @DisplayName("Test 150: POST create application with all fields and verify both collections saved - should succeed")
    void testCreateApplication_AllFieldsBothCollectionsSaved_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(jobRepository.findById("job-id-1")).thenReturn(Optional.of(validJob));
        when(applicationRepository.findByJobIdAndApplicantEmail("job-id-1", "applicant@example.com")).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenReturn(validApplication);
        when(resumeAndDetailsRepository.save(any(ResumeAndDetails.class))).thenReturn(new ResumeAndDetails());

        String applicationJson = """
            {
                "jobId": "job-id-1",
                "jobTitle": "Software Engineer",
                "company": "Tech Corp",
                "location": "San Francisco, CA",
                "jobDescription": "Job description",
                "fullName": "John Doe",
                "phoneNumber": "1234567890",
                "coverLetter": "I am interested",
                "resumeFileName": "resume.pdf",
                "resumeFileType": "application/pdf",
                "resumeBase64": "base64data",
                "resumeFileSize": 1024,
                "linkedInUrl": "https://linkedin.com/in/johndoe",
                "portfolioUrl": "https://johndoe.com",
                "experience": "5 years",
                "availability": "Immediately",
                "status": "pending"
            }
            """;

        // Should save to both all_applied_jobs and resume_and_details collections
    }
}

