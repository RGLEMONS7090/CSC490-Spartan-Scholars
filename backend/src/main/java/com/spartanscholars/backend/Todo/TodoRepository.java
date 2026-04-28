package com.spartanscholars.backend.Todo;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TodoRepository extends JpaRepository<TodoTask, Long> {

    List<TodoTask> findByOwnerIdOrderByCompletedAscDueDateAscUpdatedAtDesc(Long ownerId);

    Optional<TodoTask> findByIdAndOwnerId(Long id, Long ownerId);
}
