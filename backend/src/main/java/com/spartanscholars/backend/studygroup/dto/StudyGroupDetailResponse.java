package com.spartanscholars.backend.studygroup.dto;

import java.util.List;

public record StudyGroupDetailResponse(
        Long id,
        String name,
        String course,
        String description,
        String ownerName,
        boolean owner,
        long memberCount,
        boolean joined,
        List<StudyGroupMessageResponse> messages,
        List<StudyGroupSharedItemResponse> sharedItems
) {
}
