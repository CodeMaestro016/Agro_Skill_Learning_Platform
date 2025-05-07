package com.agro.demo.repository;

import com.agro.demo.model.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findBySenderIdAndReceiverId(String senderId, String receiverId);
    List<Message> findByReceiverId(String receiverId);
    List<Message> findBySenderId(String senderId);
    long countByReceiverIdAndIsReadFalse(String receiverId);
} 