package com.spartanscholars.backend.studygroup;

import com.spartanscholars.backend.note.Note;
import com.spartanscholars.backend.note.NoteService;
import com.spartanscholars.backend.notification.NotificationService;
import com.spartanscholars.backend.quiz.QuizService;
import com.spartanscholars.backend.quiz.StudyQuiz;
import com.spartanscholars.backend.studygroup.dto.CreateStudyGroupMessageRequest;
import com.spartanscholars.backend.studygroup.dto.CreateStudyGroupRequest;
import com.spartanscholars.backend.studygroup.dto.CreateStudyGroupShareRequest;
import com.spartanscholars.backend.studygroup.dto.JoinPrivateStudyGroupRequest;
import com.spartanscholars.backend.studygroup.dto.StudyGroupDetailResponse;
import com.spartanscholars.backend.studygroup.dto.StudyGroupMessageResponse;
import com.spartanscholars.backend.studygroup.dto.StudyGroupSharedItemResponse;
import com.spartanscholars.backend.studygroup.dto.StudyGroupSummaryResponse;
import com.spartanscholars.backend.user.User;
import java.security.SecureRandom;
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
    private static final String ACCESS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int ACCESS_CODE_LENGTH = 10;

    private final StudyGroupRepository studyGroupRepository;
    private final StudyGroupMemberRepository memberRepository;
    private final StudyGroupMessageRepository messageRepository;
    private final StudyGroupSharedItemRepository sharedItemRepository;
    private final NoteService noteService;
    private final QuizService quizService;
    private final NotificationService notificationService;
    private final SecureRandom secureRandom = new SecureRandom();

    public StudyGroupService(
            StudyGroupRepository studyGroupRepository,
            StudyGroupMemberRepository memberRepository,
            StudyGroupMessageRepository messageRepository,
            StudyGroupSharedItemRepository sharedItemRepository,
            NoteService noteService,
            QuizService quizService,
            NotificationService notificationService
    ) {
        this.studyGroupRepository = studyGroupRepository;
        this.memberRepository = memberRepository;
        this.messageRepository = messageRepository;
        this.sharedItemRepository = sharedItemRepository;
        this.noteService = noteService;
        this.quizService = quizService;
        this.notificationService = notificationService;
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
                .filter(group -> !group.isPrivateGroup()
                        || joinedIds.contains(group.getId())
                        || group.getOwner().getId().equals(authenticated.getId()))
                .map(group -> new StudyGroupSummaryResponse(
                        group.getId(),
                        group.getName(),
                        group.getCourse(),
                        group.getDescription(),
                        group.getOwner().getName(),
                        memberCounts.getOrDefault(group.getId(), 0L),
                        group.isPrivateGroup(),
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
        group.setPrivateGroup(request.privateGroup());
        group.setAccessCode(request.privateGroup() ? generateUniqueAccessCode() : null);

        StudyGroup saved = studyGroupRepository.save(group);
        joinInternal(saved, authenticated);
        return buildDetailResponse(saved, authenticated, true, List.of(), List.of(), 1L);
    }

    @Transactional(readOnly = true)
    public StudyGroupDetailResponse getById(User user, Long id) {
        User authenticated = requireUser(user);
        StudyGroup group = findGroup(id);
        boolean joined = memberRepository.existsByGroupIdAndUserId(id, authenticated.getId());
        if (group.isPrivateGroup() && !joined && !group.getOwner().getId().equals(authenticated.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This private group is only visible to members.");
        }
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
        if (group.isPrivateGroup()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use the private group password to join this group.");
        }
        joinInternal(group, authenticated);
        return getById(authenticated, id);
    }

    @Transactional
    public StudyGroupDetailResponse joinPrivate(User user, JoinPrivateStudyGroupRequest request) {
        User authenticated = requireUser(user);
        String password = requiredText(request.password(), "Private group password is required.");
        StudyGroup group = studyGroupRepository.findByAccessCode(password)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Private group not found."));
        if (!group.isPrivateGroup()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That password does not belong to a private group.");
        }
        joinInternal(group, authenticated);
        return getById(authenticated, group.getId());
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
        notifyGroupMembersOfMessage(group, authenticated);

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

        if (group.isPrivateGroup() && !group.getOwner().getId().equals(user.getId())) {
            notificationService.notifyUser(
                    group.getOwner(),
                    "New member joined your private study group",
                    user.getName() + " joined " + group.getName() + ".",
                    "/study-groups/" + group.getId()
            );
        }
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
                group.isPrivateGroup(),
                joined || group.getOwner().getId().equals(authenticated.getId()) ? group.getAccessCode() : null,
                group.getOwner().getId().equals(authenticated.getId()),
                memberCount,
                joined,
                messages,
                sharedItems
        );
    }

    private StudyGroupSharedItemResponse toSharedItemResponse(StudyGroupSharedItem item) {
        return new StudyGroupSharedItemResponse(
                item.getId(),
                item.getItemType(),
                null,
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

    private String generateUniqueAccessCode() {
        String code = randomAccessCode();
        while (studyGroupRepository.existsByAccessCode(code)) {
            code = randomAccessCode();
        }
        return code;
    }

    private String randomAccessCode() {
        StringBuilder builder = new StringBuilder(ACCESS_CODE_LENGTH);
        for (int i = 0; i < ACCESS_CODE_LENGTH; i++) {
            builder.append(ACCESS_CODE_ALPHABET.charAt(secureRandom.nextInt(ACCESS_CODE_ALPHABET.length())));
        }
        return builder.toString();
    }

    private void notifyGroupMembersOfMessage(StudyGroup group, User author) {
        for (StudyGroupMember member : memberRepository.findByGroupId(group.getId())) {
            if (member.getUser().getId().equals(author.getId())) {
                continue;
            }
            notificationService.notifyUser(
                    member.getUser(),
                    "New study group reply",
                    author.getName() + " posted in " + group.getName() + ".",
                    "/study-groups/" + group.getId()
            );
        }
    }
}
