package com.spartanscholars.backend.quiz.dto;

public record GenerateAiStudyMaterialRequest(
        String mainTopic,
        String classLevel,
        String topicsToCover,
        Integer itemCount
) {
}
