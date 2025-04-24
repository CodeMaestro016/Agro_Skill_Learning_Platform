package com.agro.demo.service;

import com.agro.demo.model.Notification;
import com.agro.demo.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public Notification createNotification(Notification notification) {
        notification.setCreatedAt(new java.util.Date());
        return notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsByReceiverId(String receiverId) {
        return notificationRepository.findByReceiverId(receiverId);
    }
}
