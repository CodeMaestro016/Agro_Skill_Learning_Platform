package com.agro.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "saved_posts")
public class SavedPost {
    @Id
    private String id;
    private String userId;
    private String postId;
    private LocalDateTime savedAt;

    public SavedPost() {
        this.savedAt = LocalDateTime.now();
    }

    public SavedPost(String userId, String postId) {
        this.userId = userId;
        this.postId = postId;
        this.savedAt = LocalDateTime.now();
    }
} 