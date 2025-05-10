package com.agro.demo.repository;

import com.agro.demo.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
 
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(String userId);
    void deleteByPostId(String postId);
} 