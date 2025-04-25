package com.agro.demo.service;

import com.agro.demo.model.User;
import com.agro.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Find a user by their ID
    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    // Save a new user
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    // Update an existing user
    public User updateUser(User user) {
        return userRepository.save(user);
    }

    // Delete a user by their ID
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }
}



