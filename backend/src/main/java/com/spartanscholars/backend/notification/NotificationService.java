package com.spartanscholars.backend.notification;

import com.spartanscholars.backend.notification.dto.NotificationItemResponse;
import com.spartanscholars.backend.notification.dto.NotificationListResponse;
import com.spartanscholars.backend.user.User;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public NotificationListResponse list(User user) {
        User authenticated = requireUser(user);
        List<NotificationItemResponse> items = notificationRepository.findTop20ByUserIdOrderByCreatedAtDesc(authenticated.getId())
                .stream()
                .map(notification -> new NotificationItemResponse(
                        notification.getId(),
                        notification.getTitle(),
                        notification.getMessage(),
                        notification.getHref(),
                        notification.isRead(),
                        notification.getCreatedAt()
                ))
                .toList();
        return new NotificationListResponse(
                notificationRepository.countByUserIdAndReadFalse(authenticated.getId()),
                items
        );
    }

    @Transactional
    public void markAllRead(User user) {
        notificationRepository.markAllReadByUserId(requireUser(user).getId());
    }

    @Transactional
    public void markRead(User user, Long id) {
        User authenticated = requireUser(user);
        Notification notification = notificationRepository.findByIdAndUserId(id, authenticated.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found."));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyUser(User recipient, String title, String message, String href) {
        if (recipient == null || recipient.getId() == null) {
            return;
        }
        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setHref(href);
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    private User requireUser(User user) {
        if (user == null || user.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "You must be logged in.");
        }
        return user;
    }
}
