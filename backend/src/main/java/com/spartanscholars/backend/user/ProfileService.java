package com.spartanscholars.backend.user;

import com.spartanscholars.backend.user.dto.ProfileResponse;
import com.spartanscholars.backend.user.dto.UpdateProfileRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
}
