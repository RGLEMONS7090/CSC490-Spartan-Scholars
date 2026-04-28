package com.spartanscholars.backend.auth.dto;

import com.spartanscholars.backend.user.Role;
import com.spartanscholars.backend.user.User;

public record AuthResponse(
        Long id,
        String name,
        String email,
        Role role,
        String profileImage,
        String token
) {
    public static AuthResponse from(User user, String token) {
        return new AuthResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getProfileImage(),
                token
        );
    }
}
