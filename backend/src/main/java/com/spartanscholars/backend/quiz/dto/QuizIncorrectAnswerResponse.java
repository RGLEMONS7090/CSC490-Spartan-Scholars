package com.spartanscholars.backend.quiz.dto;

public record QuizIncorrectAnswerResponse(
        int questionNumber,
        String prompt,
        String submittedAnswer,
        String correctAnswer
) {
}
