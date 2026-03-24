package com.spartanscholars.backend.admin.dto;

import java.util.List;

public record AdminUserImplementationsResponse(
        Long id,
        String name,
        String email,
        List<AdminNoteResponse> notes,
        List<AdminQuizResponse> quizzes,
        List<AdminDiscussionResponse> discussions
) {
}
