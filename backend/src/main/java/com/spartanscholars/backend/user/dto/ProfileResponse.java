package com.spartanscholars.backend.user.dto;

import com.spartanscholars.backend.user.User;

public record ProfileResponse(
        Long id,
        String name,
        String email,
        String role,
        boolean adminMode
) {
    public static ProfileResponse from(User user, boolean adminMode) {
        return new ProfileResponse(user.getId(), user.getName(), user.getEmail(), user.getRole().name(), adminMode);
    }
}
