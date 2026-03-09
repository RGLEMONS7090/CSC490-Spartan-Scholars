package com.spartanscholars.backend.discussion.dto;

public record LikeResponse(
        boolean liked,
        long likeCount
) {
}
