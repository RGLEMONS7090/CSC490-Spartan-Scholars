package com.spartanscholars.backend.quiz.dto;

import com.spartanscholars.backend.quiz.QuestionType;
import java.util.List;

public record QuizQuestionResponse(
        Long id,
        String prompt,
        QuestionType responseType,
        List<String> options
) {
}
