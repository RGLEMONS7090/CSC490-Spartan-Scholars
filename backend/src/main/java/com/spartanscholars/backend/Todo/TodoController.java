package com.spartanscholars.backend.Todo;

import com.spartanscholars.backend.Todo.dto.TodoResponse;
import com.spartanscholars.backend.Todo.dto.TodoRequest;
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
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping
    public ResponseEntity<List<TodoResponse>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(todoService.list(user));
    }

    @PostMapping
    public ResponseEntity<TodoResponse> create(
            @AuthenticationPrincipal User user,
            @RequestBody TodoRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(todoService.create(user, request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TodoResponse> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody TodoRequest request
    ) {
        return ResponseEntity.ok(todoService.update(user, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        todoService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
