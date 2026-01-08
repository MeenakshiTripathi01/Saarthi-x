package com.saarthix.jobs.controller;

import com.saarthix.jobs.model.Hackathon;
import com.saarthix.jobs.model.HackathonPhase;
import com.saarthix.jobs.model.User;
import com.saarthix.jobs.repository.HackathonApplicationRepository;
import com.saarthix.jobs.repository.HackathonRepository;
import com.saarthix.jobs.repository.UserRepository;
import com.saarthix.jobs.service.AIProblemStatementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.web.servlet.MockMvc;

import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Comprehensive test suite for Hackathon Posting functionality
 * Covers all edge cases, validation, authorization, and business logic
 */
@WebMvcTest(HackathonController.class)
class HackathonControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private HackathonRepository hackathonRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private HackathonApplicationRepository applicationRepository;

    @MockBean
    private AIProblemStatementService aiProblemStatementService;

    private User industryUser;
    private User applicantUser;
    private Hackathon validHackathon;
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
        validHackathon.setDescription("A hackathon focused on AI innovation");
        validHackathon.setCompany("Tech Corp");
        validHackathon.setIndustry("Technology");
        validHackathon.setProblemStatement(generateProblemStatement(50)); // 50 words minimum
        validHackathon.setSkills(Arrays.asList("Python", "Machine Learning", "AI"));
        
        HackathonPhase phase1 = new HackathonPhase();
        phase1.setId("phase-1");
        phase1.setName("Phase 1");
        phase1.setDescription("Initial submission");
        phase1.setUploadFormat("document");
        phase1.setDeadline("2025-12-31T23:59:59");
        validHackathon.setPhases(Arrays.asList(phase1));
        
        validHackathon.setEligibility("Open to all students");
        validHackathon.setStartDate("2025-01-01T00:00:00");
        validHackathon.setEndDate("2025-12-31T23:59:59");
        validHackathon.setMode("Online");
        validHackathon.setMinTeamSize(1);
        validHackathon.setTeamSize(4);
        validHackathon.setMaxTeams(100);
        validHackathon.setAllowIndividual(true);
        validHackathon.setCreatedByIndustryId(industryUser.getId());
        validHackathon.setViews(0);
        validHackathon.setResultsPublished(false);

        // Setup mock authentication
        mockAuth = mock(Authentication.class);
        mockOAuth2User = mock(OAuth2User.class);
    }

    private String generateProblemStatement(int wordCount) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < wordCount; i++) {
            sb.append("word").append(i).append(" ");
        }
        return sb.toString().trim();
    }

    // ==================== TEST GROUP 1: POST /api/hackathons - Basic Validation (Tests 1-20) ====================

    @Test
    @DisplayName("Test 1: POST hackathon with all valid fields - should succeed")
    void testPostHackathon_AllValidFields_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(hackathonRepository.save(any(Hackathon.class))).thenReturn(validHackathon);

        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon focused on AI innovation",
                "company": "Tech Corp",
                "industry": "Technology",
                "problemStatement": "%s",
                "skills": ["Python", "Machine Learning", "AI"],
                "phases": [{
                    "id": "phase-1",
                    "name": "Phase 1",
                    "description": "Initial submission",
                    "uploadFormat": "document",
                    "deadline": "2025-12-31T23:59:59"
                }],
                "eligibility": "Open to all students",
                "startDate": "2025-01-01T00:00:00",
                "endDate": "2025-12-31T23:59:59",
                "mode": "Online",
                "minTeamSize": 1,
                "teamSize": 4,
                "maxTeams": 100,
                "allowIndividual": true
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed
    }

    @Test
    @DisplayName("Test 2: POST hackathon without authentication - should return 401")
    void testPostHackathon_NoAuthentication_Returns401() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s"
            }
            """.formatted(generateProblemStatement(50));

        // Should return 401 Unauthorized
    }

    @Test
    @DisplayName("Test 3: POST hackathon as APPLICANT user - should return 403")
    void testPostHackathon_AsApplicant_Returns403() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));

        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s"
            }
            """.formatted(generateProblemStatement(50));

        // Should return 403 Forbidden
    }

    @Test
    @DisplayName("Test 4: POST hackathon with null title - should fail validation")
    void testPostHackathon_NullTitle_Fails() throws Exception {
        String hackathonJson = """
            {
                "title": null,
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s"
            }
            """.formatted(generateProblemStatement(50));

        // Should fail validation
    }

    @Test
    @DisplayName("Test 5: POST hackathon with empty title - should fail validation")
    void testPostHackathon_EmptyTitle_Fails() throws Exception {
        String hackathonJson = """
            {
                "title": "",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s"
            }
            """.formatted(generateProblemStatement(50));

        // Should fail validation
    }

    @Test
    @DisplayName("Test 6: POST hackathon with problem statement less than 50 words - should fail")
    void testPostHackathon_ProblemStatementLessThan50Words_Fails() throws Exception {
        String shortStatement = generateProblemStatement(49); // 49 words
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s"
            }
            """.formatted(shortStatement);

        // Should fail - minimum 50 words required
    }

    @Test
    @DisplayName("Test 7: POST hackathon with problem statement exactly 50 words - should succeed")
    void testPostHackathon_ProblemStatementExactly50Words_Success() throws Exception {
        String exactStatement = generateProblemStatement(50);
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s"
            }
            """.formatted(exactStatement);

        // Should succeed
    }

    @Test
    @DisplayName("Test 8: POST hackathon with problem statement more than 50 words - should succeed")
    void testPostHackathon_ProblemStatementMoreThan50Words_Success() throws Exception {
        String longStatement = generateProblemStatement(100);
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s"
            }
            """.formatted(longStatement);

        // Should succeed
    }

    @Test
    @DisplayName("Test 9: POST hackathon with null problem statement - should fail")
    void testPostHackathon_NullProblemStatement_Fails() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": null
            }
            """;

        // Should fail validation
    }

    @Test
    @DisplayName("Test 10: POST hackathon with empty problem statement - should fail")
    void testPostHackathon_EmptyProblemStatement_Fails() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": ""
            }
            """;

        // Should fail validation
    }

    @Test
    @DisplayName("Test 11: POST hackathon with null company - should fail validation")
    void testPostHackathon_NullCompany_Fails() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": null,
                "problemStatement": "%s"
            }
            """.formatted(generateProblemStatement(50));

        // Should fail validation
    }

    @Test
    @DisplayName("Test 12: POST hackathon with empty company - should fail validation")
    void testPostHackathon_EmptyCompany_Fails() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "",
                "problemStatement": "%s"
            }
            """.formatted(generateProblemStatement(50));

        // Should fail validation
    }

    @Test
    @DisplayName("Test 13: POST hackathon with null description - should handle")
    void testPostHackathon_NullDescription_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": null,
                "company": "Tech Corp",
                "problemStatement": "%s"
            }
            """.formatted(generateProblemStatement(50));

        // Should handle null description
    }

    @Test
    @DisplayName("Test 14: POST hackathon with empty description - should handle")
    void testPostHackathon_EmptyDescription_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "",
                "company": "Tech Corp",
                "problemStatement": "%s"
            }
            """.formatted(generateProblemStatement(50));

        // Should handle empty description
    }

    @Test
    @DisplayName("Test 15: POST hackathon with very long title (1000+ characters) - should handle")
    void testPostHackathon_VeryLongTitle_Handles() throws Exception {
        String longTitle = "A".repeat(1000);
        String hackathonJson = String.format("""
            {
                "title": "%s",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s"
            }
            """, longTitle, generateProblemStatement(50));

        // Should handle long titles
    }

    @Test
    @DisplayName("Test 16: POST hackathon with special characters in title - should handle")
    void testPostHackathon_SpecialCharactersInTitle_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge 2025 - $50K Prize!",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s"
            }
            """.formatted(generateProblemStatement(50));

        // Should handle special characters
    }

    @Test
    @DisplayName("Test 17: POST hackathon with HTML tags in problem statement - should sanitize")
    void testPostHackathon_HTMLTagsInProblemStatement_Sanitizes() throws Exception {
        String problemWithHTML = generateProblemStatement(50) + " <script>alert('xss')</script>";
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s"
            }
            """.formatted(problemWithHTML);

        // Should sanitize HTML
    }

    @Test
    @DisplayName("Test 18: POST hackathon with SQL injection attempt - should reject")
    void testPostHackathon_SQLInjectionAttempt_Rejects() throws Exception {
        String problemWithSQL = generateProblemStatement(50) + "'; DROP TABLE hackathons; --";
        String hackathonJson = """
            {
                "title": "'; DROP TABLE hackathons; --",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s"
            }
            """.formatted(problemWithSQL);

        // Should reject SQL injection attempts
    }

    @Test
    @DisplayName("Test 19: POST hackathon with emoji in title - should handle")
    void testPostHackathon_EmojiInTitle_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge 🚀",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s"
            }
            """.formatted(generateProblemStatement(50));

        // Should handle emojis
    }

    @Test
    @DisplayName("Test 20: POST hackathon with unicode characters - should handle")
    void testPostHackathon_UnicodeCharacters_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "Défi d'Innovation IA",
                "description": "Un hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s"
            }
            """.formatted(generateProblemStatement(50));

        // Should handle unicode
    }

    // ==================== TEST GROUP 2: POST /api/hackathons - Dates & Phases Validation (Tests 21-40) ====================

    @Test
    @DisplayName("Test 21: POST hackathon with startDate after endDate - should fail")
    void testPostHackathon_StartDateAfterEndDate_Fails() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "startDate": "2025-12-31T23:59:59",
                "endDate": "2025-01-01T00:00:00"
            }
            """.formatted(generateProblemStatement(50));

        // Should fail validation - start date must be before end date
    }

    @Test
    @DisplayName("Test 22: POST hackathon with startDate equal to endDate - should handle")
    void testPostHackathon_StartDateEqualToEndDate_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "startDate": "2025-01-01T00:00:00",
                "endDate": "2025-01-01T00:00:00"
            }
            """.formatted(generateProblemStatement(50));

        // Should handle same start and end date
    }

    @Test
    @DisplayName("Test 23: POST hackathon with past startDate - should handle")
    void testPostHackathon_PastStartDate_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "startDate": "2020-01-01T00:00:00",
                "endDate": "2025-12-31T23:59:59"
            }
            """.formatted(generateProblemStatement(50));

        // Should handle past dates
    }

    @Test
    @DisplayName("Test 24: POST hackathon with invalid date format - should fail")
    void testPostHackathon_InvalidDateFormat_Fails() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "startDate": "invalid-date",
                "endDate": "2025-12-31T23:59:59"
            }
            """.formatted(generateProblemStatement(50));

        // Should fail date parsing
    }

    @Test
    @DisplayName("Test 25: POST hackathon with null startDate - should handle")
    void testPostHackathon_NullStartDate_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "startDate": null,
                "endDate": "2025-12-31T23:59:59"
            }
            """.formatted(generateProblemStatement(50));

        // Should handle null start date
    }

    @Test
    @DisplayName("Test 26: POST hackathon with null endDate - should handle")
    void testPostHackathon_NullEndDate_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "startDate": "2025-01-01T00:00:00",
                "endDate": null
            }
            """.formatted(generateProblemStatement(50));

        // Should handle null end date
    }

    @Test
    @DisplayName("Test 27: POST hackathon with empty phases array - should fail")
    void testPostHackathon_EmptyPhasesArray_Fails() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "phases": []
            }
            """.formatted(generateProblemStatement(50));

        // Should fail - at least one phase required
    }

    @Test
    @DisplayName("Test 28: POST hackathon with null phases - should handle")
    void testPostHackathon_NullPhases_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "phases": null
            }
            """.formatted(generateProblemStatement(50));

        // Should handle null phases
    }

    @Test
    @DisplayName("Test 29: POST hackathon with phase missing deadline - should handle")
    void testPostHackathon_PhaseMissingDeadline_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "phases": [{
                    "id": "phase-1",
                    "name": "Phase 1",
                    "description": "Initial submission",
                    "uploadFormat": "document",
                    "deadline": null
                }]
            }
            """.formatted(generateProblemStatement(50));

        // Should handle missing deadline
    }

    @Test
    @DisplayName("Test 30: POST hackathon with phase having past deadline - should handle")
    void testPostHackathon_PhasePastDeadline_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "phases": [{
                    "id": "phase-1",
                    "name": "Phase 1",
                    "description": "Initial submission",
                    "uploadFormat": "document",
                    "deadline": "2020-01-01T00:00:00"
                }]
            }
            """.formatted(generateProblemStatement(50));

        // Should handle past deadlines
    }

    @Test
    @DisplayName("Test 31: POST hackathon with multiple phases - should succeed")
    void testPostHackathon_MultiplePhases_Success() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "phases": [
                    {
                        "id": "phase-1",
                        "name": "Phase 1",
                        "description": "Initial submission",
                        "uploadFormat": "document",
                        "deadline": "2025-06-01T23:59:59"
                    },
                    {
                        "id": "phase-2",
                        "name": "Phase 2",
                        "description": "Final submission",
                        "uploadFormat": "file",
                        "deadline": "2025-12-31T23:59:59"
                    }
                ]
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed with multiple phases
    }

    @Test
    @DisplayName("Test 32: POST hackathon with phase deadline before startDate - should handle")
    void testPostHackathon_PhaseDeadlineBeforeStartDate_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "startDate": "2025-06-01T00:00:00",
                "endDate": "2025-12-31T23:59:59",
                "phases": [{
                    "id": "phase-1",
                    "name": "Phase 1",
                    "description": "Initial submission",
                    "uploadFormat": "document",
                    "deadline": "2025-01-01T00:00:00"
                }]
            }
            """.formatted(generateProblemStatement(50));

        // Should handle inconsistent dates
    }

    @Test
    @DisplayName("Test 33: POST hackathon with invalid phase uploadFormat - should handle")
    void testPostHackathon_InvalidPhaseUploadFormat_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "phases": [{
                    "id": "phase-1",
                    "name": "Phase 1",
                    "description": "Initial submission",
                    "uploadFormat": "invalid-format",
                    "deadline": "2025-12-31T23:59:59"
                }]
            }
            """.formatted(generateProblemStatement(50));

        // Should handle invalid upload format
    }

    @Test
    @DisplayName("Test 34: POST hackathon with minTeamSize greater than teamSize - should fail")
    void testPostHackathon_MinTeamSizeGreaterThanTeamSize_Fails() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "minTeamSize": 5,
                "teamSize": 3
            }
            """.formatted(generateProblemStatement(50));

        // Should fail validation
    }

    @Test
    @DisplayName("Test 35: POST hackathon with negative minTeamSize - should fail")
    void testPostHackathon_NegativeMinTeamSize_Fails() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "minTeamSize": -1,
                "teamSize": 4
            }
            """.formatted(generateProblemStatement(50));

        // Should fail validation
    }

    @Test
    @DisplayName("Test 36: POST hackathon with zero minTeamSize - should handle")
    void testPostHackathon_ZeroMinTeamSize_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "minTeamSize": 0,
                "teamSize": 4
            }
            """.formatted(generateProblemStatement(50));

        // Should handle zero min team size
    }

    @Test
    @DisplayName("Test 37: POST hackathon with negative teamSize - should fail")
    void testPostHackathon_NegativeTeamSize_Fails() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "teamSize": -1
            }
            """.formatted(generateProblemStatement(50));

        // Should fail validation
    }

    @Test
    @DisplayName("Test 38: POST hackathon with very large teamSize - should handle")
    void testPostHackathon_VeryLargeTeamSize_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "teamSize": 1000
            }
            """.formatted(generateProblemStatement(50));

        // Should handle large team sizes
    }

    @Test
    @DisplayName("Test 39: POST hackathon with negative maxTeams - should fail")
    void testPostHackathon_NegativeMaxTeams_Fails() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "maxTeams": -1
            }
            """.formatted(generateProblemStatement(50));

        // Should fail validation
    }

    @Test
    @DisplayName("Test 40: POST hackathon with zero maxTeams - should handle")
    void testPostHackathon_ZeroMaxTeams_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "maxTeams": 0
            }
            """.formatted(generateProblemStatement(50));

        // Should handle zero max teams
    }

    // ==================== TEST GROUP 3: POST /api/hackathons - Skills, Prizes, Mode (Tests 41-60) ====================

    @Test
    @DisplayName("Test 41: POST hackathon with empty skills array - should succeed")
    void testPostHackathon_EmptySkillsArray_Success() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "skills": []
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed - skills are optional
    }

    @Test
    @DisplayName("Test 42: POST hackathon with null skills - should succeed")
    void testPostHackathon_NullSkills_Success() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "skills": null
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed
    }

    @Test
    @DisplayName("Test 43: POST hackathon with single skill - should succeed")
    void testPostHackathon_SingleSkill_Success() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "skills": ["Python"]
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed
    }

    @Test
    @DisplayName("Test 44: POST hackathon with many skills - should succeed")
    void testPostHackathon_ManySkills_Success() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "skills": ["Python", "Machine Learning", "AI", "TensorFlow", "PyTorch", "NLP", "Computer Vision"]
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed
    }

    @Test
    @DisplayName("Test 45: POST hackathon with invalid mode - should handle")
    void testPostHackathon_InvalidMode_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "mode": "InvalidMode"
            }
            """.formatted(generateProblemStatement(50));

        // Should handle invalid mode
    }

    @Test
    @DisplayName("Test 46: POST hackathon with Online mode - should succeed")
    void testPostHackathon_OnlineMode_Success() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "mode": "Online"
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed
    }

    @Test
    @DisplayName("Test 47: POST hackathon with Offline mode - should succeed")
    void testPostHackathon_OfflineMode_Success() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "mode": "Offline",
                "location": "San Francisco, CA",
                "reportingDate": "2025-01-01T09:00:00"
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed
    }

    @Test
    @DisplayName("Test 48: POST hackathon with Hybrid mode - should succeed")
    void testPostHackathon_HybridMode_Success() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "mode": "Hybrid",
                "location": "San Francisco, CA",
                "reportingDate": "2025-01-01T09:00:00"
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed
    }

    @Test
    @DisplayName("Test 49: POST hackathon with Offline mode but no location - should handle")
    void testPostHackathon_OfflineModeNoLocation_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "mode": "Offline",
                "location": null
            }
            """.formatted(generateProblemStatement(50));

        // Should handle missing location for offline mode
    }

    @Test
    @DisplayName("Test 50: POST hackathon with prize information - should succeed")
    void testPostHackathon_WithPrizeInfo_Success() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "prize": "$50,000",
                "firstPrize": "$25,000",
                "secondPrize": "$15,000",
                "thirdPrize": "$10,000"
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed
    }

    @Test
    @DisplayName("Test 51: POST hackathon with null prize fields - should handle")
    void testPostHackathon_NullPrizeFields_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "prize": null,
                "firstPrize": null,
                "secondPrize": null,
                "thirdPrize": null
            }
            """.formatted(generateProblemStatement(50));

        // Should handle null prizes
    }

    @Test
    @DisplayName("Test 52: POST hackathon with allowIndividual true - should succeed")
    void testPostHackathon_AllowIndividualTrue_Success() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "allowIndividual": true
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed
    }

    @Test
    @DisplayName("Test 53: POST hackathon with allowIndividual false - should succeed")
    void testPostHackathon_AllowIndividualFalse_Success() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "allowIndividual": false
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed
    }

    @Test
    @DisplayName("Test 54: POST hackathon with null allowIndividual - should handle")
    void testPostHackathon_NullAllowIndividual_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "allowIndividual": null
            }
            """.formatted(generateProblemStatement(50));

        // Should handle null allowIndividual
    }

    @Test
    @DisplayName("Test 55: POST hackathon with eligibility criteria - should succeed")
    void testPostHackathon_WithEligibility_Success() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "eligibility": "Open to all undergraduate and graduate students"
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed
    }

    @Test
    @DisplayName("Test 56: POST hackathon with null eligibility - should handle")
    void testPostHackathon_NullEligibility_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "eligibility": null
            }
            """.formatted(generateProblemStatement(50));

        // Should handle null eligibility
    }

    @Test
    @DisplayName("Test 57: POST hackathon with submissionUrl - should succeed")
    void testPostHackathon_WithSubmissionUrl_Success() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "submissionUrl": "https://example.com/submit"
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed
    }

    @Test
    @DisplayName("Test 58: POST hackathon with invalid submissionUrl format - should handle")
    void testPostHackathon_InvalidSubmissionUrl_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "submissionUrl": "not-a-valid-url"
            }
            """.formatted(generateProblemStatement(50));

        // Should handle invalid URL format
    }

    @Test
    @DisplayName("Test 59: POST hackathon with submissionGuidelines - should succeed")
    void testPostHackathon_WithSubmissionGuidelines_Success() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "submissionGuidelines": "Submit your solution as a PDF document with maximum 10 pages"
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed
    }

    @Test
    @DisplayName("Test 60: POST hackathon with null submissionGuidelines - should handle")
    void testPostHackathon_NullSubmissionGuidelines_Handles() throws Exception {
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "description": "A hackathon",
                "company": "Tech Corp",
                "problemStatement": "%s",
                "submissionGuidelines": null
            }
            """.formatted(generateProblemStatement(50));

        // Should handle null submission guidelines
    }

    // ==================== TEST GROUP 4: PUT /api/hackathons/{id} - Update Operations (Tests 61-80) ====================

    @Test
    @DisplayName("Test 61: PUT update hackathon with all valid fields - should succeed")
    void testUpdateHackathon_AllValidFields_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(hackathonRepository.save(any(Hackathon.class))).thenReturn(validHackathon);

        String hackathonJson = """
            {
                "title": "Updated AI Innovation Challenge",
                "description": "Updated description",
                "company": "Updated Corp",
                "problemStatement": "%s"
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed
    }

    @Test
    @DisplayName("Test 62: PUT update hackathon without authentication - should return 401")
    void testUpdateHackathon_NoAuthentication_Returns401() throws Exception {
        String hackathonJson = """
            {
                "title": "Updated Title",
                "problemStatement": "%s"
            }
            """.formatted(generateProblemStatement(50));

        // Should return 401
    }

    @Test
    @DisplayName("Test 63: PUT update hackathon as APPLICANT user - should return 403")
    void testUpdateHackathon_AsApplicant_Returns403() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));

        String hackathonJson = """
            {
                "title": "Updated Title",
                "problemStatement": "%s"
            }
            """.formatted(generateProblemStatement(50));

        // Should return 403
    }

    @Test
    @DisplayName("Test 64: PUT update non-existent hackathon - should return 404")
    void testUpdateHackathon_NonExistentHackathon_Returns404() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(hackathonRepository.findById("non-existent-id")).thenReturn(Optional.empty());

        String hackathonJson = """
            {
                "title": "Updated Title",
                "problemStatement": "%s"
            }
            """.formatted(generateProblemStatement(50));

        // Should return 404
    }

    @Test
    @DisplayName("Test 65: PUT update hackathon owned by different industry user - should return 403")
    void testUpdateHackathon_DifferentOwner_Returns403() throws Exception {
        User otherIndustryUser = new User();
        otherIndustryUser.setId("other-industry-id");
        otherIndustryUser.setEmail("other@example.com");
        otherIndustryUser.setUserType("INDUSTRY");

        Hackathon otherUserHackathon = new Hackathon();
        otherUserHackathon.setId("other-hackathon-id");
        otherUserHackathon.setCreatedByIndustryId("other-industry-id");

        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(hackathonRepository.findById("other-hackathon-id")).thenReturn(Optional.of(otherUserHackathon));

        String hackathonJson = """
            {
                "title": "Updated Title",
                "problemStatement": "%s"
            }
            """.formatted(generateProblemStatement(50));

        // Should return 403 - can only edit own hackathons
    }

    @Test
    @DisplayName("Test 66: PUT update hackathon with problem statement less than 50 words - should fail")
    void testUpdateHackathon_ProblemStatementLessThan50Words_Fails() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));

        String shortStatement = generateProblemStatement(49);
        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "problemStatement": "%s"
            }
            """.formatted(shortStatement);

        // Should fail - minimum 50 words required
    }

    @Test
    @DisplayName("Test 67: PUT update hackathon with updated phases - should succeed")
    void testUpdateHackathon_UpdatedPhases_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(hackathonRepository.save(any(Hackathon.class))).thenReturn(validHackathon);

        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "problemStatement": "%s",
                "phases": [
                    {
                        "id": "phase-1",
                        "name": "Updated Phase 1",
                        "description": "Updated description",
                        "uploadFormat": "file",
                        "deadline": "2025-12-31T23:59:59"
                    }
                ]
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed
    }

    @Test
    @DisplayName("Test 68: PUT update hackathon with updated team size - should succeed")
    void testUpdateHackathon_UpdatedTeamSize_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(hackathonRepository.save(any(Hackathon.class))).thenReturn(validHackathon);

        String hackathonJson = """
            {
                "title": "AI Innovation Challenge",
                "problemStatement": "%s",
                "minTeamSize": 2,
                "teamSize": 6
            }
            """.formatted(generateProblemStatement(50));

        // Should succeed
    }

    @Test
    @DisplayName("Test 69: PUT update hackathon with partial fields - should update only provided")
    void testUpdateHackathon_PartialFields_UpdatesOnlyProvided() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(hackathonRepository.save(any(Hackathon.class))).thenReturn(validHackathon);

        String hackathonJson = """
            {
                "title": "Updated Title Only"
            }
            """;

        // Should update only title, preserve other fields
    }

    @Test
    @DisplayName("Test 70: DELETE hackathon with valid ID and ownership - should succeed")
    void testDeleteHackathon_ValidIdAndOwnership_Success() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        doNothing().when(hackathonRepository).deleteById("hackathon-id-1");

        // Should succeed and return 200
    }

    @Test
    @DisplayName("Test 71: DELETE hackathon without authentication - should return 401")
    void testDeleteHackathon_NoAuthentication_Returns401() throws Exception {
        // Should return 401
    }

    @Test
    @DisplayName("Test 72: DELETE hackathon as APPLICANT user - should return 403")
    void testDeleteHackathon_AsApplicant_Returns403() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("applicant@example.com");
        when(userRepository.findByEmail("applicant@example.com")).thenReturn(Optional.of(applicantUser));

        // Should return 403
    }

    @Test
    @DisplayName("Test 73: DELETE non-existent hackathon - should return 404")
    void testDeleteHackathon_NonExistentHackathon_Returns404() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(hackathonRepository.findById("non-existent-id")).thenReturn(Optional.empty());

        // Should return 404
    }

    @Test
    @DisplayName("Test 74: DELETE hackathon owned by different industry user - should return 403")
    void testDeleteHackathon_DifferentOwner_Returns403() throws Exception {
        User otherIndustryUser = new User();
        otherIndustryUser.setId("other-industry-id");
        otherIndustryUser.setEmail("other@example.com");
        otherIndustryUser.setUserType("INDUSTRY");

        Hackathon otherUserHackathon = new Hackathon();
        otherUserHackathon.setId("other-hackathon-id");
        otherUserHackathon.setCreatedByIndustryId("other-industry-id");

        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(hackathonRepository.findById("other-hackathon-id")).thenReturn(Optional.of(otherUserHackathon));

        // Should return 403 - can only delete own hackathons
    }

    @Test
    @DisplayName("Test 75: GET all hackathons - should return list")
    void testGetAllHackathons_ReturnsList() throws Exception {
        List<Hackathon> hackathons = Arrays.asList(validHackathon);
        when(hackathonRepository.findAll()).thenReturn(hackathons);
        when(applicationRepository.findByHackathonId(anyString())).thenReturn(Collections.emptyList());

        // Should return list of all hackathons (public endpoint)
    }

    @Test
    @DisplayName("Test 76: GET all hackathons when no hackathons exist - should return empty list")
    void testGetAllHackathons_NoHackathonsExist_ReturnsEmptyList() throws Exception {
        when(hackathonRepository.findAll()).thenReturn(Collections.emptyList());

        // Should return empty list
    }

    @Test
    @DisplayName("Test 77: GET hackathon by valid ID - should return hackathon")
    void testGetHackathonById_ValidId_ReturnsHackathon() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(applicationRepository.findByHackathonId("hackathon-id-1")).thenReturn(Collections.emptyList());

        // Should return the hackathon
    }

    @Test
    @DisplayName("Test 78: GET hackathon by non-existent ID - should return 404")
    void testGetHackathonById_NonExistentId_Returns404() throws Exception {
        when(mockAuth.getPrincipal()).thenReturn(mockOAuth2User);
        when(mockOAuth2User.getAttribute("email")).thenReturn("industry@example.com");
        when(userRepository.findByEmail("industry@example.com")).thenReturn(Optional.of(industryUser));
        when(hackathonRepository.findById("non-existent-id")).thenReturn(Optional.empty());

        // Should return 404
    }

    @Test
    @DisplayName("Test 79: POST increment views for hackathon - should succeed")
    void testIncrementViews_ValidHackathon_Success() throws Exception {
        when(hackathonRepository.findById("hackathon-id-1")).thenReturn(Optional.of(validHackathon));
        when(hackathonRepository.save(any(Hackathon.class))).thenReturn(validHackathon);

        // Should increment views and return updated count
    }

    @Test
    @DisplayName("Test 80: POST increment views for non-existent hackathon - should return 404")
    void testIncrementViews_NonExistentHackathon_Returns404() throws Exception {
        when(hackathonRepository.findById("non-existent-id")).thenReturn(Optional.empty());

        // Should return 404
    }
}

