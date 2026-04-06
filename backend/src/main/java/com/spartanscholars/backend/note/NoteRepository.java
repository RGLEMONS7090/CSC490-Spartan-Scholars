package com.spartanscholars.backend.note;

import com.spartanscholars.backend.note.dto.NoteSummaryProjection;
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

    List<Note> findByPublishedToBoardTrueOrderByPublishedToBoardAtDesc();

    boolean existsByShareCode(String shareCode);

    long countByOwnerId(Long ownerId);

    void deleteByOwnerId(Long ownerId);
}
