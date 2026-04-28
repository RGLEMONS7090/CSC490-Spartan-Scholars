package com.spartanscholars.backend.admin.dto;

import com.spartanscholars.backend.quiz.QuizType;
import java.time.Instant;

public record AdminQuizResponse(
        Long id,
        String title,
        QuizType type,
        int itemCount,
        Instant updatedAt
) {
}
