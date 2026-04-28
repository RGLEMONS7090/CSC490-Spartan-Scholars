package com.spartanscholars.backend.quiz.dto;

import java.util.List;

public record QuizQuestionRequest(
        String prompt,
        boolean writtenResponse,
        List<String> options,
        String correctAnswer
) {
}
