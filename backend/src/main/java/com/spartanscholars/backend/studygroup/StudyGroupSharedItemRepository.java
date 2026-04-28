package com.spartanscholars.backend.studygroup;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyGroupSharedItemRepository extends JpaRepository<StudyGroupSharedItem, Long> {

    @EntityGraph(attributePaths = {"sharedBy"})
    List<StudyGroupSharedItem> findByGroupIdOrderByCreatedAtDesc(Long groupId);

    @EntityGraph(attributePaths = {"group", "sharedBy", "note", "quiz"})
    Optional<StudyGroupSharedItem> findByIdAndGroupId(Long id, Long groupId);

    void deleteByQuizId(Long quizId);
}
