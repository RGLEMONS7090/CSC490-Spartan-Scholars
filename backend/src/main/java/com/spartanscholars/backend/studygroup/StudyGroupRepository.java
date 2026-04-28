package com.spartanscholars.backend.studygroup;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyGroupRepository extends JpaRepository<StudyGroup, Long> {

    Optional<StudyGroup> findById(Long id);

    List<StudyGroup> findAllByOrderByUpdatedAtDesc();

    List<StudyGroup> findAllByOwnerId(Long ownerId);

    boolean existsByAccessCode(String accessCode);

    Optional<StudyGroup> findByAccessCode(String accessCode);
}
