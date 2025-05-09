package com.agro.demo.service;

import com.agro.demo.model.User;
import com.agro.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);
        return processOAuth2User(oAuth2UserRequest, oAuth2User);
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest oAuth2UserRequest, OAuth2User oAuth2User) {
        String provider = oAuth2UserRequest.getClientRegistration().getRegistrationId();
        String providerId = oAuth2User.getAttribute("sub"); // For Google
        
        // Handle different providers
        String email = oAuth2User.getAttribute("email");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");
        String imageUrl = oAuth2User.getAttribute("picture");

        // Special handling for Facebook
        if (provider.equals("facebook")) {
            providerId = oAuth2User.getAttribute("id");
            firstName = oAuth2User.getAttribute("first_name");
            lastName = oAuth2User.getAttribute("last_name");
            Map<String, Object> picture = oAuth2User.getAttribute("picture");
            if (picture != null && picture.containsKey("data")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) picture.get("data");
                imageUrl = (String) data.get("url");
            }
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;

        if (userOptional.isPresent()) {
            user = userOptional.get();
            // Check if user is trying to sign in with a different provider
            if (!user.getProvider().equals(provider)) {
                throw new OAuth2AuthenticationException("Email already registered with " + user.getProvider());
            }
            // Update existing user
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setImageUrl(imageUrl);
        } else {
            // Create new user - using the constructor that matches our User class
            user = new User(email, firstName, lastName, imageUrl, provider, providerId);
        }
        
        userRepository.save(user);
        return oAuth2User;
    }
} 