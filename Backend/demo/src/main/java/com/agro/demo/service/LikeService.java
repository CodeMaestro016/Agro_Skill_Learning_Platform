package com.agro.demo.service;

import com.agro.demo.model.Like;
import com.agro.demo.model.Notification;
import com.agro.demo.repository.LikeRepository;
import com.agro.demo.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class LikeService {

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    public Like addLike(Like like) {
        // Check if the like already exists
        if (!likeRepository.existsByPostIdAndUserId(like.getPostId(), like.getUserId())) {
            like.setCreatedAt(new Date());
            Like savedLike = likeRepository.save(like);

            // Create notification
            Notification notification = new Notification();
            notification.setSenderId(like.getUserId());
            notification.setReceiverId(like.getPostOwnerId());
            notification.setPostId(like.getPostId());
            notification.setType("like");
            notification.setMessage(like.getUsername() + " liked your post.");
            notification.setCreatedAt(new Date());
            notification.setRead(false);

            notificationRepository.save(notification);

            return savedLike;
        } else {
            // Like already exists, return existing like or null
            return null;
        }
    }

    public List<Like> getLikesByPost(String postId) {
        return likeRepository.findByPostId(postId);
    }

    public void removeLike(String postId, String userId) {
        likeRepository.deleteByPostIdAndUserId(postId, userId);
    }
}
