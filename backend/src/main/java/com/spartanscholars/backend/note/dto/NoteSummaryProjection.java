package com.spartanscholars.backend.note.dto;

import java.time.Instant;

public interface NoteSummaryProjection {

    Long getId();

    String getTitle();

    String getCategory();

    String getPreview();

    String getFileName();

    Instant getUpdatedAt();
}
