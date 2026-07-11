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
  HiChartBar,
  HiClipboardList,
  HiCalendar,
  HiChat,
  HiDocumentReport,
  HiQrcode,
} from 'react-icons/hi';
import { notificationAPI } from '../services/api';

const sidebarLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: HiHome },
  { to: '/my-cows', label: 'My Cows', icon: HiHeart },
  { to: '/add-cow', label: 'Register Cow', icon: HiPlusCircle },
  { to: '/ai-diagnosis', label: 'AI Diagnosis', icon: HiBeaker },
  { to: '/health-records', label: 'Health Records', icon: HiClipboardList },
  { to: '/vaccination', label: 'Vaccinations', icon: HiCalendar },
  { to: '/milk-production', label: 'Milk Production', icon: HiChartBar },
  { to: '/analytics', label: 'Analytics', icon: HiChartBar },
  { to: '/cow-passport', label: 'QR Passport', icon: HiQrcode },
  { to: '/ai-chat', label: 'AI Chat', icon: HiChat },
  { to: '/notifications', label: 'Notifications', icon: HiBell, badge: true },
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
      } catch { /* ignore */ }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 
                    transition-all duration-300 z-20 w-64 overflow-y-auto
                    ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <nav className="p-4 space-y-0.5">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative
                ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 border border-primary-100 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{link.label}</span>
              {link.badge && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
            <p className="text-xs font-medium text-primary-700">CowLens AI</p>
            <p className="text-xs text-primary-500 mt-0.5">v2.0.0 • Smart Herd Management</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;