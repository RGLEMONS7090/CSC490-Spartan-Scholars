package com.spartanscholars.backend.studygroup.dto;

import java.util.List;

public record CreateStudyGroupShareRequest(
        List<Long> noteIds,
        List<Long> quizIds
) {
}
