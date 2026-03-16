package com.spartanscholars.backend.discussion;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.spartanscholars.backend.user.User;

public interface DiscussionLikeRepository extends JpaRepository<DiscussionLike, Long> {

    Optional<DiscussionLike> findByDiscussionIdAndUserId(Long discussionId, Long userId);

    long countByDiscussionId(Long discussionId);

    boolean existsByUserAndDiscussion(User user, Discussion discussion);

    @Query("""
            select l.discussion.id as discussionId, count(l) as total
            from DiscussionLike l
            where l.discussion.id in :ids
            group by l.discussion.id
            """)
    List<CountProjection> countByDiscussionIds(@Param("ids") Collection<Long> ids);

    @Query("""
            select l.discussion.id
            from DiscussionLike l
            where l.user.id = :userId and l.discussion.id in :ids
            """)
    List<Long> findLikedDiscussionIds(@Param("userId") Long userId, @Param("ids") Collection<Long> ids);

    void deleteByDiscussionId(Long discussionId);
}
