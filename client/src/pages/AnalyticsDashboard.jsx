import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cowsAPI, healthAPI, vaccinationAPI, diagnosisAPI } from '../services/api';
import AnimatedPage from '../components/AnimatedPage';
import StatCard from '../components/StatCard';
import { CardSkeleton } from '../components/Skeleton';
import { HiHeart, HiTrendingUp, HiChartBar, HiCalendar, HiArrowRight } from 'react-icons/hi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [breedData, setBreedData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [healthStatus, setHealthStatus] = useState({ healthy: 0, sick: 0, critical: 0, recovering: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch dashboard stats
        const statsRes = await cowsAPI.getDashboardStats();
        setStats(statsRes.data.data);

        // Fetch all cows for breed distribution
        const cowsRes = await cowsAPI.getAll();
        const cows = cowsRes.data.data;

        // Compute breed distribution from real cow data
        const breedCounts = {};
        cows.forEach(cow => {
          const breed = cow.breed || 'Unknown';
          breedCounts[breed] = (breedCounts[breed] || 0) + 1;
        });
        setBreedData(Object.entries(breedCounts).map(([name, value]) => ({ name, value })));

        // Compute health status
        const hStatus = { healthy: 0, sick: 0, critical: 0, recovering: 0 };
        cows.forEach(cow => {
          const status = cow.healthStatus || 'healthy';
          if (status === 'healthy') hStatus.healthy++;
          else if (status === 'sick' || status === 'under_treatment') hStatus.sick++;
          else if (status === 'critical') hStatus.critical++;
          else if (status === 'recovering') hStatus.recovering++;
        });
        setHealthStatus(hStatus);

        // Fetch all diagnoses for monthly trend
        const allDiagnoses = [];
        for (const cow of cows.slice(0, 20)) {
          try {
            const diagRes = await diagnosisAPI.getByCow(cow._id);
            allDiagnoses.push(...(diagRes.data.data || []));
          } catch { /* skip */ }
        }

        // Group by month (last 6 months)
        const monthMap = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = d.toLocaleString('en', { month: 'short' });
          monthMap[key] = { month: key, count: 0, score: 0 };
        }

        allDiagnoses.forEach(d => {
          const date = new Date(d.createdAt);
          const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth();
          if (monthDiff >= 0 && monthDiff < 6) {
            const key = date.toLocaleString('en', { month: 'short' });
            if (monthMap[key]) {
              monthMap[key].count++;
              monthMap[key].score = Math.max(monthMap[key].score, d.healthScore || statsRes.data.data?.avgHealthScore || 75);
            }
          }
        });

        // Fill in missing months with default values
        Object.keys(monthMap).forEach(key => {
          if (!monthMap[key].score) monthMap[key].score = statsRes.data.data?.avgHealthScore || 75;
        });

        setMonthlyData(Object.values(monthMap));
      } catch (err) {
        setError('Failed to load analytics data');
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;

  const totalCows = (healthStatus.healthy + healthStatus.sick + healthStatus.critical + healthStatus.recovering);
  const totalVaccinations = monthlyData.reduce((s, m) => s + m.count, 0);

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Analytics Dashboard</h1>
            <p className="text-gray-500 mt-1">Data-driven insights from your herd</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-lg">
            <HiCalendar className="w-4 h-4 text-primary-600" />
            <span className="text-sm text-primary-700 font-medium">Last 6 Months</span>
          </div>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Cows" value={totalCows} icon={HiHeart} color="primary" />
          <StatCard label="Avg Health Score" value={stats?.avgHealthScore || 0} icon={HiTrendingUp} color="green" />
          <StatCard label="Total Diagnoses" value={totalVaccinations} icon={HiChartBar} color="blue" />
          <StatCard label="Active Treatments" value={healthStatus.sick} icon={HiHeart} color={healthStatus.sick > 0 ? 'amber' : 'gray'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="section-title mb-4">Monthly Diagnoses Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', strokeWidth: 2 }} name="Health Score" />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="Diagnoses" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="section-title mb-4">Breed Distribution</h2>
            {breedData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={breedData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {breedData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <p>No breed data available</p>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="section-title mb-4">Monthly Activity</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                <Bar dataKey="count" fill="#22c55e" radius={[8, 8, 0, 0]} name="Diagnoses" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="section-title mb-4">Health Status Overview</h2>
            <div className="space-y-4">
              {[
                { label: 'Healthy', value: healthStatus.healthy, color: 'bg-green-500' },
                { label: 'Under Treatment', value: healthStatus.sick, color: 'bg-amber-500' },
                { label: 'Critical', value: healthStatus.critical, color: 'bg-red-500' },
                { label: 'Recovering', value: healthStatus.recovering, color: 'bg-blue-500' },
              ].map((item) => {
                const pct = totalCows > 0 ? Math.round((item.value / totalCows) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-medium">{item.value} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/my-cows" className="mt-4 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all cows <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default AnalyticsDashboard;