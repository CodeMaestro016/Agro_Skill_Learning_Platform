package com.agro.demo.service;

import com.agro.demo.model.Post;
import com.agro.demo.model.User;
import com.agro.demo.model.PostDTO;
import com.agro.demo.repository.PostRepository;
import com.agro.demo.repository.UserRepository;
import com.agro.demo.util.VideoValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
public class PostService {

    private static final Logger logger = LoggerFactory.getLogger(PostService.class);
    
    @Autowired
    private PostRepository postRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VideoValidator videoValidator;

    @Autowired
    private CloudinaryService cloudinaryService;

    public Post createPost(Post post, List<MultipartFile> images, MultipartFile videoFile) throws IOException {
        logger.info("Creating a new post");
        
        if (post.getUserId() == null || post.getUserId().trim().isEmpty()) {
            logger.error("Error: User ID is missing");
            throw new IllegalArgumentException("User ID is required");
        }

        // Verify user exists
        Optional<User> userOptional = userRepository.findById(post.getUserId());
        if (userOptional.isEmpty()) {
            logger.error("Error: User not found with ID: {}", post.getUserId());
            throw new IllegalArgumentException("Invalid user ID");
        }

        // Handle images if present
        if (images != null && !images.isEmpty()) {
            if (images.size() > 3) {
                logger.error("Error: Maximum 3 images allowed");
                throw new IllegalArgumentException("Maximum 3 images allowed");
            }
            // Upload images to Cloudinary
            List<String> imageUrls = cloudinaryService.uploadImages(new ArrayList<>(images));
            post.setImageUrls(imageUrls);
        }

        // Handle video if present
        if (videoFile != null && !videoFile.isEmpty()) {
            try {
                if (!videoValidator.isValidVideoDuration(videoFile)) {
                    logger.error("Error: Video duration exceeds 30 seconds");
                    throw new IllegalArgumentException("Video duration must not exceed 30 seconds");
                }
                // Upload video to Cloudinary
                String videoUrl = cloudinaryService.uploadVideo(videoFile);
                post.setVideoUrl(videoUrl);
                // Clear other content types
                post.setContent(null);
                post.setImageUrls(null);
            } catch (Exception e) {
                logger.error("Error processing video: {}", e.getMessage());
                throw new IOException("Failed to process video: " + e.getMessage());
            }
        }

        // Validate post content - exactly one of content, images, or video must be present
        if (!post.isValid()) {
            logger.error("Error: Post must have exactly one of: content, images, or video");
            throw new IllegalArgumentException("Post must have exactly one of: content, images, or video");
        }

        return postRepository.save(post);
    }

    public List<PostDTO> getAllPostsByUserId(String userId) {
        logger.info("Fetching posts for user: {}", userId);
        
        if (userId == null || userId.trim().isEmpty()) {
            logger.error("Error: User ID is missing");
            throw new IllegalArgumentException("User ID is required");
        }

        List<Post> posts = postRepository.findByUserId(userId);
        return posts.stream()
            .map(post -> {
                Optional<User> user = userRepository.findById(post.getUserId());
                return new PostDTO(post, user.orElse(null));
            })
            .collect(Collectors.toList());
    }

    public PostDTO getPostByIdAndUserId(String id, String userId) {
        logger.info("Fetching post with ID: {} for user: {}", id, userId);

        if (userId == null || userId.trim().isEmpty()) {
            logger.error("Error: User ID is missing");
            throw new IllegalArgumentException("User ID is required");
        }

        Optional<Post> postOptional = postRepository.findById(id);
        
        if (postOptional.isEmpty() || !postOptional.get().getUserId().equals(userId)) {
            logger.error("Error: Post not found or does not belong to the user");
            throw new IllegalArgumentException("Post not found or unauthorized");
        }
        
        Post post = postOptional.get();
        Optional<User> user = userRepository.findById(post.getUserId());
        return new PostDTO(post, user.orElse(null));
    }

