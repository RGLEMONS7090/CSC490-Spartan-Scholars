package com.spartanscholars.backend.Todo;

import com.spartanscholars.backend.Todo.dto.TodoResponse;
import com.spartanscholars.backend.Todo.dto.TodoRequest;

import com.spartanscholars.backend.user.User;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TodoService {

    private final TodoRepository todoRepository;

    public TodoService(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }

    @Transactional(readOnly = true)
    public List<TodoResponse> list(User user) {
        User authenticated = requireUser(user);
        return todoRepository.findByOwnerIdOrderByCompletedAscDueDateAscUpdatedAtDesc(authenticated.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TodoResponse create(User user, TodoRequest request) {
        User authenticated = requireUser(user);
        TodoTask task = new TodoTask();
        task.setOwner(authenticated);
        applyRequest(task, request, false);
        return toResponse(todoRepository.save(task));
    }

    @Transactional
    public TodoResponse update(User user, Long taskId, TodoRequest request) {
        TodoTask task = findOwnedTask(user, taskId);
        applyRequest(task, request, true);
        return toResponse(todoRepository.save(task));
    }

    @Transactional
    public void delete(User user, Long taskId) {
        TodoTask task = findOwnedTask(user, taskId);
        todoRepository.delete(task);
    }

    private void applyRequest(TodoTask task, TodoRequest request, boolean allowPartial) {
        String title = sanitize(request.title());
        if (!allowPartial || request.title() != null) {
            if (title == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Task title is required.");
            }
            task.setTitle(title);
        }

        if (!allowPartial || request.description() != null) {
            task.setDescription(sanitize(request.description()));
        }

        if (!allowPartial || request.dueDate() != null) {
            task.setDueDate(request.dueDate());
        }

        if (!allowPartial || request.completed() != null) {
            task.setCompleted(Boolean.TRUE.equals(request.completed()));
        }

        String createdBy = sanitize(request.createdBy());
        if (!allowPartial || request.createdBy() != null) {
            task.setCreatedBy(createdBy == null ? "USER" : createdBy.toUpperCase());
        } else if (task.getCreatedBy() == null) {
            task.setCreatedBy("USER");
        }
    }

    private TodoTask findOwnedTask(User user, Long taskId) {
        User authenticated = requireUser(user);
        return todoRepository.findByIdAndOwnerId(taskId, authenticated.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found."));
    }

    private User requireUser(User user) {
        if (user == null || user.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "You must be logged in.");
        }
        return user;
    }

    private TodoResponse toResponse(TodoTask task) {
        return new TodoResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getDueDate(),
                task.isCompleted(),
                task.getCreatedBy(),
                task.getCreatedAt(),
                task.getUpdatedAt()
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
