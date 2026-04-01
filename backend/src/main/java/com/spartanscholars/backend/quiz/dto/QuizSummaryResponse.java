package com.spartanscholars.backend.quiz.dto;

import com.spartanscholars.backend.quiz.QuizType;
import java.time.Instant;

public record QuizSummaryResponse(
        Long id,
        String title,
        QuizType type,
        int itemCount,
        boolean completed,
        boolean imported,
        Integer latestScore,
        Instant updatedAt
) {
}
