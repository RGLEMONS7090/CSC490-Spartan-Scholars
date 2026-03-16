package com.spartanscholars.backend.quiz.dto;

import java.util.List;

public record QuizSubmissionRequest(
        List<String> answers
) {
}
