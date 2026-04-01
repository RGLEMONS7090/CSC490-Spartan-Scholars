package com.spartanscholars.backend.note;

import com.spartanscholars.backend.ai.AiService;
import com.spartanscholars.backend.note.dto.ImportNoteRequest;
import com.spartanscholars.backend.note.dto.NoteResponse;
import com.spartanscholars.backend.note.dto.NoteShareResponse;
import com.spartanscholars.backend.note.dto.NoteSummaryProjection;
import com.spartanscholars.backend.note.dto.NoteSummaryResponse;
import com.spartanscholars.backend.notification.NotificationService;
import com.spartanscholars.backend.user.User;
import java.io.IOException;
import java.security.SecureRandom;
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
    private static final String SHARE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int SHARE_CODE_LENGTH = 10;

    private final NoteRepository noteRepository;
    private final AiService aiService;
    private final NotificationService notificationService;
    private final SecureRandom secureRandom = new SecureRandom();

    public NoteService(NoteRepository noteRepository, AiService aiService, NotificationService notificationService) {
        this.noteRepository = noteRepository;
        this.aiService = aiService;
        this.notificationService = notificationService;
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
        String preview = buildPreview(note.getPreview());
        return new NoteSummaryResponse(
                note.getId(),
                note.getTitle(),
                note.getCategory(),
                preview,
                note.getFileName(),
                note.getFileName() != null && !note.getFileName().isBlank(),
                note.getImported(),
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
        note.setImported(false);
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

    @Transactional
    public NoteShareResponse createShareCode(User user, Long noteId) {
        Note note = findOwnedNote(user, noteId);
        if (note.getShareCode() == null || note.getShareCode().isBlank()) {
            note.setShareCode(generateUniqueShareCode());
            noteRepository.save(note);
        }
        return new NoteShareResponse(note.getId(), note.getTitle(), note.getShareCode());
    }

    @Transactional
    public NoteResponse importByPassword(User user, ImportNoteRequest request) {
        User authenticated = requireUser(user);
        String password = requiredText(request.password(), "Share password is required.");
        Note source = noteRepository.findByShareCode(password)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared note not found."));
        if (source.getOwner().getId().equals(authenticated.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You already own this note.");
        }
        Note imported = cloneNote(source, authenticated);
        notifyOwnerOfImport(source, authenticated);
        return toResponse(noteRepository.save(imported));
    }

    @Transactional(readOnly = true)
    public Note getAttachment(Long noteId) {
        Note note = noteRepository.findById(noteId)
        .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Note not found."
        ));

if (note.getFileData() == null || note.getFileData().isBlank()) {
    throw new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "No attachment found for this note."
    );
}

return note;


       
       
       
        //Note note = noteRepository.findById(noteId);
        //if (note.getFileData() == null || note.getFileData().isBlank()) {
            //throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No attachment found for this note.");
        //}
        //return note;
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

        boolean allowed =
        lower.endsWith(".pdf") ||
        lower.endsWith(".doc") ||
        lower.endsWith(".docx") ||
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png");

        if (!allowed) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only PDF, DOC, DOCX, JPG, and PNG files are supported."
            );
        }
        
        //if (!(lower.endsWith(".pdf") || lower.endsWith(".doc") || lower.endsWith(".docx"))) {
            //throw new ResponseStatusException(
                    //HttpStatus.BAD_REQUEST,
                    //"Only PDF, DOC, and DOCX files are supported."
            //);
        //}
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

    @Transactional(readOnly = true)
    public Note findOwnedNoteEntity(User user, Long noteId) {
        return findOwnedNote(user, noteId);
    }

    @Transactional
    public NoteResponse importFromExisting(User user, Note source) {
        User authenticated = requireUser(user);
        if (source.getOwner().getId().equals(authenticated.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You already own this note.");
        }
        Note imported = cloneNote(source, authenticated);
        notifyOwnerOfImport(source, authenticated);
        return toResponse(noteRepository.save(imported));
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
                note.isImported(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }

    private Note cloneNote(Note source, User targetOwner) {
        Note imported = new Note();
        imported.setOwner(targetOwner);
        imported.setTitle(source.getTitle());
        imported.setCategory(source.getCategory());
        imported.setContent(source.getContent());
        imported.setFileName(source.getFileName());
        imported.setFileContentType(source.getFileContentType());
        imported.setFileData(source.getFileData());
        imported.setImported(true);
        imported.setShareCode(null);
        return imported;
    }

    private String generateUniqueShareCode() {
        String code = randomShareCode();
        while (noteRepository.existsByShareCode(code)) {
            code = randomShareCode();
        }
        return code;
    }

    private String randomShareCode() {
        StringBuilder builder = new StringBuilder(SHARE_CODE_LENGTH);
        for (int i = 0; i < SHARE_CODE_LENGTH; i++) {
            builder.append(SHARE_CODE_ALPHABET.charAt(secureRandom.nextInt(SHARE_CODE_ALPHABET.length())));
        }
        return builder.toString();
    }

    private String requiredText(String value, String message) {
        String sanitized = sanitize(value);
        if (sanitized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return sanitized;
    }

    private void notifyOwnerOfImport(Note source, User importer) {
        notificationService.notifyUser(
                source.getOwner(),
                "Your note was imported",
                importer.getName() + " imported your note " + source.getTitle() + ".",
                "/notes"
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
