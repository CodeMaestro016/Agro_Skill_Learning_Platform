package com.agro.demo.controller;

import com.agro.demo.model.User;
import com.agro.demo.repository.UserRepository;
import com.agro.demo.security.JwtUtil;
import com.agro.demo.service.CloudinaryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final CloudinaryService cloudinaryService;

    public UserController(UserRepository userRepository, JwtUtil jwtUtil, CloudinaryService cloudinaryService) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.cloudinaryService = cloudinaryService;
    }

    // 1. POST - Add user details
    @PostMapping("/addDetails")
    public ResponseEntity<?> addDetails(@RequestHeader("Authorization") String authHeader,
                                        @RequestBody Map<String, String> request) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.getEmailFromToken(token);

        logger.info("Adding user details for email: {}", email);

        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (!optionalUser.isPresent()) {
            logger.error("User not found for email: {}", email);
            return ResponseEntity.badRequest().body("User not found");
        }

        User user = optionalUser.get();

        user.setAbout(request.getOrDefault("about", user.getAbout()));
        user.setAddress(request.getOrDefault("address", user.getAddress()));
        user.setContactNumber(request.getOrDefault("contactNumber", user.getContactNumber()));
        user.setProfilePhoto(request.getOrDefault("profilePhoto", user.getProfilePhoto()));
        user.setCoverPhoto(request.getOrDefault("coverPhoto", user.getCoverPhoto()));

        userRepository.save(user);

        logger.info("User details added successfully for email: {}", email);
        return ResponseEntity.ok("Details added successfully");
    }

    // 2. PUT - Update user details
    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(
        @RequestHeader("Authorization") String authHeader,
        @RequestParam(value = "firstName", required = false) String firstName,
        @RequestParam(value = "lastName", required = false) String lastName,
        @RequestParam(value = "about", required = false) String about,
        @RequestParam(value = "address", required = false) String address,
        @RequestParam(value = "contactNumber", required = false) String contactNumber,
        @RequestParam(value = "profilePhoto", required = false) MultipartFile profilePhoto,
        @RequestParam(value = "coverPhoto", required = false) MultipartFile coverPhoto) {
        
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.getEmailFromToken(token);

        logger.info("Updating user profile for email: {}", email);

        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (!optionalUser.isPresent()) {
            logger.error("User not found for email: {}", email);
            return ResponseEntity.badRequest().body("User not found");
        }

        User user = optionalUser.get();

        try {
            // Update name fields
            if (firstName != null) user.setFirstName(firstName);
            if (lastName != null) user.setLastName(lastName);
            
            // Update other fields
            if (about != null) user.setAbout(about);
            if (address != null) user.setAddress(address);
            if (contactNumber != null) user.setContactNumber(contactNumber);

            // Handle profile photo upload
            if (profilePhoto != null && !profilePhoto.isEmpty()) {
                List<MultipartFile> files = Collections.singletonList(profilePhoto);
                List<String> urls = cloudinaryService.uploadImages(files);
                if (!urls.isEmpty()) {
                    user.setProfilePhoto(urls.get(0));
                }
            }

            // Handle cover photo upload
            if (coverPhoto != null && !coverPhoto.isEmpty()) {
                List<MultipartFile> files = Collections.singletonList(coverPhoto);
                List<String> urls = cloudinaryService.uploadImages(files);
                if (!urls.isEmpty()) {
                    user.setCoverPhoto(urls.get(0));
                }
            }

            userRepository.save(user);

            logger.info("User profile updated successfully");
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error updating user profile: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to update profile: " + e.getMessage());
        }
    }

    // 3. GET - Get current user details
    @GetMapping("/me")
    public ResponseEntity<?> getProfile(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.getEmailFromToken(token);

        logger.info("Fetching user profile for email: {}", email);

        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (!optionalUser.isPresent()) {
            logger.error("User not found for email: {}", email);
            return ResponseEntity.badRequest().body("User not found");
        }

        return ResponseEntity.ok(optionalUser.get());
    }

    // 4. DELETE - Delete current user
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteUser(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.getEmailFromToken(token);

        logger.info("Deleting user with email: {}", email);

        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (!optionalUser.isPresent()) {
            logger.error("User not found for deletion with email: {}", email);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        userRepository.delete(optionalUser.get());

        logger.info("User deleted successfully");
        return ResponseEntity.ok("User deleted successfully");
    }

    // 5. GET - Search users
    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam String query) {
        logger.info("Searching users with query: {}", query);
        
        // Log all users in database for debugging
        List<User> allUsers = userRepository.findAll();
        logger.info("Total users in database: {}", allUsers.size());
        allUsers.forEach(user -> logger.info("User: {} {} ({})", user.getFirstName(), user.getLastName(), user.getEmail()));
        
        // Search users by name, email, or about field
        List<User> users = userRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrAboutContainingIgnoreCase(
            query, query, query, query
        );
        
        logger.info("Found {} users matching query: {}", users.size(), query);
        users.forEach(user -> logger.info("Match: {} {} ({})", user.getFirstName(), user.getLastName(), user.getEmail()));
        
        return ResponseEntity.ok(users);
    }

    // 6. GET - Debug endpoint to list all users
    @GetMapping("/debug/all")
    public ResponseEntity<?> getAllUsers() {
        logger.info("Fetching all users for debugging");
        List<User> users = userRepository.findAll();
        logger.info("Found {} total users", users.size());
        return ResponseEntity.ok(users);
    }




@PostMapping("/follow/{targetUserId}")
public ResponseEntity<?> followUser(@RequestHeader("Authorization") String authHeader,
                                    @PathVariable String targetUserId) {
    String token = authHeader.replace("Bearer ", "");
    String email = jwtUtil.getEmailFromToken(token);

    Optional<User> optionalCurrentUser = userRepository.findByEmail(email);
    Optional<User> optionalTargetUser = userRepository.findById(targetUserId);

    if (!optionalCurrentUser.isPresent() || !optionalTargetUser.isPresent()) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
    }

    User currentUser = optionalCurrentUser.get();
    User targetUser = optionalTargetUser.get();

    currentUser.getFollowing().add(targetUserId);
    targetUser.getFollowers().add(currentUser.getId());

    userRepository.save(currentUser);
    userRepository.save(targetUser);

    return ResponseEntity.ok("Followed successfully");
}

@PostMapping("/unfollow/{targetUserId}")
public ResponseEntity<?> unfollowUser(@RequestHeader("Authorization") String authHeader,
                                      @PathVariable String targetUserId) {
    String token = authHeader.replace("Bearer ", "");
    String email = jwtUtil.getEmailFromToken(token);

    Optional<User> optionalCurrentUser = userRepository.findByEmail(email);
    Optional<User> optionalTargetUser = userRepository.findById(targetUserId);

    if (!optionalCurrentUser.isPresent() || !optionalTargetUser.isPresent()) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
    }

    User currentUser = optionalCurrentUser.get();
    User targetUser = optionalTargetUser.get();

    currentUser.getFollowing().remove(targetUserId);
    targetUser.getFollowers().remove(currentUser.getId());

    userRepository.save(currentUser);
    userRepository.save(targetUser);

    return ResponseEntity.ok("Unfollowed successfully");
}

}
