package com.spartanscholars.backend.admin;

import com.spartanscholars.backend.admin.dto.AdminPasswordRequest;
import com.spartanscholars.backend.admin.dto.AdminSessionResponse;
import com.spartanscholars.backend.admin.dto.AdminUserImplementationsResponse;
import com.spartanscholars.backend.admin.dto.AdminUserSummaryResponse;
import com.spartanscholars.backend.user.User;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/session")
    public ResponseEntity<AdminSessionResponse> createAdminSession(
            @AuthenticationPrincipal User user,
            @RequestBody AdminPasswordRequest request
    ) {
        return ResponseEntity.ok(adminService.createAdminSession(user, request));
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserSummaryResponse>> listUsers(Authentication authentication) {
        return ResponseEntity.ok(adminService.listUsers(authentication));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<AdminUserImplementationsResponse> getUserImplementations(
            @PathVariable Long userId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminService.getUserImplementations(userId, authentication));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId, Authentication authentication) {
        adminService.deleteUser(userId, authentication);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{userId}/notes/{noteId}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable Long userId,
            @PathVariable Long noteId,
            Authentication authentication
    ) {
        adminService.deleteNote(userId, noteId, authentication);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{userId}/quizzes/{quizId}")
    public ResponseEntity<Void> deleteQuiz(
            @PathVariable Long userId,
            @PathVariable Long quizId,
            Authentication authentication
    ) {
        adminService.deleteQuiz(userId, quizId, authentication);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{userId}/discussions/{discussionId}")
    public ResponseEntity<Void> deleteDiscussion(
            @PathVariable Long userId,
            @PathVariable Long discussionId,
            Authentication authentication
    ) {
        adminService.deleteDiscussion(userId, discussionId, authentication);
        return ResponseEntity.noContent().build();
    }
}
