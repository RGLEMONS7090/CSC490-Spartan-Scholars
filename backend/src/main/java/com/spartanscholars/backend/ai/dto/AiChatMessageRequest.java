package com.spartanscholars.backend.ai.dto;

public record AiChatMessageRequest(
        String role,
        String content
) {
}
