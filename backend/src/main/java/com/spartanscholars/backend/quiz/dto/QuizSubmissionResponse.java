package com.spartanscholars.backend.quiz.dto;

public record QuizSubmissionResponse(
        int score,
        int totalQuestions,
        int correctAnswers
) {
}
