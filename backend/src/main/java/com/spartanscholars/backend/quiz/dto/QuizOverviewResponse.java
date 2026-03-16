package com.spartanscholars.backend.quiz.dto;

import java.util.List;

public record QuizOverviewResponse(
        int totalAvailable,
        long completedCount,
        Integer averageScore,
        List<QuizSummaryResponse> quizzes
) {
}
