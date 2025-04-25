package com.agro.demo.service;

import com.agro.demo.model.LearningPlan;
import com.agro.demo.repository.LearningPlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.ArrayList;

@Service
public class LearningPlanService {
    private static final Logger logger = LoggerFactory.getLogger(LearningPlanService.class);

    @Autowired
    private LearningPlanRepository learningPlanRepository;

    // Create a new learning plan
    public LearningPlan createPlan(LearningPlan plan) {
        try {
            logger.info("Service: Creating learning plan for user: {}", plan.getUserId());

            // Handle null values and set default values
            if (plan.getSteps() == null) {
                logger.warn("Steps list is null, initializing empty list");
                plan.setSteps(new ArrayList<>());
            }

            if (plan.getResources() == null) {
                logger.warn("Resources list is null, initializing empty list");
                plan.setResources(new ArrayList<>());
            }

            if (plan.getStatus() == null) {
                plan.setStatus("active");
            }

            if (plan.getTitle() == null || plan.getTitle().trim().isEmpty()) {
                logger.error("Plan title is missing");
                throw new IllegalArgumentException("Plan title is required");
            }

            logger.info(" Saving learning plan to database");
            LearningPlan savedPlan = learningPlanRepository.save(plan);
            logger.info(" Successfully saved learning plan with ID: {}", savedPlan.getId());

            return savedPlan;
        } catch (Exception e) {
            logger.error(" Error in createPlan: ", e);
            throw new RuntimeException("Failed to save plan: " + e.getMessage());
        }
    }

    // Get all learning plans for a specific user
    public List<LearningPlan> getPlansByUserId(String userId) {
        try {
            logger.info(" Fetching learning plans for user: {}", userId);
            List<LearningPlan> plans = learningPlanRepository.findByUserId(userId);
            logger.info("Found {} plans for user {}", plans.size(), userId);
            return plans;
        } catch (Exception e) {
            logger.error(" Error fetching user plans: ", e);
            throw e;
        }
    }

    // Get a single learning plan by ID
    public LearningPlan getPlanById(String id) {
        logger.info("🔍 Fetching learning plan with ID: {}", id);
        return learningPlanRepository.findById(id).orElseThrow(() -> new RuntimeException("Plan not found"));
    }

    // Update a learning plan
    public LearningPlan updateLearningPlan(String id, LearningPlan updatedPlan) {
        logger.info(" Updating learning plan with ID: {}", id);
        return learningPlanRepository.findById(id).map(plan -> {
            plan.setTitle(updatedPlan.getTitle());
            plan.setDescription(updatedPlan.getDescription());
            plan.setSteps(updatedPlan.getSteps());
            plan.setResources(updatedPlan.getResources());
            plan.setStatus(updatedPlan.getStatus());
            plan.setProgress(updatedPlan.getProgress());
            LearningPlan savedPlan = learningPlanRepository.save(plan);
            logger.info(" Successfully updated learning plan with ID: {}", savedPlan.getId());
            return savedPlan;
        }).orElseThrow(() -> new RuntimeException("Plan not found"));
    }

    //  Update step status and recalculate progress
    public LearningPlan updateStepStatus(String planId, int stepIndex, String newStatus) {
        logger.info("Updating step status for plan ID: {}, step index: {}", planId, stepIndex);
        return learningPlanRepository.findById(planId).map(plan -> {
            List<LearningPlan.Step> steps = plan.getSteps();
            if (stepIndex >= 0 && stepIndex < steps.size()) {
                steps.get(stepIndex).setStepStatus(newStatus);
                plan.setSteps(steps);
                
                // Recalculate progress
                int completedSteps = (int) steps.stream()
                    .filter(step -> "complete".equals(step.getStepStatus()))
                    .count();
                int totalSteps = steps.size();
                int newProgress = totalSteps > 0 ? (completedSteps * 100) / totalSteps : 0;
                plan.setProgress(newProgress);
                
                LearningPlan savedPlan = learningPlanRepository.save(plan);
                logger.info("Successfully updated step status and progress for plan ID: {}", savedPlan.getId());
                return savedPlan;
            } else {
                throw new RuntimeException("Invalid step index");
            }
        }).orElseThrow(() -> new RuntimeException("Plan not found"));
    }

    //  Delete a learning plan
    public boolean deleteLearningPlan(String id) {
        logger.info("Deleting learning plan with ID: {}", id);
        if (learningPlanRepository.existsById(id)) {
            learningPlanRepository.deleteById(id);
            logger.info("Plan deleted successfully");
            return true;
        } else {
            logger.warn("Plan with ID {} not found", id);
            return false;
        }
    }
}
