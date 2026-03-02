package com.spartanscholars.backend.auth.dto;

import com.spartanscholars.backend.user.Role;
import com.spartanscholars.backend.user.User;

public record AuthResponse(
        Long id,
        String name,
        String email,
        Role role
) {
    public static AuthResponse from(User user) {
        return new AuthResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }
}
