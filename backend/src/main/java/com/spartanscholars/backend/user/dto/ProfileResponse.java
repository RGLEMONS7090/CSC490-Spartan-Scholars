package com.spartanscholars.backend.user.dto;

import com.spartanscholars.backend.user.User;

public record ProfileResponse(
        Long id,
        String name,
        String email
) {
    public static ProfileResponse from(User user) {
        return new ProfileResponse(user.getId(), user.getName(), user.getEmail());
    }
}
