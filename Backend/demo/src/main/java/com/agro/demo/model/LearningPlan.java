package com.agro.demo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

import java.util.List;
import java.util.ArrayList;

@Data
@Document(collection = "plans")
public class LearningPlan {
    @Id
    private String id;
    private String userId;
    private String title;
    private String description;
    private List<Step> steps;
    private List<Resource> resources;
    private String status;
    private int progress = 0;  // Default value

    // Inner classes for Step and Resource
    public static class Step {
        private String title;
        private String description;
        private String startDate;
        private String endDate;
        private String stepStatus = "not complete";  // Default value

        // Getters and Setters
        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getStartDate() {
            return startDate;
        }

        public void setStartDate(String startDate) {
            this.startDate = startDate;
        }

        public String getEndDate() {
            return endDate;
        }

        public void setEndDate(String endDate) {
            this.endDate = endDate;
        }

        public String getStepStatus() {
            return stepStatus;
        }

        public void setStepStatus(String stepStatus) {
            this.stepStatus = stepStatus;
        }
    }

    public static class Resource {
        private String name;
        private String link;

        // Getters and Setters
        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getLink() {
            return link;
        }

        public void setLink(String link) {
            this.link = link;
        }
    }
    
    // Constructors
    public LearningPlan() {
        this.steps = new ArrayList<>();
        this.resources = new ArrayList<>(); 
        this.description = null; 
        this.status = "not complete";
        this.progress = 0;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Step> getSteps() {
        return steps;
    }

    public void setSteps(List<Step> steps) {
        this.steps = steps;
    }

    public List<Resource> getResources() {
        return resources;
    }

    public void setResources(List<Resource> resources) {
        this.resources = resources;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getProgress() {
        return progress;
    }

    public void setProgress(int progress) {
        this.progress = progress;
    }
} 