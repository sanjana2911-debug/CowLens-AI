import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import Loading from '../components/Loading';
import {
  HiBell,
  HiCheck,
  HiTrash,
  HiExclamationCircle,
  HiCalendar,
  HiShieldCheck,
  HiChip,
  HiInformationCircle,
} from 'react-icons/hi';

const typeIcons = {
  vaccination_reminder: { icon: HiCalendar, color: 'text-green-600', bg: 'bg-green-100' },
  vaccination_due: { icon: HiShieldCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
  health_alert: { icon: HiExclamationCircle, color: 'text-red-600', bg: 'bg-red-100' },
  diagnosis_update: { icon: HiChip, color: 'text-purple-600', bg: 'bg-purple-100' },
  health_score: { icon: HiInformationCircle, color: 'text-primary-600', bg: 'bg-primary-100' },
  system: { icon: HiInformationCircle, color: 'text-gray-600', bg: 'bg-gray-100' },
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll(filter === 'unread');
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(notifications.filter((n) => n._id !== id));
      const deleted = notifications.find((n) => n._id === id);
      if (deleted && !deleted.isRead) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  if (loading) return <Loading />;

  const getTypeStyle = (type) => typeIcons[type] || typeIcons.system;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className="btn-secondary text-sm !py-2 !px-3">
              <HiCheck className="w-4 h-4 inline mr-1" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['all', 'unread'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="card text-center py-12">
          <HiBell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-500">
            {filter === 'unread' ? 'No unread notifications' : 'You have no notifications yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const style = getTypeStyle(notification.type);
            const TypeIcon = style.icon;

            return (
              <div
                key={notification._id}
                className={`card flex items-start gap-4 transition-all ${
                  !notification.isRead ? 'ring-2 ring-primary-100 bg-primary-50/30' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0`}>
                  <TypeIcon className={`w-5 h-5 ${style.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                        {!notification.isRead && (
                          <span className="ml-2 w-2 h-2 bg-primary-500 rounded-full inline-block" />
                        )}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {notification.actionLink && (
                      <Link
                        to={notification.actionLink}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View Details
                      </Link>
                    )}
                    {notification.relatedCow?.name && (
                      <span className="text-xs text-gray-400">
                        • {notification.relatedCow.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <HiCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;