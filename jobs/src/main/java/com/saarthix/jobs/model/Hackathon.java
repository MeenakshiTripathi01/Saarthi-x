package com.saarthix.jobs.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "hackathons")
public class Hackathon {

    @Id
    private String id;

    // Basic Info
    private String title;
    private String description;
    private String company;

    // Problem & Skills
    private String problemStatement;
    private List<String> skills;

    // Phases
    private List<HackathonPhase> phases;

    // Eligibility
    private String eligibility;

    // Dates & Mode
    private String startDate;
    private String endDate;
    private String mode;
    private String location; // For Hybrid/Offline
    private String reportingDate; // For Hybrid/Offline

    // Submission
    private String submissionUrl;
    private String submissionGuidelines;

    // Capacity & Prizes
    private int minTeamSize;
    private int teamSize;
    private int maxTeams;
    private String prize;

    // Metadata
    private String createdByIndustryId;
    private int views;

    // Constructors
    public Hackathon() {
    }

    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getProblemStatement() {
        return problemStatement;
    }

    public void setProblemStatement(String problemStatement) {
        this.problemStatement = problemStatement;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills;
    }

    public List<HackathonPhase> getPhases() {
        return phases;
    }

    public void setPhases(List<HackathonPhase> phases) {
        this.phases = phases;
    }

    public String getEligibility() {
        return eligibility;
    }

    public void setEligibility(String eligibility) {
        this.eligibility = eligibility;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getReportingDate() {
        return reportingDate;
    }

    public void setReportingDate(String reportingDate) {
        this.reportingDate = reportingDate;
    }

    public String getSubmissionUrl() {
        return submissionUrl;
    }

    public void setSubmissionUrl(String submissionUrl) {
        this.submissionUrl = submissionUrl;
    }

    public String getSubmissionGuidelines() {
        return submissionGuidelines;
    }

    public void setSubmissionGuidelines(String submissionGuidelines) {
        this.submissionGuidelines = submissionGuidelines;
    }

    public int getMinTeamSize() {
        return minTeamSize;
    }

    public void setMinTeamSize(int minTeamSize) {
        this.minTeamSize = minTeamSize;
    }

    public int getTeamSize() {
        return teamSize;
    }

    public void setTeamSize(int teamSize) {
        this.teamSize = teamSize;
    }

    public int getMaxTeams() {
        return maxTeams;
    }

    public void setMaxTeams(int maxTeams) {
        this.maxTeams = maxTeams;
    }

    public String getPrize() {
        return prize;
    }

    public void setPrize(String prize) {
        this.prize = prize;
    }

    public String getCreatedByIndustryId() {
        return createdByIndustryId;
    }

    public void setCreatedByIndustryId(String createdByIndustryId) {
        this.createdByIndustryId = createdByIndustryId;
    }

    public int getViews() {
        return views;
    }

    public void setViews(int views) {
        this.views = views;
    }
}
