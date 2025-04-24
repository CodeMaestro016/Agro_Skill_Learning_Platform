package com.agro.demo.controller;

import com.agro.demo.model.Like;
import com.agro.demo.service.LikeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/likes")
public class LikeController {

    @Autowired
    private LikeService likeService;

    @PostMapping
    public Like addLike(@RequestBody Like like) {
        return likeService.addLike(like);
    }

    @DeleteMapping("/{postId}/{userId}")
    public void removeLike(@PathVariable String postId, @PathVariable String userId) {
        likeService.removeLike(postId, userId);
    }

    @GetMapping("/{postId}")
    public List<Like> getLikes(@PathVariable String postId) {
        return likeService.getLikesByPost(postId);
    }
}
