package com.agro.demo.service;

import com.agro.demo.model.Comment;
import com.agro.demo.model.Notification;
import com.agro.demo.repository.CommentRepository;
import com.agro.demo.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    // Add Comment
    public Comment addComment(Comment comment) {
        comment.setCreatedAt(new Date());
        comment.setUpdatedAt(new Date());
        Comment savedComment = commentRepository.save(comment);

        // Create Notification
        Notification notification = new Notification();
        notification.setType("comment");
        notification.setSenderId(comment.getUserId());
        notification.setReceiverId(getPostOwnerId(comment.getPostId())); // 👈 You need to implement this
        notification.setPostId(comment.getPostId());
        notification.setMessage(comment.getUsername() + " commented on your post");
        notification.setCreatedAt(new Date());
        notification.setRead(false);

        notificationRepository.save(notification);

        return savedComment;
    }

    // Get All Comments by Post ID
    public List<Comment> getCommentsByPostId(String postId) {
        return commentRepository.findByPostId(postId);
    }

    // Update Comment
    public Optional<Comment> updateComment(String commentId, String content) {
        Optional<Comment> optionalComment = commentRepository.findById(commentId);
        if (optionalComment.isPresent()) {
            Comment comment = optionalComment.get();
            comment.setContent(content);
            comment.setUpdatedAt(new Date());
            commentRepository.save(comment);
            return Optional.of(comment);
        }
        return Optional.empty();
    }

    // Delete Comment
    public boolean deleteComment(String commentId) {
        if (commentRepository.existsById(commentId)) {
            commentRepository.deleteById(commentId);
            return true;
        }
        return false;
    }

    // Dummy function to return post owner's ID — in real case, call post service or store post owner in DB
    private String getPostOwnerId(String postId) {
        // TODO: Replace this with actual logic from PostService or PostRepository
        return "owner-id-of-" + postId;
    }
}
