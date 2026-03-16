package com.spartanscholars.backend.studygroup.dto;

import java.time.Instant;

public record StudyGroupMessageResponse(
        Long id,
        String authorName,
        String content,
        Instant createdAt,
        boolean mine
) {
}
