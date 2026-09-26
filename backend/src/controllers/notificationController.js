import { Notification } from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    // If not logged in, return empty notifications array
    if (!req.user) {
      return res.json({
        success: true,
        unreadCount: 0,
        notifications: []
      });
    }

    const role = req.user.role;
    const userId = req.user._id;

    // Strict query: Only fetch notifications directed specifically to this user,
    // or broadcast to their role / all with no specific userId target
    const query = {
      $or: [
        { userId: userId },
        { targetRole: role, userId: null },
        { targetRole: 'all', userId: null }
      ]
    };

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(30);
    const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

    res.json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { id } = req.params;
    const notif = await Notification.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { userId: req.user._id },
          { targetRole: req.user.role, userId: null },
          { targetRole: 'all', userId: null }
        ]
      },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    res.json({
      success: true,
      notification: notif
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const role = req.user.role;
    const userId = req.user._id;

    await Notification.updateMany(
      {
        $or: [
          { userId: userId },
          { targetRole: role, userId: null },
          { targetRole: 'all', userId: null }
        ],
        isRead: false
      },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

