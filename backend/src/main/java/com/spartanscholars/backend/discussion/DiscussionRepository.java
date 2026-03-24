package com.spartanscholars.backend.discussion;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscussionRepository extends JpaRepository<Discussion, Long> {

    List<Discussion> findAllByOrderByUpdatedAtDesc();

    List<Discussion> findAllByOwnerIdOrderByUpdatedAtDesc(Long ownerId);

    long countByOwnerId(Long ownerId);

    List<Discussion> findAllByOrderByCreatedAtDesc();

    List<Discussion> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrderByUpdatedAtDesc(
            String titleQuery,
            String descriptionQuery
    );

    List<Discussion> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrderByCreatedAtDesc(
            String titleQuery,
            String descriptionQuery
    );
}
