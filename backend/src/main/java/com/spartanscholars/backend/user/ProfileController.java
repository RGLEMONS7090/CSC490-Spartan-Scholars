package com.spartanscholars.backend.user;

import com.spartanscholars.backend.user.dto.ChangePasswordRequest;
import com.spartanscholars.backend.user.dto.ProfileResponse;
import com.spartanscholars.backend.user.dto.UpdateProfileRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(profileService.getProfile(user));
    }

    @PatchMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(profileService.updateProfile(user, request));
    }

    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal User user,
            @RequestBody ChangePasswordRequest request
    ) {
        profileService.changePassword(user, request.currentPassword(), request.newPassword());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteProfile(@AuthenticationPrincipal User user) {
        profileService.deleteProfile(user);
        return ResponseEntity.noContent().build();
    }
}
