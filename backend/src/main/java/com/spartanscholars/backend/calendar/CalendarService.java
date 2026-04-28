package com.spartanscholars.backend.calendar;

import com.spartanscholars.backend.calendar.dto.CalendarEventRequest;
import com.spartanscholars.backend.calendar.dto.CalendarEventResponse;
import com.spartanscholars.backend.user.User;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CalendarService {

    private final CalendarRepository calendarRepository;

    public CalendarService(CalendarRepository calendarRepository) {
        this.calendarRepository = calendarRepository;
    }

    @Transactional(readOnly = true)
    public List<CalendarEventResponse> list(User user) {
        User authenticated = requireUser(user);
        return calendarRepository.findByOwnerIdOrderByEventDateAscCreatedAtAsc(authenticated.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CalendarEventResponse create(User user, CalendarEventRequest request) {
        User authenticated = requireUser(user);
        CalendarEvent event = new CalendarEvent();
        event.setOwner(authenticated);
        applyRequest(event, request);
        return toResponse(calendarRepository.save(event));
    }

    @Transactional
    public CalendarEventResponse update(User user, Long eventId, CalendarEventRequest request) {
        CalendarEvent event = findOwnedEvent(user, eventId);
        applyRequest(event, request);
        return toResponse(calendarRepository.save(event));
    }

    @Transactional
    public void delete(User user, Long eventId) {
        CalendarEvent event = findOwnedEvent(user, eventId);
        calendarRepository.delete(event);
    }

    private void applyRequest(CalendarEvent event, CalendarEventRequest request) {
        String title = sanitize(request.title());
        if (title == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event title is required.");
        }
        if (request.eventDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event date is required.");
        }

        event.setTitle(title);
        event.setDescription(sanitize(request.description()));
        event.setEventDate(request.eventDate());

        String createdBy = sanitize(request.createdBy());
        event.setCreatedBy(createdBy == null ? "USER" : createdBy.toUpperCase());
    }

    private CalendarEvent findOwnedEvent(User user, Long eventId) {
        User authenticated = requireUser(user);
        return calendarRepository.findByIdAndOwnerId(eventId, authenticated.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Calendar event not found."));
    }

    private User requireUser(User user) {
        if (user == null || user.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "You must be logged in.");
        }
        return user;
    }

    private CalendarEventResponse toResponse(CalendarEvent event) {
        return new CalendarEventResponse(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getEventDate(),
                event.getCreatedBy(),
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }

    private String sanitize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
