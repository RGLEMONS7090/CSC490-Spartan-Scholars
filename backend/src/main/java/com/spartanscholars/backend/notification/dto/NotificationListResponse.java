package com.spartanscholars.backend.notification.dto;

import java.util.List;

public record NotificationListResponse(
        long unreadCount,
        List<NotificationItemResponse> notifications
) {
}
