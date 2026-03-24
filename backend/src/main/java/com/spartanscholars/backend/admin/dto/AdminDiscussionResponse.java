package com.spartanscholars.backend.admin.dto;

import java.time.Instant;

public record AdminDiscussionResponse(
        Long id,
        String title,
        String description,
        Instant updatedAt
) {
}
