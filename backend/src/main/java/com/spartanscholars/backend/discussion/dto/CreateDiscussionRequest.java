package com.spartanscholars.backend.discussion.dto;

public record CreateDiscussionRequest(
        String title,
        String description
) {
}
