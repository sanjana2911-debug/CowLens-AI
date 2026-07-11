import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cowsAPI } from '../services/api';
import AnimatedPage from '../components/AnimatedPage';
import StatCard from '../components/StatCard';
import { CardSkeleton } from '../components/Skeleton';
import {
  HiHeart, HiClipboardList, HiCalendar, HiExclamationCircle, HiBell,
  HiShieldCheck, HiTrendingUp, HiEmojiHappy, HiEmojiSad, HiClock,
  HiChartBar, HiBeaker, HiChat, HiDocumentReport, HiArrowRight, HiQrcode,
  HiLocationMarker, HiSparkles, HiPlus,
} from 'react-icons/hi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

  if (loading) return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;

  // Build health trend from real data when available
  const healthTrend = stats?.healthTrend && stats.healthTrend.length > 0
    ? stats.healthTrend.map(item => ({ month: item.month, score: item.score }))
    : [
        { month: 'Jan', score: stats?.avgHealthScore || 75 },
        { month: 'Feb', score: stats?.avgHealthScore || 75 },
        { month: 'Mar', score: stats?.avgHealthScore || 75 },
        { month: 'Apr', score: stats?.avgHealthScore || 75 },
        { month: 'May', score: stats?.avgHealthScore || 75 },
        { month: 'Jun', score: stats?.avgHealthScore || 75 },
      ];

  const quickActions = [
    { to: '/add-cow', label: 'Register Cow', icon: HiPlus, color: 'bg-primary-500', desc: 'Add a new cow to your herd' },
    { to: '/ai-diagnosis', label: 'AI Diagnosis', icon: HiBeaker, color: 'bg-purple-500', desc: 'Analyze symptoms with AI' },
    { to: '/ai-chat', label: 'AI Chat', icon: HiChat, color: 'bg-blue-500', desc: 'Ask health questions' },
    { to: '/vaccination', label: 'Vaccinations', icon: HiShieldCheck, color: 'bg-green-500', desc: 'Track due dates' },
    { to: '/milk-production', label: 'Milk Tracker', icon: HiChartBar, color: 'bg-amber-500', desc: 'Monitor production' },
    { to: '/analytics', label: 'Analytics', icon: HiTrendingUp, color: 'bg-indigo-500', desc: 'View insights' },
  ];

  return (
    <AnimatedPage>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 md:p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
              <p className="text-primary-100 mt-1">Here's your herd overview for today</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
              <HiSparkles className="w-5 h-5" />
              <span className="text-sm font-medium">AI-Powered</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-primary-200 text-xs">Total Cows</p>
              <p className="text-2xl font-bold">{stats?.totalCows || 0}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-primary-200 text-xs">Health Score</p>
              <p className="text-2xl font-bold">{stats?.avgHealthScore || 0}%</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-primary-200 text-xs">Vaccinations</p>
              <p className="text-2xl font-bold">{stats?.vaccinationsDueCount || 0} due</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-primary-200 text-xs">Alerts</p>
              <p className="text-2xl font-bold">{stats?.healthAlerts?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Cows" value={stats?.totalCows || 0} icon={HiHeart} color="primary" link="/my-cows" />
          <StatCard label="Healthy" value={stats?.healthyCows || 0} icon={HiEmojiHappy} color="green" link="/my-cows" />
          <StatCard label="Needs Attention" value={(stats?.sickCows || 0) + (stats?.criticalCows || 0)} icon={HiEmojiSad} color={(stats?.sickCows || 0) > 0 ? 'red' : 'gray'} link="/my-cows" />
          <StatCard label="Vaccinations Due" value={stats?.vaccinationsDueCount || 0} icon={HiCalendar} color={(stats?.vaccinationsDueCount || 0) > 0 ? 'amber' : 'gray'} link="/vaccination" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Health Trend Chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Health Score Trend</h2>
                <Link to="/analytics" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  Full Analytics <HiArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={healthTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                  <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Health Alerts */}
            {stats?.healthAlerts?.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-title flex items-center gap-2">
                    <HiExclamationCircle className="w-5 h-5 text-red-500" />
                    Health Alerts
                  </h2>
                  <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full font-medium">{stats.healthAlerts.length} active</span>
                </div>
                <div className="space-y-2">
                  {stats.healthAlerts.slice(0, 4).map((alert) => (
                    <Link key={alert._id} to={alert.actionLink || '#'}
                      className={`block p-3 rounded-lg border transition-colors ${
                        alert.severity === 'critical' ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                      }`}>
                      <div className="flex items-center gap-2">
                        <HiExclamationCircle className={`w-5 h-5 ${alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`} />
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
                  <Link to="/vaccination" className="text-xs text-primary-600 font-medium">View all</Link>
                </div>
                <div className="space-y-2">
                  {stats.upcomingVaccinations.slice(0, 4).map((vac) => (
                    <Link key={vac._id} to={`/vaccination/${vac.cow?._id || vac.cow}`}
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
                      <HiCalendar className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{vac.vaccineName}</p>
                        <p className="text-xs text-gray-500">{vac.cow?.name || `Cow #${vac.cow?.tagNumber || 'Unknown'}`} — Due: {new Date(vac.nextDueDate).toLocaleDateString()}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Overdue Warning */}
            {stats?.overdueVaccinations > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <HiClock className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  <strong>{stats.overdueVaccinations}</strong> vaccination{stats.overdueVaccinations > 1 ? 's are' : ' is'} overdue.
                  <Link to="/vaccination" className="underline ml-1 font-medium">View schedule</Link>
                </p>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="card">
              <h2 className="section-title mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-2">
                {quickActions.map((action, i) => (
                  <Link key={i} to={action.to}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all group">
                    <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{action.label}</p>
                      <p className="text-xs text-gray-400">{action.desc}</p>
                    </div>
                    <HiArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Diagnoses */}
            {stats?.recentDiagnoses?.length > 0 && (
              <div className="card">
                <h2 className="section-title mb-3">Recent Diagnoses</h2>
                <div className="space-y-2">
                  {stats.recentDiagnoses.slice(0, 4).map((diag) => (
                    <div key={diag._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 truncate">{diag.condition}</p>
                        <p className="text-xs text-gray-500">{diag.cow?.name || `Cow #${diag.cow?.tagNumber || ''}`}</p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                        diag.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        diag.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        diag.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>{diag.severity}</span>
                    </div>
                  ))}
                </div>
                <Link to="/ai-diagnosis" className="mt-3 text-xs text-primary-600 font-medium flex items-center gap-1">
                  New diagnosis <HiArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Resources */}
            <div className="card bg-gradient-to-br from-primary-50 to-green-50 border-primary-100">
              <HiQrcode className="w-8 h-8 text-primary-600 mb-2" />
              <h3 className="font-semibold text-gray-800">QR Health Passport</h3>
              <p className="text-sm text-gray-600 mt-1">Generate digital health passports for your cows</p>
              <Link to="/cow-passport" className="mt-3 inline-flex items-center gap-1 text-sm text-primary-600 font-medium">
                View Passports <HiArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <HiLocationMarker className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-800">Nearby Vets</h3>
              <p className="text-sm text-gray-600 mt-1">Find veterinary clinics near you</p>
              <Link to="/nearby-vets" className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 font-medium">
                Find Vets <HiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default Dashboard;