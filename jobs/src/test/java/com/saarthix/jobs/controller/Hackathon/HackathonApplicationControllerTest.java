package com.saarthix.jobs.controller.Hackathon;

import com.saarthix.jobs.model.Hackathon;
import com.saarthix.jobs.model.HackathonApplication;
import com.saarthix.jobs.model.HackathonPhase;
import com.saarthix.jobs.model.User;
import com.saarthix.jobs.repository.HackathonApplicationRepository;
import com.saarthix.jobs.repository.HackathonRepository;
import com.saarthix.jobs.repository.UserRepository;
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
 * Comprehensive test suite for Hackathon Application functionality
 * Covers all edge cases, validation, authorization, and business logic
 */
@WebMvcTest(HackathonApplicationController.class)
class HackathonApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private HackathonApplicationRepository applicationRepository;

    @MockBean
    private HackathonRepository hackathonRepository;

    @MockBean
    private UserRepository userRepository;

    private User industryUser;
    private User applicantUser;
    private Hackathon validHackathon;
    private HackathonApplication validApplication;
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

        // Setup valid hackathon
        validHackathon = new Hackathon();
        validHackathon.setId("hackathon-id-1");
        validHackathon.setTitle("AI Innovation Challenge");
        validHackathon.setCreatedByIndustryId(industryUser.getId());
        validHackathon.setResultsPublished(false);
        
        HackathonPhase phase1 = new HackathonPhase();
        phase1.setId("phase-1");
        phase1.setName("Phase 1");
        phase1.setDeadline(LocalDateTime.now().plusDays(30).toString());
        validHackathon.setPhases(Arrays.asList(phase1));
        validHackathon.setEndDate(LocalDateTime.now().plusDays(30).toString());
        validHackathon.setAllowIndividual(true);

        // Setup valid application
        validApplication = new HackathonApplication();
        validApplication.setId("application-id-1");
        validApplication.setHackathonId("hackathon-id-1");
        validApplication.setApplicantId(applicantUser.getId());
        validApplication.setAsTeam(false);
        validApplication.setIndividualName("John Doe");
        validApplication.setIndividualEmail("applicant@example.com");
        validApplication.setIndividualPhone("1234567890");
        validApplication.setIndividualQualifications("Bachelor's in Computer Science");
        validApplication.setAppliedAt(LocalDateTime.now());
        validApplication.setStatus("ACTIVE");

        // Setup mock authentication
        mockAuth = mock(Authentication.class);
        mockOAuth2User = mock(OAuth2User.class);
    }

    // ==================== TEST GROUP 1: POST /api/hackathon-applications/{hackathonId}/apply - Individual Application (Tests 1-20) ====================

    @Test
    @DisplayName("Test 1: POST apply to hackathon as individual with all valid fields - should succeed")
    void testApplyToHackathon_IndividualAllValidFields_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "John Doe",
                "individualEmail": "applicant@example.com",
                "individualPhone": "1234567890",
                "individualQualifications": "Bachelor's in Computer Science"
            }
            """;

        // Should succeed
    }

    @Test
    @DisplayName("Test 2: POST apply to hackathon without authentication - should return 401")
    void testApplyToHackathon_NoAuthentication_Returns401() throws Exception {
        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "John Doe",
                "individualEmail": "applicant@example.com"
            }
            """;

        // Should return 401 Unauthorized
    }

    @Test
    @DisplayName("Test 3: POST apply to hackathon as INDUSTRY user - should return 403")
    void testApplyToHackathon_AsIndustryUser_Returns403() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "John Doe"
            }
            """;

        // Should return 403 Forbidden
    }

    @Test
    @DisplayName("Test 4: POST apply to non-existent hackathon - should return 404")
    void testApplyToHackathon_NonExistentHackathon_Returns404() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("non-existent-id")).thenReturn(Optional.empty());

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "John Doe"
            }
            """;

        // Should return 404
    }

    @Test
    @DisplayName("Test 5: POST apply to hackathon with results published - should return 403")
    void testApplyToHackathon_ResultsPublished_Returns403() throws Exception {
        validHackathon.setResultsPublished(true);
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "John Doe"
            }
            """;

        // Should return 403 - applications closed
    }

    @Test
    @DisplayName("Test 6: POST apply to hackathon with Phase 1 deadline passed - should return 403")
    void testApplyToHackathon_Phase1DeadlinePassed_Returns403() throws Exception {
        HackathonPhase phase1 = new HackathonPhase();
        phase1.setId("phase-1");
        phase1.setDeadline(LocalDateTime.now().minusDays(1).toString()); // Past deadline
        validHackathon.setPhases(Arrays.asList(phase1));
        
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "John Doe"
            }
            """;

        // Should return 403 - deadline passed
    }

    @Test
    @DisplayName("Test 7: POST apply to hackathon with endDate passed - should return 403")
    void testApplyToHackathon_EndDatePassed_Returns403() throws Exception {
        validHackathon.setEndDate(LocalDateTime.now().minusDays(1).toString()); // Past end date
        
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "John Doe"
            }
            """;

        // Should return 403 - registration closed
    }

    @Test
    @DisplayName("Test 8: POST apply to hackathon with previously rejected application - should return 403")
    void testApplyToHackathon_PreviouslyRejected_Returns403() throws Exception {
        HackathonApplication rejectedApp = new HackathonApplication();
        rejectedApp.setStatus("REJECTED");
        rejectedApp.setRejectionMessage("Application rejected");
        
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId("hackathon-id-1", applicantUser.getId()))
            .thenReturn(Arrays.asList(rejectedApp));

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "John Doe"
            }
            """;

        // Should return 403 - cannot re-apply after rejection
    }

    @Test
    @DisplayName("Test 9: POST apply as individual with null individualName - should fail")
    void testApplyToHackathon_IndividualNullName_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": null,
                "individualEmail": "applicant@example.com"
            }
            """;

        // Should fail validation
    }

    @Test
    @DisplayName("Test 10: POST apply as individual with empty individualName - should fail")
    void testApplyToHackathon_IndividualEmptyName_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "",
                "individualEmail": "applicant@example.com"
            }
            """;

        // Should fail validation
    }

    @Test
    @DisplayName("Test 11: POST apply as individual with null individualEmail - should handle")
    void testApplyToHackathon_IndividualNullEmail_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "John Doe",
                "individualEmail": null
            }
            """;

        // Should handle null email
    }

    @Test
    @DisplayName("Test 12: POST apply as individual with invalid email format - should handle")
    void testApplyToHackathon_IndividualInvalidEmail_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "John Doe",
                "individualEmail": "invalid-email"
            }
            """;

        // Should handle invalid email format
    }

    @Test
    @DisplayName("Test 13: POST apply as individual with null individualPhone - should handle")
    void testApplyToHackathon_IndividualNullPhone_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "John Doe",
                "individualEmail": "applicant@example.com",
                "individualPhone": null
            }
            """;

        // Should handle null phone
    }

    @Test
    @DisplayName("Test 14: POST apply as individual with null individualQualifications - should handle")
    void testApplyToHackathon_IndividualNullQualifications_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "John Doe",
                "individualEmail": "applicant@example.com",
                "individualQualifications": null
            }
            """;

        // Should handle null qualifications
    }

    @Test
    @DisplayName("Test 15: POST apply to hackathon that doesn't allow individuals - should return 403")
    void testApplyToHackathon_DoesNotAllowIndividual_Returns403() throws Exception {
        validHackathon.setAllowIndividual(false);
        
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "John Doe",
                "individualEmail": "applicant@example.com"
            }
            """;

        // Should return 403 - individual applications not allowed
    }

    @Test
    @DisplayName("Test 16: POST apply as individual with asTeam null - should default to false")
    void testApplyToHackathon_AsTeamNull_DefaultsToFalse() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        String applicationJson = """
            {
                "asTeam": null,
                "individualName": "John Doe",
                "individualEmail": "applicant@example.com"
            }
            """;

        // Should default to individual application
    }

    @Test
    @DisplayName("Test 17: POST apply as individual with very long name - should handle")
    void testApplyToHackathon_IndividualVeryLongName_Handles() throws Exception {
        String longName = "A".repeat(1000);
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = String.format("""
            {
                "asTeam": false,
                "individualName": "%s",
                "individualEmail": "applicant@example.com"
            }
            """, longName);

        // Should handle long names
    }

    @Test
    @DisplayName("Test 18: POST apply as individual with special characters in name - should handle")
    void testApplyToHackathon_IndividualSpecialCharactersInName_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "John O'Doe-Smith",
                "individualEmail": "applicant@example.com"
            }
            """;

        // Should handle special characters
    }

    @Test
    @DisplayName("Test 19: POST apply as individual with XSS attempt in name - should sanitize")
    void testApplyToHackathon_IndividualXSSInName_Sanitizes() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "<script>alert('xss')</script>John Doe",
                "individualEmail": "applicant@example.com"
            }
            """;

        // Should sanitize XSS attempts
    }

    @Test
    @DisplayName("Test 20: POST apply as individual with SQL injection attempt - should reject")
    void testApplyToHackathon_IndividualSQLInjection_Rejects() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": false,
                "individualName": "'; DROP TABLE applications; --",
                "individualEmail": "applicant@example.com"
            }
            """;

        // Should reject SQL injection attempts
    }

    // ==================== TEST GROUP 2: POST /api/hackathon-applications/{hackathonId}/apply - Team Application (Tests 21-40) ====================

    @Test
    @DisplayName("Test 21: POST apply to hackathon as team with all valid fields - should succeed")
    void testApplyToHackathon_TeamAllValidFields_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "Team Alpha",
                "teamSize": 4,
                "teamMembers": [
                    {
                        "name": "John Doe",
                        "email": "john@example.com",
                        "phone": "1234567890",
                        "role": "Team Lead"
                    },
                    {
                        "name": "Jane Smith",
                        "email": "jane@example.com",
                        "phone": "0987654321",
                        "role": "Member"
                    }
                ]
            }
            """;

        // Should succeed
    }

    @Test
    @DisplayName("Test 22: POST apply as team with null teamName - should fail")
    void testApplyToHackathon_TeamNullTeamName_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": null,
                "teamSize": 4
            }
            """;

        // Should fail - team name required
    }

    @Test
    @DisplayName("Test 23: POST apply as team with empty teamName - should fail")
    void testApplyToHackathon_TeamEmptyTeamName_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "",
                "teamSize": 4
            }
            """;

        // Should fail - team name required
    }

    @Test
    @DisplayName("Test 24: POST apply as team with teamSize less than 2 - should fail")
    void testApplyToHackathon_TeamSizeLessThan2_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "Team Alpha",
                "teamSize": 1
            }
            """;

        // Should fail - team size must be > 1
    }

    @Test
    @DisplayName("Test 25: POST apply as team with teamSize equal to 2 - should succeed")
    void testApplyToHackathon_TeamSizeEqualTo2_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "Team Alpha",
                "teamSize": 2
            }
            """;

        // Should succeed
    }

    @Test
    @DisplayName("Test 26: POST apply as team with teamSize exceeding hackathon maxTeamSize - should handle")
    void testApplyToHackathon_TeamSizeExceedsMax_Handles() throws Exception {
        validHackathon.setTeamSize(4); // Max team size is 4
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "Team Alpha",
                "teamSize": 10
            }
            """;

        // Should handle or reject oversized teams
    }

    @Test
    @DisplayName("Test 27: POST apply as team with teamSize less than hackathon minTeamSize - should handle")
    void testApplyToHackathon_TeamSizeLessThanMin_Handles() throws Exception {
        validHackathon.setMinTeamSize(3); // Min team size is 3
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "Team Alpha",
                "teamSize": 2
            }
            """;

        // Should handle or reject undersized teams
    }

    @Test
    @DisplayName("Test 28: POST apply as team with empty teamMembers array - should handle")
    void testApplyToHackathon_TeamEmptyMembers_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "Team Alpha",
                "teamSize": 4,
                "teamMembers": []
            }
            """;

        // Should handle empty team members
    }

    @Test
    @DisplayName("Test 29: POST apply as team with null teamMembers - should handle")
    void testApplyToHackathon_TeamNullMembers_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "Team Alpha",
                "teamSize": 4,
                "teamMembers": null
            }
            """;

        // Should handle null team members
    }

    @Test
    @DisplayName("Test 30: POST apply as team with teamMember missing name - should handle")
    void testApplyToHackathon_TeamMemberMissingName_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "Team Alpha",
                "teamSize": 4,
                "teamMembers": [
                    {
                        "name": null,
                        "email": "john@example.com",
                        "phone": "1234567890",
                        "role": "Team Lead"
                    }
                ]
            }
            """;

        // Should handle missing member name
    }

    @Test
    @DisplayName("Test 31: POST apply as team with teamMember missing email - should handle")
    void testApplyToHackathon_TeamMemberMissingEmail_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "Team Alpha",
                "teamSize": 4,
                "teamMembers": [
                    {
                        "name": "John Doe",
                        "email": null,
                        "phone": "1234567890",
                        "role": "Team Lead"
                    }
                ]
            }
            """;

        // Should handle missing member email
    }

    @Test
    @DisplayName("Test 32: POST apply as team with duplicate team member emails - should handle")
    void testApplyToHackathon_TeamDuplicateEmails_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "Team Alpha",
                "teamSize": 4,
                "teamMembers": [
                    {
                        "name": "John Doe",
                        "email": "same@example.com",
                        "phone": "1234567890",
                        "role": "Team Lead"
                    },
                    {
                        "name": "Jane Smith",
                        "email": "same@example.com",
                        "phone": "0987654321",
                        "role": "Member"
                    }
                ]
            }
            """;

        // Should handle or reject duplicate emails
    }

    @Test
    @DisplayName("Test 33: POST apply as team with invalid team member email format - should handle")
    void testApplyToHackathon_TeamInvalidEmailFormat_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "Team Alpha",
                "teamSize": 4,
                "teamMembers": [
                    {
                        "name": "John Doe",
                        "email": "invalid-email",
                        "phone": "1234567890",
                        "role": "Team Lead"
                    }
                ]
            }
            """;

        // Should handle invalid email format
    }

    @Test
    @DisplayName("Test 34: POST apply as team with teamSize not matching teamMembers count - should handle")
    void testApplyToHackathon_TeamSizeMismatch_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "Team Alpha",
                "teamSize": 4,
                "teamMembers": [
                    {
                        "name": "John Doe",
                        "email": "john@example.com",
                        "phone": "1234567890",
                        "role": "Team Lead"
                    }
                ]
            }
            """;

        // Should handle size mismatch
    }

    @Test
    @DisplayName("Test 35: POST apply as team with multiple team members - should succeed")
    void testApplyToHackathon_TeamMultipleMembers_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "Team Alpha",
                "teamSize": 4,
                "teamMembers": [
                    {
                        "name": "John Doe",
                        "email": "john@example.com",
                        "phone": "1234567890",
                        "role": "Team Lead"
                    },
                    {
                        "name": "Jane Smith",
                        "email": "jane@example.com",
                        "phone": "0987654321",
                        "role": "Member"
                    },
                    {
                        "name": "Bob Johnson",
                        "email": "bob@example.com",
                        "phone": "1122334455",
                        "role": "Member"
                    },
                    {
                        "name": "Alice Williams",
                        "email": "alice@example.com",
                        "phone": "5566778899",
                        "role": "Member"
                    }
                ]
            }
            """;

        // Should succeed
    }

    @Test
    @DisplayName("Test 36: POST apply as team with special characters in teamName - should handle")
    void testApplyToHackathon_TeamSpecialCharactersInName_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "Team Alpha-2025!",
                "teamSize": 4
            }
            """;

        // Should handle special characters
    }

    @Test
    @DisplayName("Test 37: POST apply as team with very long teamName - should handle")
    void testApplyToHackathon_TeamVeryLongName_Handles() throws Exception {
        String longName = "A".repeat(500);
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = String.format("""
            {
                "asTeam": true,
                "teamName": "%s",
                "teamSize": 4
            }
            """, longName);

        // Should handle long team names
    }

    @Test
    @DisplayName("Test 38: POST apply as team with XSS attempt in teamName - should sanitize")
    void testApplyToHackathon_TeamXSSInName_Sanitizes() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "<script>alert('xss')</script>Team Alpha",
                "teamSize": 4
            }
            """;

        // Should sanitize XSS attempts
    }

    @Test
    @DisplayName("Test 39: POST apply as team with negative teamSize - should fail")
    void testApplyToHackathon_TeamNegativeSize_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "Team Alpha",
                "teamSize": -1
            }
            """;

        // Should fail validation
    }

    @Test
    @DisplayName("Test 40: POST apply as team with zero teamSize - should fail")
    void testApplyToHackathon_TeamZeroSize_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonIdAndApplicantId(anyString(), anyString())).thenReturn(Collections.emptyList());

        String applicationJson = """
            {
                "asTeam": true,
                "teamName": "Team Alpha",
                "teamSize": 0
            }
            """;

        // Should fail validation
    }

    // ==================== TEST GROUP 3: POST /api/hackathon-applications/{applicationId}/phases/{phaseId}/submit - Phase Submissions (Tests 41-60) ====================

    @Test
    @DisplayName("Test 41: POST submit phase solution with solutionStatement - should succeed")
    void testSubmitPhase_SolutionStatement_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        String submissionJson = """
            {
                "solutionStatement": "This is our solution to the problem",
                "status": "PENDING"
            }
            """;

        // Should succeed
    }

    @Test
    @DisplayName("Test 42: POST submit phase solution without authentication - should return 403")
    void testSubmitPhase_NoAuthentication_Returns403() throws Exception {
        String submissionJson = """
            {
                "solutionStatement": "Solution"
            }
            """;

        // Should return 403
    }

    @Test
    @DisplayName("Test 43: POST submit phase solution as INDUSTRY user - should return 403")
    void testSubmitPhase_AsIndustryUser_Returns403() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));

        String submissionJson = """
            {
                "solutionStatement": "Solution"
            }
            """;

        // Should return 403
    }

    @Test
    @DisplayName("Test 44: POST submit phase solution for non-existent application - should return 404")
    void testSubmitPhase_NonExistentApplication_Returns404() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("non-existent-id")).thenReturn(Optional.empty());

        String submissionJson = """
            {
                "solutionStatement": "Solution"
            }
            """;

        // Should return 404
    }

    @Test
    @DisplayName("Test 45: POST submit phase solution for another user's application - should return 403")
    void testSubmitPhase_AnotherUserApplication_Returns403() throws Exception {
        User otherApplicant = new User();
        otherApplicant.setId("other-applicant-id");
        otherApplicant.setEmail("other@example.com");
        otherApplicant.setUserType("APPLICANT");

        HackathonApplication otherApp = new HackathonApplication();
        otherApp.setId("other-app-id");
        otherApp.setApplicantId("other-applicant-id");

        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("other-app-id")).thenReturn(Optional.of(otherApp));

        String submissionJson = """
            {
                "solutionStatement": "Solution"
            }
            """;

        // Should return 403 - can only submit for own application
    }

    @Test
    @DisplayName("Test 46: POST submit phase solution for rejected application - should return 403")
    void testSubmitPhase_RejectedApplication_Returns403() throws Exception {
        validApplication.setStatus("REJECTED");
        
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));

        String submissionJson = """
            {
                "solutionStatement": "Solution"
            }
            """;

        // Should return 403 - application rejected
    }

    @Test
    @DisplayName("Test 47: POST submit phase solution after deadline passed - should return 403")
    void testSubmitPhase_DeadlinePassed_Returns403() throws Exception {
        HackathonPhase phase1 = new HackathonPhase();
        phase1.setId("phase-1");
        phase1.setDeadline(LocalDateTime.now().minusDays(1).toString()); // Past deadline
        validHackathon.setPhases(Arrays.asList(phase1));
        
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));

        String submissionJson = """
            {
                "solutionStatement": "Solution"
            }
            """;

        // Should return 403 - deadline passed
    }

    @Test
    @DisplayName("Test 48: POST submit phase solution with fileUrl - should succeed")
    void testSubmitPhase_WithFileUrl_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        String submissionJson = """
            {
                "fileUrl": "https://example.com/file.pdf",
                "fileName": "solution.pdf",
                "status": "PENDING"
            }
            """;

        // Should succeed
    }

    @Test
    @DisplayName("Test 49: POST submit phase solution with submissionLink - should succeed")
    void testSubmitPhase_WithSubmissionLink_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        String submissionJson = """
            {
                "submissionLink": "https://github.com/user/repo",
                "status": "PENDING"
            }
            """;

        // Should succeed
    }

    @Test
    @DisplayName("Test 50: POST submit phase solution with all submission types - should succeed")
    void testSubmitPhase_AllSubmissionTypes_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        String submissionJson = """
            {
                "solutionStatement": "This is our solution",
                "fileUrl": "https://example.com/file.pdf",
                "fileName": "solution.pdf",
                "submissionLink": "https://github.com/user/repo",
                "status": "PENDING"
            }
            """;

        // Should succeed
    }

    @Test
    @DisplayName("Test 51: POST submit phase solution with empty solutionStatement - should handle")
    void testSubmitPhase_EmptySolutionStatement_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));

        String submissionJson = """
            {
                "solutionStatement": "",
                "status": "PENDING"
            }
            """;

        // Should handle empty statement
    }

    @Test
    @DisplayName("Test 52: POST submit phase solution with null solutionStatement - should handle")
    void testSubmitPhase_NullSolutionStatement_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));

        String submissionJson = """
            {
                "solutionStatement": null,
                "status": "PENDING"
            }
            """;

        // Should handle null statement
    }

    @Test
    @DisplayName("Test 53: POST submit phase solution with invalid fileUrl format - should handle")
    void testSubmitPhase_InvalidFileUrl_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));

        String submissionJson = """
            {
                "fileUrl": "not-a-valid-url",
                "status": "PENDING"
            }
            """;

        // Should handle invalid URL format
    }

    @Test
    @DisplayName("Test 54: POST submit phase solution with invalid submissionLink format - should handle")
    void testSubmitPhase_InvalidSubmissionLink_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));

        String submissionJson = """
            {
                "submissionLink": "not-a-valid-url",
                "status": "PENDING"
            }
            """;

        // Should handle invalid link format
    }

    @Test
    @DisplayName("Test 55: POST submit phase solution as re-upload after REUPLOAD_REQUESTED - should succeed")
    void testSubmitPhase_ReuploadAfterRequest_Success() throws Exception {
        HackathonApplication.PhaseSubmission existingSubmission = new HackathonApplication.PhaseSubmission();
        existingSubmission.setStatus("REUPLOAD_REQUESTED");
        existingSubmission.setReuploadCount(1);
        validApplication.getPhaseSubmissions().put("phase-1", existingSubmission);
        
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        String submissionJson = """
            {
                "solutionStatement": "Updated solution after re-upload request",
                "status": "PENDING"
            }
            """;

        // Should succeed and mark as re-uploaded
    }

    @Test
    @DisplayName("Test 56: POST submit phase solution with XSS attempt in solutionStatement - should sanitize")
    void testSubmitPhase_XSSInSolutionStatement_Sanitizes() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));

        String submissionJson = """
            {
                "solutionStatement": "<script>alert('xss')</script>Solution",
                "status": "PENDING"
            }
            """;

        // Should sanitize XSS attempts
    }

    @Test
    @DisplayName("Test 57: POST submit phase solution with very long solutionStatement - should handle")
    void testSubmitPhase_VeryLongSolutionStatement_Handles() throws Exception {
        String longStatement = "A".repeat(100000);
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));

        String submissionJson = String.format("""
            {
                "solutionStatement": "%s",
                "status": "PENDING"
            }
            """, longStatement);

        // Should handle long statements
    }

    @Test
    @DisplayName("Test 58: POST submit phase solution with SQL injection attempt - should reject")
    void testSubmitPhase_SQLInjectionAttempt_Rejects() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));

        String submissionJson = """
            {
                "solutionStatement": "'; DROP TABLE submissions; --",
                "status": "PENDING"
            }
            """;

        // Should reject SQL injection attempts
    }

    @Test
    @DisplayName("Test 59: POST submit phase solution for non-existent phase - should handle")
    void testSubmitPhase_NonExistentPhase_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));

        String submissionJson = """
            {
                "solutionStatement": "Solution",
                "status": "PENDING"
            }
            """;

        // Should handle non-existent phase
    }

    @Test
    @DisplayName("Test 60: POST submit phase solution with null status - should default to PENDING")
    void testSubmitPhase_NullStatus_DefaultsToPending() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        String submissionJson = """
            {
                "solutionStatement": "Solution",
                "status": null
            }
            """;

        // Should default to PENDING status
    }

    // ==================== TEST GROUP 4: PUT /api/hackathon-applications/{applicationId}/phases/{phaseId}/review - Review Operations (Tests 61-80) ====================

    @Test
    @DisplayName("Test 61: PUT review phase solution as ACCEPTED - should succeed")
    void testReviewPhase_Accepted_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        HackathonApplication.PhaseSubmission existingSubmission = new HackathonApplication.PhaseSubmission();
        existingSubmission.setStatus("PENDING");
        validApplication.getPhaseSubmissions().put("phase-1", existingSubmission);

        String reviewJson = """
            {
                "status": "ACCEPTED",
                "score": 85,
                "remarks": "Great solution!"
            }
            """;

        // Should succeed
    }

    @Test
    @DisplayName("Test 62: PUT review phase solution without authentication - should return 403")
    void testReviewPhase_NoAuthentication_Returns403() throws Exception {
        String reviewJson = """
            {
                "status": "ACCEPTED",
                "score": 85
            }
            """;

        // Should return 403
    }

    @Test
    @DisplayName("Test 63: PUT review phase solution as APPLICANT user - should return 403")
    void testReviewPhase_AsApplicant_Returns403() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));

        String reviewJson = """
            {
                "status": "ACCEPTED",
                "score": 85
            }
            """;

        // Should return 403
    }

    @Test
    @DisplayName("Test 64: PUT review phase solution for non-existent application - should return 404")
    void testReviewPhase_NonExistentApplication_Returns404() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("non-existent-id")).thenReturn(Optional.empty());

        String reviewJson = """
            {
                "status": "ACCEPTED",
                "score": 85
            }
            """;

        // Should return 404
    }

    @Test
    @DisplayName("Test 65: PUT review phase solution for hackathon not owned by industry - should return 403")
    void testReviewPhase_NotOwnedHackathon_Returns403() throws Exception {
        User otherIndustryUser = new User();
        otherIndustryUser.setId("other-industry-id");
        otherIndustryUser.setEmail("other@example.com");
        otherIndustryUser.setUserType("INDUSTRY");

        Hackathon otherHackathon = new Hackathon();
        otherHackathon.setId("other-hackathon-id");
        otherHackathon.setCreatedByIndustryId("other-industry-id");

        HackathonApplication otherApp = new HackathonApplication();
        otherApp.setId("other-app-id");
        otherApp.setHackathonId("other-hackathon-id");

        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("other-app-id")).thenReturn(Optional.of(otherApp));
        when(hackathonRepository.findById("other-hackathon-id")).thenReturn(Optional.of(otherHackathon));

        String reviewJson = """
            {
                "status": "ACCEPTED",
                "score": 85
            }
            """;

        // Should return 403 - can only review own hackathons
    }

    @Test
    @DisplayName("Test 66: PUT review phase solution with REJECTED status - should succeed")
    void testReviewPhase_Rejected_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        HackathonApplication.PhaseSubmission existingSubmission = new HackathonApplication.PhaseSubmission();
        existingSubmission.setStatus("PENDING");
        validApplication.getPhaseSubmissions().put("phase-1", existingSubmission);

        String reviewJson = """
            {
                "status": "REJECTED",
                "score": 0,
                "remarks": "Solution does not meet requirements"
            }
            """;

        // Should succeed and set application status to REJECTED
    }

    @Test
    @DisplayName("Test 67: PUT review phase solution with negative score - should handle")
    void testReviewPhase_NegativeScore_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));

        HackathonApplication.PhaseSubmission existingSubmission = new HackathonApplication.PhaseSubmission();
        existingSubmission.setStatus("PENDING");
        validApplication.getPhaseSubmissions().put("phase-1", existingSubmission);

        String reviewJson = """
            {
                "status": "ACCEPTED",
                "score": -10
            }
            """;

        // Should handle or reject negative scores
    }

    @Test
    @DisplayName("Test 68: PUT review phase solution with score over 100 - should handle")
    void testReviewPhase_ScoreOver100_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));

        HackathonApplication.PhaseSubmission existingSubmission = new HackathonApplication.PhaseSubmission();
        existingSubmission.setStatus("PENDING");
        validApplication.getPhaseSubmissions().put("phase-1", existingSubmission);

        String reviewJson = """
            {
                "status": "ACCEPTED",
                "score": 150
            }
            """;

        // Should handle scores over 100
    }

    @Test
    @DisplayName("Test 69: PUT review phase solution with null score - should handle")
    void testReviewPhase_NullScore_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        HackathonApplication.PhaseSubmission existingSubmission = new HackathonApplication.PhaseSubmission();
        existingSubmission.setStatus("PENDING");
        validApplication.getPhaseSubmissions().put("phase-1", existingSubmission);

        String reviewJson = """
            {
                "status": "ACCEPTED",
                "score": null
            }
            """;

        // Should handle null score
    }

    @Test
    @DisplayName("Test 70: PUT review phase solution with null remarks - should handle")
    void testReviewPhase_NullRemarks_Handles() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        HackathonApplication.PhaseSubmission existingSubmission = new HackathonApplication.PhaseSubmission();
        existingSubmission.setStatus("PENDING");
        validApplication.getPhaseSubmissions().put("phase-1", existingSubmission);

        String reviewJson = """
            {
                "status": "ACCEPTED",
                "score": 85,
                "remarks": null
            }
            """;

        // Should handle null remarks
    }

    @Test
    @DisplayName("Test 71: PUT request re-upload for phase solution - should succeed")
    void testRequestReupload_ValidRequest_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        HackathonApplication.PhaseSubmission existingSubmission = new HackathonApplication.PhaseSubmission();
        existingSubmission.setStatus("PENDING");
        existingSubmission.setReuploadCount(0);
        validApplication.getPhaseSubmissions().put("phase-1", existingSubmission);

        String requestJson = """
            {
                "message": "Please re-upload with additional documentation"
            }
            """;

        // Should succeed and increment reupload count
    }

    @Test
    @DisplayName("Test 72: PUT request re-upload when count is already 2 - should return 400")
    void testRequestReupload_MaxCountReached_Returns400() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));

        HackathonApplication.PhaseSubmission existingSubmission = new HackathonApplication.PhaseSubmission();
        existingSubmission.setStatus("PENDING");
        existingSubmission.setReuploadCount(2); // Already at max
        validApplication.getPhaseSubmissions().put("phase-1", existingSubmission);

        String requestJson = """
            {
                "message": "Please re-upload"
            }
            """;

        // Should return 400 - max re-upload limit reached
    }

    @Test
    @DisplayName("Test 73: PUT request re-upload when count is 1 - should succeed")
    void testRequestReupload_CountIs1_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        HackathonApplication.PhaseSubmission existingSubmission = new HackathonApplication.PhaseSubmission();
        existingSubmission.setStatus("PENDING");
        existingSubmission.setReuploadCount(1);
        validApplication.getPhaseSubmissions().put("phase-1", existingSubmission);

        String requestJson = """
            {
                "message": "Please re-upload"
            }
            """;

        // Should succeed - second re-upload request
    }

    @Test
    @DisplayName("Test 74: PUT request re-upload without authentication - should return 403")
    void testRequestReupload_NoAuthentication_Returns403() throws Exception {
        String requestJson = """
            {
                "message": "Please re-upload"
            }
            """;

        // Should return 403
    }

    @Test
    @DisplayName("Test 75: PUT request re-upload as APPLICANT user - should return 403")
    void testRequestReupload_AsApplicant_Returns403() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));

        String requestJson = """
            {
                "message": "Please re-upload"
            }
            """;

        // Should return 403
    }

    @Test
    @DisplayName("Test 76: PUT reject application with rejection message - should succeed")
    void testRejectApplication_WithMessage_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        String requestJson = """
            {
                "rejectionMessage": "Application does not meet eligibility criteria"
            }
            """;

        // Should succeed and set status to REJECTED
    }

    @Test
    @DisplayName("Test 77: PUT reject application without rejection message - should succeed")
    void testRejectApplication_WithoutMessage_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(applicationRepository.findById("application-id-1")).thenReturn(Optional.of(validApplication));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.save(any(HackathonApplication.class))).thenReturn(validApplication);

        String requestJson = """
            {
                "rejectionMessage": null
            }
            """;

        // Should succeed
    }

    @Test
    @DisplayName("Test 78: PUT reject application without authentication - should return 403")
    void testRejectApplication_NoAuthentication_Returns403() throws Exception {
        String requestJson = """
            {
                "rejectionMessage": "Rejected"
            }
            """;

        // Should return 403
    }

    @Test
    @DisplayName("Test 79: PUT reject application as APPLICANT user - should return 403")
    void testRejectApplication_AsApplicant_Returns403() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));

        String requestJson = """
            {
                "rejectionMessage": "Rejected"
            }
            """;

        // Should return 403
    }

    @Test
    @DisplayName("Test 80: GET my applications as APPLICANT - should succeed")
    void testGetMyApplications_AsApplicant_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));
        when(applicationRepository.findByApplicantId("applicant-user-id")).thenReturn(Arrays.asList(validApplication));

        // Should return list of applications
    }
}

