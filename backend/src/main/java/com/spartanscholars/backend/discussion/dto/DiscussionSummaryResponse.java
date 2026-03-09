package com.spartanscholars.backend.discussion.dto;

import java.time.Instant;

public record DiscussionSummaryResponse(
        Long id,
        String title,
        String description,
        String authorName,
        long likeCount,
        long commentCount,
        boolean likedByCurrentUser,
        Instant createdAt,
        Instant updatedAt
) {
}
