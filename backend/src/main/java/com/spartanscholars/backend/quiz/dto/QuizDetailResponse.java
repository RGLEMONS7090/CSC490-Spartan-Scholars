package com.spartanscholars.backend.quiz.dto;

import com.spartanscholars.backend.quiz.QuizType;
import java.util.List;

public record QuizDetailResponse(
        Long id,
        String title,
        QuizType type,
        List<QuizQuestionResponse> questions,
        List<FlashcardResponse> cards
) {
}
