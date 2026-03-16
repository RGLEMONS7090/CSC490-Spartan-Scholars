package com.spartanscholars.backend.quiz.dto;

import java.util.List;

public record CreateFlashcardQuizRequest(
        String title,
        List<FlashcardRequest> cards
) {
}
