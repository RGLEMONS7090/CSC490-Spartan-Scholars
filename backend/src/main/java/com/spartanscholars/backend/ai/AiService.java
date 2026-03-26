package com.spartanscholars.backend.ai;

import com.spartanscholars.backend.ai.dto.AiGeneratedFlashcardPayload;
import com.spartanscholars.backend.ai.dto.AiGeneratedTestQuizPayload;
import com.spartanscholars.backend.ai.dto.AiChatMessageRequest;
import com.spartanscholars.backend.ai.dto.AiChatRequest;
import com.spartanscholars.backend.ai.dto.AiChatResponse;
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

        return buildStructuredDegreeAuditParse(sanitizedText);
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
        List<String> inProgressCourses = extractInProgressCourses(lines);
        List<DegreeAuditRequirementGroup> remainingRequirementGroups = extractStructuredRequirementGroups(lines);
        List<String> remainingCourses = extractExactRemainingCourses(lines, inProgressCourses, remainingRequirementGroups);
        List<String> remainingRequirements = extractRequirementSummaries(lines, remainingRequirementGroups, remainingCourses);
        List<String> completedCourses = extractCompletedCourses(lines, inProgressCourses, remainingCourses, remainingRequirementGroups);

        return new DegreeAuditParseResponse(
                university,
                defaultString(degreeName),
                defaultString(major),
                defaultString(concentration),
                defaultString(minor),
                completedCourses,
                inProgressCourses,
                remainingCourses,
                remainingRequirements,
                remainingRequirementGroups,
                summaryMessage
        );
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
                            buildGroupLabel(currentHeading, countNeeded),
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
                        buildGroupLabel(currentHeading.isBlank() ? line : currentHeading, 1),
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
