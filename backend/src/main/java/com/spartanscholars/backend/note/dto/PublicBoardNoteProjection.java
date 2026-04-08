package com.spartanscholars.backend.note.dto;

import java.time.Instant;

public interface PublicBoardNoteProjection {

    Long getId();

    String getTitle();

    String getCategory();

    String getPreview();

    String getFileName();

    String getFileContentType();

    boolean getImported();

    boolean getPublishedToBoard();

    Long getOwnerId();

    String getAuthorName();

    Instant getCreatedAt();

    Instant getUpdatedAt();

    Instant getPublishedToBoardAt();
}
