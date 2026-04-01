package com.spartanscholars.backend.ai;

import com.spartanscholars.backend.ai.dto.AiGeneratedFlashcardPayload;
import com.spartanscholars.backend.ai.dto.AiGeneratedTestQuizPayload;
import com.spartanscholars.backend.ai.dto.AiChatMessageRequest;
import com.spartanscholars.backend.ai.dto.AiChatRequest;
import com.spartanscholars.backend.ai.dto.AiChatResponse;
import com.spartanscholars.backend.ai.dto.DegreeAuditCourseDetail;
import com.spartanscholars.backend.ai.dto.DegreeAuditParseResponse;
import com.spartanscholars.backend.ai.dto.DegreeAuditRequirementGroup;
import com.spartanscholars.backend.quiz.dto.CreateFlashcardQuizRequest;
import com.spartanscholars.backend.quiz.dto.CreateTestQuizRequest;
import com.spartanscholars.backend.user.User;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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
    private static final Pattern COURSE_CODE_PATTERN = Pattern.compile("\\b([A-Z]{2,4})\\s?(\\d{3}[A-Z]?)\\b");

    private static final String SCHOOL_ASSISTANT_INSTRUCTIONS = """
            You are Spartan Scholars AI, a study assistant for students.
            Only help with school-related topics such as homework, studying, class concepts, academic writing, research, note-taking, quizzes, flashcards, and exam preparation.
            Treat direct factual questions from school subjects like biology, chemistry, physics, math, computer science, history, literature, and writing as school-related even if the user does not explicitly mention school.
            Do not refuse a question just because it is short, factual, or phrased like a quiz question.
            Only refuse requests that are clearly unrelated to academics, learning, or schoolwork.
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
    private static final String DEGREE_AUDIT_PARSER_INSTRUCTIONS = """
            You are Spartan Scholars AI, helping a student interpret a University of North Carolina Greensboro Degree Works PDF audit.
            Read the extracted audit text and return only valid JSON matching the provided schema.
            Focus on identifying the student's university, degree, major, concentration, minor, completed course codes, in-progress course codes, remaining course codes, and remaining non-course requirements.
            Prefer exact course codes that appear in the audit, such as CSC 130 or MAT 191.
            Do not invent courses that do not appear in the text.
            Do not duplicate a course code across completedCourses, inProgressCourses, and remainingCourses.
            If a course is currently in progress, place it only in inProgressCourses.
            If the audit says a student needs elective credits, science credits, or another requirement area rather than one exact course, place that item in remainingRequirements instead of remainingCourses.
            Put requirement blocks like science requirements, gen ed areas, residency rules, and "still needed" items without a single exact course code into remainingRequirements.
            Also fill remainingRequirementGroups for any choose-one / choose-N block. Example: if the audit says the student needs 1 more science from several options, return one remainingRequirementGroups item with a label like "1 Science class", requirementType "science", countNeeded 1, and the options listed from the audit.
            Only put exact individually required classes into remainingCourses.
            If a field is missing, return an empty string for text fields and an empty array for list fields.
            Keep the summary short and factual.
            The university should be UNC Greensboro or University of North Carolina Greensboro when present.
            """;
    private static final String DEGREE_AUDIT_NORMALIZATION_INSTRUCTIONS = """
            You are Spartan Scholars AI, cleaning and normalizing a Degree Works audit that has already been partially parsed by a deterministic parser.
            Use the parser output as the starting point, but correct misclassified items by reading the audit text.
            Return only valid JSON matching the provided schema.
            Rules:
            - Preserve exact course codes from the audit.
            - A course in progress must appear only in inProgressCourses and inProgressCourseDetails.
            - Exact single-course requirements belong in remainingCourses and remainingCourseDetails.
            - Requirement areas like science options or elective buckets belong in remainingRequirementGroups, not remainingCourses.
            - Keep completed requirement areas like foreign language or math out of remainingRequirements unless the audit explicitly says they are still needed.
            - Do not hallucinate courses, options, concentrations, or minors.
            - Prefer cleaner labels for requirement groups, such as "1 Science class" or "3 Credits in CSC electives at 300 level or above".
            - Keep the summary short and factual.
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

    @Transactional(readOnly = true)
    public DegreeAuditParseResponse parseDegreeAudit(User user, String fileName, byte[] bytes) {
        requireAuthenticatedUser(user);

        if (fileName == null || !fileName.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please upload a PDF exported from Degree Works.");
        }

        String extractedText;
        try {
            extractedText = DegreeAuditPdfExtractor.extract(bytes);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to read the uploaded Degree Works PDF.");
        }

        String sanitizedText = sanitize(extractedText);
        if (sanitizedText == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The uploaded PDF did not contain readable text.");
        }

        DegreeAuditParseResponse parserResult = buildStructuredDegreeAuditParse(sanitizedText);
        if (apiKey.isBlank()) {
            return parserResult;
        }

        DegreeAuditParseResponse aiNormalized = normalizeDegreeAuditWithAi(sanitizedText, parserResult);
        return aiNormalized == null ? parserResult : aiNormalized;
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

    private Map<String, Object> buildDegreeAuditFormat() {
        Map<String, Object> requirementGroupSchema = new LinkedHashMap<>();
        requirementGroupSchema.put("type", "object");
        requirementGroupSchema.put("additionalProperties", false);
        Map<String, Object> requirementGroupProperties = new LinkedHashMap<>();
        requirementGroupProperties.put("label", Map.of("type", "string"));
        requirementGroupProperties.put("requirementType", Map.of("type", "string"));
        requirementGroupProperties.put("countNeeded", Map.of("type", "integer"));
        requirementGroupProperties.put("creditsNeeded", Map.of("type", "string"));
        requirementGroupProperties.put("options", Map.of(
                "type", "array",
                "items", Map.of("type", "string")
        ));
        requirementGroupSchema.put("properties", requirementGroupProperties);
        requirementGroupSchema.put("required", List.of("label", "requirementType", "countNeeded", "creditsNeeded", "options"));

        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("additionalProperties", false);
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("university", Map.of("type", "string"));
        properties.put("degreeName", Map.of("type", "string"));
        properties.put("major", Map.of("type", "string"));
        properties.put("concentration", Map.of("type", "string"));
        properties.put("minor", Map.of("type", "string"));
        properties.put("completedCourses", Map.of(
                "type", "array",
                "items", Map.of("type", "string")
        ));
        properties.put("inProgressCourses", Map.of(
                "type", "array",
                "items", Map.of("type", "string")
        ));
        properties.put("remainingCourses", Map.of(
                "type", "array",
                "items", Map.of("type", "string")
        ));
        Map<String, Object> courseDetailSchema = new LinkedHashMap<>();
        courseDetailSchema.put("type", "object");
        courseDetailSchema.put("additionalProperties", false);
        courseDetailSchema.put("properties", Map.of(
                "code", Map.of("type", "string"),
                "title", Map.of("type", "string")
        ));
        courseDetailSchema.put("required", List.of("code", "title"));
        properties.put("completedCourseDetails", Map.of(
                "type", "array",
                "items", courseDetailSchema
        ));
        properties.put("inProgressCourseDetails", Map.of(
                "type", "array",
                "items", courseDetailSchema
        ));
        properties.put("remainingCourseDetails", Map.of(
                "type", "array",
                "items", courseDetailSchema
        ));
        properties.put("remainingRequirements", Map.of(
                "type", "array",
                "items", Map.of("type", "string")
        ));
        properties.put("remainingRequirementGroups", Map.of(
                "type", "array",
                "items", requirementGroupSchema
        ));
        properties.put("summary", Map.of("type", "string"));
        schema.put("properties", properties);
        schema.put("required", List.of(
                "university",
                "degreeName",
                "major",
                "concentration",
                "minor",
                "completedCourses",
                "inProgressCourses",
                "remainingCourses",
                "completedCourseDetails",
                "inProgressCourseDetails",
                "remainingCourseDetails",
                "remainingRequirements",
                "remainingRequirementGroups",
                "summary"
        ));

        return Map.of(
                "type", "json_schema",
                "name", "degree_audit_parse",
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

    private DegreeAuditParseResponse buildHeuristicDegreeAuditParse(String auditText, String fallbackMessage) {
        return buildStructuredDegreeAuditParse(auditText, fallbackMessage);
    }

    private DegreeAuditParseResponse buildStructuredDegreeAuditParse(String auditText) {
        return buildStructuredDegreeAuditParse(auditText, "Parsed from Degree Works audit sections.");
    }

    private DegreeAuditParseResponse buildStructuredDegreeAuditParse(String auditText, String summaryMessage) {
        String university = "";
        String lowerAudit = auditText.toLowerCase(Locale.ROOT);
        if (lowerAudit.contains("unc greensboro") || lowerAudit.contains("university of north carolina greensboro")) {
            university = "University of North Carolina Greensboro";
        }

        String degreeName = extractAfterLabel(auditText, "Degree");
        String major = extractAfterLabel(auditText, "Major");
        String concentration = extractAfterLabel(auditText, "Concentration");
        String minor = extractAfterLabel(auditText, "Minor");
        List<String> lines = normalizeAuditLines(auditText);
        Map<String, String> titleMap = extractCourseTitleMap(lines);
        List<String> inProgressCourses = extractInProgressCourses(lines);
        List<DegreeAuditRequirementGroup> remainingRequirementGroups = extractStructuredRequirementGroups(lines);
        remainingRequirementGroups = enrichRequirementGroups(remainingRequirementGroups, titleMap);
        List<String> remainingCourses = extractExactRemainingCourses(lines, inProgressCourses, remainingRequirementGroups);
        List<String> remainingRequirements = extractRequirementSummaries(lines, remainingRequirementGroups, remainingCourses);
        List<String> completedCourses = extractCompletedCourses(lines, inProgressCourses, remainingCourses, remainingRequirementGroups);
        List<DegreeAuditCourseDetail> completedCourseDetails = buildCourseDetails(completedCourses, lines);
        List<DegreeAuditCourseDetail> inProgressCourseDetails = buildCourseDetails(inProgressCourses, lines);
        List<DegreeAuditCourseDetail> remainingCourseDetails = buildCourseDetails(remainingCourses, lines);

        return new DegreeAuditParseResponse(
                university,
                defaultString(degreeName),
                defaultString(major),
                defaultString(concentration),
                defaultString(minor),
                completedCourses,
                inProgressCourses,
                remainingCourses,
                completedCourseDetails,
                inProgressCourseDetails,
                remainingCourseDetails,
                remainingRequirements,
                remainingRequirementGroups,
                summaryMessage
        );
    }

    private DegreeAuditParseResponse normalizeDegreeAuditWithAi(String auditText, DegreeAuditParseResponse parserResult) {
        try {
            String parserJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(parserResult);

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", model);
            payload.put("instructions", DEGREE_AUDIT_NORMALIZATION_INSTRUCTIONS);
            payload.put("input", List.of(Map.of(
                    "role", "user",
                    "content", """
                            Degree Works audit text:

                            %s

                            Deterministic parser output:

                            %s
                            """.formatted(auditText, parserJson)
            )));
            payload.put("max_output_tokens", 2400);
            payload.put("text", Map.of("format", buildDegreeAuditFormat()));

            JsonNode responseBody = executeResponseRequest(payload);
            String json = extractReply(responseBody);
            if (json == null) {
                return null;
            }

            DegreeAuditParseResponse aiResult = objectMapper.readValue(json, DegreeAuditParseResponse.class);
            return mergeDegreeAuditParses(auditText, parserResult, aiResult);
        } catch (Exception exception) {
            return null;
        }
    }

    private DegreeAuditParseResponse mergeDegreeAuditParses(
            String auditText,
            DegreeAuditParseResponse parserResult,
            DegreeAuditParseResponse aiResult
    ) {
        Set<String> auditCodes = new LinkedHashSet<>(findCourseCodes(auditText));
        Map<String, String> titleMap = extractCourseTitleMap(normalizeAuditLines(auditText));

        List<String> inProgressCourses = sanitizeCourseCodes(
                preferCourseList(aiResult.inProgressCourses(), parserResult.inProgressCourses()),
                auditCodes
        );
        List<String> remainingCourses = sanitizeCourseCodes(
                preferCourseList(aiResult.remainingCourses(), parserResult.remainingCourses()),
                auditCodes
        );
        remainingCourses.removeIf(inProgressCourses::contains);

        List<DegreeAuditRequirementGroup> requirementGroups =
                mergeAndSanitizeRequirementGroups(
                        aiResult.remainingRequirementGroups(),
                        parserResult.remainingRequirementGroups(),
                        auditCodes,
                        titleMap
                );
        Set<String> groupedOptionCodes = new LinkedHashSet<>();
        requirementGroups.forEach(group -> group.options().forEach(option -> groupedOptionCodes.addAll(findCourseCodes(option))));
        remainingCourses.removeIf(groupedOptionCodes::contains);

        List<String> completedCourses = sanitizeCourseCodes(
                preferCourseList(aiResult.completedCourses(), parserResult.completedCourses()),
                auditCodes
        );
        completedCourses.removeIf(inProgressCourses::contains);
        completedCourses.removeIf(remainingCourses::contains);

        List<DegreeAuditCourseDetail> completedDetails = mergeCourseDetails(
                completedCourses,
                parserResult.completedCourseDetails(),
                aiResult.completedCourseDetails()
        );
        List<DegreeAuditCourseDetail> inProgressDetails = mergeCourseDetails(
                inProgressCourses,
                parserResult.inProgressCourseDetails(),
                aiResult.inProgressCourseDetails()
        );
        List<DegreeAuditCourseDetail> remainingDetails = mergeCourseDetails(
                remainingCourses,
                parserResult.remainingCourseDetails(),
                aiResult.remainingCourseDetails()
        );
        List<String> remainingRequirements = sanitizeStringList(
                preferStringList(aiResult.remainingRequirements(), parserResult.remainingRequirements())
        );

        return new DegreeAuditParseResponse(
                preferText(aiResult.university(), parserResult.university()),
                preferText(aiResult.degreeName(), parserResult.degreeName()),
                preferText(aiResult.major(), parserResult.major()),
                preferText(aiResult.concentration(), parserResult.concentration()),
                preferText(aiResult.minor(), parserResult.minor()),
                completedCourses,
                inProgressCourses,
                remainingCourses,
                completedDetails,
                inProgressDetails,
                remainingDetails,
                remainingRequirements,
                requirementGroups,
                "Normalized with AI using parsed Degree Works sections."
        );
    }

    private List<String> preferCourseList(List<String> preferred, List<String> fallback) {
        return preferred != null && !preferred.isEmpty() ? preferred : fallback;
    }

    private List<String> preferStringList(List<String> preferred, List<String> fallback) {
        return preferred != null && !preferred.isEmpty() ? preferred : fallback;
    }

    private String preferText(String preferred, String fallback) {
        String sanitizedPreferred = sanitize(preferred);
        return sanitizedPreferred != null ? sanitizedPreferred : defaultString(fallback);
    }

    private List<String> sanitizeCourseCodes(List<String> values, Set<String> allowedCodes) {
        List<String> results = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        for (String value : values == null ? List.<String>of() : values) {
            String code = sanitize(normalizeCourseCode(value));
            if (code == null || !allowedCodes.contains(code) || !seen.add(code)) {
                continue;
            }
            results.add(code);
        }
        return results;
    }

    private String normalizeCourseCode(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", " ").replaceAll("\\s+", " ").trim();
        Matcher matcher = Pattern.compile("^([A-Z]{2,4})\\s?(\\d{3}[A-Z]?)$").matcher(normalized);
        if (!matcher.find()) {
            return normalized;
        }
        return matcher.group(1) + " " + matcher.group(2);
    }

    private List<DegreeAuditCourseDetail> mergeCourseDetails(
            List<String> codes,
            List<DegreeAuditCourseDetail> parserDetails,
            List<DegreeAuditCourseDetail> aiDetails
    ) {
        Map<String, DegreeAuditCourseDetail> parserMap = mapCourseDetails(parserDetails);
        Map<String, DegreeAuditCourseDetail> aiMap = mapCourseDetails(aiDetails);
        List<DegreeAuditCourseDetail> merged = new ArrayList<>();

        for (String code : codes) {
            DegreeAuditCourseDetail aiDetail = aiMap.get(code);
            DegreeAuditCourseDetail parserDetail = parserMap.get(code);
            String title = aiDetail != null && sanitize(aiDetail.title()) != null
                    ? aiDetail.title().trim()
                    : parserDetail != null ? defaultString(parserDetail.title()) : "";
            merged.add(new DegreeAuditCourseDetail(code, title));
        }

        return merged;
    }

    private Map<String, DegreeAuditCourseDetail> mapCourseDetails(List<DegreeAuditCourseDetail> details) {
        Map<String, DegreeAuditCourseDetail> mapped = new LinkedHashMap<>();
        for (DegreeAuditCourseDetail detail : details == null ? List.<DegreeAuditCourseDetail>of() : details) {
            if (detail == null) {
                continue;
            }
            String code = sanitize(normalizeCourseCode(detail.code()));
            if (code == null) {
                continue;
            }
            mapped.put(code, new DegreeAuditCourseDetail(code, defaultString(detail.title())));
        }
        return mapped;
    }

    private List<DegreeAuditRequirementGroup> mergeAndSanitizeRequirementGroups(
            List<DegreeAuditRequirementGroup> preferred,
            List<DegreeAuditRequirementGroup> fallback,
            Set<String> auditCodes,
            Map<String, String> titleMap
    ) {
        Map<String, DegreeAuditRequirementGroup> merged = new LinkedHashMap<>();
        addRequirementGroupsToMap(merged, fallback, auditCodes, titleMap);
        addRequirementGroupsToMap(merged, preferred, auditCodes, titleMap);
        return new ArrayList<>(merged.values());
    }

    private void addRequirementGroupsToMap(
            Map<String, DegreeAuditRequirementGroup> target,
            List<DegreeAuditRequirementGroup> source,
            Set<String> auditCodes,
            Map<String, String> titleMap
    ) {
        for (DegreeAuditRequirementGroup group : source == null ? List.<DegreeAuditRequirementGroup>of() : source) {
            if (group == null) {
                continue;
            }

            String label = defaultString(group.label());
            String type = defaultString(group.requirementType());
            int countNeeded = group.countNeeded() <= 0 ? 1 : group.countNeeded();
            String creditsNeeded = defaultString(group.creditsNeeded());
            List<String> options = sanitizeRequirementOptions(group.options(), auditCodes, titleMap);
            if (options.isEmpty()) {
                continue;
            }

            String key = buildRequirementGroupKey(label, type, countNeeded, creditsNeeded);
            DegreeAuditRequirementGroup existing = target.get(key);
            if (existing == null) {
                target.put(key, new DegreeAuditRequirementGroup(label, type, countNeeded, creditsNeeded, options));
                continue;
            }

            List<String> mergedOptions = new ArrayList<>();
            Set<String> seen = new LinkedHashSet<>();
            for (String option : existing.options()) {
                if (seen.add(option)) {
                    mergedOptions.add(option);
                }
            }
            for (String option : options) {
                if (seen.add(option)) {
                    mergedOptions.add(option);
                }
            }

            String betterLabel = label.length() > existing.label().length() ? label : existing.label();
            String betterType = type.isBlank() ? existing.requirementType() : type;
            String betterCredits = creditsNeeded.isBlank() ? existing.creditsNeeded() : creditsNeeded;
            target.put(key, new DegreeAuditRequirementGroup(betterLabel, betterType, countNeeded, betterCredits, mergedOptions));
        }
    }

    private String buildRequirementGroupKey(String label, String type, int countNeeded, String creditsNeeded) {
        return normalizeRequirementKey(label) + "|" + type + "|" + countNeeded + "|" + creditsNeeded;
    }

    private String normalizeRequirementKey(String value) {
        return defaultString(value).toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }

    private List<DegreeAuditRequirementGroup> enrichRequirementGroups(
            List<DegreeAuditRequirementGroup> groups,
            Map<String, String> titleMap
    ) {
        List<DegreeAuditRequirementGroup> enriched = new ArrayList<>();
        Set<String> allowedCodes = new LinkedHashSet<>(titleMap.keySet());
        for (DegreeAuditRequirementGroup group : groups == null ? List.<DegreeAuditRequirementGroup>of() : groups) {
            enriched.add(new DegreeAuditRequirementGroup(
                    defaultString(group.label()),
                    defaultString(group.requirementType()),
                    group.countNeeded() <= 0 ? 1 : group.countNeeded(),
                    defaultString(group.creditsNeeded()),
                    sanitizeRequirementOptions(group.options(), allowedCodes, titleMap)
            ));
        }
        return enriched;
    }

    private List<String> sanitizeRequirementOptions(List<String> options, Set<String> auditCodes, Map<String, String> titleMap) {
        List<String> sanitizedOptions = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        for (String option : options == null ? List.<String>of() : options) {
            String cleaned = sanitize(option);
            if (cleaned == null) {
                continue;
            }

            List<String> optionCodes = findCourseCodes(cleaned);
            boolean allCodesInAudit = optionCodes.isEmpty() || optionCodes.stream().allMatch(auditCodes::contains);
            if (allCodesInAudit) {
                String enriched = enrichRequirementOption(cleaned, titleMap);
                if (seen.add(enriched)) {
                    sanitizedOptions.add(enriched);
                }
            }
        }
        return sanitizedOptions;
    }

    private String enrichRequirementOption(String option, Map<String, String> titleMap) {
        List<String> codes = findCourseCodes(option);
        if (codes.size() != 1) {
            return option;
        }

        String code = codes.get(0);
        String title = sanitize(titleMap.get(code));
        if (title == null) {
            return code;
        }

        if (option.equals(code) || !option.contains(" - ")) {
            return code + " - " + title;
        }

        return option;
    }

    private List<String> sanitizeStringList(List<String> values) {
        List<String> results = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        for (String value : values == null ? List.<String>of() : values) {
            String cleaned = sanitize(value);
            if (cleaned != null && seen.add(cleaned)) {
                results.add(cleaned);
            }
        }
        return results;
    }

    private List<String> normalizeAuditLines(String auditText) {
        String[] rawLines = auditText.split("\\R");
        List<String> lines = new ArrayList<>();
        for (int index = 0; index < rawLines.length; index++) {
            String line = sanitize(rawLines[index]);
            if (line == null) {
                continue;
            }

            if (index + 1 < rawLines.length) {
                String nextLine = sanitize(rawLines[index + 1]);
                if (nextLine != null
                        && line.equals(line.toUpperCase(Locale.ROOT))
                        && nextLine.equals(nextLine.toUpperCase(Locale.ROOT))
                        && line.length() < 42
                        && nextLine.length() < 42) {
                    lines.add(line + " " + nextLine);
                    index++;
                    continue;
                }
            }

            lines.add(line);
        }
        return lines;
    }

    private List<DegreeAuditCourseDetail> buildCourseDetails(List<String> codes, List<String> lines) {
        Map<String, String> titleMap = extractCourseTitleMap(lines);
        List<DegreeAuditCourseDetail> details = new ArrayList<>();
        for (String code : codes) {
            details.add(new DegreeAuditCourseDetail(code, defaultString(titleMap.get(code))));
        }
        return details;
    }

    private Map<String, String> extractCourseTitleMap(List<String> lines) {
        Map<String, String> titles = new LinkedHashMap<>();

        for (int index = 0; index < lines.size(); index++) {
            String line = lines.get(index);
            List<String> codes = findCourseCodes(line);
            if (codes.size() != 1) {
                continue;
            }

            String code = codes.get(0);
            String title = extractCourseTitleFromLine(line, code);
            if ((title == null || title.isBlank()) && index + 1 < lines.size()) {
                title = extractStandaloneCourseTitle(lines.get(index + 1));
            }

            if (title != null && !title.isBlank()) {
                titles.putIfAbsent(code, title);
            }
        }

        return titles;
    }

    private String extractCourseTitleFromLine(String line, String code) {
        int codeIndex = line.toUpperCase(Locale.ROOT).indexOf(code.toUpperCase(Locale.ROOT));
        if (codeIndex < 0) {
            return null;
        }

        String trailing = line.substring(codeIndex + code.length()).trim();
        if (trailing.isBlank()) {
            return null;
        }

        String cleaned = trailing
                .replaceFirst("(?i)^[-:;,]+\\s*", "")
                .replaceFirst("(?i)\\s+[A-DFTP][+-]?\\s+\\d+\\s+(Fall|Spring|Summer|Winter)\\b.*$", "")
                .replaceFirst("(?i)\\s+(Fall|Spring|Summer|Winter)\\s+\\d{4}.*$", "")
                .replaceFirst("(?i)\\s+\\d+\\s*(credits?|hours?)\\b.*$", "")
                .replaceFirst("(?i)\\s+satisfied by:.*$", "")
                .replaceFirst("(?i)\\s+in progress.*$", "")
                .trim();

        return normalizeExtractedCourseTitle(cleaned);
    }

    private String extractStandaloneCourseTitle(String line) {
        if (line == null || !findCourseCodes(line).isEmpty() || shouldIgnoreAuditLine(line) || looksLikeRequirementHeading(line)) {
            return null;
        }
        return normalizeExtractedCourseTitle(line);
    }

    private String normalizeExtractedCourseTitle(String value) {
        String cleaned = sanitize(value);
        if (cleaned == null) {
            return null;
        }

        cleaned = cleaned
                .replaceAll("\\s+", " ")
                .replaceFirst("(?i)^still needed:\\s*", "")
                .replaceFirst("(?i)^satisfied by:\\s*", "")
                .replaceFirst("\\s*[-–—]?\\s*\\(\\d+(?:\\.\\d+)?\\)\\s*$", "")
                .trim();

        String lower = cleaned.toLowerCase(Locale.ROOT);
        if (cleaned.length() < 4
                || lower.startsWith("see ")
                || lower.startsWith("major in ")
                || lower.startsWith("choose from")
                || lower.startsWith("select ")
                || lower.startsWith("legend")
                || lower.startsWith("notes")
                || lower.contains("credits applied")) {
            return null;
        }

        return cleaned;
    }

    private List<String> extractInProgressCourses(List<String> lines) {
        Set<String> courses = new LinkedHashSet<>();
        boolean inSection = false;

        for (String line : lines) {
            String lowerLine = line.toLowerCase(Locale.ROOT);
            if (lowerLine.startsWith("in-progress credits applied")) {
                inSection = true;
                continue;
            }
            if (inSection && lowerLine.startsWith("legend")) {
                break;
            }
            if (inSection) {
                courses.addAll(findCourseCodes(line));
            }
        }

        return new ArrayList<>(courses);
    }

    private List<DegreeAuditRequirementGroup> extractStructuredRequirementGroups(List<String> lines) {
        List<DegreeAuditRequirementGroup> groups = new ArrayList<>();
        String currentHeading = "";

        for (int index = 0; index < lines.size(); index++) {
            String line = lines.get(index);
            String lowerLine = line.toLowerCase(Locale.ROOT);

            if (!lowerLine.startsWith("still needed:")) {
                if (looksLikeRequirementHeading(line)) {
                    currentHeading = line;
                }
                continue;
            }

            if (lowerLine.contains("choose from")) {
                int countNeeded = extractFirstNumber(line, 1);
                List<String> options = collectRequirementOptions(lines, index + 1);
                if (!options.isEmpty()) {
                    groups.add(new DegreeAuditRequirementGroup(
                            extractSpecificRequirementLabel(currentHeading, line, countNeeded),
                            inferRequirementType(currentHeading),
                            countNeeded,
                            extractCreditsText(line),
                            options
                    ));
                }
                continue;
            }

            if (lowerLine.contains(" or ")) {
                groups.add(new DegreeAuditRequirementGroup(
                        extractSpecificRequirementLabel(currentHeading, line, 1),
                        inferRequirementType(currentHeading.isBlank() ? line : currentHeading),
                        1,
                        extractCreditsText(line),
                        extractInlineOptions(line)
                ));
            }
        }

        return groups;
    }

    private List<String> extractExactRemainingCourses(
            List<String> lines,
            List<String> inProgressCourses,
            List<DegreeAuditRequirementGroup> requirementGroups
    ) {
        Set<String> inProgressSet = new LinkedHashSet<>(inProgressCourses);
        Set<String> groupedOptionCodes = new LinkedHashSet<>();
        requirementGroups.forEach(group -> group.options().forEach(option -> groupedOptionCodes.addAll(findCourseCodes(option))));

        Set<String> exactRemaining = new LinkedHashSet<>();
        for (String line : lines) {
            String lowerLine = line.toLowerCase(Locale.ROOT);
            if (!lowerLine.contains("still needed:")) {
                continue;
            }
            if (lowerLine.contains("choose from") || lowerLine.contains(" or ")) {
                continue;
            }

            for (String courseCode : findCourseCodes(line)) {
                if (!inProgressSet.contains(courseCode) && !groupedOptionCodes.contains(courseCode)) {
                    exactRemaining.add(courseCode);
                }
            }
        }

        return new ArrayList<>(exactRemaining);
    }

    private List<String> extractRequirementSummaries(
            List<String> lines,
            List<DegreeAuditRequirementGroup> requirementGroups,
            List<String> remainingCourses
    ) {
        Set<String> summaries = new LinkedHashSet<>();
        requirementGroups.forEach(group -> summaries.add(group.label()));

        Set<String> remainingSet = new LinkedHashSet<>(remainingCourses);
        for (String line : lines) {
            String lowerLine = line.toLowerCase(Locale.ROOT);
            if (!lowerLine.contains("still needed:")) {
                continue;
            }
            if (findCourseCodes(line).stream().anyMatch(remainingSet::contains)) {
                continue;
            }
            if (lowerLine.contains("choose from") || lowerLine.contains(" or ")) {
                continue;
            }
            summaries.add(line.replaceFirst("(?i)^still needed:\\s*", "").trim());
        }

        return new ArrayList<>(summaries);
    }

    private List<String> extractCompletedCourses(
            List<String> lines,
            List<String> inProgressCourses,
            List<String> remainingCourses,
            List<DegreeAuditRequirementGroup> requirementGroups
    ) {
        Set<String> excluded = new LinkedHashSet<>();
        excluded.addAll(inProgressCourses);
        excluded.addAll(remainingCourses);
        requirementGroups.forEach(group -> group.options().forEach(option -> excluded.addAll(findCourseCodes(option))));

        Set<String> completed = new LinkedHashSet<>();
        Pattern completedCoursePattern = Pattern.compile(
                "\\b([A-Z]{2,4})\\s?(\\d{3}[A-Z]?)\\b.+\\s([A-DFTP][+-]?|B|C|D|P|T)\\s+\\d+\\s+(Fall|Spring|Summer|Winter)",
                Pattern.CASE_INSENSITIVE
        );

        for (String line : lines) {
            if (line.startsWith("Satisfied by:")) {
                continue;
            }

            Matcher matcher = completedCoursePattern.matcher(line);
            if (matcher.find()) {
                String courseCode = matcher.group(1).toUpperCase(Locale.ROOT) + " " + matcher.group(2).toUpperCase(Locale.ROOT);
                if (!excluded.contains(courseCode)) {
                    completed.add(courseCode);
                }
            }
        }

        return new ArrayList<>(completed);
    }

    private boolean looksLikeRequirementHeading(String line) {
        String upper = line.toUpperCase(Locale.ROOT);
        return line.equals(upper)
                || upper.contains("REQUIREMENTS")
                || upper.contains("ELECTIVES")
                || upper.contains("CAPSTONE")
                || upper.contains("DISCIPLINE");
    }

    private List<String> collectRequirementOptions(List<String> lines, int startIndex) {
        List<String> options = new ArrayList<>();

        for (int index = startIndex; index < lines.size(); index++) {
            String line = lines.get(index);
            String lowerLine = line.toLowerCase(Locale.ROOT);

            if (lowerLine.startsWith("in-progress credits applied")
                    || lowerLine.startsWith("legend")
                    || lowerLine.startsWith("electives credits applied")
                    || lowerLine.startsWith("supporting discipline requirements")
                    || lowerLine.endsWith("incomplete")
                    || looksLikeRequirementHeading(line) && !lowerLine.contains("science requirements")) {
                break;
            }

            if (shouldIgnoreAuditLine(line)) {
                continue;
            }

            if (lowerLine.contains("still needed:")) {
                continue;
            }

            if (findCourseCodes(line).size() >= 2 && line.toLowerCase(Locale.ROOT).contains("satisfied by:")) {
                continue;
            }

            if (Character.isUpperCase(line.charAt(0)) && line.length() > 12) {
                boolean satisfiedOption = index + 1 < lines.size() && lines.get(index + 1).startsWith("Satisfied by:");
                if (!satisfiedOption) {
                    options.add(line);
                }
            }
        }

        return options.stream().distinct().toList();
    }

    private boolean shouldIgnoreAuditLine(String line) {
        String lowerLine = line.toLowerCase(Locale.ROOT);
        return line.startsWith("Satisfied by:")
                || lowerLine.startsWith("course title grade credits")
                || lowerLine.startsWith("uncg degree works")
                || lowerLine.startsWith("student name ")
                || lowerLine.startsWith("student id ")
                || lowerLine.startsWith("degree bachelor")
                || lowerLine.startsWith("audit date ")
                || lowerLine.startsWith("ellucian degree works")
                || lowerLine.startsWith("disclaimer")
                || lowerLine.contains("*****");
    }

    private List<String> extractInlineOptions(String stillNeededLine) {
        String cleaned = stillNeededLine.replaceFirst("(?i)^still needed:\\s*", "").trim();
        Set<String> options = new LinkedHashSet<>();
        for (String courseCode : findCourseCodes(cleaned)) {
            options.add(courseCode);
        }
        if (options.isEmpty()) {
            options.add(cleaned);
        }
        return new ArrayList<>(options);
    }

    private int extractFirstNumber(String text, int fallback) {
        Matcher matcher = Pattern.compile("(\\d+)").matcher(text);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        return fallback;
    }

    private String extractSpecificRequirementLabel(String heading, String stillNeededLine, int countNeeded) {
        String cleanedLine = stillNeededLine
                .replaceFirst("(?i)^still needed:\\s*", "")
                .replaceFirst("(?i)choose from\\s+.+$", "")
                .replaceFirst("(?i)select\\s+.+$", "")
                .trim()
                .replaceAll("\\s+", " ");

        if (!cleanedLine.isBlank()) {
            String normalized = cleanedLine.toLowerCase(Locale.ROOT);
            boolean looksSpecific =
                    normalized.contains("higher")
                            || Pattern.compile("\\b[A-Z]{2,4}\\s?\\d{3}[A-Z]?\\b").matcher(cleanedLine).find()
                            || normalized.contains("credits in")
                            || normalized.contains("hours in");
            if (looksSpecific) {
                return cleanedLine;
            }
        }

        String cleanedHeading = sanitize(heading);
        if (cleanedHeading != null && !cleanedHeading.isBlank()) {
            return cleanedHeading;
        }

        return buildGroupLabel(cleanedHeading == null ? "" : cleanedHeading, countNeeded);
    }

    private String buildGroupLabel(String heading, int countNeeded) {
        String type = inferRequirementType(heading);
        return switch (type) {
            case "science" -> countNeeded + " Science class";
            case "elective" -> extractCreditsText(heading).isBlank()
                    ? countNeeded + " Elective"
                    : extractCreditsText(heading) + " of electives";
            default -> countNeeded + " Requirement choice";
        };
    }

    private String extractAfterLabel(String text, String label) {
        Pattern pattern = Pattern.compile("(?im)^\\s*" + Pattern.quote(label) + "\\s*:?\\s*(.+)$");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return sanitize(matcher.group(1));
        }
        return "";
    }

    private List<String> extractCoursesNearKeywords(String text, List<String> keywords) {
        String[] lines = text.split("\\R");
        Set<String> results = new LinkedHashSet<>();

        for (int index = 0; index < lines.length; index++) {
            String currentLine = lines[index];
            String lowerLine = currentLine.toLowerCase(Locale.ROOT);

            boolean matched = keywords.stream().anyMatch(lowerLine::contains);
            if (!matched) {
                continue;
            }

            for (int offset = 0; offset <= 4 && index + offset < lines.length; offset++) {
                results.addAll(findCourseCodes(lines[index + offset]));
            }
        }

        return new ArrayList<>(results);
    }

    private List<String> extractRemainingCourseCodes(String text, Set<String> excludedCodes) {
        Set<String> results = new LinkedHashSet<>(findCourseCodes(text));
        results.removeAll(excludedCodes);
        return new ArrayList<>(results);
    }

    private List<String> extractRemainingRequirementLines(String text, List<String> keywords) {
        String[] lines = text.split("\\R");
        Set<String> results = new LinkedHashSet<>();

        for (int index = 0; index < lines.length; index++) {
            String line = sanitizeRequirementLine(lines[index]);
            if (line == null) {
                continue;
            }

            String lowerLine = line.toLowerCase(Locale.ROOT);
            boolean matched = keywords.stream().anyMatch(lowerLine::contains);
            if (!matched) {
                continue;
            }

            collectRequirementLine(results, line);
            for (int offset = 1; offset <= 3 && index + offset < lines.length; offset++) {
                collectRequirementLine(results, lines[index + offset]);
            }
        }

        return new ArrayList<>(results);
    }

    private List<DegreeAuditRequirementGroup> extractRequirementGroups(String text) {
        String[] lines = text.split("\\R");
        List<DegreeAuditRequirementGroup> groups = new ArrayList<>();

        for (int index = 0; index < lines.length; index++) {
            String line = sanitizeRequirementLine(lines[index]);
            if (line == null) {
                continue;
            }

            String lowerLine = line.toLowerCase(Locale.ROOT);
            boolean looksLikeGroupedRequirement =
                    lowerLine.contains("select") && lowerLine.contains("option")
                            || lowerLine.contains("choose from")
                            || lowerLine.contains("following");
            if (!looksLikeGroupedRequirement) {
                continue;
            }

            int countNeeded = 1;
            Matcher chooseMatcher = Pattern.compile("choose from\\s+(\\d+)\\s+of the following", Pattern.CASE_INSENSITIVE).matcher(line);
            Matcher selectMatcher = Pattern.compile("select\\s+(\\d+)\\s+options?", Pattern.CASE_INSENSITIVE).matcher(line);
            if (chooseMatcher.find()) {
                countNeeded = Integer.parseInt(chooseMatcher.group(1));
            } else if (selectMatcher.find()) {
                countNeeded = Integer.parseInt(selectMatcher.group(1));
            }

            List<String> options = new ArrayList<>();
            for (int offset = 1; offset <= 10 && index + offset < lines.length; offset++) {
                String optionLine = sanitizeRequirementLine(lines[index + offset]);
                if (optionLine == null) {
                    continue;
                }

                String lowerOption = optionLine.toLowerCase(Locale.ROOT);
                if (lowerOption.contains("still needed") || lowerOption.contains("satisfied by:")) {
                    continue;
                }
                if (lowerOption.contains("select") && lowerOption.contains("option")) {
                    break;
                }
                if (lowerOption.startsWith("fall") || lowerOption.startsWith("spring") || lowerOption.startsWith("summer")) {
                    continue;
                }

                boolean looksLikeOption =
                        !findCourseCodes(optionLine).isEmpty()
                                || optionLine.length() > 12 && Character.isUpperCase(optionLine.charAt(0));
                if (looksLikeOption) {
                    options.add(optionLine);
                }
            }

            if (options.isEmpty()) {
                continue;
            }

            groups.add(new DegreeAuditRequirementGroup(
                    buildRequirementLabel(line, countNeeded),
                    inferRequirementType(line),
                    countNeeded,
                    extractCreditsText(line),
                    options.stream().distinct().toList()
            ));
        }

        return groups;
    }

    private String buildRequirementLabel(String line, int countNeeded) {
        String type = inferRequirementType(line);
        return switch (type) {
            case "science" -> countNeeded + " Science class";
            case "elective" -> countNeeded + " Elective";
            case "humanities" -> countNeeded + " Humanities course";
            case "social-science" -> countNeeded + " Social Science course";
            default -> countNeeded + " Requirement option";
        };
    }

    private String inferRequirementType(String line) {
        String normalized = line.toLowerCase(Locale.ROOT);
        if (normalized.contains("science")) {
            return "science";
        }
        if (normalized.contains("elective")) {
            return "elective";
        }
        if (normalized.contains("humanities")) {
            return "humanities";
        }
        if (normalized.contains("social")) {
            return "social-science";
        }
        return "requirement";
    }

    private String extractCreditsText(String line) {
        Matcher matcher = Pattern.compile("(\\d+\\s+(credits?|hours?))", Pattern.CASE_INSENSITIVE).matcher(line);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "";
    }

    private void collectRequirementLine(Set<String> results, String rawLine) {
        String line = sanitizeRequirementLine(rawLine);
        if (line == null) {
            return;
        }

        String lowerLine = line.toLowerCase(Locale.ROOT);
        if (lowerLine.startsWith("notes") || lowerLine.startsWith("legend") || lowerLine.startsWith("fall through")) {
            return;
        }

        boolean hasCourseCode = !findCourseCodes(line).isEmpty();
        boolean looksLikeRequirement =
                lowerLine.contains("still needed")
                        || lowerLine.contains("remaining")
                        || lowerLine.contains("insufficient")
                        || lowerLine.contains("complete all of the following")
                        || lowerLine.contains("credits in")
                        || lowerLine.contains("hours in")
                        || lowerLine.contains("natural science")
                        || lowerLine.contains("science")
                        || lowerLine.contains("general education")
                        || lowerLine.contains("gen ed")
                        || lowerLine.contains("humanities")
                        || lowerLine.contains("social")
                        || lowerLine.contains("residency");

        if (!looksLikeRequirement || (hasCourseCode && line.length() < 28)) {
            return;
        }

        results.add(line);
    }

    private String sanitizeRequirementLine(String value) {
        String sanitized = sanitize(value);
        if (sanitized == null) {
            return null;
        }

        String cleaned = sanitized
                .replaceAll("\\s+", " ")
                .replaceAll("^[\\p{Punct}\\s]+", "")
                .replaceAll("[\\p{Punct}\\s]+$", "")
                .trim();

        if (cleaned.length() < 8) {
            return null;
        }

        return cleaned;
    }

    private List<String> findCourseCodes(String text) {
        List<String> results = new ArrayList<>();
        Matcher matcher = COURSE_CODE_PATTERN.matcher(text);
        while (matcher.find()) {
            results.add(matcher.group(1) + " " + matcher.group(2));
        }
        return results;
    }

    private String defaultString(String value) {
        return value == null ? "" : value;
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
