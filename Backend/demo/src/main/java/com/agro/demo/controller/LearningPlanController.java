package com.agro.demo.controller;

import com.agro.demo.model.LearningPlan;
import com.agro.demo.service.LearningPlanService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/learning-plan")
@CrossOrigin(origins = "*")
public class LearningPlanController {
    
    private static final Logger logger = LoggerFactory.getLogger(LearningPlanController.class);
    private final LearningPlanService learningPlanService;

    public LearningPlanController(LearningPlanService learningPlanService) {
        this.learningPlanService = learningPlanService;
    }
    
    //  Create a new learning plan
    @PostMapping
    public ResponseEntity<?> createPlan(@RequestBody LearningPlan plan) {
        logger.info("Received request to create a learning plan.");
        logger.info("Incoming Data: {}", plan);

        try {
            if (plan.getUserId() == null || plan.getUserId().trim().isEmpty()) {
                logger.error("Error: User ID is missing.");
                return ResponseEntity.badRequest().body("User ID is required");
            }

            if (plan.getTitle() == null || plan.getTitle().trim().isEmpty()) {
                logger.error("Error: Title is missing.");
                return ResponseEntity.badRequest().body("Title is required");
            }

            LearningPlan createdPlan = learningPlanService.createPlan(plan);
            return ResponseEntity.ok(createdPlan);
        } catch (Exception e) {
            logger.error("Exception: Error creating learning plan", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to create learning plan: " + e.getMessage());
        }
    }

    // Get all learning plans for a specific user
    @GetMapping
    public ResponseEntity<?> getAllPlans(@RequestParam String userId) {
        logger.info("in controller get method", userId);
       
        if (userId == null || userId.trim().isEmpty()) {
            logger.error("Error: User ID is missing.");
            return ResponseEntity.badRequest().body("User ID is required");
        }
    
        List<LearningPlan> userPlans = learningPlanService.getPlansByUserId(userId);
    
        // Log the plans that are being returned
        logger.info("Plans retrieved: {}", userPlans);
    
        return ResponseEntity.ok(userPlans);
    }
    

    // Get a learning plan by ID (only for a specific user)
    @GetMapping("/{id}")
    public ResponseEntity<?> getPlanById(@PathVariable String id, @RequestParam String userId) {
        logger.info("Fetching learning plan with ID: {} for user: {}", id, userId);

        if (userId == null || userId.trim().isEmpty()) {
            logger.error("Error: User ID is missing.");
            return ResponseEntity.badRequest().body("User ID is required");
        }

        try {
            LearningPlan plan = learningPlanService.getPlanById(id);
            
            if (plan == null || !plan.getUserId().equals(userId)) {
                logger.error("Error: Plan not found or does not belong to the user.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Plan not found or unauthorized");
            }
            
            return ResponseEntity.ok(plan);
        } catch (Exception e) {
            logger.error("Error fetching plan: ", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Plan not found");
        }
    }

    // Update a learning plan (only for a specific user)
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePlan(@PathVariable String id, @RequestParam String userId, @RequestBody LearningPlan updatedPlan) {
        logger.info(" Updating plan with ID: {} for user: {}", id, userId);

        if (userId == null || userId.trim().isEmpty()) {
            logger.error("Error: User ID is missing.");
            return ResponseEntity.badRequest().body("User ID is required");
        }

        try {
            LearningPlan plan = learningPlanService.getPlanById(id);

            if (plan == null || !plan.getUserId().equals(userId)) {
                logger.error(" Error: Plan not found or unauthorized.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Plan not found or unauthorized");
            }

            LearningPlan updated = learningPlanService.updateLearningPlan(id, updatedPlan);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("Error updating plan: ", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Failed to update: " + e.getMessage());
        }
    }

    // Update step status
    @PutMapping("/{id}/steps/{stepIndex}")
    public ResponseEntity<?> updateStepStatus(
            @PathVariable String id,
            @PathVariable int stepIndex,
            @RequestParam String userId,
            @RequestBody Map<String, String> request) {
        logger.info("Updating step status for plan ID: {}, step index: {}", id, stepIndex);

        if (userId == null || userId.trim().isEmpty()) {
            logger.error("Error: User ID is missing.");
            return ResponseEntity.badRequest().body("User ID is required");
        }

        String newStatus = request.get("status");
        if (newStatus == null || newStatus.trim().isEmpty()) {
            logger.error("Error: Status is missing.");
            return ResponseEntity.badRequest().body("Status is required");
        }

        try {
            LearningPlan plan = learningPlanService.getPlanById(id);

            if (plan == null || !plan.getUserId().equals(userId)) {
                logger.error("Error: Plan not found or unauthorized.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Plan not found or unauthorized");
            }

            LearningPlan updated = learningPlanService.updateStepStatus(id, stepIndex, newStatus);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("Error updating step status: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update step status: " + e.getMessage());
        }
    }

    //  Delete a learning plan (only for a specific user)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePlan(@PathVariable String id, @RequestParam String userId) {
        logger.info(" Deleting plan with ID: {} for user: {}", id, userId);

        if (userId == null || userId.trim().isEmpty()) {
            logger.error("Error: User ID is missing.");
            return ResponseEntity.badRequest().body("User ID is required");
        }

        try {
            LearningPlan plan = learningPlanService.getPlanById(id);

            if (plan == null || !plan.getUserId().equals(userId)) {
                logger.error("Error: Plan not found or unauthorized.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Plan not found or unauthorized");
            }

            boolean deleted = learningPlanService.deleteLearningPlan(id);
            if (deleted) {
                return ResponseEntity.ok("Plan deleted successfully");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Plan not found");
            }
        } catch (Exception e) {
            logger.error("Error deleting plan: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting plan");
        }
    }

    // Test API connection
    @GetMapping("/test")
    public ResponseEntity<String> testConnection() {
        logger.info("Test endpoint called");
        return ResponseEntity.ok("Connection successful");
    }
}
