package com.agro.demo.model;

import lombok.Data;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;
import java.time.LocalDateTime;

@Data
@Builder
@Document(collection = "posts")
public class Post {
    @Id
    private String id;
    private String userId;
    private String content;
    private String caption;
    private List<String> imageUrls;
    private String videoUrl;
    private LocalDateTime createdAt;

    public Post() {
        this.createdAt = LocalDateTime.now();
    }

    public Post(String id, String userId, String content, String caption, List<String> imageUrls, String videoUrl, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.content = content;
        this.caption = caption;
        this.imageUrls = imageUrls;
        this.videoUrl = videoUrl;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    // Validation method to ensure only one type of content is present
    public boolean isValid() {
        int contentCount = 0;
        if (content != null && !content.isEmpty()) contentCount++;
        if (imageUrls != null && !imageUrls.isEmpty()) contentCount++;
        if (videoUrl != null && !videoUrl.isEmpty()) contentCount++;
        return contentCount == 1;
    }
}
