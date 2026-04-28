package com.spartanscholars.backend.discussion.dto;

import java.time.Instant;
import java.util.List;

public record CommentResponse(
        Long id,
        String authorName,
        String content,
        Instant createdAt,
        List<CommentResponse> replies
) {
}
