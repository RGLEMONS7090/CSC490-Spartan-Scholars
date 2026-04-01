package com.spartanscholars.backend.studygroup;

import com.spartanscholars.backend.note.Note;
import com.spartanscholars.backend.note.NoteService;
import com.spartanscholars.backend.quiz.QuizService;
import com.spartanscholars.backend.quiz.StudyQuiz;
import com.spartanscholars.backend.studygroup.dto.CreateStudyGroupMessageRequest;
import com.spartanscholars.backend.studygroup.dto.CreateStudyGroupRequest;
import com.spartanscholars.backend.studygroup.dto.CreateStudyGroupShareRequest;
import com.spartanscholars.backend.studygroup.dto.StudyGroupDetailResponse;
import com.spartanscholars.backend.studygroup.dto.StudyGroupMessageResponse;
import com.spartanscholars.backend.studygroup.dto.StudyGroupSharedItemResponse;
import com.spartanscholars.backend.studygroup.dto.StudyGroupSummaryResponse;
import com.spartanscholars.backend.user.User;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StudyGroupService {

    private final StudyGroupRepository studyGroupRepository;
    private final StudyGroupMemberRepository memberRepository;
    private final StudyGroupMessageRepository messageRepository;
    private final StudyGroupSharedItemRepository sharedItemRepository;
    private final NoteService noteService;
    private final QuizService quizService;

    public StudyGroupService(
            StudyGroupRepository studyGroupRepository,
            StudyGroupMemberRepository memberRepository,
            StudyGroupMessageRepository messageRepository,
            StudyGroupSharedItemRepository sharedItemRepository,
            NoteService noteService,
            QuizService quizService
    ) {
        this.studyGroupRepository = studyGroupRepository;
        this.memberRepository = memberRepository;
        this.messageRepository = messageRepository;
        this.sharedItemRepository = sharedItemRepository;
        this.noteService = noteService;
        this.quizService = quizService;
    }

    @Transactional(readOnly = true)
    public List<StudyGroupSummaryResponse> list(User user, String query) {
        User authenticated = requireUser(user);
        String search = sanitize(query);
        List<StudyGroup> groups = studyGroupRepository.findAllByOrderByUpdatedAtDesc();
        if (search != null) {
            String normalized = search.toLowerCase(Locale.ROOT);
            groups = groups.stream()
                    .filter(group ->
                            containsIgnoreCase(group.getName(), normalized)
                                    || containsIgnoreCase(group.getCourse(), normalized)
                                    || containsIgnoreCase(group.getDescription(), normalized)
                    )
                    .toList();
        }
        if (groups.isEmpty()) {
            return List.of();
        }

        List<Long> groupIds = groups.stream().map(StudyGroup::getId).toList();
        Map<Long, Long> memberCounts = new HashMap<>();
        for (Object[] row : memberRepository.countByGroupIds(groupIds)) {
            memberCounts.put((Long) row[0], (Long) row[1]);
        }
        List<Long> joinedIds = memberRepository.findJoinedGroupIds(authenticated.getId(), groupIds);

        return groups.stream()
                .map(group -> new StudyGroupSummaryResponse(
                        group.getId(),
                        group.getName(),
                        group.getCourse(),
                        group.getDescription(),
                        group.getOwner().getName(),
                        memberCounts.getOrDefault(group.getId(), 0L),
                        joinedIds.contains(group.getId()),
                        group.getUpdatedAt()
                ))
                .toList();
    }

    @Transactional
    public StudyGroupDetailResponse create(User user, CreateStudyGroupRequest request) {
        User authenticated = requireUser(user);

        StudyGroup group = new StudyGroup();
        group.setOwner(authenticated);
        group.setName(requiredText(request.name(), "Group name is required."));
        group.setCourse(requiredText(request.course(), "Course is required."));
        group.setDescription(sanitize(request.description()));

        StudyGroup saved = studyGroupRepository.save(group);
        joinInternal(saved, authenticated);
        return buildDetailResponse(saved, authenticated, true, List.of(), List.of(), 1L);
    }

    @Transactional(readOnly = true)
    public StudyGroupDetailResponse getById(User user, Long id) {
        User authenticated = requireUser(user);
        StudyGroup group = findGroup(id);
        boolean joined = memberRepository.existsByGroupIdAndUserId(id, authenticated.getId());
        List<StudyGroupMessageResponse> messages = messageRepository.findByGroupIdOrderByCreatedAtAsc(id).stream()
                .map(message -> new StudyGroupMessageResponse(
                        message.getId(),
                        message.getAuthor().getName(),
                        message.getContent(),
                        message.getCreatedAt(),
                        message.getAuthor().getId().equals(authenticated.getId())
                ))
                .toList();
        List<StudyGroupSharedItemResponse> sharedItems = joined
                ? sharedItemRepository.findByGroupIdOrderByCreatedAtDesc(id).stream()
                        .map(this::toSharedItemResponse)
                        .toList()
                : List.of();
        return buildDetailResponse(group, authenticated, joined, messages, sharedItems, memberRepository.countByGroupId(id));
    }

    @Transactional
    public StudyGroupDetailResponse join(User user, Long id) {
        User authenticated = requireUser(user);
        StudyGroup group = findGroup(id);
        joinInternal(group, authenticated);
        return getById(authenticated, id);
    }

    @Transactional
    public StudyGroupMessageResponse addMessage(User user, Long id, CreateStudyGroupMessageRequest request) {
        User authenticated = requireUser(user);
        StudyGroup group = findGroup(id);
        if (!memberRepository.existsByGroupIdAndUserId(id, authenticated.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Join the group before sending messages.");
        }

        StudyGroupMessage message = new StudyGroupMessage();
        message.setGroup(group);
        message.setAuthor(authenticated);
        message.setContent(requiredText(request.content(), "Message content is required."));
        StudyGroupMessage saved = messageRepository.save(message);

        return new StudyGroupMessageResponse(
                saved.getId(),
                authenticated.getName(),
                saved.getContent(),
                saved.getCreatedAt(),
                true
        );
    }

    @Transactional
    public void delete(User user, Long id) {
        User authenticated = requireUser(user);
        StudyGroup group = findGroup(id);
        if (!group.getOwner().getId().equals(authenticated.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the group creator can delete this group.");
        }
        studyGroupRepository.delete(group);
    }

    @Transactional
    public StudyGroupDetailResponse shareItems(User user, Long id, CreateStudyGroupShareRequest request) {
        User authenticated = requireUser(user);
        StudyGroup group = findGroup(id);
        requireMembership(group.getId(), authenticated);

        boolean sharedAnything = false;
        for (Long noteId : request.noteIds() == null ? List.<Long>of() : request.noteIds()) {
            Note note = noteService.findOwnedNoteEntity(authenticated, noteId);
            StudyGroupSharedItem item = new StudyGroupSharedItem();
            item.setGroup(group);
            item.setSharedBy(authenticated);
            item.setItemType(StudyGroupSharedItemType.NOTE);
            item.setNote(note);
            item.setTitle(note.getTitle());
            sharedItemRepository.save(item);
            sharedAnything = true;
        }
        for (Long quizId : request.quizIds() == null ? List.<Long>of() : request.quizIds()) {
            StudyQuiz quiz = quizService.findOwnedQuizEntity(authenticated, quizId);
            StudyGroupSharedItem item = new StudyGroupSharedItem();
            item.setGroup(group);
            item.setSharedBy(authenticated);
            item.setItemType(StudyGroupSharedItemType.QUIZ);
            item.setQuiz(quiz);
            item.setTitle(quiz.getTitle());
            sharedItemRepository.save(item);
            sharedAnything = true;
        }

        if (!sharedAnything) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose at least one note or quiz to share.");
        }

        return getById(authenticated, id);
    }

    @Transactional
    public StudyGroupDetailResponse importSharedItem(User user, Long groupId, Long sharedItemId) {
        User authenticated = requireUser(user);
        StudyGroup group = findGroup(groupId);
        requireMembership(group.getId(), authenticated);

        StudyGroupSharedItem item = sharedItemRepository.findByIdAndGroupId(sharedItemId, groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared item not found."));

        if (item.getItemType() == StudyGroupSharedItemType.NOTE) {
            Note note = item.getNote();
            if (note == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "This shared note is no longer available.");
            }
            noteService.importFromExisting(authenticated, note);
        } else {
            StudyQuiz quiz = item.getQuiz();
            if (quiz == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "This shared quiz is no longer available.");
            }
            quizService.importFromExisting(authenticated, quiz);
        }

        return getById(authenticated, groupId);
    }

    private void joinInternal(StudyGroup group, User user) {
        if (memberRepository.findByGroupIdAndUserId(group.getId(), user.getId()).isPresent()) {
            return;
        }

        StudyGroupMember member = new StudyGroupMember();
        member.setGroup(group);
        member.setUser(user);
        memberRepository.save(member);
    }

    private StudyGroupDetailResponse buildDetailResponse(
            StudyGroup group,
            User authenticated,
            boolean joined,
            List<StudyGroupMessageResponse> messages,
            List<StudyGroupSharedItemResponse> sharedItems,
            long memberCount
    ) {
        return new StudyGroupDetailResponse(
                group.getId(),
                group.getName(),
                group.getCourse(),
                group.getDescription(),
                group.getOwner().getName(),
                group.getOwner().getId().equals(authenticated.getId()),
                memberCount,
                joined,
                messages,
                sharedItems
        );
    }

    private StudyGroupSharedItemResponse toSharedItemResponse(StudyGroupSharedItem item) {
        Long sourceItemId = item.getItemType() == StudyGroupSharedItemType.NOTE
                ? (item.getNote() == null ? null : item.getNote().getId())
                : (item.getQuiz() == null ? null : item.getQuiz().getId());
        return new StudyGroupSharedItemResponse(
                item.getId(),
                item.getItemType(),
                sourceItemId,
                item.getTitle(),
                item.getSharedBy().getName(),
                item.getCreatedAt()
        );
    }

    private StudyGroup findGroup(Long id) {
        return studyGroupRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Study group not found."));
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

    private void requireMembership(Long groupId, User user) {
        if (!memberRepository.existsByGroupIdAndUserId(groupId, user.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Join the group before sharing or importing items.");
        }
    }

    private String sanitize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }
}
