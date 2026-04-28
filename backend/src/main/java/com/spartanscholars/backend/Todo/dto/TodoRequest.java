package com.spartanscholars.backend.Todo.dto;

import java.time.LocalDate;

public record TodoRequest(
        String title,
        String description,
        LocalDate dueDate,
        Boolean completed,
        String createdBy
) {
}
