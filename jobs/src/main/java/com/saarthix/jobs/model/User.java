package com.saarthix.jobs.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String name;
    private String email;
    private String pictureUrl;
    private String password;   // null for Google users

    // NEW: identifies whether user is APPLICANT or INDUSTRY
    private String userType;   // "APPLICANT" or "INDUSTRY"

    // Subscription type for INDUSTRY users (FREE or PAID)
    private String subscriptionType;   // "FREE" or "PAID", defaults to "FREE"

    public User() {}
    
    // Constructor that initializes subscription as FREE
    public User(String name, String email, String pictureUrl, String userType) {
        this.name = name;
        this.email = email;
        this.pictureUrl = pictureUrl;
        this.userType = userType;
        this.subscriptionType = "INDUSTRY".equals(userType) ? "FREE" : null;
    }

    public User(String name, String email, String pictureUrl) {
        this.name = name;
        this.email = email;
        this.pictureUrl = pictureUrl;
    }

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPictureUrl() { return pictureUrl; }
    public void setPictureUrl(String pictureUrl) { this.pictureUrl = pictureUrl; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }

    public String getSubscriptionType() { return subscriptionType; }
    public void setSubscriptionType(String subscriptionType) { this.subscriptionType = subscriptionType; }
}
