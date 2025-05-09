package com.agro.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String userId; // recipient of the notification
    private String actorId; // user who performed the action
    private String postId;
    private String type; // "LIKE" or "COMMENT"
    private String content; // for comments, store the comment content
    private boolean isRead;
    private LocalDateTime createdAt;

    public Notification() {
        this.createdAt = LocalDateTime.now();
        this.isRead = false;
    }

    public Notification(String userId, String actorId, String postId, String type, String content) {
        this.userId = userId;
        this.actorId = actorId;
        this.postId = postId;
        this.type = type;
        this.content = content;
        this.createdAt = LocalDateTime.now();
        this.isRead = false;
    }
} 