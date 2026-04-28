package com.spartanscholars.backend.Todo.dto;

import java.time.Instant;
import java.time.LocalDate;

public record TodoResponse(
        Long id,
        String title,
        String description,
        LocalDate dueDate,
        boolean completed,
        String createdBy,
        Instant createdAt,
        Instant updatedAt
) {
}
