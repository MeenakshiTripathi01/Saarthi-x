import axios from 'axios';
import axiosInstance from './axiosConfig';
import { BACKEND_URL } from '../config';

const BASE_URL = `${BACKEND_URL}/api/notifications`;

/**
 * Fetch all notifications for the current user
 */
export const fetchNotifications = async () => {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async () => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/unread-count`);
    return response.data.count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await axiosInstance.put(
      `${BASE_URL}/${notificationId}/read`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await axiosInstance.put(
      `${BASE_URL}/mark-all-read`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await axiosInstance.delete(
      `${BASE_URL}/${notificationId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

