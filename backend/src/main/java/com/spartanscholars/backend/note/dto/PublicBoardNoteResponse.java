package com.spartanscholars.backend.note.dto;

import java.time.Instant;

public record PublicBoardNoteResponse(
        Long id,
        String title,
        String category,
        String description,
        String fileName,
        String fileContentType,
        boolean hasAttachment,
        boolean imported,
        boolean publishedToBoard,
        boolean ownedByCurrentUser,
        String authorName,
        Instant createdAt,
        Instant updatedAt,
        Instant publishedToBoardAt
) {
}
