package com.spartanscholars.backend.note.dto;

public record NoteShareResponse(
        Long noteId,
        String title,
        String password
) {
}
