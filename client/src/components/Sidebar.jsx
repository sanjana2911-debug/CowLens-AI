import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  HiHome,
  HiHeart,
  HiPlusCircle,
  HiBeaker,
  HiUser,
  HiCog,
  HiBell,
  HiLocationMarker,
} from 'react-icons/hi';
import { notificationAPI } from '../services/api';

const sidebarLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: HiHome },
  { to: '/my-cows', label: 'My Cows', icon: HiHeart },
  { to: '/add-cow', label: 'Add Cow', icon: HiPlusCircle },
  { to: '/notifications', label: 'Notifications', icon: HiBell, badge: true },
  { to: '/ai-diagnosis', label: 'AI Diagnosis', icon: HiBeaker },
  { to: '/nearby-vets', label: 'Nearby Vets', icon: HiLocationMarker },
  { to: '/profile', label: 'Profile', icon: HiUser },
  { to: '/settings', label: 'Settings', icon: HiCog },
];

const Sidebar = ({ open, setOpen }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await notificationAPI.getUnreadCount();
        setUnreadCount(res.data.data.unreadCount);
      } catch {
        // Ignore errors
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 
                    transition-all duration-300 z-20 w-64
                    ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <nav className="p-4 space-y-1">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors relative
                ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 border border-primary-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <link.icon className="w-5 h-5" />
              {link.label}
              {link.badge && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">CowLens AI v1.0.0</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;