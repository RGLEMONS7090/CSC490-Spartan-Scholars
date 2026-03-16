package com.spartanscholars.backend.quiz.dto;

import java.util.List;

public record QuizSubmissionResponse(
        int score,
        int totalQuestions,
        int correctAnswers,
        List<QuizIncorrectAnswerResponse> incorrectAnswers
) {
}
