import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HiCog } from 'react-icons/hi';

const Settings = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    vaccinationReminders: true,
    healthAlert: false,
  });

  const handleToggle = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your application preferences</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <HiCog className="w-5 h-5 text-gray-600" />
          <h2 className="section-title">Notification Preferences</h2>
        </div>

        <div className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive email updates about your account' },
            { key: 'vaccinationReminders', label: 'Vaccination Reminders', desc: 'Get reminded when vaccinations are due' },
            { key: 'healthAlert', label: 'Health Alerts', desc: 'Receive alerts about unusual health patterns' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <button
                onClick={() => handleToggle(item.key)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  notifications[item.key] ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    notifications[item.key] ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="section-title mb-4">Account Information</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Account Type</p>
            <p className="text-sm font-medium text-gray-900 mt-1 capitalize">{user?.role || 'User'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;