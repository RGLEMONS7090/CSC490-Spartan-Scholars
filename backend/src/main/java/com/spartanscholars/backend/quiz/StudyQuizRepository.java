package com.spartanscholars.backend.quiz;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyQuizRepository extends JpaRepository<StudyQuiz, Long> {

    List<StudyQuiz> findByOwnerIdOrderByUpdatedAtDesc(Long ownerId);

    List<StudyQuiz> findAllByOwnerIdOrderByUpdatedAtDesc(Long ownerId);

    Optional<StudyQuiz> findByIdAndOwnerId(Long id, Long ownerId);

    Optional<StudyQuiz> findByShareCode(String shareCode);

    @EntityGraph(attributePaths = {"questions"})
    Optional<StudyQuiz> findWithQuestionsByShareCode(String shareCode);

    @EntityGraph(attributePaths = {"flashcards"})
    Optional<StudyQuiz> findWithFlashcardsByShareCode(String shareCode);

    boolean existsByShareCode(String shareCode);

    long countByOwnerId(Long ownerId);

    @EntityGraph(attributePaths = {"questions"})
    Optional<StudyQuiz> findWithQuestionsByIdAndOwnerId(Long id, Long ownerId);

    @EntityGraph(attributePaths = {"flashcards"})
    Optional<StudyQuiz> findWithFlashcardsByIdAndOwnerId(Long id, Long ownerId);
}
