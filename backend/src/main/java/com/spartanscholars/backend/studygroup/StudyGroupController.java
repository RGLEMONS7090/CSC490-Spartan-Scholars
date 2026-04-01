package com.spartanscholars.backend.studygroup;

import com.spartanscholars.backend.studygroup.dto.CreateStudyGroupMessageRequest;
import com.spartanscholars.backend.studygroup.dto.CreateStudyGroupRequest;
import com.spartanscholars.backend.studygroup.dto.CreateStudyGroupShareRequest;
import com.spartanscholars.backend.studygroup.dto.StudyGroupDetailResponse;
import com.spartanscholars.backend.studygroup.dto.StudyGroupMessageResponse;
import com.spartanscholars.backend.studygroup.dto.StudyGroupSummaryResponse;
import com.spartanscholars.backend.user.User;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/study-groups")
public class StudyGroupController {

    private final StudyGroupService studyGroupService;

    public StudyGroupController(StudyGroupService studyGroupService) {
        this.studyGroupService = studyGroupService;
    }

    @GetMapping
    public ResponseEntity<List<StudyGroupSummaryResponse>> list(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String q
    ) {
        return ResponseEntity.ok(studyGroupService.list(user, q));
    }

    @PostMapping
    public ResponseEntity<StudyGroupDetailResponse> create(
            @AuthenticationPrincipal User user,
            @RequestBody CreateStudyGroupRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studyGroupService.create(user, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudyGroupDetailResponse> getById(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(studyGroupService.getById(user, id));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<StudyGroupDetailResponse> join(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(studyGroupService.join(user, id));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<StudyGroupMessageResponse> addMessage(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody CreateStudyGroupMessageRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studyGroupService.addMessage(user, id, request));
    }

    @PostMapping("/{id}/shared-items")
    public ResponseEntity<StudyGroupDetailResponse> shareItems(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody CreateStudyGroupShareRequest request
    ) {
        return ResponseEntity.ok(studyGroupService.shareItems(user, id, request));
    }

    @PostMapping("/{id}/shared-items/{sharedItemId}/import")
    public ResponseEntity<StudyGroupDetailResponse> importSharedItem(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @PathVariable Long sharedItemId
    ) {
        return ResponseEntity.ok(studyGroupService.importSharedItem(user, id, sharedItemId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        studyGroupService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
