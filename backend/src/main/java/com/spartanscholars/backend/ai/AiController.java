package com.spartanscholars.backend.ai;

import com.spartanscholars.backend.ai.dto.AiChatRequest;
import com.spartanscholars.backend.ai.dto.AiChatResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(
            Authentication authentication,
            @RequestBody AiChatRequest request
    ) {
        return ResponseEntity.ok(aiService.chat(authentication, request));
    }
}
