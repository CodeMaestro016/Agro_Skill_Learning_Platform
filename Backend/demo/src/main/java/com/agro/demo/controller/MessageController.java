package com.agro.demo.controller;

import com.agro.demo.model.Message;
import com.agro.demo.model.User;
import com.agro.demo.repository.MessageRepository;
import com.agro.demo.repository.UserRepository;
import com.agro.demo.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    private static final Logger logger = LoggerFactory.getLogger(MessageController.class);

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public MessageController(MessageRepository messageRepository, UserRepository userRepository, JwtUtil jwtUtil) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestHeader("Authorization") String authHeader,
                                        @RequestBody Map<String, String> request) {
        String token = authHeader.replace("Bearer ", "");
        String senderEmail = jwtUtil.getEmailFromToken(token);

        Optional<User> senderOptional = userRepository.findByEmail(senderEmail);
        if (!senderOptional.isPresent()) {
            return ResponseEntity.badRequest().body("Sender not found");
        }

        String receiverId = request.get("receiverId");
        String content = request.get("content");

        if (receiverId == null || content == null) {
            return ResponseEntity.badRequest().body("Receiver ID and content are required");
        }

        Optional<User> receiverOptional = userRepository.findById(receiverId);
        if (!receiverOptional.isPresent()) {
            return ResponseEntity.badRequest().body("Receiver not found");
        }

        Message message = new Message(senderOptional.get().getId(), receiverId, content);
        messageRepository.save(message);

        logger.info("Message sent from {} to {}", senderEmail, receiverId);
        return ResponseEntity.ok("Message sent successfully");
    }

    @GetMapping("/conversation/{userId}")
    public ResponseEntity<?> getConversation(@RequestHeader("Authorization") String authHeader,
                                           @PathVariable String userId) {
        String token = authHeader.replace("Bearer ", "");
        String currentUserEmail = jwtUtil.getEmailFromToken(token);

        Optional<User> currentUserOptional = userRepository.findByEmail(currentUserEmail);
        if (!currentUserOptional.isPresent()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        String currentUserId = currentUserOptional.get().getId();
        List<Message> messages = messageRepository.findBySenderIdAndReceiverId(currentUserId, userId);
        messages.addAll(messageRepository.findBySenderIdAndReceiverId(userId, currentUserId));

        // Create a map to store user details
        Map<String, User> userDetails = new HashMap<>();
        
        // Add current user details
        userDetails.put(currentUserId, currentUserOptional.get());
        
        // Add other user details
        Optional<User> otherUserOptional = userRepository.findById(userId);
        if (otherUserOptional.isPresent()) {
            userDetails.put(userId, otherUserOptional.get());
        }

        // Create response with messages and user details
        Map<String, Object> response = new HashMap<>();
        response.put("messages", messages);
        response.put("userDetails", userDetails);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread/count")
    public ResponseEntity<?> getUnreadCount(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String currentUserEmail = jwtUtil.getEmailFromToken(token);

        Optional<User> currentUserOptional = userRepository.findByEmail(currentUserEmail);
        if (!currentUserOptional.isPresent()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        long unreadCount = messageRepository.countByReceiverIdAndIsReadFalse(currentUserOptional.get().getId());
        return ResponseEntity.ok(unreadCount);
    }

    @PutMapping("/mark-read/{messageId}")
    public ResponseEntity<?> markMessageAsRead(@RequestHeader("Authorization") String authHeader,
                                             @PathVariable String messageId) {
        String token = authHeader.replace("Bearer ", "");
        String currentUserEmail = jwtUtil.getEmailFromToken(token);

        Optional<User> currentUserOptional = userRepository.findByEmail(currentUserEmail);
        if (!currentUserOptional.isPresent()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        Optional<Message> messageOptional = messageRepository.findById(messageId);
        if (!messageOptional.isPresent()) {
            return ResponseEntity.badRequest().body("Message not found");
        }

        Message message = messageOptional.get();
        if (!message.getReceiverId().equals(currentUserOptional.get().getId())) {
            return ResponseEntity.badRequest().body("Unauthorized to mark this message as read");
        }

        message.setRead(true);
        messageRepository.save(message);

        return ResponseEntity.ok("Message marked as read");
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> getAllConversations(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String currentUserEmail = jwtUtil.getEmailFromToken(token);

        Optional<User> currentUserOptional = userRepository.findByEmail(currentUserEmail);
        if (!currentUserOptional.isPresent()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        String currentUserId = currentUserOptional.get().getId();
        List<Message> sentMessages = messageRepository.findBySenderId(currentUserId);
        List<Message> receivedMessages = messageRepository.findByReceiverId(currentUserId);

        // Create a map to store user details
        Map<String, User> userDetails = new HashMap<>();
        
        // Add current user details
        userDetails.put(currentUserId, currentUserOptional.get());
        
        // Collect all unique user IDs from sent and received messages
        Set<String> userIds = new HashSet<>();
        sentMessages.forEach(msg -> userIds.add(msg.getReceiverId()));
        receivedMessages.forEach(msg -> userIds.add(msg.getSenderId()));
        
        // Fetch details for all users involved in conversations
        userIds.forEach(userId -> {
            userRepository.findById(userId).ifPresent(user -> userDetails.put(userId, user));
        });

        Map<String, Object> response = new HashMap<>();
        response.put("sentMessages", sentMessages);
        response.put("receivedMessages", receivedMessages);
        response.put("userDetails", userDetails);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/update/{messageId}")
    public ResponseEntity<?> updateMessage(@RequestHeader("Authorization") String authHeader,
                                         @PathVariable String messageId,
                                         @RequestBody Map<String, String> request) {
        String token = authHeader.replace("Bearer ", "");
        String currentUserEmail = jwtUtil.getEmailFromToken(token);

        Optional<User> currentUserOptional = userRepository.findByEmail(currentUserEmail);
        if (!currentUserOptional.isPresent()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        Optional<Message> messageOptional = messageRepository.findById(messageId);
        if (!messageOptional.isPresent()) {
            return ResponseEntity.badRequest().body("Message not found");
        }

        Message message = messageOptional.get();
        if (!message.getSenderId().equals(currentUserOptional.get().getId())) {
            return ResponseEntity.badRequest().body("Unauthorized to update this message");
        }

        String newContent = request.get("content");
        if (newContent == null || newContent.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Content cannot be empty");
        }

        message.setContent(newContent);
        messageRepository.save(message);

        logger.info("Message {} updated by user {}", messageId, currentUserEmail);
        return ResponseEntity.ok("Message updated successfully");
    }

    @DeleteMapping("/delete/{messageId}")
    public ResponseEntity<?> deleteMessage(@RequestHeader("Authorization") String authHeader,
                                         @PathVariable String messageId) {
        String token = authHeader.replace("Bearer ", "");
        String currentUserEmail = jwtUtil.getEmailFromToken(token);

        Optional<User> currentUserOptional = userRepository.findByEmail(currentUserEmail);
        if (!currentUserOptional.isPresent()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        Optional<Message> messageOptional = messageRepository.findById(messageId);
        if (!messageOptional.isPresent()) {
            return ResponseEntity.badRequest().body("Message not found");
        }

        Message message = messageOptional.get();
        String currentUserId = currentUserOptional.get().getId();

        // Allow deletion if user is either sender or receiver
        if (!message.getSenderId().equals(currentUserId) && !message.getReceiverId().equals(currentUserId)) {
            return ResponseEntity.badRequest().body("Unauthorized to delete this message");
        }

        messageRepository.delete(message);

        logger.info("Message {} deleted by user {}", messageId, currentUserEmail);
        return ResponseEntity.ok("Message deleted successfully");
    }

    @DeleteMapping("/delete-conversation/{userId}")
    public ResponseEntity<?> deleteConversation(@RequestHeader("Authorization") String authHeader,
                                              @PathVariable String userId) {
        String token = authHeader.replace("Bearer ", "");
        String currentUserEmail = jwtUtil.getEmailFromToken(token);

        Optional<User> currentUserOptional = userRepository.findByEmail(currentUserEmail);
        if (!currentUserOptional.isPresent()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        String currentUserId = currentUserOptional.get().getId();
        
        // Delete all messages between the two users
        List<Message> messagesToDelete = messageRepository.findBySenderIdAndReceiverId(currentUserId, userId);
        messagesToDelete.addAll(messageRepository.findBySenderIdAndReceiverId(userId, currentUserId));
        
        messageRepository.deleteAll(messagesToDelete);

        logger.info("Conversation between {} and {} deleted by {}", currentUserId, userId, currentUserEmail);
        return ResponseEntity.ok("Conversation deleted successfully");
    }
} 