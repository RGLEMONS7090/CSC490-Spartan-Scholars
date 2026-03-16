package com.spartanscholars.backend.quiz.dto;

import java.util.List;

public record CreateTestQuizRequest(
        String title,
        List<QuizQuestionRequest> questions
) {
}
