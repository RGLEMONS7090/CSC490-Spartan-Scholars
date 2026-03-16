package com.spartanscholars.backend.discussion;

import com.spartanscholars.backend.discussion.dto.CommentResponse;
import com.spartanscholars.backend.discussion.dto.CreateCommentRequest;
import com.spartanscholars.backend.discussion.dto.CreateDiscussionRequest;
import com.spartanscholars.backend.discussion.dto.DiscussionSummaryResponse;
import com.spartanscholars.backend.discussion.dto.LikeResponse;
import com.spartanscholars.backend.user.User;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DiscussionService {

    private final DiscussionRepository discussionRepository;
    private final DiscussionLikeRepository discussionLikeRepository;
    private final DiscussionCommentRepository discussionCommentRepository;

    public DiscussionService(
            DiscussionRepository discussionRepository,
            DiscussionLikeRepository discussionLikeRepository,
            DiscussionCommentRepository discussionCommentRepository
    ) {
        this.discussionRepository = discussionRepository;
        this.discussionLikeRepository = discussionLikeRepository;
        this.discussionCommentRepository = discussionCommentRepository;
    }

    @Transactional(readOnly = true)
    public List<DiscussionSummaryResponse> list(User user, String sort, String query) {
        User authenticated = requireUser(user);
        List<Discussion> discussions = loadDiscussions(sort, query);
        if (discussions.isEmpty()) {
            return List.of();
        }

        List<Long> ids = discussions.stream().map(Discussion::getId).toList();
        Map<Long, Long> likesByDiscussion = toCountMap(discussionLikeRepository.countByDiscussionIds(ids));
        Map<Long, Long> commentsByDiscussion = toCountMap(discussionCommentRepository.countByDiscussionIds(ids));
        Set<Long> likedByCurrentUser = new HashSet<>(
                discussionLikeRepository.findLikedDiscussionIds(authenticated.getId(), ids)
        );

        List<DiscussionSummaryResponse> response = discussions.stream()
                .map(discussion -> new DiscussionSummaryResponse(
                        discussion.getId(),
                        discussion.getTitle(),
                        discussion.getDescription(),
                        discussion.getOwner().getName(),
                        discussion.getOwner().getId().equals(authenticated.getId()),
                        likesByDiscussion.getOrDefault(discussion.getId(), 0L),
                        commentsByDiscussion.getOrDefault(discussion.getId(), 0L),
                        likedByCurrentUser.contains(discussion.getId()),
                        discussion.getCreatedAt(),
                        discussion.getUpdatedAt()
                ))
                .toList();

        if ("trending".equalsIgnoreCase(sort)) {
            return response.stream()
                    .sorted(
                            Comparator.comparingLong(DiscussionSummaryResponse::likeCount).reversed()
                                    .thenComparing(DiscussionSummaryResponse::updatedAt, Comparator.reverseOrder())
                    )
                    .toList();
        }
        return response;
    }

    @Transactional
    public DiscussionSummaryResponse create(User user, CreateDiscussionRequest request) {
        User authenticated = requireUser(user);
        String title = sanitize(request.title());
        if (title == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required.");
        }

        Discussion discussion = new Discussion();
        discussion.setOwner(authenticated);
        discussion.setTitle(title);
        discussion.setDescription(sanitize(request.description()));

        Discussion saved = discussionRepository.save(discussion);
        return new DiscussionSummaryResponse(
                saved.getId(),
                saved.getTitle(),
                saved.getDescription(),
                authenticated.getName(),
                true,
                0,
                0,
                false,
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        );
    }

    @Transactional
    public void deleteDiscussion(User user, Long discussionId) {
        User authenticated = requireUser(user);
        Discussion discussion = findDiscussion(discussionId);
        if (!discussion.getOwner().getId().equals(authenticated.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the creator can delete this discussion.");
        }

        discussionCommentRepository.deleteByDiscussionId(discussionId);
        discussionLikeRepository.deleteByDiscussionId(discussionId);
        discussionRepository.delete(discussion);
    }

    @Transactional
    public LikeResponse toggleLike(User user, Long discussionId) {
        User authenticated = requireUser(user);
        Discussion discussion = findDiscussion(discussionId);

        discussionLikeRepository.findByDiscussionIdAndUserId(discussionId, authenticated.getId())
                .ifPresentOrElse(
                        discussionLikeRepository::delete,
                        () -> {
                            DiscussionLike like = new DiscussionLike();
                            like.setDiscussion(discussion);
                            like.setUser(authenticated);
                            discussionLikeRepository.save(like);
                        }
                );

        boolean liked = discussionLikeRepository.findByDiscussionIdAndUserId(discussionId, authenticated.getId()).isPresent();
        long likeCount = discussionLikeRepository.countByDiscussionId(discussionId);
        return new LikeResponse(liked, likeCount);
    }

    @Transactional
    public CommentResponse addComment(User user, Long discussionId, CreateCommentRequest request) {
        User authenticated = requireUser(user);
        Discussion discussion = findDiscussion(discussionId);
        String content = sanitize(request.content());
        if (content == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment content is required.");
        }

        DiscussionComment comment = new DiscussionComment();
        comment.setDiscussion(discussion);
        comment.setAuthor(authenticated);
        comment.setContent(content);

        if (request.parentId() != null) {
            DiscussionComment parent = discussionCommentRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parent comment not found."));
            if (!parent.getDiscussion().getId().equals(discussionId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent comment is from another discussion.");
            }
            comment.setParent(parent);
        }

        DiscussionComment saved = discussionCommentRepository.save(comment);
        discussion.touch();
        discussionRepository.save(discussion);

        return new CommentResponse(
                saved.getId(),
                authenticated.getName(),
                saved.getContent(),
                saved.getCreatedAt(),
                List.of()
        );
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> listComments(User user, Long discussionId) {
        requireUser(user);
        findDiscussion(discussionId);

        List<DiscussionComment> comments = discussionCommentRepository.findByDiscussionIdOrderByCreatedAtAsc(discussionId);
        if (comments.isEmpty()) {
            return List.of();
        }

        Map<Long, List<DiscussionComment>> byParent = new HashMap<>();
        List<DiscussionComment> roots = new ArrayList<>();
        for (DiscussionComment comment : comments) {
            if (comment.getParent() == null) {
                roots.add(comment);
                continue;
            }
            byParent.computeIfAbsent(comment.getParent().getId(), key -> new ArrayList<>()).add(comment);
        }

        return roots.stream()
                .map(comment -> toCommentTree(comment, byParent))
                .toList();
    }

    private CommentResponse toCommentTree(
            DiscussionComment comment,
            Map<Long, List<DiscussionComment>> byParent
    ) {
        List<CommentResponse> replies = byParent.getOrDefault(comment.getId(), List.of())
                .stream()
                .map(child -> toCommentTree(child, byParent))
                .toList();

        return new CommentResponse(
                comment.getId(),
                comment.getAuthor().getName(),
                comment.getContent(),
                comment.getCreatedAt(),
                replies
        );
    }

    private List<Discussion> loadDiscussions(String sort, String query) {
        String normalized = sort == null ? "all" : sort.trim().toLowerCase();
        String search = sanitize(query);
        if (search != null) {
            if ("recent".equals(normalized)) {
                return discussionRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrderByCreatedAtDesc(
                        search,
                        search
                );
            }
            return discussionRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrderByUpdatedAtDesc(
                    search,
                    search
            );
        }
        if ("recent".equals(normalized)) {
            return discussionRepository.findAllByOrderByCreatedAtDesc();
        }
        return discussionRepository.findAllByOrderByUpdatedAtDesc();
    }

    private Map<Long, Long> toCountMap(Collection<CountProjection> rows) {
        Map<Long, Long> counts = new HashMap<>();
        for (CountProjection row : rows) {
            counts.put(row.getDiscussionId(), row.getTotal());
        }
        return counts;
    }

    private Discussion findDiscussion(Long discussionId) {
        return discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Discussion not found."));
    }

    private User requireUser(User user) {
        if (user == null || user.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "You must be logged in.");
        }
        return user;
    }

    private String sanitize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public DiscussionSummaryResponse getDiscussion(User user, Long id) {
        User authenticated = requireUser(user);
        Discussion d = findDiscussion(id);
    
        long likeCount = discussionLikeRepository.countByDiscussionId(id);
        long commentCount = discussionCommentRepository.countByDiscussionId(id);
        boolean likedByCurrentUser =
                discussionLikeRepository.existsByUserAndDiscussion(authenticated, d);
    
        return new DiscussionSummaryResponse(
                d.getId(),
                d.getTitle(),
                d.getDescription(),
                d.getOwner().getName(),
                d.getOwner().getId().equals(authenticated.getId()),
                likeCount,
                commentCount,
                likedByCurrentUser,
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }
}
