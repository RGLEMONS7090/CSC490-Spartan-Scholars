package com.spartanscholars.backend.admin;

import com.spartanscholars.backend.admin.dto.AdminDiscussionResponse;
import com.spartanscholars.backend.admin.dto.AdminNoteResponse;
import com.spartanscholars.backend.admin.dto.AdminPasswordRequest;
import com.spartanscholars.backend.admin.dto.AdminQuizResponse;
import com.spartanscholars.backend.admin.dto.AdminSessionResponse;
import com.spartanscholars.backend.admin.dto.AdminUserImplementationsResponse;
import com.spartanscholars.backend.admin.dto.AdminUserSummaryResponse;
import com.spartanscholars.backend.auth.JwtService;
import com.spartanscholars.backend.discussion.Discussion;
import com.spartanscholars.backend.discussion.DiscussionComment;
import com.spartanscholars.backend.discussion.DiscussionCommentRepository;
import com.spartanscholars.backend.discussion.DiscussionLikeRepository;
import com.spartanscholars.backend.discussion.DiscussionRepository;
import com.spartanscholars.backend.note.Note;
import com.spartanscholars.backend.note.NoteRepository;
import com.spartanscholars.backend.quiz.QuizAttemptRepository;
import com.spartanscholars.backend.quiz.QuizType;
import com.spartanscholars.backend.quiz.StudyQuiz;
import com.spartanscholars.backend.quiz.StudyQuizRepository;
import com.spartanscholars.backend.studygroup.StudyGroup;
import com.spartanscholars.backend.studygroup.StudyGroupMemberRepository;
import com.spartanscholars.backend.studygroup.StudyGroupMessageRepository;
import com.spartanscholars.backend.studygroup.StudyGroupRepository;
import com.spartanscholars.backend.user.User;
import com.spartanscholars.backend.user.UserRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminService {

    private static final int NOTE_PREVIEW_LENGTH = 140;

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final NoteRepository noteRepository;
    private final StudyQuizRepository studyQuizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final DiscussionRepository discussionRepository;
    private final DiscussionCommentRepository discussionCommentRepository;
    private final DiscussionLikeRepository discussionLikeRepository;
    private final StudyGroupRepository studyGroupRepository;
    private final StudyGroupMemberRepository studyGroupMemberRepository;
    private final StudyGroupMessageRepository studyGroupMessageRepository;

    @Value("${app.admin.password:UNCG2026SpartanScholars}")
    private String adminPassword;

    public AdminService(
            JwtService jwtService,
            UserRepository userRepository,
            NoteRepository noteRepository,
            StudyQuizRepository studyQuizRepository,
            QuizAttemptRepository quizAttemptRepository,
            DiscussionRepository discussionRepository,
            DiscussionCommentRepository discussionCommentRepository,
            DiscussionLikeRepository discussionLikeRepository,
            StudyGroupRepository studyGroupRepository,
            StudyGroupMemberRepository studyGroupMemberRepository,
            StudyGroupMessageRepository studyGroupMessageRepository
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.noteRepository = noteRepository;
        this.studyQuizRepository = studyQuizRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.discussionRepository = discussionRepository;
        this.discussionCommentRepository = discussionCommentRepository;
        this.discussionLikeRepository = discussionLikeRepository;
        this.studyGroupRepository = studyGroupRepository;
        this.studyGroupMemberRepository = studyGroupMemberRepository;
        this.studyGroupMessageRepository = studyGroupMessageRepository;
    }

    public AdminSessionResponse createAdminSession(User user, AdminPasswordRequest request) {
        User authenticated = requireUser(user);
        String password = sanitize(request.password());
        if (password == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin password is required.");
        }
        if (!adminPassword.equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin password is incorrect.");
        }
        return new AdminSessionResponse(jwtService.generateToken(authenticated.getEmail(), true));
    }

    @Transactional(readOnly = true)
    public List<AdminUserSummaryResponse> listUsers(Authentication authentication) {
        requireAdmin(authentication);
        return userRepository.findAll().stream()
                .map(user -> new AdminUserSummaryResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        noteRepository.countByOwnerId(user.getId()),
                        studyQuizRepository.countByOwnerId(user.getId()),
                        discussionRepository.countByOwnerId(user.getId())
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminUserImplementationsResponse getUserImplementations(Long userId, Authentication authentication) {
        requireAdmin(authentication);
        User target = findUser(userId);

        List<AdminNoteResponse> notes = noteRepository.findByOwnerIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toAdminNote)
                .toList();
        List<AdminQuizResponse> quizzes = studyQuizRepository.findAllByOwnerIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toAdminQuiz)
                .toList();
        List<AdminDiscussionResponse> discussions = discussionRepository.findAllByOwnerIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toAdminDiscussion)
                .toList();

        return new AdminUserImplementationsResponse(
                target.getId(),
                target.getName(),
                target.getEmail(),
                notes,
                quizzes,
                discussions
        );
    }

    @Transactional
    public void deleteUser(Long userId, Authentication authentication) {
        requireAdmin(authentication);
        User target = findUser(userId);
        deleteAllUserContent(target.getId());
        userRepository.delete(target);
    }

    @Transactional
    public void deleteNote(Long userId, Long noteId, Authentication authentication) {
        requireAdmin(authentication);
        Note note = noteRepository.findByIdAndOwnerId(noteId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found."));
        noteRepository.delete(note);
    }

    @Transactional
    public void deleteQuiz(Long userId, Long quizId, Authentication authentication) {
        requireAdmin(authentication);
        StudyQuiz quiz = studyQuizRepository.findByIdAndOwnerId(quizId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found."));
        quizAttemptRepository.deleteByQuizId(quizId);
        studyQuizRepository.delete(quiz);
    }

    @Transactional
    public void deleteDiscussion(Long userId, Long discussionId, Authentication authentication) {
        requireAdmin(authentication);
        Discussion discussion = discussionRepository.findById(discussionId)
                .filter(value -> value.getOwner().getId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Discussion not found."));
        discussionCommentRepository.deleteByDiscussionId(discussionId);
        discussionLikeRepository.deleteByDiscussionId(discussionId);
        discussionRepository.delete(discussion);
    }

    private void deleteAllUserContent(Long userId) {
        noteRepository.deleteByOwnerId(userId);

        for (StudyQuiz quiz : studyQuizRepository.findAllByOwnerIdOrderByUpdatedAtDesc(userId)) {
            quizAttemptRepository.deleteByQuizId(quiz.getId());
            studyQuizRepository.delete(quiz);
        }
        quizAttemptRepository.deleteByUserId(userId);

        for (Discussion discussion : discussionRepository.findAllByOwnerIdOrderByUpdatedAtDesc(userId)) {
            discussionCommentRepository.deleteByDiscussionId(discussion.getId());
            discussionLikeRepository.deleteByDiscussionId(discussion.getId());
            discussionRepository.delete(discussion);
        }
        detachAndDeleteCommentsByAuthor(userId);
        discussionLikeRepository.deleteByUserId(userId);

        for (StudyGroup group : studyGroupRepository.findAllByOwnerId(userId)) {
            studyGroupRepository.delete(group);
        }
        studyGroupMessageRepository.deleteByAuthorId(userId);
        studyGroupMemberRepository.deleteByUserId(userId);
    }

    private void detachAndDeleteCommentsByAuthor(Long userId) {
        List<Long> commentIds = discussionCommentRepository.findByAuthorId(userId).stream()
                .map(DiscussionComment::getId)
                .toList();
        if (!commentIds.isEmpty()) {
            discussionCommentRepository.clearParentsByParentIds(commentIds);
            discussionCommentRepository.deleteByAuthorId(userId);
        }
    }

    private AdminNoteResponse toAdminNote(Note note) {
        String preview = note.getContent() == null ? "" : note.getContent().trim().replaceAll("\\s+", " ");
        if (preview.length() > NOTE_PREVIEW_LENGTH) {
            preview = preview.substring(0, NOTE_PREVIEW_LENGTH) + "...";
        }
        return new AdminNoteResponse(
                note.getId(),
                note.getTitle(),
                note.getCategory(),
                preview,
                note.getUpdatedAt()
        );
    }

    private AdminQuizResponse toAdminQuiz(StudyQuiz quiz) {
        int itemCount = quiz.getType() == QuizType.TEST ? quiz.getQuestions().size() : quiz.getFlashcards().size();
        return new AdminQuizResponse(
                quiz.getId(),
                quiz.getTitle(),
                quiz.getType(),
                itemCount,
                quiz.getUpdatedAt()
        );
    }

    private AdminDiscussionResponse toAdminDiscussion(Discussion discussion) {
        return new AdminDiscussionResponse(
                discussion.getId(),
                discussion.getTitle(),
                discussion.getDescription(),
                discussion.getUpdatedAt()
        );
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    }

    private User requireUser(User user) {
        if (user == null || user.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "You must be logged in.");
        }
        return user;
    }

    private void requireAdmin(Authentication authentication) {
        boolean isAdmin = authentication != null
                && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        if (!isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access is required.");
        }
    }

    private String sanitize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
