package com.agro.demo.controller;

import com.agro.demo.model.*;
import com.agro.demo.service.InteractivityService;
import com.agro.demo.security.JwtUtil;
import com.agro.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/interactivity")
@CrossOrigin(origins = "*")
public class InteractivityController {

    @Autowired
    private InteractivityService interactivityService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    private String getUserIdFromToken(String token) {
        String email = jwtUtil.getEmailFromToken(token);
        Optional<User> user = userRepository.findByEmail(email);
        if (!user.isPresent()) {
            throw new IllegalArgumentException("User not found");
        }
        return user.get().getId();
    }

    // Like endpoints
    @PostMapping("/likes/{postId}")
    public ResponseEntity<?> toggleLike(
            @PathVariable String postId,
            @RequestHeader("Authorization") String token) {
        try {
            String userId = getUserIdFromToken(token.replace("Bearer ", ""));
            Like like = interactivityService.toggleLike(postId, userId);
            return ResponseEntity.ok(like);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error toggling like: " + e.getMessage());
        }
    }

    @GetMapping("/likes/{postId}/count")
    public ResponseEntity<?> getLikeCount(@PathVariable String postId) {
        try {
            long count = interactivityService.getLikeCount(postId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error getting like count: " + e.getMessage());
        }
    }

    @GetMapping("/likes/{postId}/status")
    public ResponseEntity<?> hasUserLiked(
            @PathVariable String postId,
            @RequestHeader("Authorization") String token) {
        try {
            String userId = getUserIdFromToken(token.replace("Bearer ", ""));
            boolean hasLiked = interactivityService.hasUserLiked(postId, userId);
            return ResponseEntity.ok(Map.of("hasLiked", hasLiked));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error checking like status: " + e.getMessage());
        }
    }

    // Comment endpoints
    @PostMapping("/comments/{postId}")
    public ResponseEntity<?> addComment(
            @PathVariable String postId,
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String token) {
        try {
            String userId = getUserIdFromToken(token.replace("Bearer ", ""));
            String content = request.get("content");
            Comment comment = interactivityService.addComment(postId, userId, content);
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error adding comment: " + e.getMessage());
        }
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<?> updateComment(
            @PathVariable String commentId,
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String token) {
        try {
            String userId = getUserIdFromToken(token.replace("Bearer ", ""));
            String content = request.get("content");
            Comment comment = interactivityService.updateComment(commentId, userId, content);
            return ResponseEntity.ok(comment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating comment: " + e.getMessage());
        }
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable String commentId,
            @RequestHeader("Authorization") String token) {
        try {
            String userId = getUserIdFromToken(token.replace("Bearer ", ""));
            interactivityService.deleteComment(commentId, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting comment: " + e.getMessage());
        }
    }

    @GetMapping("/comments/{postId}")
    public ResponseEntity<?> getComments(@PathVariable String postId) {
        try {
            List<Comment> comments = interactivityService.getComments(postId);
            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error getting comments: " + e.getMessage());
        }
    }

    // Notification endpoints
    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications(
            @RequestHeader("Authorization") String token) {
        try {
            String userId = getUserIdFromToken(token.replace("Bearer ", ""));
            List<Notification> notifications = interactivityService.getUserNotifications(userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error getting notifications: " + e.getMessage());
        }
    }

    @GetMapping("/notifications/unread")
    public ResponseEntity<?> getUnreadNotifications(
            @RequestHeader("Authorization") String token) {
        try {
            String userId = getUserIdFromToken(token.replace("Bearer ", ""));
            List<Notification> notifications = interactivityService.getUnreadNotifications(userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error getting unread notifications: " + e.getMessage());
        }
    }

    @PutMapping("/notifications/{notificationId}/read")
    public ResponseEntity<?> markNotificationAsRead(
            @PathVariable String notificationId,
            @RequestHeader("Authorization") String token) {
        try {
            String userId = getUserIdFromToken(token.replace("Bearer ", ""));
            interactivityService.markNotificationAsRead(notificationId, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error marking notification as read: " + e.getMessage());
        }
    }

    @PutMapping("/notifications/read-all")
    public ResponseEntity<?> markAllNotificationsAsRead(
            @RequestHeader("Authorization") String token) {
        try {
            String userId = getUserIdFromToken(token.replace("Bearer ", ""));
            interactivityService.markAllNotificationsAsRead(userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error marking all notifications as read: " + e.getMessage());
        }
    }
} 