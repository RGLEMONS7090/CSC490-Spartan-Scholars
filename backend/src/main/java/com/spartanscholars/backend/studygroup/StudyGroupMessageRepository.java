package com.spartanscholars.backend.studygroup;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyGroupMessageRepository extends JpaRepository<StudyGroupMessage, Long> {

    List<StudyGroupMessage> findByGroupIdOrderByCreatedAtAsc(Long groupId);

    void deleteByAuthorId(Long authorId);
}
