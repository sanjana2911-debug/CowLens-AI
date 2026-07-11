import { useState } from 'react';
import AnimatedPage from '../components/AnimatedPage';
import StatCard from '../components/StatCard';
import { HiChartBar, HiTrendingUp, HiPlus, HiDotsHorizontal } from 'react-icons/hi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';

const MilkProduction = () => {
  const [showForm, setShowForm] = useState(false);
  const [records, setRecords] = useState([
    { date: '2026-01-06', morning: 12, evening: 10, total: 22 },
    { date: '2026-01-07', morning: 14, evening: 11, total: 25 },
    { date: '2026-01-08', morning: 13, evening: 12, total: 25 },
    { date: '2026-01-09', morning: 15, evening: 10, total: 25 },
    { date: '2026-01-10', morning: 14, evening: 13, total: 27 },
    { date: '2026-01-11', morning: 16, evening: 12, total: 28 },
    { date: '2026-01-12', morning: 15, evening: 14, total: 29 },
  ]);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], morning: '', evening: '', cowId: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    const morning = parseFloat(formData.morning);
    const evening = parseFloat(formData.evening);
    if (!morning || !evening) { toast.error('Please enter both values'); return; }
    setRecords([{ date: formData.date, morning, evening, total: morning + evening }, ...records]);
    setShowForm(false);
    toast.success('Milk record added');
  };

  const total = records.reduce((s, r) => s + r.total, 0);
  const avg = records.length > 0 ? (total / records.length).toFixed(1) : 0;

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Milk Production Tracker</h1>
            <p className="text-gray-500 mt-1">Track daily milk yield per cow</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <HiPlus className="w-5 h-5" /> Add Record
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total (7 days)" value={`${total} L`} icon={HiChartBar} color="primary" />
          <StatCard label="Daily Avg" value={`${avg} L`} icon={HiTrendingUp} color="green" trend={8} />
          <StatCard label="Today" value={`${records[0]?.total || 0} L`} icon={HiChartBar} color="blue" />
        </div>

        {showForm && (
          <div className="card animate-fadeIn">
            <h2 className="section-title mb-4">Record Milk Production</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Morning (L)</label>
                <input type="number" step="0.1" value={formData.morning} onChange={(e) => setFormData({...formData, morning: e.target.value})} className="input-field" placeholder="0.0" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evening (L)</label>
                <input type="number" step="0.1" value={formData.evening} onChange={(e) => setFormData({...formData, evening: e.target.value})} className="input-field" placeholder="0.0" required />
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="section-title mb-4">Daily Yield Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={records.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e' }} name="Total (L)" />
                <Line type="monotone" dataKey="morning" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="Morning" />
                <Line type="monotone" dataKey="evening" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} name="Evening" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="section-title mb-4">Morning vs Evening</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={records.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                <Bar dataKey="morning" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Morning" />
                <Bar dataKey="evening" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Evening" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title mb-4">Recent Records</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Date</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">Morning</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">Evening</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="py-3 px-2 text-right">{r.morning} L</td>
                    <td className="py-3 px-2 text-right">{r.evening} L</td>
                    <td className="py-3 px-2 text-right font-bold text-primary-700">{r.total} L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default MilkProduction;