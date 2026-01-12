package com.saarthix.jobs.controller;

import com.saarthix.jobs.model.Notification;
import com.saarthix.jobs.model.User;
import com.saarthix.jobs.repository.NotificationRepository;
import com.saarthix.jobs.repository.UserRepository;
import org.springframework.http.ResponseEntity;
// OAuth2 imports removed - using token-based auth only
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:2003", allowCredentials = "true")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationController(NotificationRepository notificationRepository,
                                 UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get all notifications for the current authenticated user
     * Filtered by userType to ensure users only see relevant notifications
     */
    @GetMapping
    public ResponseEntity<?> getMyNotifications(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        System.out.println("=========================================");
        System.out.println("GET /api/notifications");
        System.out.println("AuthHeader: " + (authHeader != null ? (authHeader.length() > 50 ? authHeader.substring(0, 50) + "..." : authHeader) : "null"));
        System.out.println("=========================================");
        
        // Try to resolve user from token
        User user = resolveUser(authHeader);
        System.out.println("Resolved user: " + (user != null ? user.getEmail() + " (type: " + user.getUserType() + ")" : "null"));
        
        if (user == null) {
            System.err.println("User resolution failed - returning 401");
            return ResponseEntity.status(401).body("User not found");
        }

        // Get all notifications for this user, ordered by most recent first
        List<Notification> allNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        
        // Filter by userType to ensure users only see their relevant notifications
        List<Notification> filteredNotifications = allNotifications.stream()
            .filter(n -> user.getUserType() != null && user.getUserType().equals(n.getUserType()))
            .toList();
        
        return ResponseEntity.ok(filteredNotifications);
    }

    /**
     * Get unread notifications count for the current authenticated user
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Try to resolve user from token
        User user = resolveUser(authHeader);
        if (user == null) {
            return ResponseEntity.ok(Map.of("count", 0));
        }

        // Get all unread notifications for this user
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getId());
        
        // Filter by userType
        long unreadCount = unreadNotifications.stream()
            .filter(n -> user.getUserType() != null && user.getUserType().equals(n.getUserType()))
            .count();
        
        return ResponseEntity.ok(Map.of("count", unreadCount));
    }

    /**
     * Mark a notification as read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Try to resolve user from token
        User user = resolveUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        // Find the notification
        Notification notification = notificationRepository.findById(id).orElse(null);
        if (notification == null) {
            return ResponseEntity.status(404).body("Notification not found");
        }

        // Verify the notification belongs to the current user
        if (!user.getId().equals(notification.getUserId())) {
            return ResponseEntity.status(403).body("You can only mark your own notifications as read");
        }

        // Mark as read
        notification.setRead(true);
        notificationRepository.save(notification);

        return ResponseEntity.ok(notification);
    }

    /**
     * Mark all notifications as read for the current user
     */
    @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllAsRead(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Try to resolve user from token
        User user = resolveUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        // Get all unread notifications for this user
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getId());
        
        // Mark all as read
        unreadNotifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unreadNotifications);

        return ResponseEntity.ok(Map.of("message", "All notifications marked as read", "count", unreadNotifications.size()));
    }

    /**
     * Delete a notification
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable String id, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Try to resolve user from token
        User user = resolveUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        // Find the notification
        Notification notification = notificationRepository.findById(id).orElse(null);
        if (notification == null) {
            return ResponseEntity.status(404).body("Notification not found");
        }

        // Verify the notification belongs to the current user
        if (!user.getId().equals(notification.getUserId())) {
            return ResponseEntity.status(403).body("You can only delete your own notifications");
        }

        // Delete the notification
        notificationRepository.delete(notification);

        return ResponseEntity.ok(Map.of("message", "Notification deleted successfully"));
    }

    /**
     * Helper method to resolve user from Saarthix token (token-based auth only)
     */
    private User resolveUser(String authHeader) {
        System.out.println("=== NotificationController.resolveUser ===");
        System.out.println("AuthHeader: " + (authHeader != null ? (authHeader.length() > 50 ? authHeader.substring(0, 50) + "..." : authHeader) : "null"));
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.err.println("No Bearer token found in Authorization header");
            return null;
        }
        
        String token = authHeader.substring(7);
        System.out.println("Token length: " + token.length());
        
        // Decode custom SomethingX JWT token format
        try {
            String[] parts = token.split("\\.");
            System.out.println("Token parts count: " + parts.length);
            
            if (parts.length >= 2) {
                // Decode the payload (first part)
                String payload = new String(java.util.Base64.getDecoder().decode(parts[0]), 
                    java.nio.charset.StandardCharsets.UTF_8);
                System.out.println("Decoded payload: " + payload);
                
                // Parse the custom format: key:value|key:value|
                Map<String, String> claims = new java.util.HashMap<>();
                String[] claimPairs = payload.split("\\|");
                for (String pair : claimPairs) {
                    if (pair.contains(":")) {
                        String[] keyValue = pair.split(":", 2);
                        if (keyValue.length == 2) {
                            claims.put(keyValue[0], keyValue[1]);
                        }
                    }
                }
                
                System.out.println("Extracted claims: " + claims);
                
                // Get email from claims
                String email = claims.get("email");
                if (email != null) {
                    System.out.println("Extracted email: " + email);
                    Optional<User> userOpt = userRepository.findByEmail(email);
                    if (userOpt.isPresent()) {
                        System.out.println("User found: " + userOpt.get().getEmail() + " (type: " + userOpt.get().getUserType() + ")");
                        return userOpt.get();
                    } else {
                        System.err.println("User not found in database for email: " + email);
                    }
                } else {
                    System.err.println("Email not found in token claims");
                }
            } else {
                System.err.println("Token does not have expected format (expected at least 2 parts)");
            }
        } catch (Exception e) {
            System.err.println("Error decoding token in NotificationController: " + e.getMessage());
            e.printStackTrace();
        }
        
        return null;
    }
}

