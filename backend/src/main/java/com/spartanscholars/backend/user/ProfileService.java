package com.spartanscholars.backend.user;

import com.spartanscholars.backend.user.dto.ProfileResponse;
import com.spartanscholars.backend.user.dto.UpdateProfileRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(User user, Authentication authentication) {
        return ProfileResponse.from(requireUser(user), isAdmin(authentication));
    }

    @Transactional
    public ProfileResponse updateProfile(User user, UpdateProfileRequest request) {
        User authenticated = requireUser(user);
        String displayName = sanitize(request.displayName());
        if (displayName == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Display name is required.");
        }

        authenticated.setName(displayName);
        return ProfileResponse.from(userRepository.save(authenticated), false);
    }

    @Transactional
    public void changePassword(User user, String currentPassword, String newPassword) {
        User authenticated = requireUser(user);
        String current = sanitize(currentPassword);
        String next = sanitize(newPassword);
        if (current == null || next == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current and new password are required.");
        }
        if (!passwordEncoder.matches(current, authenticated.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
        }
        if (next.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 8 characters.");
        }

        authenticated.setPassword(passwordEncoder.encode(next));
        userRepository.save(authenticated);
    }

    @Transactional
    public void deleteProfile(User user) {
        userRepository.delete(requireUser(user));
    }

    private User requireUser(User user) {
        if (user == null || user.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "You must be logged in.");
        }
        return user;
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null
                && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

    private String sanitize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    // To upload profile image
    @Transactional
    public ProfileResponse uploadProfileImage(User user, MultipartFile file){
        User authenticated = requireUser(user);

        if (file.isEmpty()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty.");
        }

        try {
            //Using absolute path instead of relative, because it will cause problems later
            String projectRoot = System.getProperty("user.dir");
            Path uploadPath = Paths.get(projectRoot, "uploads", "profile-images");

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // This is for relative path
            //Path uploadPath = Paths.get("uploads/profile-images");
            //if (!Files.exists(uploadPath)) {
                //Files.createDirectories(uploadPath);
            //}
    
            String oldImage = authenticated.getProfileImage();
            if (oldImage != null && oldImage.startsWith("/uploads/profile-images/")) {
                String oldFileName = oldImage.replace("/uploads/profile-images/", "");
                Path oldPath = uploadPath.resolve(oldFileName);
                //Path oldPath = Paths.get(oldImage.substring(1)); // remove leading "/"
                if (Files.exists(oldPath)) {
                    Files.delete(oldPath);
                }
            }

            // New image
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            //Update
            authenticated.setProfileImage("/uploads/profile-images/" + fileName);
            userRepository.save(authenticated);

            return ProfileResponse.from(authenticated);

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload image.");
        }
    }
}
