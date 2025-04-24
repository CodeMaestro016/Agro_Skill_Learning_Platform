package com.agro.demo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "likes")
public class Like {

    @Id
    private String id;

    private String postId;
    private String userId;
    private String username;
    private String postOwnerId;
    private Date createdAt;

    // Constructors
    public Like() {
        this.createdAt = new Date();
    }

    public Like(String postId, String userId, String username, String postOwnerId) {
        this.postId = postId;
        this.userId = userId;
        this.username = username;
        this.postOwnerId = postOwnerId;
        this.createdAt = new Date();
    }

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPostId() { return postId; }
    public void setPostId(String postId) { this.postId = postId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPostOwnerId() { return postOwnerId; }
    public void setPostOwnerId(String postOwnerId) { this.postOwnerId = postOwnerId; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}
