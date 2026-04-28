package com.spartanscholars.backend.discussion;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DiscussionCommentRepository extends JpaRepository<DiscussionComment, Long> {

    List<DiscussionComment> findByDiscussionIdOrderByCreatedAtAsc(Long discussionId);

    @Query("""
            select c.discussion.id as discussionId, count(c) as total
            from DiscussionComment c
            where c.discussion.id in :ids
            group by c.discussion.id
            """)
    List<CountProjection> countByDiscussionIds(@Param("ids") Collection<Long> ids);

    long countByDiscussionId(Long discussionId);

    void deleteByDiscussionId(Long discussionId);

    List<DiscussionComment> findByAuthorId(Long authorId);

    void deleteByAuthorId(Long authorId);

    @Modifying
    @Query("""
            update DiscussionComment c
            set c.parent = null
            where c.parent.id in :parentIds
            """)
    void clearParentsByParentIds(@Param("parentIds") Collection<Long> parentIds);
}
