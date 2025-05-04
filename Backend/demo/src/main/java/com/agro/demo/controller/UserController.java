package com.agro.demo.controller;

import com.agro.demo.model.User;
import com.agro.demo.repository.UserRepository;
import com.agro.demo.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

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

    public UserController(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
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
    public ResponseEntity<?> updateProfile(@RequestHeader("Authorization") String authHeader,
                                           @RequestBody Map<String, String> request) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.getEmailFromToken(token);

        logger.info("Updating user profile for email: {}", email);

        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (!optionalUser.isPresent()) {
            logger.error("User not found for email: {}", email);
            return ResponseEntity.badRequest().body("User not found");
        }

        User user = optionalUser.get();

        // Update name fields
        user.setFirstName(request.getOrDefault("firstName", user.getFirstName()));
        user.setLastName(request.getOrDefault("lastName", user.getLastName()));
        
        // Update other fields
        user.setAbout(request.getOrDefault("about", user.getAbout()));
        user.setAddress(request.getOrDefault("address", user.getAddress()));
        user.setContactNumber(request.getOrDefault("contactNumber", user.getContactNumber()));
        user.setProfilePhoto(request.getOrDefault("profilePhoto", user.getProfilePhoto()));
        user.setCoverPhoto(request.getOrDefault("coverPhoto", user.getCoverPhoto()));
        user.setImageUrl(request.getOrDefault("imageUrl", user.getImageUrl()));

        userRepository.save(user);

        logger.info("User profile updated successfully");
        return ResponseEntity.ok(user);
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
}
