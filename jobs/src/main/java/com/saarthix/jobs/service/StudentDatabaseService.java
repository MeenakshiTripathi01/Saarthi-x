package com.saarthix.jobs.service;

import com.saarthix.jobs.model.*;
import com.saarthix.jobs.model.dto.StudentDatabaseDto;
import com.saarthix.jobs.repository.*;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudentDatabaseService {
    
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final HackathonApplicationRepository hackathonApplicationRepository;
    private final ApplicationRepository applicationRepository;
    private final IndustryShortlistRepository industryShortlistRepository;
    private final ActivityLogRepository activityLogRepository;
    
    public StudentDatabaseService(
            UserProfileRepository userProfileRepository,
            UserRepository userRepository,
            HackathonApplicationRepository hackathonApplicationRepository,
            ApplicationRepository applicationRepository,
            IndustryShortlistRepository industryShortlistRepository,
            ActivityLogRepository activityLogRepository) {
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
        this.hackathonApplicationRepository = hackathonApplicationRepository;
        this.applicationRepository = applicationRepository;
        this.industryShortlistRepository = industryShortlistRepository;
        this.activityLogRepository = activityLogRepository;
    }
    
    /**
     * Get all student profiles with filtering
     * @param industryEmail - Email of the industry user (for shortlist status)
     * @param isPaidUser - Whether the industry user has a PAID subscription
     * @param filters - Map of filter criteria
     * @return List of StudentDatabaseDto
     */
    public List<StudentDatabaseDto> getAllStudents(
            String industryEmail, 
            boolean isPaidUser, 
            Map<String, String> filters) {
        
        // Get all profiles
        List<UserProfile> allProfiles = userProfileRepository.findAll();
        
        // Filter only APPLICANT profiles
        allProfiles = allProfiles.stream()
                .filter(profile -> {
                    Optional<User> userOpt = userRepository.findByEmail(profile.getApplicantEmail());
                    return userOpt.isPresent() && "APPLICANT".equals(userOpt.get().getUserType());
                })
                .collect(Collectors.toList());
        
        // Apply filters
        List<UserProfile> filteredProfiles = applyFilters(allProfiles, filters);
        
        // Get shortlisted student emails for this industry
        Set<String> shortlistedEmails = industryShortlistRepository
                .findByIndustryEmail(industryEmail)
                .stream()
                .map(IndustryShortlist::getStudentEmail)
                .collect(Collectors.toSet());
        
        // Convert to DTOs
        return filteredProfiles.stream()
                .map(profile -> convertToDto(profile, isPaidUser, shortlistedEmails.contains(profile.getApplicantEmail())))
                .collect(Collectors.toList());
    }
    
    /**
     * Get a single student profile by ID
     * @param studentId - ID of the student
     * @param industryEmail - Email of the industry user
     * @param industryId - ID of the industry user
     * @param isPaidUser - Whether the industry user has a PAID subscription
     * @return StudentDatabaseDto
     */
    public StudentDatabaseDto getStudentById(
            String studentId, 
            String industryEmail, 
            String industryId,
            boolean isPaidUser) {
        
        Optional<UserProfile> profileOpt = userProfileRepository.findById(studentId);
        if (!profileOpt.isPresent()) {
            return null;
        }
        
        UserProfile profile = profileOpt.get();
        
        // Check if student is shortlisted
        boolean isShortlisted = industryShortlistRepository
                .existsByIndustryEmailAndStudentEmail(industryEmail, profile.getApplicantEmail());
        
        // Log the profile view
        logActivity(industryEmail, industryId, profile.getApplicantEmail(), studentId, "PROFILE_VIEWED");
        
        return convertToDto(profile, isPaidUser, isShortlisted);
    }
    
    /**
     * Shortlist a student
     * @param studentId - ID of the student
     * @param industryEmail - Email of the industry user
     * @param industryId - ID of the industry user
     * @param isPaidUser - Whether the industry user has a PAID subscription
     * @return success message or error
     */
    public String shortlistStudent(
            String studentId, 
            String industryEmail, 
            String industryId,
            boolean isPaidUser) {
        
        Optional<UserProfile> profileOpt = userProfileRepository.findById(studentId);
        if (!profileOpt.isPresent()) {
            return "Student not found";
        }
        
        UserProfile profile = profileOpt.get();
        
        // Check if already shortlisted
        if (industryShortlistRepository.existsByIndustryEmailAndStudentEmail(industryEmail, profile.getApplicantEmail())) {
            return "Student already shortlisted";
        }
        
        // Create shortlist entry
        IndustryShortlist shortlist = new IndustryShortlist(
                industryEmail, 
                industryId, 
                profile.getApplicantEmail(), 
                studentId
        );
        industryShortlistRepository.save(shortlist);
        
        // Log the activity
        logActivity(industryEmail, industryId, profile.getApplicantEmail(), studentId, "CANDIDATE_SHORTLISTED");
        
        return "Student shortlisted successfully";
    }
    
    /**
     * Remove a student from shortlist
     * @param studentId - ID of the student
     * @param industryEmail - Email of the industry user
     * @return success message
     */
    public String removeShortlist(String studentId, String industryEmail) {
        Optional<UserProfile> profileOpt = userProfileRepository.findById(studentId);
        if (!profileOpt.isPresent()) {
            return "Student not found";
        }
        
        UserProfile profile = profileOpt.get();
        industryShortlistRepository.deleteByIndustryEmailAndStudentEmail(industryEmail, profile.getApplicantEmail());
        
        return "Student removed from shortlist";
    }
    
    /**
     * Get all shortlisted students for an industry user
     * @param industryEmail - Email of the industry user
     * @param isPaidUser - Whether the industry user has a PAID subscription
     * @return List of StudentDatabaseDto
     */
    public List<StudentDatabaseDto> getShortlistedStudents(String industryEmail, boolean isPaidUser) {
        List<IndustryShortlist> shortlists = industryShortlistRepository.findByIndustryEmail(industryEmail);
        
        return shortlists.stream()
                .map(shortlist -> {
                    Optional<UserProfile> profileOpt = userProfileRepository.findByApplicantEmail(shortlist.getStudentEmail());
                    return profileOpt.map(profile -> convertToDto(profile, isPaidUser, true)).orElse(null);
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
    
    /**
     * Download resume (PAID users only)
     * @param studentId - ID of the student
     * @param industryEmail - Email of the industry user
     * @param industryId - ID of the industry user
     * @param isPaidUser - Whether the industry user has a PAID subscription
     * @return Resume data or null
     */
    public Map<String, String> downloadResume(
            String studentId, 
            String industryEmail, 
            String industryId,
            boolean isPaidUser) {
        
        Optional<UserProfile> profileOpt = userProfileRepository.findById(studentId);
        if (!profileOpt.isPresent()) {
            return null;
        }
        
        UserProfile profile = profileOpt.get();
        
        // Log the activity
        logActivity(industryEmail, industryId, profile.getApplicantEmail(), studentId, "RESUME_DOWNLOADED");
        
        Map<String, String> resumeData = new HashMap<>();
        resumeData.put("fileName", profile.getResumeFileName());
        resumeData.put("fileType", profile.getResumeFileType());
        resumeData.put("base64Data", profile.getResumeBase64());
        
        return resumeData;
    }
    
    // ============= PRIVATE HELPER METHODS =============
    
    /**
     * Apply filters to the list of profiles
     */
    private List<UserProfile> applyFilters(List<UserProfile> profiles, Map<String, String> filters) {
        if (filters == null || filters.isEmpty()) {
            return profiles;
        }
        
        return profiles.stream()
                .filter(profile -> {
                    // Filter by degree
                    if (filters.containsKey("degree") && !filters.get("degree").isEmpty()) {
                        String filterDegree = filters.get("degree").toLowerCase();
                        boolean matchesDegree = false;
                        if (profile.getEducationEntries() != null) {
                            matchesDegree = profile.getEducationEntries().stream()
                                    .anyMatch(edu -> edu.getDegree() != null && 
                                            edu.getDegree().toLowerCase().contains(filterDegree));
                        }
                        if (!matchesDegree) return false;
                    }
                    
                    // Filter by specialization
                    if (filters.containsKey("specialization") && !filters.get("specialization").isEmpty()) {
                        String filterSpec = filters.get("specialization").toLowerCase();
                        boolean matchesSpec = false;
                        if (profile.getEducationEntries() != null) {
                            matchesSpec = profile.getEducationEntries().stream()
                                    .anyMatch(edu -> (edu.getStream() != null && edu.getStream().toLowerCase().contains(filterSpec)) ||
                                                     (edu.getDegree() != null && edu.getDegree().toLowerCase().contains(filterSpec)));
                        }
                        if (!matchesSpec) return false;
                    }
                    
                    // Filter by skills
                    if (filters.containsKey("skills") && !filters.get("skills").isEmpty()) {
                        String filterSkill = filters.get("skills").toLowerCase();
                        if (profile.getSkills() == null || 
                            profile.getSkills().stream().noneMatch(skill -> skill.toLowerCase().contains(filterSkill))) {
                            return false;
                        }
                    }
                    
                    // Filter by graduation year
                    if (filters.containsKey("graduationYear") && !filters.get("graduationYear").isEmpty()) {
                        String filterYear = filters.get("graduationYear");
                        boolean matchesYear = false;
                        if (profile.getEducationEntries() != null) {
                            matchesYear = profile.getEducationEntries().stream()
                                    .anyMatch(edu -> edu.getPassingYear() != null && 
                                            edu.getPassingYear().equals(filterYear));
                        }
                        if (!matchesYear) return false;
                    }
                    
                    // Filter by college/institution
                    if (filters.containsKey("college") && !filters.get("college").isEmpty()) {
                        String filterCollege = filters.get("college").toLowerCase();
                        boolean matchesCollege = false;
                        if (profile.getEducationEntries() != null) {
                            matchesCollege = profile.getEducationEntries().stream()
                                    .anyMatch(edu -> edu.getInstitution() != null && 
                                            edu.getInstitution().toLowerCase().contains(filterCollege));
                        }
                        if (!matchesCollege) return false;
                    }
                    
                    // Filter by location
                    if (filters.containsKey("location") && !filters.get("location").isEmpty()) {
                        String filterLocation = filters.get("location").toLowerCase();
                        boolean matchesLocation = 
                            (profile.getCurrentLocation() != null && profile.getCurrentLocation().toLowerCase().contains(filterLocation)) ||
                            (profile.getPreferredLocations() != null && 
                             profile.getPreferredLocations().stream().anyMatch(loc -> loc.toLowerCase().contains(filterLocation)));
                        if (!matchesLocation) return false;
                    }
                    
                    // Filter by availability
                    if (filters.containsKey("availability") && !filters.get("availability").isEmpty()) {
                        String filterAvail = filters.get("availability").toLowerCase();
                        if (profile.getAvailability() == null || 
                            !profile.getAvailability().toLowerCase().contains(filterAvail)) {
                            return false;
                        }
                    }
                    
                    // Filter by keyword (name, skill, college)
                    if (filters.containsKey("keyword") && !filters.get("keyword").isEmpty()) {
                        String keyword = filters.get("keyword").toLowerCase();
                        boolean matchesKeyword = 
                            (profile.getFullName() != null && profile.getFullName().toLowerCase().contains(keyword)) ||
                            (profile.getSkills() != null && profile.getSkills().stream().anyMatch(s -> s.toLowerCase().contains(keyword))) ||
                            (profile.getEducationEntries() != null && profile.getEducationEntries().stream()
                                    .anyMatch(edu -> edu.getInstitution() != null && edu.getInstitution().toLowerCase().contains(keyword)));
                        if (!matchesKeyword) return false;
                    }
                    
                    return true;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Convert UserProfile to StudentDatabaseDto
     * Applies access control based on subscription type
     */
    private StudentDatabaseDto convertToDto(UserProfile profile, boolean isPaidUser, boolean isShortlisted) {
        StudentDatabaseDto dto = new StudentDatabaseDto();
        
        // Always visible fields
        dto.setStudentId(profile.getId());
        dto.setFullName(profile.getFullName());
        dto.setGender(profile.getGender());
        dto.setProfilePictureBase64(profile.getProfilePictureBase64());
        dto.setSkills(profile.getSkills());
        dto.setExperience(profile.getExperience());
        dto.setSummary(profile.getSummary());
        dto.setCurrentLocation(profile.getCurrentLocation());
        dto.setPreferredLocations(profile.getPreferredLocations());
        dto.setWorkPreference(profile.getWorkPreference());
        dto.setLinkedInUrl(profile.getLinkedInUrl());
        dto.setPortfolioUrl(profile.getPortfolioUrl());
        dto.setGithubUrl(profile.getGithubUrl());
        dto.setAvailability(profile.getAvailability());
        dto.setHobbies(profile.getHobbies());
        dto.setCreatedAt(profile.getCreatedAt());
        dto.setLastUpdated(profile.getLastUpdated());
        dto.setIsShortlisted(isShortlisted);
        
        // Contact details - available for all users
        dto.setEmail(profile.getEmail() != null ? profile.getEmail() : profile.getApplicantEmail());
        dto.setPhoneNumber(profile.getPhoneNumber());
        
        // Education entries
        if (profile.getEducationEntries() != null && !profile.getEducationEntries().isEmpty()) {
            List<StudentDatabaseDto.EducationDto> eduDtos = profile.getEducationEntries().stream()
                    .map(this::convertEducationToDto)
                    .collect(Collectors.toList());
            dto.setEducationEntries(eduDtos);
            
            // Extract graduation info from highest education
            UserProfile.EducationEntry graduation = profile.getEducationEntries().stream()
                    .filter(e -> "Graduation".equalsIgnoreCase(e.getLevel()) || 
                                 "Post Graduation".equalsIgnoreCase(e.getLevel()))
                    .findFirst()
                    .orElse(null);
            
            if (graduation != null) {
                dto.setDegree(graduation.getDegree());
                dto.setSpecialization(graduation.getStream());
                dto.setInstitution(graduation.getInstitution());
                dto.setGraduationYear(graduation.getPassingYear());
            }
        }
        
        // Professional experiences
        if (profile.getProfessionalExperiences() != null) {
            List<StudentDatabaseDto.ProfessionalExperienceDto> expDtos = profile.getProfessionalExperiences().stream()
                    .map(this::convertExperienceToDto)
                    .collect(Collectors.toList());
            dto.setProfessionalExperiences(expDtos);
        }
        
        // Projects
        if (profile.getProjects() != null) {
            List<StudentDatabaseDto.ProjectDto> projDtos = profile.getProjects().stream()
                    .map(this::convertProjectToDto)
                    .collect(Collectors.toList());
            dto.setProjects(projDtos);
        }
        
        // Hackathons participated (with error handling)
        try {
            List<HackathonApplication> hackathonApps = hackathonApplicationRepository
                    .findByApplicantId(profile.getApplicantId());
            dto.setHackathonsParticipated(hackathonApps != null ? hackathonApps.size() : 0);
        } catch (Exception e) {
            // If there's an error fetching hackathon data, set to 0
            System.err.println("Warning: Could not fetch hackathon applications for " + profile.getApplicantId() + ": " + e.getMessage());
            dto.setHackathonsParticipated(0);
        }
        
        // Jobs applied (with error handling)
        try {
            List<Application> jobApps = applicationRepository
                    .findByApplicantEmail(profile.getApplicantEmail());
            dto.setJobsApplied(jobApps != null ? jobApps.size() : 0);
        } catch (Exception e) {
            // If there's an error fetching job applications, set to 0
            System.err.println("Warning: Could not fetch job applications for " + profile.getApplicantEmail() + ": " + e.getMessage());
            dto.setJobsApplied(0);
        }
        
        // Resume info
        dto.setResumeFileName(profile.getResumeFileName());
        dto.setResumeAvailable(profile.getResumeBase64() != null && !profile.getResumeBase64().isEmpty());
        
        // Resume access - available for all users
        if (profile.getResumeBase64() != null) {
            dto.setResumeBase64(profile.getResumeBase64());
        } else {
            dto.setResumeBase64(null);
        }
        
        // Profile completeness score
        dto.setProfileCompletenessScore(calculateProfileCompleteness(profile));
        
        return dto;
    }
    
    /**
     * Convert education entry to DTO
     */
    private StudentDatabaseDto.EducationDto convertEducationToDto(UserProfile.EducationEntry edu) {
        StudentDatabaseDto.EducationDto dto = new StudentDatabaseDto.EducationDto();
        dto.setLevel(edu.getLevel());
        dto.setDegree(edu.getDegree());
        dto.setInstitution(edu.getInstitution());
        dto.setBoard(edu.getBoard());
        dto.setPassingYear(edu.getPassingYear());
        dto.setPercentage(edu.getPercentage());
        dto.setStream(edu.getStream());
        return dto;
    }
    
    /**
     * Convert professional experience to DTO
     */
    private StudentDatabaseDto.ProfessionalExperienceDto convertExperienceToDto(UserProfile.ProfessionalExperience exp) {
        StudentDatabaseDto.ProfessionalExperienceDto dto = new StudentDatabaseDto.ProfessionalExperienceDto();
        dto.setJobTitle(exp.getJobTitle());
        dto.setCompany(exp.getCompany());
        dto.setStartDate(exp.getStartDate());
        dto.setEndDate(exp.getEndDate());
        dto.setIsCurrentJob(exp.getIsCurrentJob());
        dto.setDescription(exp.getDescription());
        return dto;
    }
    
    /**
     * Convert project to DTO
     */
    private StudentDatabaseDto.ProjectDto convertProjectToDto(UserProfile.Project project) {
        StudentDatabaseDto.ProjectDto dto = new StudentDatabaseDto.ProjectDto();
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setGithubLink(project.getGithubLink());
        dto.setWebsiteLink(project.getWebsiteLink());
        return dto;
    }
    
    /**
     * Calculate profile completeness score (0-100)
     */
    private Integer calculateProfileCompleteness(UserProfile profile) {
        int score = 0;
        int maxScore = 12;
        
        if (profile.getFullName() != null && !profile.getFullName().isEmpty()) score++;
        if (profile.getEmail() != null && !profile.getEmail().isEmpty()) score++;
        if (profile.getPhoneNumber() != null && !profile.getPhoneNumber().isEmpty()) score++;
        if (profile.getProfilePictureBase64() != null && !profile.getProfilePictureBase64().isEmpty()) score++;
        if (profile.getResumeBase64() != null && !profile.getResumeBase64().isEmpty()) score++;
        if (profile.getSkills() != null && !profile.getSkills().isEmpty()) score++;
        if (profile.getEducationEntries() != null && !profile.getEducationEntries().isEmpty()) score++;
        if (profile.getProfessionalExperiences() != null && !profile.getProfessionalExperiences().isEmpty()) score++;
        if (profile.getProjects() != null && !profile.getProjects().isEmpty()) score++;
        if (profile.getSummary() != null && !profile.getSummary().isEmpty()) score++;
        if (profile.getLinkedInUrl() != null && !profile.getLinkedInUrl().isEmpty()) score++;
        if (profile.getCurrentLocation() != null && !profile.getCurrentLocation().isEmpty()) score++;
        
        return (score * 100) / maxScore;
    }
    
    /**
     * Log activity
     */
    private void logActivity(String industryEmail, String industryId, String studentEmail, String studentId, String actionType) {
        ActivityLog log = new ActivityLog(industryEmail, industryId, studentEmail, studentId, actionType);
        activityLogRepository.save(log);
    }
}

