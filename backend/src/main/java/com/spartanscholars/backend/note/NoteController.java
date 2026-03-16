package com.spartanscholars.backend.note;

import com.spartanscholars.backend.note.dto.NoteResponse;
import com.spartanscholars.backend.note.dto.NoteSummaryResponse;
import com.spartanscholars.backend.user.User;
import java.util.Base64;
import java.util.List;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping
    public ResponseEntity<List<NoteSummaryResponse>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(noteService.list(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoteResponse> getById(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(noteService.getById(user, id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<NoteResponse> create(
            @AuthenticationPrincipal User user,
            @RequestParam String title,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) MultipartFile file
    ) {
        NoteResponse created = noteService.create(user, title, category, content, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<NoteResponse> update(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            @RequestParam String title,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) MultipartFile file,
            @RequestParam(defaultValue = "false") boolean removeAttachment
    ) {
        NoteResponse updated = noteService.update(user, id, title, category, content, file, removeAttachment);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        noteService.delete(user, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/enhance")
    public ResponseEntity<NoteResponse> enhance(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(noteService.enhanceWithAi(user, id));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable Long id, @AuthenticationPrincipal User user) {
        Note note = noteService.getAttachment(user, id);
        String fileName = note.getFileName() == null ? "attachment" : note.getFileName();
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (note.getFileContentType() != null) {
            mediaType = MediaType.parseMediaType(note.getFileContentType());
        }
        byte[] bytes = Base64.getDecoder().decode(note.getFileData());

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(fileName).build().toString()
                )
                .body(bytes);
    }
}
