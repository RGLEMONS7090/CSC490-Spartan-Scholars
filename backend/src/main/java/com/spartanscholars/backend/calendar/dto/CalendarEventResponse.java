package com.spartanscholars.backend.calendar.dto;

import java.time.Instant;
import java.time.LocalDate;

public record CalendarEventResponse(
        Long id,
        String title,
        String description,
        LocalDate eventDate,
        String createdBy,
        Instant createdAt,
        Instant updatedAt
) {
}
