package com.agro.demo.repository;

import com.agro.demo.model.LearningPlan;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface LearningPlanRepository extends MongoRepository<LearningPlan, String> {

    // Find all plans by user ID
    List<LearningPlan> findByUserId(String userId);

    // Find a specific plan by ID and user ID (for extra security)
    Optional<LearningPlan> findByIdAndUserId(String id, String userId);

    // Delete a learning plan by ID and user ID
    void deleteByIdAndUserId(String id, String userId);

    // Count learning plans for a specific user
    long countByUserId(String userId);
}
