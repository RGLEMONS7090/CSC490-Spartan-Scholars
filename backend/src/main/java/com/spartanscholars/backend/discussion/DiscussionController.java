package com.spartanscholars.backend.discussion;

import com.spartanscholars.backend.discussion.dto.CommentResponse;
import com.spartanscholars.backend.discussion.dto.CreateCommentRequest;
import com.spartanscholars.backend.discussion.dto.CreateDiscussionRequest;
import com.spartanscholars.backend.discussion.dto.DiscussionSummaryResponse;
import com.spartanscholars.backend.discussion.dto.LikeResponse;
import com.spartanscholars.backend.user.User;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/discussions")
public class DiscussionController {

    private final DiscussionService discussionService;

    public DiscussionController(DiscussionService discussionService) {
        this.discussionService = discussionService;
    }

    @GetMapping
    public ResponseEntity<List<DiscussionSummaryResponse>> list(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "all") String sort
    ) {
        return ResponseEntity.ok(discussionService.list(user, sort));
    }

    @PostMapping
    public ResponseEntity<DiscussionSummaryResponse> create(
            @AuthenticationPrincipal User user,
            @RequestBody CreateDiscussionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(discussionService.create(user, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiscussionSummaryResponse> getDiscussion(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(discussionService.getDiscussion(user, id));
    }

    @PostMapping("/{id}/likes")
    public ResponseEntity<LikeResponse> toggleLike(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return ResponseEntity.ok(discussionService.toggleLike(user, id));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> listComments(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return ResponseEntity.ok(discussionService.listComments(user, id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody CreateCommentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(discussionService.addComment(user, id, request));
    }
}