    public Post updatePost(String id, String userId, Post updatedPost, List<MultipartFile> images, MultipartFile videoFile) throws IOException {
        logger.info("Updating post with ID: {} for user: {}", id, userId);

        if (userId == null || userId.trim().isEmpty()) {
            logger.error("Error: User ID is missing");
            throw new IllegalArgumentException("User ID is required");
        }

        Optional<Post> postOptional = postRepository.findById(id);

        if (postOptional.isEmpty() || !postOptional.get().getUserId().equals(userId)) {
            logger.error("Error: Post not found or unauthorized");
            throw new IllegalArgumentException("Post not found or unauthorized");
        }

        Post existingPost = postOptional.get();

        // Update caption if provided
        if (updatedPost.getCaption() != null) {
            existingPost.setCaption(updatedPost.getCaption());
        }

        // Determine which content type is being updated
        boolean hasNewContent = updatedPost.getContent() != null && !updatedPost.getContent().isEmpty();
        boolean hasNewImages = images != null && !images.isEmpty();
        boolean hasNewVideo = videoFile != null;

        // Count how many content types are being updated
        int contentTypesCount = 0;
        if (hasNewContent) contentTypesCount++;
        if (hasNewImages) contentTypesCount++;
        if (hasNewVideo) contentTypesCount++;

        // If multiple content types are being updated, throw an error
        if (contentTypesCount > 1) {
            logger.error("Error: Cannot update multiple content types at once");
            throw new IllegalArgumentException("Cannot update multiple content types at once");
        }

        // Handle content updates
        if (hasNewContent) {
            existingPost.setContent(updatedPost.getContent());
            existingPost.setImageUrls(null);
            existingPost.setVideoUrl(null);
        }

        // Handle image updates
        if (hasNewImages) {
            if (images.size() > 3) {
                logger.error("Error: Maximum 3 images allowed");
                throw new IllegalArgumentException("Maximum 3 images allowed");
            }
            // Upload new images to Cloudinary
            List<String> imageUrls = cloudinaryService.uploadImages(new ArrayList<>(images));
            existingPost.setImageUrls(imageUrls);
            existingPost.setContent(null);
            existingPost.setVideoUrl(null);
        }

        // Handle video updates
        if (hasNewVideo) {
            // Validate video duration if new video is provided
            if (!videoValidator.isValidVideoDuration(videoFile)) {
                logger.error("Error: Video duration exceeds 30 seconds");
                throw new IllegalArgumentException("Video duration must not exceed 30 seconds");
            }
            // Upload new video to Cloudinary
            String videoUrl = cloudinaryService.uploadVideo(videoFile);
            existingPost.setVideoUrl(videoUrl);
            existingPost.setContent(null);
            existingPost.setImageUrls(null);
        }

        // If no new content is being added, keep the existing content
        if (!hasNewContent && !hasNewImages && !hasNewVideo) {
            // Keep existing content type
            if (existingPost.getContent() != null && !existingPost.getContent().isEmpty()) {
                existingPost.setContent(updatedPost.getContent());
            } else if (existingPost.getImageUrls() != null && !existingPost.getImageUrls().isEmpty()) {
                existingPost.setImageUrls(updatedPost.getImageUrls());
            } else if (existingPost.getVideoUrl() != null && !existingPost.getVideoUrl().isEmpty()) {
                existingPost.setVideoUrl(updatedPost.getVideoUrl());
            }
        }

        return postRepository.save(existingPost);
    }

    public void deletePost(String id, String userId) {
        logger.info("Deleting post with ID: {} for user: {}", id, userId);

        if (userId == null || userId.trim().isEmpty()) {
            logger.error("Error: User ID is missing");
            throw new IllegalArgumentException("User ID is required");
        }

        Optional<Post> postOptional = postRepository.findById(id);

        if (postOptional.isEmpty() || !postOptional.get().getUserId().equals(userId)) {
            logger.error("Error: Post not found or unauthorized");
            throw new IllegalArgumentException("Post not found or unauthorized");
        }

        postRepository.deleteById(id);
    }

    public Page<PostDTO> getFeed(int page, int size) {
        logger.info("Fetching feed with page: {} and size: {}", page, size);
        
        if (page < 0) {
            logger.error("Error: Page number cannot be negative");
            throw new IllegalArgumentException("Page number cannot be negative");
        }
        
        if (size <= 0) {
            logger.error("Error: Page size must be greater than 0");
            throw new IllegalArgumentException("Page size must be greater than 0");
        }
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = postRepository.findAllByOrderByCreatedAtDesc(pageable);
        
        return posts.map(post -> {
            Optional<User> user = userRepository.findById(post.getUserId());
            if (user.isPresent()) {
                logger.info("User found for post {}: {} {}", post.getId(), user.get().getFirstName(), user.get().getLastName());
                logger.info("User profile photo: {}", user.get().getProfilePhoto());
            } else {
                logger.warn("No user found for post {}", post.getId());
            }
            return new PostDTO(post, user.orElse(null));
        });
    }
} 