package com.agro.demo.repository;

import com.agro.demo.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PostRepository extends MongoRepository<Post, String> {
    List<Post> findByUserId(String userId);
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
