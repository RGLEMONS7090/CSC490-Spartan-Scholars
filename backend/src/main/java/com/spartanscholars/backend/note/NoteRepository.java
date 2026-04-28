package com.spartanscholars.backend.note;

import com.spartanscholars.backend.note.dto.NoteSummaryProjection;
import com.spartanscholars.backend.note.dto.PublicBoardNoteProjection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByOwnerIdOrderByUpdatedAtDesc(Long ownerId);

    @Query(value = """
            select
                n.id as id,
                n.title as title,
                n.category as category,
                substring(coalesce(n.content, ''), 1, 240) as preview,
                n.file_name as fileName,
                n.imported as imported,
                n.updated_at as updatedAt
            from notes n
            where n.user_id = :ownerId
            order by n.updated_at desc
            """, nativeQuery = true)
    List<NoteSummaryProjection> findSummariesByOwnerIdOrderByUpdatedAtDesc(Long ownerId);

    Optional<Note> findByIdAndOwnerId(Long id, Long ownerId);

    Optional<Note> findByShareCode(String shareCode);

    Optional<Note> findByIdAndPublishedToBoardTrue(Long id);

    @Query(value = """
            select
                n.id as id,
                n.title as title,
                n.category as category,
                substring(coalesce(n.content, ''), 1, 240) as preview,
                n.file_name as fileName,
                n.file_content_type as fileContentType,
                n.imported as imported,
                n.published_to_board as publishedToBoard,
                n.user_id as ownerId,
                u.name as authorName,
                n.created_at as createdAt,
                n.updated_at as updatedAt,
                n.published_to_board_at as publishedToBoardAt
            from notes n
            join users u on u.id = n.user_id
            where n.published_to_board = true
            order by n.published_to_board_at desc, n.updated_at desc
            """, nativeQuery = true)
    List<PublicBoardNoteProjection> findPublicBoardSummariesOrderByPublishedToBoardAtDesc();

    boolean existsByShareCode(String shareCode);

    long countByOwnerId(Long ownerId);

    void deleteByOwnerId(Long ownerId);
}
