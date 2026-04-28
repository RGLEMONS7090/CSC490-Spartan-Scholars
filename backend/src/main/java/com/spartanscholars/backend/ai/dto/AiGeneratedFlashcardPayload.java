package com.spartanscholars.backend.ai.dto;

import com.spartanscholars.backend.quiz.dto.FlashcardRequest;
import java.util.List;

public record AiGeneratedFlashcardPayload(
        List<FlashcardRequest> cards
) {
}
