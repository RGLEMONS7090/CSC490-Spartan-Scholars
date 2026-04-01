package com.spartanscholars.backend.studygroup.dto;

import com.spartanscholars.backend.studygroup.StudyGroupSharedItemType;
import java.time.Instant;

public record StudyGroupSharedItemResponse(
        Long id,
        StudyGroupSharedItemType itemType,
        Long sourceItemId,
        String title,
        String sharedByName,
        Instant createdAt
) {
}
