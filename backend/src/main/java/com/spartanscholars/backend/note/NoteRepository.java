package com.spartanscholars.backend.note;

import com.spartanscholars.backend.note.dto.NoteSummaryProjection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByOwnerIdOrderByUpdatedAtDesc(Long ownerId);

    @Query("""
            select
                n.id as id,
                n.title as title,
                n.category as category,
                n.content as content,
                n.fileName as fileName,
                n.updatedAt as updatedAt
            from Note n
            where n.owner.id = :ownerId
            order by n.updatedAt desc
            """)
    List<NoteSummaryProjection> findSummariesByOwnerIdOrderByUpdatedAtDesc(Long ownerId);

    Optional<Note> findByIdAndOwnerId(Long id, Long ownerId);

    long countByOwnerId(Long ownerId);

    void deleteByOwnerId(Long ownerId);
}
