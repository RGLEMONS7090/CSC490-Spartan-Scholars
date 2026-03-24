package com.spartanscholars.backend.admin.dto;

import java.time.Instant;

public record AdminNoteResponse(
        Long id,
        String title,
        String category,
        String preview,
        Instant updatedAt
) {
}
