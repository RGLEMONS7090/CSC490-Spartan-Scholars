package com.spartanscholars.backend.admin.dto;

public record AdminUserSummaryResponse(
        Long id,
        String name,
        String email,
        long noteCount,
        long quizCount,
        long discussionCount
) {
}
