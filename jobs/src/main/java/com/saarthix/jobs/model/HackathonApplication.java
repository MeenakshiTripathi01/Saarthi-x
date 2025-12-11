package com.saarthix.jobs.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonProperty;

@Document("hackathon_applications")
public class HackathonApplication {

    @Id
    private String id;

    private String hackathonId;
    private String applicantId;

    @JsonProperty("asTeam")
    private Boolean asTeam = false;

    private String teamName;
    private int teamSize = 1;

    private List<TeamMember> teamMembers = new ArrayList<>();

    private LocalDateTime appliedAt;

    private String currentPhaseId;
    private String status; // "ACTIVE", "REJECTED", "COMPLETED"

    // Map phaseId -> PhaseSubmission
    private java.util.Map<String, PhaseSubmission> phaseSubmissions = new java.util.HashMap<>();

    // Default Constructor
    public HackathonApplication() {
        this.asTeam = false;
        this.teamSize = 1;
        this.status = "ACTIVE";
    }

    // Getters & Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getHackathonId() {
        return hackathonId;
    }

    public void setHackathonId(String hackathonId) {
        this.hackathonId = hackathonId;
    }

    public String getApplicantId() {
        return applicantId;
    }

    public void setApplicantId(String applicantId) {
        this.applicantId = applicantId;
    }

    public Boolean getAsTeam() {
        return asTeam != null ? asTeam : false;
    }

    public void setAsTeam(Boolean asTeam) {
        this.asTeam = asTeam != null ? asTeam : false;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public int getTeamSize() {
        return teamSize > 0 ? teamSize : 1;
    }

    public void setTeamSize(int teamSize) {
        this.teamSize = teamSize > 0 ? teamSize : 1;
    }

    public List<TeamMember> getTeamMembers() {
        return teamMembers;
    }

    public void setTeamMembers(List<TeamMember> teamMembers) {
        this.teamMembers = teamMembers;
    }

    public LocalDateTime getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(LocalDateTime appliedAt) {
        this.appliedAt = appliedAt;
    }

    public String getCurrentPhaseId() {
        return currentPhaseId;
    }

    public void setCurrentPhaseId(String currentPhaseId) {
        this.currentPhaseId = currentPhaseId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public java.util.Map<String, PhaseSubmission> getPhaseSubmissions() {
        return phaseSubmissions;
    }

    public void setPhaseSubmissions(java.util.Map<String, PhaseSubmission> phaseSubmissions) {
        this.phaseSubmissions = phaseSubmissions;
    }

    // Inner class for Team Member details
    public static class TeamMember {
        private String name;
        private String email;
        private String phone;
        private String role; // "Team Lead" or "Member"

        public TeamMember() {
        }

        public TeamMember(String name, String email, String phone, String role) {
            this.name = name;
            this.email = email;
            this.phone = phone;
            this.role = role;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }

    // Inner class for Phase Submission details
    public static class PhaseSubmission {
        private String solutionStatement; // For initial phase or text submissions
        private String fileUrl; // For file uploads
        private String fileName;
        private LocalDateTime submittedAt;

        private String status; // "PENDING", "ACCEPTED", "REJECTED"
        private String remarks;
        private Integer score;

        public PhaseSubmission() {
            this.status = "PENDING";
            this.submittedAt = LocalDateTime.now();
        }

        public String getSolutionStatement() {
            return solutionStatement;
        }

        public void setSolutionStatement(String solutionStatement) {
            this.solutionStatement = solutionStatement;
        }

        public String getFileUrl() {
            return fileUrl;
        }

        public void setFileUrl(String fileUrl) {
            this.fileUrl = fileUrl;
        }

        public String getFileName() {
            return fileName;
        }

        public void setFileName(String fileName) {
            this.fileName = fileName;
        }

        public LocalDateTime getSubmittedAt() {
            return submittedAt;
        }

        public void setSubmittedAt(LocalDateTime submittedAt) {
            this.submittedAt = submittedAt;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getRemarks() {
            return remarks;
        }

        public void setRemarks(String remarks) {
            this.remarks = remarks;
        }

        public Integer getScore() {
            return score;
        }

        public void setScore(Integer score) {
            this.score = score;
        }
    }
}
