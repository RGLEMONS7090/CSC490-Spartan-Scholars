package com.spartanscholars.backend.quiz;

import com.spartanscholars.backend.quiz.dto.CreateFlashcardQuizRequest;
import com.spartanscholars.backend.quiz.dto.CreateTestQuizRequest;
import com.spartanscholars.backend.quiz.dto.GenerateAiStudyMaterialRequest;
import com.spartanscholars.backend.quiz.dto.QuizDetailResponse;
import com.spartanscholars.backend.quiz.dto.QuizOverviewResponse;
import com.spartanscholars.backend.quiz.dto.QuizSubmissionRequest;
import com.spartanscholars.backend.quiz.dto.QuizSubmissionResponse;
import com.spartanscholars.backend.quiz.dto.QuizSummaryResponse;
import com.spartanscholars.backend.user.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @GetMapping
    public ResponseEntity<QuizOverviewResponse> overview(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(quizService.overview(user));
    }

    @PostMapping("/test")
    public ResponseEntity<QuizSummaryResponse> createTest(
            @AuthenticationPrincipal User user,
            @RequestBody CreateTestQuizRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.createTestQuiz(user, request));
    }

    @PostMapping("/flashcards")
    public ResponseEntity<QuizSummaryResponse> createFlashcards(
            @AuthenticationPrincipal User user,
            @RequestBody CreateFlashcardQuizRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.createFlashcardQuiz(user, request));
    }

    @PostMapping("/ai/test")
    public ResponseEntity<QuizSummaryResponse> generateAiTestQuiz(
            @AuthenticationPrincipal User user,
            @RequestBody GenerateAiStudyMaterialRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.generateAiTestQuiz(user, request));
    }

    @PostMapping("/ai/flashcards")
    public ResponseEntity<QuizSummaryResponse> generateAiFlashcards(
            @AuthenticationPrincipal User user,
            @RequestBody GenerateAiStudyMaterialRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.generateAiFlashcardQuiz(user, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizDetailResponse> getQuiz(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(quizService.getQuiz(user, id));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<QuizSubmissionResponse> submitTest(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody QuizSubmissionRequest request
    ) {
        return ResponseEntity.ok(quizService.submitTest(user, id, request));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Void> completeFlashcards(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        quizService.completeFlashcards(user, id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        quizService.deleteQuiz(user, id);
        return ResponseEntity.noContent().build();
    }
}
