package com.spartanscholars.backend.calendar.dto;

import java.time.LocalDate;

public record CalendarEventRequest(
        String title,
        String description,
        LocalDate eventDate,
        String createdBy
) {
}
