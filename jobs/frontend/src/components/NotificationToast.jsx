import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { markNotificationAsRead } from '../api/notificationApi';

export default function NotificationToast({ notification, onClose, onMarkRead }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const timeoutRef = useRef(null);

  // Play notification sound - unique ascending three-tone chime
  useEffect(() => {
    const playNotificationSound = async () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        
        // Resume audio context if suspended (needed for autoplay policies)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const now = audioContext.currentTime;
        
        // Create a pleasant ascending three-tone chime pattern (distinctive notification sound)
        // Musical notes: C5 - E5 - G5 (major triad - pleasant and recognizable)
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        frequencies.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = freq;
          oscillator.type = 'sine'; // Pure tone for clarity
          
          // Each tone starts with a slight delay (ascending pattern)
          const startTime = now + (index * 0.08); // 80ms apart
          const duration = 0.15; // 150ms per tone
          
          // Smooth attack and decay
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.03);
          gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.08);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        });
        
        // Clean up after all sounds complete
        setTimeout(() => {
          try {
            if (audioContext.state !== 'closed') {
              audioContext.close();
            }
          } catch (e) {
            // Ignore cleanup errors
          }
        }, 500);
        
      } catch (error) {
        // Silently fail if audio can't be played (autoplay restrictions, etc.)
        console.log('Notification sound unavailable:', error.message);
      }
    };

    // Play sound when toast appears
    playNotificationSound();

    // Auto-close after 5 seconds
    timeoutRef.current = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onClose]);

  const handleClick = async () => {
    // Mark as read if not already read
    if (!notification.read && onMarkRead) {
      await onMarkRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'application_status_update' && user?.userType === 'APPLICANT') {
      navigate('/job-tracker');
    } else if (notification.type === 'new_application' && user?.userType === 'INDUSTRY') {
      if (notification.jobId) {
        navigate('/manage-applications', {
          state: { selectedJobId: notification.jobId, selectedApplicationId: notification.applicationId }
        });
      } else {
        navigate('/manage-applications');
      }
    }

    onClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application_status_update':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'new_application':
        return (
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  return (
    <div
      className="max-w-md w-full bg-white rounded-lg shadow-2xl border border-gray-200 animate-slideInRight cursor-pointer hover:shadow-3xl transition-all duration-300"
      onClick={handleClick}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-gray-900">
              {notification.title}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-4 h-4 text-gray-400 hover:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-blue-600 mt-2 font-medium">
            Click to view →
          </p>
        </div>
      </div>
    </div>
  );
}

