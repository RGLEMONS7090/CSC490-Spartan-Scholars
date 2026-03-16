package com.spartanscholars.backend.ai.dto;

import com.spartanscholars.backend.quiz.dto.QuizQuestionRequest;
import java.util.List;

public record AiGeneratedTestQuizPayload(
        List<QuizQuestionRequest> questions
) {
}
