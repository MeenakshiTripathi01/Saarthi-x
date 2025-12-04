package com.saarthix.jobs.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "hackathons")
public class Hackathon {

    @Id
    private String id;

    private String title;
    private String description;
    private String company;
    private String prize;
    private int teamSize;
    private String submissionUrl;
    private String createdByIndustryId;
    private int views;

    // Getters + Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getPrize() { return prize; }
    public void setPrize(String prize) { this.prize = prize; }

    public int getTeamSize() { return teamSize; }
    public void setTeamSize(int teamSize) { this.teamSize = teamSize; }

    public String getSubmissionUrl() { return submissionUrl; }
    public void setSubmissionUrl(String submissionUrl) { this.submissionUrl = submissionUrl; }

    public String getCreatedByIndustryId() { return createdByIndustryId; }
    public void setCreatedByIndustryId(String createdByIndustryId) { this.createdByIndustryId = createdByIndustryId; }

    public int getViews() { return views; }
    public void setViews(int views) { this.views = views; }
}
