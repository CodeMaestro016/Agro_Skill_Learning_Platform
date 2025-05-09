package com.agro.demo.service;

import com.agro.demo.model.SavedPost;
import com.agro.demo.model.Post;
import com.agro.demo.model.PostDTO;
import com.agro.demo.model.User;
import com.agro.demo.repository.SavedPostRepository;
import com.agro.demo.repository.PostRepository;
import com.agro.demo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SavedPostService {
    private static final Logger logger = LoggerFactory.getLogger(SavedPostService.class);

    @Autowired
    private SavedPostRepository savedPostRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    public SavedPost savePost(String userId, String postId) {
        logger.info("Saving post {} for user {}", postId, userId);

        // Check if post exists
        Optional<Post> postOptional = postRepository.findById(postId);
        if (postOptional.isEmpty()) {
            logger.error("Post not found with ID: {}", postId);
            throw new IllegalArgumentException("Post not found");
        }

        // Check if already saved
        SavedPost existingSavedPost = savedPostRepository.findByUserIdAndPostId(userId, postId);
        if (existingSavedPost != null) {
            logger.info("Post already saved by user");
            return existingSavedPost;
        }

        // Create new saved post
        SavedPost savedPost = new SavedPost(userId, postId);
        return savedPostRepository.save(savedPost);
    }

    public void unsavePost(String userId, String postId) {
        logger.info("Unsaving post {} for user {}", postId, userId);
        savedPostRepository.deleteByUserIdAndPostId(userId, postId);
    }

    public List<PostDTO> getSavedPosts(String userId) {
        logger.info("Fetching saved posts for user {}", userId);

        List<SavedPost> savedPosts = savedPostRepository.findByUserId(userId);
        return savedPosts.stream()
            .map(savedPost -> {
                Optional<Post> postOptional = postRepository.findById(savedPost.getPostId());
                if (postOptional.isPresent()) {
                    Post post = postOptional.get();
                    Optional<User> userOptional = userRepository.findById(post.getUserId());
                    return new PostDTO(post, userOptional.orElse(null));
                }
                return null;
            })
            .filter(postDTO -> postDTO != null)
            .collect(Collectors.toList());
    }
} 