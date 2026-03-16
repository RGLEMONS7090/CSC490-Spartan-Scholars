package com.spartanscholars.backend.ai;

import com.spartanscholars.backend.ai.dto.AiGeneratedFlashcardPayload;
import com.spartanscholars.backend.ai.dto.AiGeneratedTestQuizPayload;
import com.spartanscholars.backend.ai.dto.AiChatMessageRequest;
import com.spartanscholars.backend.ai.dto.AiChatRequest;
import com.spartanscholars.backend.ai.dto.AiChatResponse;
import com.spartanscholars.backend.quiz.dto.CreateFlashcardQuizRequest;
import com.spartanscholars.backend.quiz.dto.CreateTestQuizRequest;
import com.spartanscholars.backend.user.User;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class AiService {

    private static final String SCHOOL_ASSISTANT_INSTRUCTIONS = """
            You are Spartan Scholars AI, a study assistant for students.
            Only help with school-related topics such as homework, studying, class concepts, academic writing, research, note-taking, quizzes, flashcards, and exam preparation.
            If a user asks for something unrelated to school or learning, politely refuse and redirect them to a school-related question.
            Keep answers clear, practical, and appropriate for students.
            Do not claim certainty when you are unsure.
            """;
    private static final String NOTE_ENHANCEMENT_INSTRUCTIONS = """
            You are Spartan Scholars AI, a study assistant for students.
            Rewrite and organize the provided school notes into a cleaner study resource.
            Keep the response strictly focused on the note content.
            Preserve the important facts and meaning from the original notes.
            Improve clarity, structure, grammar, and readability.
            Use concise headings and bullet points when helpful.
            Briefly explain important terms or ideas so a student can study from the notes.
            Do not invent facts that are not supported by the original notes.
            Return only the enhanced notes text, with no intro or outro.
            """;
    private static final String TEST_QUIZ_GENERATION_INSTRUCTIONS = """
            You are Spartan Scholars AI, a study assistant for students.
            Create a student-friendly multiple choice study quiz from the requested topic details.
            Every question must be academically relevant to the requested topic and class level.
            Cover the requested subtopics as evenly as possible.
            Write exactly four answer options for every question.
            Set writtenResponse to false for every question.
            Make sure correctAnswer exactly matches one of the listed options.
            Keep the difficulty appropriate for the requested class level.
            Return only valid JSON matching the provided schema.
            """;
    private static final String FLASHCARD_GENERATION_INSTRUCTIONS = """
            You are Spartan Scholars AI, a study assistant for students.
            Create concise, useful study flashcards from the requested topic details.
            Every card front should be a term, concept, process, or question prompt.
            Every card back should clearly explain or define that front in student-friendly language.
            Cover the requested subtopics as evenly as possible.
            Keep the difficulty appropriate for the requested class level.
            Return only valid JSON matching the provided schema.
            """;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String model;
    private final String apiKey;

    public AiService(
            ObjectMapper objectMapper,
            @Value("${openai.base-url:https://api.openai.com/v1}") String baseUrl,
            @Value("${openai.model:${OPENAI_MODEL:gpt-5-mini}}") String model,
            @Value("${openai.api-key:${OPENAI_API_KEY:}}") String apiKey
    ) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.model = model;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
    }

    @Transactional(readOnly = true)
    public AiChatResponse chat(Authentication authentication, AiChatRequest request) {
        requireUser(authentication);
        if (apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "OpenAI API key is not configured.");
        }

        String userMessage = sanitize(request.message());
        if (userMessage == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message is required.");
        }

        List<Map<String, Object>> input = new ArrayList<>();
        List<AiChatMessageRequest> history = request.history() == null ? List.of() : request.history();
        int start = Math.max(0, history.size() - 10);
        for (int i = start; i < history.size(); i++) {
            AiChatMessageRequest entry = history.get(i);
            String role = normalizeRole(entry.role());
            String content = sanitize(entry.content());
            if (role != null && content != null) {
                input.add(Map.of("role", role, "content", content));
            }
        }
        input.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> payload = Map.of(
                "model", model,
                "instructions", SCHOOL_ASSISTANT_INSTRUCTIONS,
                "input", input,
                "max_output_tokens", 700
        );

        JsonNode responseBody = executeResponseRequest(payload);

        String reply = extractReply(responseBody);
        if (reply == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "OpenAI returned an empty response.");
        }
        return new AiChatResponse(reply);
    }

    @Transactional(readOnly = true)
    public String enhanceNote(User user, String title, String category, String content) {
        if (user == null || user.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "You must be logged in.");
        }
        if (apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "OpenAI API key is not configured.");
        }

        String sanitizedContent = sanitize(content);
        if (sanitizedContent == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This note has no content to enhance.");
        }

        StringBuilder prompt = new StringBuilder();
        if (sanitize(title) != null) {
            prompt.append("Title: ").append(title.trim()).append("\n");
        }
        if (sanitize(category) != null) {
            prompt.append("Category: ").append(category.trim()).append("\n");
        }
        prompt.append("\nOriginal notes:\n").append(sanitizedContent);

        Map<String, Object> payload = Map.of(
                "model", model,
                "instructions", NOTE_ENHANCEMENT_INSTRUCTIONS,
                "input", List.of(Map.of("role", "user", "content", prompt.toString())),
                "max_output_tokens", 1800
        );

        JsonNode responseBody = executeResponseRequest(payload);
        String enhanced = extractReply(responseBody);
        if (enhanced == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "OpenAI returned an empty response.");
        }
        return enhanced;
    }

    @Transactional(readOnly = true)
    public CreateTestQuizRequest generateTestQuiz(
            User user,
            String mainTopic,
            String classLevel,
            String topicsToCover,
            int itemCount
    ) {
        requireAuthenticatedUser(user);
        ensureApiKeyConfigured();

        String prompt = buildStudyMaterialPrompt(mainTopic, classLevel, topicsToCover, itemCount, "multiple choice quiz");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        payload.put("instructions", TEST_QUIZ_GENERATION_INSTRUCTIONS);
        payload.put("input", List.of(Map.of("role", "user", "content", prompt)));
        payload.put("max_output_tokens", 2200);
        payload.put("text", Map.of("format", buildTestQuizFormat()));

        JsonNode responseBody = executeResponseRequest(payload);
        String json = extractReply(responseBody);
        if (json == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "OpenAI returned an empty response.");
        }

        try {
            AiGeneratedTestQuizPayload generated = objectMapper.readValue(json, AiGeneratedTestQuizPayload.class);
            return new CreateTestQuizRequest(defaultGeneratedTitle(mainTopic, "Quiz"), generated.questions());
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "OpenAI returned invalid quiz data.");
        }
    }

    @Transactional(readOnly = true)
    public CreateFlashcardQuizRequest generateFlashcards(
            User user,
            String mainTopic,
            String classLevel,
            String topicsToCover,
            int itemCount
    ) {
        requireAuthenticatedUser(user);
        ensureApiKeyConfigured();

        String prompt = buildStudyMaterialPrompt(mainTopic, classLevel, topicsToCover, itemCount, "flashcard deck");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        payload.put("instructions", FLASHCARD_GENERATION_INSTRUCTIONS);
        payload.put("input", List.of(Map.of("role", "user", "content", prompt)));
        payload.put("max_output_tokens", 1800);
        payload.put("text", Map.of("format", buildFlashcardFormat()));

        JsonNode responseBody = executeResponseRequest(payload);
        String json = extractReply(responseBody);
        if (json == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "OpenAI returned an empty response.");
        }

        try {
            AiGeneratedFlashcardPayload generated = objectMapper.readValue(json, AiGeneratedFlashcardPayload.class);
            return new CreateFlashcardQuizRequest(defaultGeneratedTitle(mainTopic, "Flashcards"), generated.cards());
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "OpenAI returned invalid flashcard data.");
        }
    }

    private JsonNode executeResponseRequest(Map<String, Object> payload) {
        try {
            return restClient.post()
                    .uri("/responses")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            String message = sanitize(exception.getResponseBodyAsString());
            if (message == null) {
                message = "OpenAI request failed with status " + exception.getStatusCode().value() + ".";
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, message);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to contact OpenAI.");
        }
    }

    private String buildStudyMaterialPrompt(
            String mainTopic,
            String classLevel,
            String topicsToCover,
            int itemCount,
            String activityType
    ) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Main topic: ").append(mainTopic).append("\n");
        prompt.append("Class level: ").append(classLevel).append("\n");
        prompt.append("Topics to cover: ").append(topicsToCover).append("\n");
        prompt.append("Number requested: ").append(itemCount).append("\n");
        prompt.append("Activity type: ").append(activityType);
        return prompt.toString();
    }

    private Map<String, Object> buildTestQuizFormat() {
        Map<String, Object> questionSchema = new LinkedHashMap<>();
        questionSchema.put("type", "object");
        questionSchema.put("additionalProperties", false);
        questionSchema.put("properties", Map.of(
                "prompt", Map.of("type", "string"),
                "writtenResponse", Map.of("type", "boolean"),
                "options", Map.of(
                        "type", "array",
                        "items", Map.of("type", "string"),
                        "minItems", 4,
                        "maxItems", 4
                ),
                "correctAnswer", Map.of("type", "string")
        ));
        questionSchema.put("required", List.of("prompt", "writtenResponse", "options", "correctAnswer"));

        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("additionalProperties", false);
        schema.put("properties", Map.of(
                "questions", Map.of(
                        "type", "array",
                        "items", questionSchema,
                        "minItems", 1
                )
        ));
        schema.put("required", List.of("questions"));

        return Map.of(
                "type", "json_schema",
                "name", "generated_test_quiz",
                "strict", true,
                "schema", schema
        );
    }

    private Map<String, Object> buildFlashcardFormat() {
        Map<String, Object> cardSchema = new LinkedHashMap<>();
        cardSchema.put("type", "object");
        cardSchema.put("additionalProperties", false);
        cardSchema.put("properties", Map.of(
                "front", Map.of("type", "string"),
                "back", Map.of("type", "string")
        ));
        cardSchema.put("required", List.of("front", "back"));

        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("additionalProperties", false);
        schema.put("properties", Map.of(
                "cards", Map.of(
                        "type", "array",
                        "items", cardSchema,
                        "minItems", 1
                )
        ));
        schema.put("required", List.of("cards"));

        return Map.of(
                "type", "json_schema",
                "name", "generated_flashcard_deck",
                "strict", true,
                "schema", schema
        );
    }

    private String defaultGeneratedTitle(String mainTopic, String suffix) {
        String topic = sanitize(mainTopic);
        return topic == null ? "AI " + suffix : topic + " " + suffix;
    }

    private void ensureApiKeyConfigured() {
        if (apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "OpenAI API key is not configured.");
        }
    }

    private User requireAuthenticatedUser(User user) {
        if (user == null || user.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "You must be logged in.");
        }
        return user;
    }

    private String extractReply(JsonNode responseBody) {
        if (responseBody == null) {
            return null;
        }

        JsonNode output = responseBody.path("output");
        if (output.isArray()) {
            for (JsonNode item : output) {
                if (!"message".equals(item.path("type").asText())) {
                    continue;
                }
                JsonNode content = item.path("content");
                if (!content.isArray()) {
                    continue;
                }
                for (JsonNode part : content) {
                    String text = sanitize(part.path("text").asText(null));
                    if (text != null) {
                        return text;
                    }
                }
            }
        }

        return sanitize(responseBody.path("output_text").asText(null));
    }

    private User requireUser(Authentication authentication) {
        Object principal = authentication == null ? null : authentication.getPrincipal();
        if (!(principal instanceof User user) || user.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "You must be logged in.");
        }
        return user;
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return null;
        }
        String normalized = role.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "user", "assistant" -> normalized;
            default -> null;
        };
    }

    private String sanitize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
