package com.agro.demo.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Arrays;

@Service
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(
        @Value("${cloudinary.cloud-name}") String cloudName,
        @Value("${cloudinary.api-key}") String apiKey,
        @Value("${cloudinary.api-secret}") String apiSecret
    ) {
        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", cloudName);
        config.put("api_key", apiKey);
        config.put("api_secret", apiSecret);
        config.put("secure", "true");
        this.cloudinary = new Cloudinary(config);
    }

    public List<String> uploadImages(List<MultipartFile> images) {
        List<String> imageUrls = new ArrayList<>();
        try {
            for (MultipartFile image : images) {
                if (image != null && !image.isEmpty()) {
                    Map<String, Object> options = new HashMap<>();
                    options.put("resource_type", "auto");
                    options.put("eager", Arrays.asList(
                        new Transformation()
                            .width(800)
                            .height(600)
                            .crop("scale")
                    ));

                    Map<String, Object> result = cloudinary.uploader().upload(
                        image.getBytes(),
                        options
                    );

                    String imageUrl = (String) result.get("secure_url");
                    if (imageUrl != null) {
                        imageUrls.add(imageUrl);
                    }
                }
            }
            return imageUrls;
        } catch (Exception e) {
            log.error("Error uploading images to Cloudinary: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload images to Cloudinary: " + e.getMessage());
        }
    }

    public String uploadVideo(MultipartFile videoFile) {
        try {
            if (videoFile == null || videoFile.isEmpty()) {
                throw new IllegalArgumentException("Video file is empty");
            }

            // Create upload options with minimal transformations
            Map<String, Object> options = new HashMap<>();
            options.put("resource_type", "video");
            options.put("eager", Arrays.asList(
                new Transformation()
                    .width(640)
                    .height(360)
                    .crop("scale")
            ));

            // Upload the video
            Map<String, Object> result = cloudinary.uploader().upload(
                videoFile.getBytes(),
                options
            );

            // Get the secure URL
            String videoUrl = (String) result.get("secure_url");
            if (videoUrl == null) {
                throw new RuntimeException("Failed to get video URL from Cloudinary response");
            }

            return videoUrl;
        } catch (Exception e) {
            log.error("Error uploading video to Cloudinary: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload video to Cloudinary: " + e.getMessage());
        }
    }
} 