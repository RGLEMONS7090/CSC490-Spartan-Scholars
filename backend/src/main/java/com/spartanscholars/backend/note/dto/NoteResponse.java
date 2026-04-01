package com.spartanscholars.backend.note.dto;

import java.time.Instant;

public record NoteResponse(
        Long id,
        String title,
        String category,
        String content,
        String fileName,
        String fileContentType,
        boolean hasAttachment,
        boolean imported,
        Instant createdAt,
        Instant updatedAt
) {
}
