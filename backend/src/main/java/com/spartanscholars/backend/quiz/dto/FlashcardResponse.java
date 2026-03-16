package com.spartanscholars.backend.quiz.dto;

public record FlashcardResponse(
        Long id,
        String front,
        String back
) {
}
