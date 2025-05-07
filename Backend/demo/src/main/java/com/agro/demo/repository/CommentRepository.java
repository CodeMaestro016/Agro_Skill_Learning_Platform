package com.agro.demo.repository;

import com.agro.demo.model.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface CommentRepository extends MongoRepository<Comment, String> {
    List<Comment> findByPostIdOrderByCreatedAtDesc(String postId);
    List<Comment> findByUserId(String userId);
    void deleteByPostId(String postId);
    List<Comment> findByParentCommentIdOrderByCreatedAtDesc(String parentCommentId);
} 