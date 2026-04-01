package com.spartanscholars.backend.quiz.dto;

public record QuizShareResponse(
        Long quizId,
        String title,
        String password
) {
}
