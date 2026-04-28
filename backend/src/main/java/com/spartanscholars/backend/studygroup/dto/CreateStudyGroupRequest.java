package com.spartanscholars.backend.studygroup.dto;

public record CreateStudyGroupRequest(
        String name,
        String course,
        String description,
        boolean privateGroup
) {
}
