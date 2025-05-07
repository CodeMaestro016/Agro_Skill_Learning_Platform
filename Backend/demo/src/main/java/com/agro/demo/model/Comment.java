package com.agro.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "comments")
public class Comment {
    @Id
    private String id;
    private String postId;
    private String userId;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String userName;
    private String userProfilePhoto;
    private String parentCommentId; // For nested comments
    private List<String> likedBy; // List of user IDs who liked this comment
    private int likeCount; // Count of likes

    public Comment() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.likedBy = new ArrayList<>();
        this.likeCount = 0;
    }

    public Comment(String postId, String userId, String content) {
        this.postId = postId;
        this.userId = userId;
        this.content = content;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.likedBy = new ArrayList<>();
        this.likeCount = 0;
    }

    public Comment(String postId, String userId, String content, String parentCommentId) {
        this.postId = postId;
        this.userId = userId;
        this.content = content;
        this.parentCommentId = parentCommentId;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.likedBy = new ArrayList<>();
        this.likeCount = 0;
    }
} 