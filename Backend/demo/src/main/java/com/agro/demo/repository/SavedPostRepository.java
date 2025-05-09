package com.agro.demo.repository;

import com.agro.demo.model.SavedPost;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface SavedPostRepository extends MongoRepository<SavedPost, String> {
    List<SavedPost> findByUserId(String userId);
    SavedPost findByUserIdAndPostId(String userId, String postId);
    void deleteByUserIdAndPostId(String userId, String postId);
} 