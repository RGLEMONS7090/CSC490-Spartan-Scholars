package com.spartanscholars.backend.user.dto;

public record ChangePasswordRequest(
        String currentPassword,
        String newPassword
) {
}
