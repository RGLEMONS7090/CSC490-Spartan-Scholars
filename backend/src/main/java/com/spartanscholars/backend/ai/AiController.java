package com.spartanscholars.backend.ai;

import com.spartanscholars.backend.ai.dto.AiChatRequest;
import com.spartanscholars.backend.ai.dto.AiChatResponse;
import com.spartanscholars.backend.ai.dto.DegreeAuditParseResponse;
import com.spartanscholars.backend.user.User;
import java.io.IOException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(
            org.springframework.security.core.Authentication authentication,
            @RequestBody AiChatRequest request
    ) {
        return ResponseEntity.ok(aiService.chat(authentication, request));
    }

    @PostMapping("/degree-audit")
    public ResponseEntity<DegreeAuditParseResponse> parseDegreeAudit(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        return ResponseEntity.ok(
                aiService.parseDegreeAudit(user, file.getOriginalFilename(), file.getBytes())
        );
    }
}
