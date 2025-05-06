package com.agro.demo.model;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class PostDTO extends Post {
    private String userName;
    private String profilePhoto;

    public PostDTO(Post post, User user) {
        super();
        this.setId(post.getId());
        this.setUserId(post.getUserId());
        this.setContent(post.getContent());
        this.setCaption(post.getCaption());
        this.setImageUrls(post.getImageUrls());
        this.setVideoUrl(post.getVideoUrl());
        this.setCreatedAt(post.getCreatedAt());
        
        if (user != null) {
            this.userName = user.getFirstName() + " " + user.getLastName();
            this.profilePhoto = user.getProfilePhoto();
        }
    }
} 