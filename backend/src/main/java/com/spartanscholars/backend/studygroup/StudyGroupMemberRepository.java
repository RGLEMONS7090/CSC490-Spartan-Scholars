package com.spartanscholars.backend.studygroup;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudyGroupMemberRepository extends JpaRepository<StudyGroupMember, Long> {

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    long countByGroupId(Long groupId);

    Optional<StudyGroupMember> findByGroupIdAndUserId(Long groupId, Long userId);

    @Query("""
            select m.group.id, count(m)
            from StudyGroupMember m
            where m.group.id in :groupIds
            group by m.group.id
            """)
    List<Object[]> countByGroupIds(@Param("groupIds") Collection<Long> groupIds);

    @Query("""
            select m.group.id
            from StudyGroupMember m
            where m.user.id = :userId and m.group.id in :groupIds
            """)
    List<Long> findJoinedGroupIds(@Param("userId") Long userId, @Param("groupIds") Collection<Long> groupIds);

    void deleteByUserId(Long userId);
}
