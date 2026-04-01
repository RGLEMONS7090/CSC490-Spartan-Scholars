package com.spartanscholars.backend.notification.dto;

import java.time.Instant;

public record NotificationItemResponse(
        Long id,
        String title,
        String message,
        String href,
        boolean read,
        Instant createdAt
) {
}
