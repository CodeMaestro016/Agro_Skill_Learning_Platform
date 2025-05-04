package com.agro.demo.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
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
    private LocalDateTime updatedAt;

    public Post() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isValid() {
        // A post must have exactly one type of content (text, images, or video)
        boolean hasContent = content != null && !content.trim().isEmpty();
        boolean hasImages = imageUrls != null && !imageUrls.isEmpty();
        boolean hasVideo = videoUrl != null && !videoUrl.isEmpty();

        // Count how many types of content are present
        int contentCount = 0;
        if (hasContent) contentCount++;
        if (hasImages) contentCount++;
        if (hasVideo) contentCount++;

        // Must have exactly one type of content
        return contentCount == 1;
    }
}
