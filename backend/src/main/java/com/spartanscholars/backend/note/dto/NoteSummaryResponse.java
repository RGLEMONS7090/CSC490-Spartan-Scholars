package com.spartanscholars.backend.note.dto;

import java.time.Instant;

public record NoteSummaryResponse(
        Long id,
        String title,
        String category,
        String preview,
        String fileName,
        boolean hasAttachment,
        boolean imported,
        Instant updatedAt
) {
}
