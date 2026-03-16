package com.spartanscholars.backend.note;

import com.spartanscholars.backend.ai.AiService;
import com.spartanscholars.backend.note.dto.NoteResponse;
import com.spartanscholars.backend.note.dto.NoteSummaryProjection;
import com.spartanscholars.backend.note.dto.NoteSummaryResponse;
import com.spartanscholars.backend.user.User;
import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NoteService {

    private static final int PREVIEW_LENGTH = 180;
    private static final long MAX_UPLOAD_SIZE_BYTES = 10_485_760;

    private final NoteRepository noteRepository;
    private final AiService aiService;

    public NoteService(NoteRepository noteRepository, AiService aiService) {
        this.noteRepository = noteRepository;
        this.aiService = aiService;
    }

    @Transactional(readOnly = true)
    public List<NoteSummaryResponse> list(User user) {
        User authenticated = requireUser(user);
        return noteRepository.findSummariesByOwnerIdOrderByUpdatedAtDesc(authenticated.getId())
                .stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    private NoteSummaryResponse toSummaryResponse(NoteSummaryProjection note) {
        String preview = buildPreview(note.getContent());
        return new NoteSummaryResponse(
                note.getId(),
                note.getTitle(),
                note.getCategory(),
                preview,
                note.getFileName(),
                note.getFileName() != null && !note.getFileName().isBlank(),
                note.getUpdatedAt()
        );
    }

    private String buildPreview(String rawPreview) {
        if (rawPreview == null) {
            return "";
        }

        String trimmed = rawPreview.trim();
        if (trimmed.isEmpty()) {
            return "";
        }

        for (String line : trimmed.split("\\R+")) {
            String normalizedLine = line.trim().replaceAll("\\s+", " ");
            String cleanedLine = cleanPreviewLine(normalizedLine);
            if (isMeaningfulPreviewLine(cleanedLine)) {
                return truncatePreview(cleanedLine);
            }
        }

        return truncatePreview(cleanPreviewLine(trimmed.replaceAll("\\s+", " ")));
    }

    private boolean isMeaningfulPreviewLine(String line) {
        if (line.isEmpty()) {
            return false;
        }

        long letterCount = line.chars().filter(Character::isLetter).count();
        return letterCount >= 3;
    }

    private String cleanPreviewLine(String line) {
        if (line == null || line.isBlank()) {
            return "";
        }

        // Skip leading page numbers, bullets, punctuation, and other extraction noise
        int firstLetterIndex = -1;
        for (int i = 0; i < line.length(); i++) {
            if (Character.isLetter(line.charAt(i))) {
                firstLetterIndex = i;
                break;
            }
        }

        if (firstLetterIndex <= 0) {
            return line.trim();
        }

        return line.substring(firstLetterIndex).trim();
    }

    private String truncatePreview(String preview) {
        if (preview.length() <= PREVIEW_LENGTH) {
            return preview;
        }
        return preview.substring(0, PREVIEW_LENGTH) + "...";
    }

    @Transactional(readOnly = true)
    public NoteResponse getById(User user, Long noteId) {
        Note note = findOwnedNote(user, noteId);
        return toResponse(note);
    }

    @Transactional
    public NoteResponse create(
            User user,
            String title,
            String category,
            String content,
            MultipartFile file
    ) {
        User authenticated = requireUser(user);
        Note note = new Note();
        note.setOwner(authenticated);
        applyNoteFields(note, title, category, content, file);
        Note saved = noteRepository.save(note);
        return toResponse(saved);
    }

    @Transactional
    public NoteResponse update(
            User user,
            Long noteId,
            String title,
            String category,
            String content,
            MultipartFile file,
            boolean removeAttachment
    ) {
        Note note = findOwnedNote(user, noteId);
        applyNoteFields(note, title, category, content, file);
        if (removeAttachment) {
            clearAttachment(note);
        }
        Note saved = noteRepository.save(note);
        return toResponse(saved);
    }

    @Transactional
    public void delete(User user, Long noteId) {
        Note note = findOwnedNote(user, noteId);
        noteRepository.delete(note);
    }

    @Transactional
    public NoteResponse enhanceWithAi(User user, Long noteId) {
        Note note = findOwnedNote(user, noteId);
        String enhancedContent = aiService.enhanceNote(user, note.getTitle(), note.getCategory(), note.getContent());
        note.setContent(enhancedContent);
        Note saved = noteRepository.save(note);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Note getAttachment(User user, Long noteId) {
        Note note = findOwnedNote(user, noteId);
        if (note.getFileData() == null || note.getFileData().isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No attachment found for this note.");
        }
        return note;
    }

    private void applyNoteFields(
            Note note,
            String title,
            String category,
            String content,
            MultipartFile file
    ) {
        String trimmedTitle = sanitize(title);
        if (trimmedTitle == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required.");
        }

        note.setTitle(trimmedTitle);
        note.setCategory(sanitize(category));
        String typedContent = content == null ? "" : content.trim();
        String extractedText = "";

        if (file != null && !file.isEmpty()) {
            extractedText = attachFile(note, file);
        }

        if (!extractedText.isBlank()) {
            if (typedContent.isBlank()) {
                note.setContent(extractedText);
            } else {
                note.setContent(typedContent + "\n\n" + extractedText);
            }
        } else {
            note.setContent(typedContent);
        }
    }

    private String attachFile(Note note, MultipartFile file) {
        String originalName = sanitize(file.getOriginalFilename());
        if (originalName == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file name is invalid.");
        }
        String lower = originalName.toLowerCase(Locale.ROOT);
        if (!(lower.endsWith(".pdf") || lower.endsWith(".doc") || lower.endsWith(".docx"))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only PDF, DOC, and DOCX files are supported."
            );
        }
        if (file.getSize() > MAX_UPLOAD_SIZE_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Attachment exceeds 10 MB limit."
            );
        }

        try {
            byte[] bytes = file.getBytes();
            note.setFileName(originalName);
            note.setFileContentType(sanitize(file.getContentType()));
            note.setFileData(Base64.getEncoder().encodeToString(bytes));
            return DocumentTextExtractor.extract(originalName, bytes);
        } catch (IOException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Failed to read or extract text from uploaded file."
            );
        }
    }

    private void clearAttachment(Note note) {
        note.setFileName(null);
        note.setFileContentType(null);
        note.setFileData(null);
    }

    private Note findOwnedNote(User user, Long noteId) {
        User authenticated = requireUser(user);
        return noteRepository.findByIdAndOwnerId(noteId, authenticated.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found."));
    }

    private User requireUser(User user) {
        if (user == null || user.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "You must be logged in.");
        }
        return user;
    }

    private NoteResponse toResponse(Note note) {
        return new NoteResponse(
                note.getId(),
                note.getTitle(),
                note.getCategory(),
                note.getContent(),
                note.getFileName(),
                note.getFileContentType(),
                note.getFileName() != null && !note.getFileName().isBlank(),
                note.getCreatedAt(),
                note.getUpdatedAt()
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
