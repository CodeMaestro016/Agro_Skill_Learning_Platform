package com.agro.demo.controller;

import com.agro.demo.model.Post;
import com.agro.demo.model.PostDTO;
import com.agro.demo.service.PostService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Arrays;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/auth/posts")
@CrossOrigin(origins = "*")
public class PostController {

    private static final Logger logger = LoggerFactory.getLogger(PostController.class);
    
    @Autowired
    private PostService postService;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createPost(
            @RequestParam("userId") String userId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "caption", required = false) String caption,
            @RequestParam(value = "imageUrls", required = false) MultipartFile[] images,
            @RequestParam(value = "videoUrl", required = false) MultipartFile video) {
        
        logger.info("Received request to create a post");
        logger.info("User ID: {}, Content: {}, Caption: {}, Images: {}, Video: {}", 
            userId, content, caption, images != null ? images.length : 0, video != null ? video.getOriginalFilename() : "none");

        try {
            Post post = new Post();
            post.setUserId(userId);
            post.setContent(content);
            post.setCaption(caption);
            
            // Convert images array to List if present
            List<MultipartFile> imagesList = null;
            if (images != null && images.length > 0) {
                imagesList = new ArrayList<>(Arrays.asList(images));
            }
            
            // Create the post
            Post createdPost = postService.createPost(post, imagesList, video);
            return ResponseEntity.ok(createdPost);
        } catch (IllegalArgumentException e) {
            logger.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            logger.error("Error uploading media: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to upload media: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Exception: Error creating post", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to create post: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllPosts(@RequestParam String userId) {
        logger.info("Fetching posts for user: {}", userId);
        
        try {
            List<PostDTO> userPosts = postService.getAllPostsByUserId(userId);
            logger.info("Posts retrieved: {}", userPosts);
            return ResponseEntity.ok(userPosts);
        } catch (IllegalArgumentException e) {
            logger.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error fetching posts: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to fetch posts: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPostById(@PathVariable String id, @RequestParam String userId) {
        logger.info("Fetching post with ID: {} for user: {}", id, userId);

        try {
            PostDTO post = postService.getPostByIdAndUserId(id, userId);
            return ResponseEntity.ok(post);
        } catch (IllegalArgumentException e) {
            logger.error("Validation error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error fetching post: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to fetch post: " + e.getMessage());
        }
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<?> updatePost(
            @PathVariable String id,
            @RequestParam String userId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "caption", required = false) String caption,
            @RequestParam(value = "imageUrls", required = false) MultipartFile[] images,
            @RequestParam(value = "videoUrl", required = false) MultipartFile video) {
        
        logger.info("Updating post with ID: {} for user: {}", id, userId);
        logger.info("Content: {}, Caption: {}, Images: {}, Video: {}", 
            content, caption, images != null ? images.length : 0, video != null ? video.getOriginalFilename() : "none");

        try {
            // First get the existing post
            Post existingPost = postService.getPostByIdAndUserId(id, userId);
            
            // Create updated post with existing data
            Post updatedPost = new Post();
            updatedPost.setId(existingPost.getId());
            updatedPost.setUserId(userId);
            updatedPost.setContent(content);
            updatedPost.setCaption(caption);
            
            // Convert images array to List if present
            List<MultipartFile> imagesList = null;
            if (images != null && images.length > 0) {
                imagesList = Arrays.asList(images);
            }
            
            Post post = postService.updatePost(id, userId, updatedPost, imagesList, video);
            return ResponseEntity.ok(post);
        } catch (IllegalArgumentException e) {
            logger.error("Validation error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IOException e) {
            logger.error("Error uploading media: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to upload media: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error updating post: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to update post: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable String id, @RequestParam String userId) {
        logger.info("Deleting post with ID: {} for user: {}", id, userId);

        try {
            postService.deletePost(id, userId);
            return ResponseEntity.ok("Post deleted successfully");
        } catch (IllegalArgumentException e) {
            logger.error("Validation error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error deleting post: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to delete post: " + e.getMessage());
        }
    }

    @GetMapping("/feed")
    public ResponseEntity<?> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        logger.info("Fetching feed with page: {} and size: {}", page, size);
        
        try {
            Page<PostDTO> feed = postService.getFeed(page, size);
            return ResponseEntity.ok(feed);
        } catch (IllegalArgumentException e) {
            logger.error("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error fetching feed: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to fetch feed: " + e.getMessage());
        }
    }

    
    
    



}
