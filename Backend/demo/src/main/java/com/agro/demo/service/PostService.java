package com.agro.demo.service;

import com.agro.demo.model.Post;
import com.agro.demo.model.User;
import com.agro.demo.model.PostDTO;
import com.agro.demo.repository.PostRepository;
import com.agro.demo.repository.UserRepository;
import com.agro.demo.util.VideoValidator;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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

    @Autowired
    private Cloudinary cloudinary;

    public Post createPost(Post post, MultipartFile video) throws IOException {
        logger.info("Creating a new post with content: {}, images: {}, video: {}", 
            post.getContent() != null ? "present" : "null",
            post.getImageUrls() != null ? post.getImageUrls().size() : 0,
            video != null ? "present" : "null");
        
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

        // Validate that exactly one type of content is present
        boolean hasContent = post.getContent() != null && !post.getContent().trim().isEmpty();
        boolean hasImages = post.getImageUrls() != null && !post.getImageUrls().isEmpty();
        boolean hasVideo = video != null && !video.isEmpty();

        logger.info("Content validation - hasContent: {}, hasImages: {}, hasVideo: {}", 
            hasContent, hasImages, hasVideo);

        int contentCount = 0;
        if (hasContent) contentCount++;
        if (hasImages) contentCount++;
        if (hasVideo) contentCount++;

        logger.info("Content count: {}", contentCount);

        if (contentCount == 0) {
            logger.error("Error: No content provided");
            throw new IllegalArgumentException("Post must have exactly one of: content, images, or video");
        }

        if (contentCount > 1) {
            logger.error("Error: Multiple content types provided");
            throw new IllegalArgumentException("Post can only have one type of content (text, images, or video)");
        }

        // Validate images if present
        if (hasImages) {
            if (post.getImageUrls().size() > 3) {
                logger.error("Error: Too many images provided");
                throw new IllegalArgumentException("Maximum 3 images allowed");
            }
            if (post.getImageUrls().size() < 1) {
                logger.error("Error: No images provided when images are required");
                throw new IllegalArgumentException("At least 1 image required if images are provided");
            }
        }

        // Validate video duration if video is present
        if (hasVideo && !videoValidator.isValidVideoDuration(video)) {
            logger.error("Error: Video duration exceeds limit");
            throw new IllegalArgumentException("Video duration must not exceed 30 seconds");
        }

        List<String> uploadedImageUrls = new ArrayList<>();
        
        // Upload images to Cloudinary
        if (hasImages) {
            for (String imageUrl : post.getImageUrls()) {
                try {
                    // Convert base64 to byte array
                    String base64Data = imageUrl.split(",")[1];
                    byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Data);
                    
                    Map uploadResult = cloudinary.uploader().upload(imageBytes, 
                        ObjectUtils.asMap(
                            "folder", "agro/posts",
                            "resource_type", "image"
                        ));
                    uploadedImageUrls.add((String) uploadResult.get("secure_url"));
                } catch (Exception e) {
                    logger.error("Error uploading image to Cloudinary: {}", e.getMessage());
                    throw new IOException("Failed to upload image to Cloudinary: " + e.getMessage());
                }
            }
        }
        
        // Upload video to Cloudinary if present
        String videoUrl = null;
        if (hasVideo) {
            try {
                Map uploadResult = cloudinary.uploader().upload(video.getBytes(), 
                    ObjectUtils.asMap(
                        "folder", "agro/posts",
                        "resource_type", "video",
                        "chunk_size", 6000000
                    ));
                videoUrl = (String) uploadResult.get("secure_url");
            } catch (Exception e) {
                logger.error("Error uploading video to Cloudinary: {}", e.getMessage());
                throw new IOException("Failed to upload video to Cloudinary: " + e.getMessage());
            }
        }
        
        post.setImageUrls(uploadedImageUrls);
        post.setVideoUrl(videoUrl);
        
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

    public Post updatePost(String id, String userId, Post updatedPost, MultipartFile video) throws IOException {
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

        List<String> uploadedImageUrls = new ArrayList<>();
        
        // Upload new images to Cloudinary
        if (updatedPost.getImageUrls() != null && !updatedPost.getImageUrls().isEmpty()) {
            for (String imageUrl : updatedPost.getImageUrls()) {
                try {
                    // Convert base64 or URL to byte array
                    byte[] imageBytes = java.util.Base64.getDecoder().decode(imageUrl.split(",")[1]);
                    Map uploadResult = cloudinary.uploader().upload(imageBytes, 
                        ObjectUtils.asMap(
                            "folder", "agro/posts",
                            "resource_type", "image"
                        ));
                    uploadedImageUrls.add((String) uploadResult.get("secure_url"));
                } catch (Exception e) {
                    logger.error("Error uploading image to Cloudinary: {}", e.getMessage());
                    throw new IOException("Failed to upload image to Cloudinary: " + e.getMessage());
                }
            }
        }
        
        // Upload new video to Cloudinary if present
        String videoUrl = existingPost.getVideoUrl();
        if (video != null && !video.isEmpty()) {
            try {
                Map uploadResult = cloudinary.uploader().upload(video.getBytes(), 
                    ObjectUtils.asMap(
                        "folder", "agro/posts",
                        "resource_type", "video",
                        "chunk_size", 6000000
                    ));
                videoUrl = (String) uploadResult.get("secure_url");
            } catch (Exception e) {
                logger.error("Error uploading video to Cloudinary: {}", e.getMessage());
                throw new IOException("Failed to upload video to Cloudinary: " + e.getMessage());
            }
        }
        
        existingPost.setContent(updatedPost.getContent());
        existingPost.setCaption(updatedPost.getCaption());
        existingPost.setImageUrls(uploadedImageUrls);
        existingPost.setVideoUrl(videoUrl);
        
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