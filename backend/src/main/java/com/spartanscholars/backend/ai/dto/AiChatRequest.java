package com.spartanscholars.backend.ai.dto;

import java.util.List;

public record AiChatRequest(
        String message,
        List<AiChatMessageRequest> history
) {
}
