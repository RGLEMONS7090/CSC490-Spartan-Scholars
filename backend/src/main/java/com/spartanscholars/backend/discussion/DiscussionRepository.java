package com.spartanscholars.backend.discussion;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscussionRepository extends JpaRepository<Discussion, Long> {

    List<Discussion> findAllByOrderByUpdatedAtDesc();

    List<Discussion> findAllByOrderByCreatedAtDesc();
}
