package com.agro.demo.controller;

import com.agro.demo.model.Notification;
import com.agro.demo.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    // Get all notifications for a specific user by receiverId
    @GetMapping("/{userId}")
    public List<Notification> getNotificationsByReceiver(@PathVariable String userId) {
        System.out.println("Getting notifications for userId: " + userId);

        List<Notification> notifications = notificationService.getNotificationsByReceiverId(userId);

        System.out.println("Number of notifications found: " + notifications.size());

        return notifications;
    }
 
}
