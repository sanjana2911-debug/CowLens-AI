const Notification = require('../models/Notification');
const Cow = require('../models/Cow');
const Vaccination = require('../models/Vaccination');

/**
 * Helper to check and generate upcoming vaccination reminders
 */
const checkVaccinationReminders = async (userId) => {
  try {
    const now = new Date();
    
    // Get all vaccinations with a nextDueDate
    const vaccinations = await Vaccination.find({
      user: userId,
      nextDueDate: { $exists: true, $ne: null },
    });

    for (const vac of vaccinations) {
      const dueDate = new Date(vac.nextDueDate);
      
      // Calculate difference in days
      const diffTime = dueDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // We send reminder if it is due within 7 days, or is overdue (diffDays <= 7)
      if (diffDays <= 7) {
        // Check if reminder already exists
        const existingNotification = await Notification.findOne({
          user: userId,
          type: 'vaccination_reminder',
          relatedVaccination: vac._id,
        });

        if (!existingNotification) {
          const cow = await Cow.findById(vac.cow);
          if (cow) {
            const isOverdue = dueDate < now;
            await Notification.create({
              user: userId,
              type: 'vaccination_reminder',
              title: isOverdue ? `Vaccination Overdue: ${vac.vaccineName}` : `Vaccination Due: ${vac.vaccineName}`,
              message: `${cow.name || `Cow #${cow.tagNumber}`} is ${isOverdue ? 'overdue for' : 'due for'} ${vac.vaccineName} vaccination on ${dueDate.toLocaleDateString()}`,
              relatedCow: cow._id,
              relatedVaccination: vac._id,
              severity: isOverdue ? 'warning' : 'info',
              actionLink: `/vaccination/${cow._id}`,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error generating vaccination reminders:', error);
  }
};

/**
 * @desc    Get all notifications for current user
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
  try {
    // Generate vaccination reminders
    await checkVaccinationReminders(req.user._id);

    const { unreadOnly } = req.query;
    const query = { user: req.user._id };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort('-createdAt')
      .populate('relatedCow', 'name tagNumber')
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = async (req, res, next) => {
  try {
    // Generate vaccination reminders
    await checkVaccinationReminders(req.user._id);

    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  checkVaccinationReminders,
};