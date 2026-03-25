package com.spartanscholars.backend.calendar;

import com.spartanscholars.backend.calendar.dto.CalendarEventRequest;
import com.spartanscholars.backend.calendar.dto.CalendarEventResponse;
import com.spartanscholars.backend.user.User;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private final CalendarService calendarService;

    public CalendarController(CalendarService calendarService) {
        this.calendarService = calendarService;
    }

    @GetMapping
    public ResponseEntity<List<CalendarEventResponse>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(calendarService.list(user));
    }

    @PostMapping
    public ResponseEntity<CalendarEventResponse> create(
            @AuthenticationPrincipal User user,
            @RequestBody CalendarEventRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(calendarService.create(user, request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CalendarEventResponse> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody CalendarEventRequest request
    ) {
        return ResponseEntity.ok(calendarService.update(user, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        calendarService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
