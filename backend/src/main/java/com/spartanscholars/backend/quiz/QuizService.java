package com.spartanscholars.backend.quiz;

import com.spartanscholars.backend.ai.AiService;
import com.spartanscholars.backend.quiz.dto.CreateFlashcardQuizRequest;
import com.spartanscholars.backend.quiz.dto.CreateTestQuizRequest;
import com.spartanscholars.backend.quiz.dto.FlashcardRequest;
import com.spartanscholars.backend.quiz.dto.GenerateAiStudyMaterialRequest;
import com.spartanscholars.backend.quiz.dto.FlashcardResponse;
import com.spartanscholars.backend.quiz.dto.ImportQuizRequest;
import com.spartanscholars.backend.quiz.dto.QuizDetailResponse;
import com.spartanscholars.backend.quiz.dto.QuizIncorrectAnswerResponse;
import com.spartanscholars.backend.quiz.dto.QuizOverviewResponse;
import com.spartanscholars.backend.quiz.dto.QuizQuestionRequest;
import com.spartanscholars.backend.quiz.dto.QuizQuestionResponse;
import com.spartanscholars.backend.quiz.dto.QuizShareResponse;
import com.spartanscholars.backend.quiz.dto.QuizSubmissionRequest;
import com.spartanscholars.backend.quiz.dto.QuizSubmissionResponse;
import com.spartanscholars.backend.quiz.dto.QuizSummaryResponse;
import com.spartanscholars.backend.user.User;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class QuizService {
    private static final String SHARE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int SHARE_CODE_LENGTH = 10;

    private final StudyQuizRepository studyQuizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AiService aiService;
    private final SecureRandom secureRandom = new SecureRandom();

    public QuizService(
            StudyQuizRepository studyQuizRepository,
            QuizAttemptRepository quizAttemptRepository,
            AiService aiService
    ) {
        this.studyQuizRepository = studyQuizRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.aiService = aiService;
    }

    @Transactional(readOnly = true)
    public QuizOverviewResponse overview(User user) {
        User authenticated = requireUser(user);
        List<StudyQuiz> quizzes = studyQuizRepository.findByOwnerIdOrderByUpdatedAtDesc(authenticated.getId());
        if (quizzes.isEmpty()) {
            return new QuizOverviewResponse(0, 0, null, List.of());
        }

        List<Long> quizIds = quizzes.stream().map(StudyQuiz::getId).toList();
        Map<Long, QuizAttempt> latestAttempts = new HashMap<>();
        for (QuizAttempt attempt : quizAttemptRepository.findByUserIdAndQuizIdInOrderByCompletedAtDesc(authenticated.getId(), quizIds)) {
            latestAttempts.putIfAbsent(attempt.getQuiz().getId(), attempt);
        }

        List<QuizSummaryResponse> summaries = quizzes.stream()
                .map(quiz -> {
                    QuizAttempt latest = latestAttempts.get(quiz.getId());
                    int itemCount = quiz.getType() == QuizType.TEST ? quiz.getQuestions().size() : quiz.getFlashcards().size();
                    return new QuizSummaryResponse(
                            quiz.getId(),
                            quiz.getTitle(),
                            quiz.getType(),
                            itemCount,
                            latest != null,
                            quiz.isImported(),
                            latest == null ? null : latest.getScore(),
                            quiz.getUpdatedAt()
                    );
                })
                .toList();

        Double averageScore = quizAttemptRepository.averageScoreByUserId(authenticated.getId());
        return new QuizOverviewResponse(
                summaries.size(),
                quizAttemptRepository.countDistinctCompletedByUserId(authenticated.getId()),
                averageScore == null ? null : (int) Math.round(averageScore),
                summaries
        );
    }

    @Transactional
    public QuizSummaryResponse createTestQuiz(User user, CreateTestQuizRequest request) {
        User authenticated = requireUser(user);
        String title = sanitize(request.title());
        if (title == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz title is required.");
        }
        if (request.questions() == null || request.questions().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one question is required.");
        }

        StudyQuiz quiz = new StudyQuiz();
        quiz.setOwner(authenticated);
        quiz.setTitle(title);
        quiz.setType(QuizType.TEST);
        quiz.setImported(false);

        int index = 0;
        for (QuizQuestionRequest questionRequest : request.questions()) {
            QuizQuestion question = new QuizQuestion();
            question.setQuiz(quiz);
            question.setPositionIndex(index++);
            question.setPrompt(requiredText(questionRequest.prompt(), "Question prompt is required."));
            if (questionRequest.writtenResponse()) {
                question.setResponseType(QuestionType.WRITTEN);
                question.setCorrectAnswer(requiredText(questionRequest.correctAnswer(), "Written answer is required."));
            } else {
                List<String> options = normalizeOptions(questionRequest.options());
                if (options.size() < 2) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Multiple choice questions need at least two options.");
                }
                question.setResponseType(QuestionType.MULTIPLE_CHOICE);
                question.setOptionA(options.get(0));
                question.setOptionB(options.get(1));
                question.setOptionC(options.size() > 2 ? options.get(2) : null);
                question.setOptionD(options.size() > 3 ? options.get(3) : null);
                String correctAnswer = requiredText(questionRequest.correctAnswer(), "Correct answer is required.");
                if (options.stream().noneMatch(option -> option.equals(correctAnswer))) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Correct answer must match one of the options.");
                }
                question.setCorrectAnswer(correctAnswer);
            }
            quiz.getQuestions().add(question);
        }

        StudyQuiz saved = studyQuizRepository.save(quiz);
        return new QuizSummaryResponse(saved.getId(), saved.getTitle(), saved.getType(), saved.getQuestions().size(), false, saved.isImported(), null, saved.getUpdatedAt());
    }

    @Transactional
    public QuizSummaryResponse createFlashcardQuiz(User user, CreateFlashcardQuizRequest request) {
        User authenticated = requireUser(user);
        String title = sanitize(request.title());
        if (title == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz title is required.");
        }
        if (request.cards() == null || request.cards().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one flashcard is required.");
        }

        StudyQuiz quiz = new StudyQuiz();
        quiz.setOwner(authenticated);
        quiz.setTitle(title);
        quiz.setType(QuizType.FLASHCARD);
        quiz.setImported(false);

        int index = 0;
        for (FlashcardRequest cardRequest : request.cards()) {
            Flashcard card = new Flashcard();
            card.setQuiz(quiz);
            card.setPositionIndex(index++);
            card.setFrontText(requiredText(cardRequest.front(), "Flashcard front is required."));
            card.setBackText(requiredText(cardRequest.back(), "Flashcard back is required."));
            quiz.getFlashcards().add(card);
        }

        StudyQuiz saved = studyQuizRepository.save(quiz);
        return new QuizSummaryResponse(saved.getId(), saved.getTitle(), saved.getType(), saved.getFlashcards().size(), false, saved.isImported(), null, saved.getUpdatedAt());
    }

    @Transactional
    public QuizSummaryResponse generateAiTestQuiz(User user, GenerateAiStudyMaterialRequest request) {
        AiQuizGenerationSpec spec = validateAiGenerationRequest(request);
        CreateTestQuizRequest generated = aiService.generateTestQuiz(
                requireUser(user),
                spec.mainTopic(),
                spec.classLevel(),
                spec.topicsToCover(),
                spec.itemCount()
        );
        return createTestQuiz(user, generated);
    }

    @Transactional
    public QuizSummaryResponse generateAiFlashcardQuiz(User user, GenerateAiStudyMaterialRequest request) {
        AiQuizGenerationSpec spec = validateAiGenerationRequest(request);
        CreateFlashcardQuizRequest generated = aiService.generateFlashcards(
                requireUser(user),
                spec.mainTopic(),
                spec.classLevel(),
                spec.topicsToCover(),
                spec.itemCount()
        );
        return createFlashcardQuiz(user, generated);
    }

    @Transactional(readOnly = true)
    public QuizDetailResponse getQuiz(User user, Long quizId) {
        StudyQuiz quiz = findOwnedQuiz(user, quizId);
        List<QuizQuestionResponse> questions = quiz.getQuestions().stream()
                .sorted((a, b) -> Integer.compare(a.getPositionIndex(), b.getPositionIndex()))
                .map(question -> new QuizQuestionResponse(
                        question.getId(),
                        question.getPrompt(),
                        question.getResponseType(),
                        optionsFor(question)
                ))
                .toList();
        List<FlashcardResponse> cards = quiz.getFlashcards().stream()
                .sorted((a, b) -> Integer.compare(a.getPositionIndex(), b.getPositionIndex()))
                .map(card -> new FlashcardResponse(card.getId(), card.getFrontText(), card.getBackText()))
                .toList();
        return new QuizDetailResponse(quiz.getId(), quiz.getTitle(), quiz.getType(), questions, cards);
    }

    @Transactional
    public QuizSubmissionResponse submitTest(User user, Long quizId, QuizSubmissionRequest request) {
        StudyQuiz quiz = findOwnedQuiz(user, quizId);
        if (quiz.getType() != QuizType.TEST) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This quiz is not a test quiz.");
        }
        List<QuizQuestion> questions = quiz.getQuestions().stream()
                .sorted((a, b) -> Integer.compare(a.getPositionIndex(), b.getPositionIndex()))
                .toList();
        List<String> answers = request.answers() == null ? List.of() : request.answers();
        int correctCount = 0;
        List<QuizIncorrectAnswerResponse> incorrectAnswers = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            String rawSubmitted = i < answers.size() ? sanitize(answers.get(i)) : null;
            String submitted = normalizeAnswer(rawSubmitted);
            String expected = normalizeAnswer(questions.get(i).getCorrectAnswer());
            if (!submitted.isBlank() && submitted.equals(expected)) {
                correctCount++;
            } else {
                incorrectAnswers.add(new QuizIncorrectAnswerResponse(
                        i + 1,
                        questions.get(i).getPrompt(),
                        rawSubmitted == null ? "No answer provided" : rawSubmitted,
                        questions.get(i).getCorrectAnswer()
                ));
            }
        }

        int score = questions.isEmpty() ? 0 : (int) Math.round((correctCount * 100.0) / questions.size());
        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuiz(quiz);
        attempt.setUser(requireUser(user));
        attempt.setScore(score);
        quizAttemptRepository.save(attempt);
        return new QuizSubmissionResponse(score, questions.size(), correctCount, incorrectAnswers);
    }

    @Transactional
    public void completeFlashcards(User user, Long quizId) {
        StudyQuiz quiz = findOwnedQuiz(user, quizId);
        if (quiz.getType() != QuizType.FLASHCARD) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This quiz is not a flashcard quiz.");
        }
        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuiz(quiz);
        attempt.setUser(requireUser(user));
        attempt.setScore(null);
        quizAttemptRepository.save(attempt);
    }

    @Transactional
    public void deleteQuiz(User user, Long quizId) {
        StudyQuiz quiz = findOwnedQuiz(user, quizId);
        quizAttemptRepository.deleteByQuizId(quizId);
        studyQuizRepository.delete(quiz);
    }

    @Transactional
    public QuizShareResponse createShareCode(User user, Long quizId) {
        StudyQuiz quiz = findOwnedQuiz(user, quizId);
        if (quiz.getShareCode() == null || quiz.getShareCode().isBlank()) {
            quiz.setShareCode(generateUniqueShareCode());
            studyQuizRepository.save(quiz);
        }
        return new QuizShareResponse(quiz.getId(), quiz.getTitle(), quiz.getShareCode());
    }

    @Transactional
    public QuizSummaryResponse importByPassword(User user, ImportQuizRequest request) {
        User authenticated = requireUser(user);
        String password = requiredText(request.password(), "Share password is required.");
        StudyQuiz source = findSharedQuiz(password);
        if (source.getOwner().getId().equals(authenticated.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You already own this quiz.");
        }
        StudyQuiz imported = cloneQuiz(source, authenticated);
        StudyQuiz saved = studyQuizRepository.save(imported);
        return new QuizSummaryResponse(saved.getId(), saved.getTitle(), saved.getType(), itemCount(saved), false, true, null, saved.getUpdatedAt());
    }

    @Transactional(readOnly = true)
    public StudyQuiz findOwnedQuizEntity(User user, Long quizId) {
        return findOwnedQuiz(user, quizId);
    }

    @Transactional
    public QuizSummaryResponse importFromExisting(User user, StudyQuiz source) {
        User authenticated = requireUser(user);
        if (source.getOwner().getId().equals(authenticated.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You already own this quiz.");
        }
        StudyQuiz imported = cloneQuiz(source, authenticated);
        StudyQuiz saved = studyQuizRepository.save(imported);
        return new QuizSummaryResponse(saved.getId(), saved.getTitle(), saved.getType(), itemCount(saved), false, true, null, saved.getUpdatedAt());
    }

    private StudyQuiz findOwnedQuiz(User user, Long quizId) {
        User authenticated = requireUser(user);
        StudyQuiz quiz = studyQuizRepository.findByIdAndOwnerId(quizId, authenticated.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found."));

        if (quiz.getType() == QuizType.TEST) {
            return studyQuizRepository.findWithQuestionsByIdAndOwnerId(quizId, authenticated.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found."));
        }

        return studyQuizRepository.findWithFlashcardsByIdAndOwnerId(quizId, authenticated.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found."));
    }

    private StudyQuiz findSharedQuiz(String shareCode) {
        StudyQuiz quiz = studyQuizRepository.findByShareCode(shareCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared quiz not found."));
        if (quiz.getType() == QuizType.TEST) {
            return studyQuizRepository.findWithQuestionsByShareCode(shareCode)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared quiz not found."));
        }
        return studyQuizRepository.findWithFlashcardsByShareCode(shareCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared quiz not found."));
    }

    private User requireUser(User user) {
        if (user == null || user.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "You must be logged in.");
        }
        return user;
    }

    private String requiredText(String value, String message) {
        String sanitized = sanitize(value);
        if (sanitized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return sanitized;
    }

    private StudyQuiz cloneQuiz(StudyQuiz source, User owner) {
        StudyQuiz imported = new StudyQuiz();
        imported.setOwner(owner);
        imported.setTitle(source.getTitle());
        imported.setType(source.getType());
        imported.setImported(true);
        imported.setShareCode(null);

        if (source.getType() == QuizType.TEST) {
            for (QuizQuestion sourceQuestion : source.getQuestions()) {
                QuizQuestion question = new QuizQuestion();
                question.setQuiz(imported);
                question.setPrompt(sourceQuestion.getPrompt());
                question.setResponseType(sourceQuestion.getResponseType());
                question.setOptionA(sourceQuestion.getOptionA());
                question.setOptionB(sourceQuestion.getOptionB());
                question.setOptionC(sourceQuestion.getOptionC());
                question.setOptionD(sourceQuestion.getOptionD());
                question.setCorrectAnswer(sourceQuestion.getCorrectAnswer());
                question.setPositionIndex(sourceQuestion.getPositionIndex());
                imported.getQuestions().add(question);
            }
        } else {
            for (Flashcard sourceCard : source.getFlashcards()) {
                Flashcard card = new Flashcard();
                card.setQuiz(imported);
                card.setFrontText(sourceCard.getFrontText());
                card.setBackText(sourceCard.getBackText());
                card.setPositionIndex(sourceCard.getPositionIndex());
                imported.getFlashcards().add(card);
            }
        }

        return imported;
    }

    private int itemCount(StudyQuiz quiz) {
        return quiz.getType() == QuizType.TEST ? quiz.getQuestions().size() : quiz.getFlashcards().size();
    }

    private String generateUniqueShareCode() {
        String code = randomShareCode();
        while (studyQuizRepository.existsByShareCode(code)) {
            code = randomShareCode();
        }
        return code;
    }

    private String randomShareCode() {
        StringBuilder builder = new StringBuilder(SHARE_CODE_LENGTH);
        for (int i = 0; i < SHARE_CODE_LENGTH; i++) {
            builder.append(SHARE_CODE_ALPHABET.charAt(secureRandom.nextInt(SHARE_CODE_ALPHABET.length())));
        }
        return builder.toString();
    }

    private String sanitize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<String> normalizeOptions(List<String> options) {
        if (options == null) {
            return List.of();
        }
        List<String> normalized = new ArrayList<>();
        for (String option : options) {
            String sanitized = sanitize(option);
            if (sanitized != null) {
                normalized.add(sanitized);
            }
        }
        return normalized;
    }

    private List<String> optionsFor(QuizQuestion question) {
        List<String> options = new ArrayList<>();
        if (question.getOptionA() != null) {
            options.add(question.getOptionA());
        }
        if (question.getOptionB() != null) {
            options.add(question.getOptionB());
        }
        if (question.getOptionC() != null) {
            options.add(question.getOptionC());
        }
        if (question.getOptionD() != null) {
            options.add(question.getOptionD());
        }
        return options;
    }

    private String normalizeAnswer(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private AiQuizGenerationSpec validateAiGenerationRequest(GenerateAiStudyMaterialRequest request) {
        String mainTopic = requiredText(request.mainTopic(), "Main topic is required.");
        String classLevel = requiredText(request.classLevel(), "Class level is required.");
        String topicsToCover = requiredText(request.topicsToCover(), "Topics to cover are required.");
        Integer itemCount = request.itemCount();
        if (itemCount == null || itemCount < 1 || itemCount > 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose between 1 and 20 items.");
        }
        return new AiQuizGenerationSpec(mainTopic, classLevel, topicsToCover, itemCount);
    }

    private record AiQuizGenerationSpec(
            String mainTopic,
            String classLevel,
            String topicsToCover,
            int itemCount
    ) {
    }
}
