package com.spartanscholars.backend.calendar;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CalendarRepository extends JpaRepository<CalendarEvent, Long> {

    List<CalendarEvent> findByOwnerIdOrderByEventDateAscCreatedAtAsc(Long ownerId);

    Optional<CalendarEvent> findByIdAndOwnerId(Long id, Long ownerId);
}
