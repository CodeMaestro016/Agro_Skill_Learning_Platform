package com.agro.demo.service;

import com.agro.demo.model.*;
import com.agro.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class InteractivityService {

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    // Like functionality
    @Transactional
    public Like toggleLike(String postId, String userId) {
        Optional<Like> existingLike = likeRepository.findByPostIdAndUserId(postId, userId);
        
        if (existingLike.isPresent()) {
            likeRepository.delete(existingLike.get());
            return null;
        } else {
            Like newLike = new Like(postId, userId);
            likeRepository.save(newLike);
            
            // Create notification for post owner
            Post post = postRepository.findById(postId).orElseThrow();
            if (!post.getUserId().equals(userId)) {
                User actor = userRepository.findById(userId).orElseThrow();
                Notification notification = new Notification(
                    post.getUserId(),
                    userId,
                    postId,
                    "LIKE",
                    actor.getFirstName() + " " + actor.getLastName() + " liked your post"
                );
                notificationRepository.save(notification);
            }
            
            return newLike;
        }
    }

    public long getLikeCount(String postId) {
        return likeRepository.countByPostId(postId);
    }

    public boolean hasUserLiked(String postId, String userId) {
        return likeRepository.findByPostIdAndUserId(postId, userId).isPresent();
    }

    // Comment functionality
    @Transactional
    public Comment addComment(String postId, String userId, String content) {
        Comment comment = new Comment(postId, userId, content);
        commentRepository.save(comment);
        
        // Create notification for post owner
        Post post = postRepository.findById(postId).orElseThrow();
        if (!post.getUserId().equals(userId)) {
            User actor = userRepository.findById(userId).orElseThrow();
            Notification notification = new Notification(
                post.getUserId(),
                userId,
                postId,
                "COMMENT",
                actor.getFirstName() + " " + actor.getLastName() + " commented: " + content
            );
            notificationRepository.save(notification);
        }
        
        return comment;
    }

    @Transactional
    public Comment updateComment(String commentId, String userId, String content) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
            
        if (!comment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized to update this comment");
        }
        
        comment.setContent(content);
        comment.setUpdatedAt(java.time.LocalDateTime.now());
        return commentRepository.save(comment);
    }

    @Transactional
    public void deleteComment(String commentId, String userId) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
            
        // Get the post to check if user is the post owner
        Post post = postRepository.findById(comment.getPostId())
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));
            
        if (!comment.getUserId().equals(userId) && !post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized to delete this comment");
        }
        
        commentRepository.delete(comment);
    }

    public List<Comment> getComments(String postId) {
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId);
    }

    // Notification functionality
    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void markNotificationAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
            
        if (!notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized to modify this notification");
        }
        
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllNotificationsAsRead(String userId) {
        List<Notification> unreadNotifications = getUnreadNotifications(userId);
        for (Notification notification : unreadNotifications) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }
} 