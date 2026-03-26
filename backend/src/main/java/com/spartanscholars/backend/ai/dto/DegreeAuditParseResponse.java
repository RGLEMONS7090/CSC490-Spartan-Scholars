package com.spartanscholars.backend.ai.dto;

import java.util.List;

public record DegreeAuditParseResponse(
        String university,
        String degreeName,
        String major,
        String concentration,
        String minor,
        List<String> completedCourses,
        List<String> inProgressCourses,
        List<String> remainingCourses,
        List<String> remainingRequirements,
        List<DegreeAuditRequirementGroup> remainingRequirementGroups,
        String summary
) {
}
