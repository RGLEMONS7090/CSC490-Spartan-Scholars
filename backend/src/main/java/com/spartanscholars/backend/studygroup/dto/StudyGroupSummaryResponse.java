package com.spartanscholars.backend.studygroup.dto;

import java.time.Instant;

public record StudyGroupSummaryResponse(
        Long id,
        String name,
        String course,
        String description,
        String ownerName,
        long memberCount,
        boolean joined,
        Instant updatedAt
) {
}
