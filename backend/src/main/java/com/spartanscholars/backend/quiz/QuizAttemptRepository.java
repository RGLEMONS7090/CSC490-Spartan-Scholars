package com.spartanscholars.backend.quiz;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    List<QuizAttempt> findByUserIdAndQuizIdInOrderByCompletedAtDesc(Long userId, List<Long> quizIds);

    void deleteByQuizId(Long quizId);

    void deleteByUserId(Long userId);

    @Query("select count(distinct qa.quiz.id) from QuizAttempt qa where qa.user.id = :userId")
    long countDistinctCompletedByUserId(Long userId);

    @Query("select avg(qa.score) from QuizAttempt qa where qa.user.id = :userId and qa.score is not null")
    Double averageScoreByUserId(Long userId);
}
