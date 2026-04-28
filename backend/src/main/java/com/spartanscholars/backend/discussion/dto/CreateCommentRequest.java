package com.spartanscholars.backend.discussion.dto;

public record CreateCommentRequest(
        String content,
        Long parentId
) {
}
