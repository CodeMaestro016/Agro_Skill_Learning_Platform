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

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PostService {

    private static final Logger logger = LoggerFactory.getLogger(PostService.class);
    
    @Autowired
    private PostRepository postRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VideoValidator videoValidator;

    public Post createPost(Post post, MultipartFile videoFile) {
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

        // Validate post content - exactly one of content, images, or video must be present
        if (!post.isValid()) {
            logger.error("Error: Post must have exactly one of: content, images, or video");
            throw new IllegalArgumentException("Post must have exactly one of: content, images, or video");
        }

        // Validate images if present
        if (post.getImageUrls() != null) {
            if (post.getImageUrls().size() > 3) {
                logger.error("Error: Maximum 3 images allowed");
                throw new IllegalArgumentException("Maximum 3 images allowed");
            }
            if (post.getImageUrls().size() < 1) {
                logger.error("Error: At least 1 image required if images are provided");
                throw new IllegalArgumentException("At least 1 image required if images are provided");
            }
        }

        // Validate video duration if video is present
        if (post.getVideoUrl() != null && !post.getVideoUrl().isEmpty() && videoFile != null) {
            if (!videoValidator.isValidVideoDuration(videoFile)) {
                logger.error("Error: Video duration exceeds 30 seconds");
                throw new IllegalArgumentException("Video duration must not exceed 30 seconds");
            }
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

    public Post updatePost(String id, String userId, Post updatedPost, MultipartFile videoFile) {
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

        // Only update fields that are provided and not empty
        if (updatedPost.getContent() != null && !updatedPost.getContent().isEmpty()) {
            existingPost.setContent(updatedPost.getContent());
            // Clear other content types
            existingPost.setImageUrls(null);
            existingPost.setVideoUrl(null);
        }

        if (updatedPost.getCaption() != null) {
            existingPost.setCaption(updatedPost.getCaption());
        }

        if (updatedPost.getImageUrls() != null && !updatedPost.getImageUrls().isEmpty()) {
            if (updatedPost.getImageUrls().size() > 3) {
                logger.error("Error: Maximum 3 images allowed");
                throw new IllegalArgumentException("Maximum 3 images allowed");
            }
            existingPost.setImageUrls(updatedPost.getImageUrls());
            // Clear other content types
            existingPost.setContent(null);
            existingPost.setVideoUrl(null);
        }

        if (updatedPost.getVideoUrl() != null && !updatedPost.getVideoUrl().isEmpty()) {
            // Validate video duration if new video is provided
            if (videoFile != null && !videoValidator.isValidVideoDuration(videoFile)) {
                logger.error("Error: Video duration exceeds 30 seconds");
                throw new IllegalArgumentException("Video duration must not exceed 30 seconds");
            }
            existingPost.setVideoUrl(updatedPost.getVideoUrl());
            // Clear other content types
            existingPost.setContent(null);
            existingPost.setImageUrls(null);
        }

        // Validate the updated post
        if (!existingPost.isValid()) {
            logger.error("Error: Post must have exactly one of: content, images, or video");
            throw new IllegalArgumentException("Post must have exactly one of: content, images, or video");
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
            return new PostDTO(post, user.orElse(null));
        });
    }
} 