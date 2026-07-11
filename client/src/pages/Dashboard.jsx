import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cowsAPI } from '../services/api';
import Loading from '../components/Loading';
import {
  HiHeart,
  HiClipboardList,
  HiCalendar,
  HiExclamationCircle,
  HiBell,
  HiShieldCheck,
  HiTrendingUp,
  HiEmojiHappy,
  HiEmojiSad,
  HiClock,
} from 'react-icons/hi';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await cowsAPI.getDashboardStats();
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Loading />;

  const statCards = [
    {
      label: 'Total Cows',
      value: stats?.totalCows || 0,
      icon: HiHeart,
      color: 'bg-primary-100 text-primary-600',
      link: '/my-cows',
    },
    {
      label: 'Healthy Cows',
      value: stats?.healthyCows || 0,
      icon: HiEmojiHappy,
      color: 'bg-emerald-100 text-emerald-600',
      link: '/my-cows',
    },
    {
      label: 'Sick Cows',
      value: stats?.sickCows || 0,
      icon: HiEmojiSad,
      color: stats?.sickCows > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500',
      link: '/my-cows',
    },
    {
      label: 'Vaccinations Due',
      value: stats?.vaccinationsDueCount || 0,
      icon: HiCalendar,
      color: stats?.vaccinationsDueCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500',
      link: '/my-cows',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user?.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stats?.avgHealthScore && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-lg">
              <HiTrendingUp className="w-5 h-5 text-primary-600" />
              <div>
                <p className="text-xs text-gray-500">Avg Health Score</p>
                <p className="text-sm font-bold text-primary-700">{stats.avgHealthScore}/100</p>
              </div>
            </div>
          )}
          <Link
            to="/notifications"
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiBell className="w-6 h-6 text-gray-600" />
            {(stats?.unreadNotifications || 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {stats.unreadNotifications > 9 ? '9+' : stats.unreadNotifications}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <Link key={index} to={card.link} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Alerts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Health Alerts Section */}
          {stats?.healthAlerts?.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title flex items-center gap-2">
                  <HiExclamationCircle className="w-5 h-5 text-red-500" />
                  Health Alerts
                </h2>
                <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">
                  {stats.healthAlerts.length} active
                </span>
              </div>
              <div className="space-y-3">
                {stats.healthAlerts.slice(0, 3).map((alert) => (
                  <Link
                    key={alert._id}
                    to={alert.actionLink || '#'}
                    className={`block p-3 rounded-lg border transition-colors ${
                      alert.severity === 'critical'
                        ? 'bg-red-50 border-red-200 hover:bg-red-100'
                        : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <HiExclamationCircle className={`w-5 h-5 ${
                        alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{alert.message}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Vaccinations */}
          {stats?.upcomingVaccinations?.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title flex items-center gap-2">
                  <HiShieldCheck className="w-5 h-5 text-primary-600" />
                  Upcoming Vaccinations
                </h2>
                <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                  {stats.vaccinationsDueCount} due
                </span>
              </div>
              <div className="space-y-3">
                {stats.upcomingVaccinations.map((vac) => (
                  <Link
                    key={vac._id}
                    to={`/vaccination/${vac.cow?._id || vac.cow}`}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
                  >
                    <HiCalendar className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {vac.vaccineName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {vac.cow?.name || `Cow #${vac.cow?.tagNumber || 'Unknown'}`} — Due:{' '}
                        {new Date(vac.nextDueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Overdue Vaccinations Warning */}
          {stats?.overdueVaccinations > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <HiClock className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-700">
                  <strong>{stats.overdueVaccinations}</strong> vaccination{stats.overdueVaccinations > 1 ? 's are' : ' is'} overdue.
                  <Link to="/my-cows" className="underline ml-1 font-medium">View details</Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Quick Actions & Stats */}
        <div className="space-y-4">
          {/* Recent Diagnoses */}
          {stats?.recentDiagnoses?.length > 0 && (
            <div className="card">
              <h2 className="section-title mb-3">Recent Diagnoses</h2>
              <div className="space-y-2">
                {stats.recentDiagnoses.map((diag) => (
                  <div key={diag._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{diag.condition}</p>
                      <p className="text-xs text-gray-500">
                        {diag.cow?.name || `Cow #${diag.cow?.tagNumber || ''}`}
                      </p>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                      diag.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      diag.severity === 'severe' ? 'bg-orange-100 text-orange-700' :
                      diag.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {diag.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <h2 className="section-title mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to="/add-cow"
                className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all"
              >
                <span className="text-xl">➕</span>
                <span className="text-sm font-medium text-gray-700">Add New Cow</span>
              </Link>
              <Link
                to="/ai-diagnosis"
                className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all"
              >
                <span className="text-xl">🤖</span>
                <span className="text-sm font-medium text-gray-700">AI Diagnosis</span>
              </Link>
              <Link
                to="/notifications"
                className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all"
              >
                <span className="text-xl">🔔</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Notifications</span>
                  {(stats?.unreadNotifications || 0) > 0 && (
                    <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      {stats.unreadNotifications} unread
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;