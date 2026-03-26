package com.spartanscholars.backend.ai.dto;

import java.util.List;

public record DegreeAuditRequirementGroup(
        String label,
        String requirementType,
        int countNeeded,
        String creditsNeeded,
        List<String> options
) {
}
