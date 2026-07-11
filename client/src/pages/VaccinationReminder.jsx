import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';
import StatCard from '../components/StatCard';
import { CardSkeleton } from '../components/Skeleton';
import { cowsAPI, vaccinationAPI } from '../services/api';
import { HiCalendar, HiShieldCheck, HiClock, HiExclamationCircle, HiCheckCircle, HiArrowRight } from 'react-icons/hi';
import toast from 'react-hot-toast';

const VaccinationReminder = () => {
  const [cows, setCows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cowRes = await cowsAPI.getAll();
        setCows(cowRes.data.data);
        
        const allVacs = await Promise.all(
          cowRes.data.data.map(async (cow) => {
            try {
              const vacRes = await vaccinationAPI.getByCow(cow._id);
              return { cow, vaccinations: vacRes.data.data || [] };
            } catch { return { cow, vaccinations: [] }; }
          })
        );

        const upcoming = [];
        allVacs.forEach(({ cow, vaccinations }) => {
          vaccinations.forEach(v => {
            if (v.nextDueDate) {
              upcoming.push({ ...v, cowName: cow.name || `Cow #${cow.tagNumber}`, cowId: cow._id });
            }
          });
        });
        
        upcoming.sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));
        setReminders(upcoming);
      } catch { toast.error('Failed to load vaccination data'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;

  const overdue = reminders.filter(r => new Date(r.nextDueDate) < new Date());
  const dueSoon = reminders.filter(r => {
    const diff = new Date(r.nextDueDate) - new Date();
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  });

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Vaccination Reminder</h1>
          <p className="text-gray-500 mt-1">Track upcoming and overdue vaccinations</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Overdue" value={overdue.length} icon={HiExclamationCircle} color="red" link="/vaccination" />
          <StatCard label="Due This Week" value={dueSoon.length} icon={HiClock} color="amber" />
          <StatCard label="Upcoming" value={reminders.length - overdue.length - dueSoon.length} icon={HiCalendar} color="primary" />
        </div>

        {overdue.length > 0 && (
          <div className="card border-2 border-red-200 bg-red-50">
            <h2 className="section-title flex items-center gap-2 text-red-700 mb-4">
              <HiExclamationCircle className="w-5 h-5" /> Overdue Vaccinations
            </h2>
            <div className="space-y-2">
              {overdue.slice(0, 5).map((v, i) => (
                <Link key={i} to={`/vaccination/${v.cowId}`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100 hover:shadow-sm transition-shadow">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{v.vaccineName}</p>
                    <p className="text-xs text-gray-500">{v.cowName} — Due: {new Date(v.nextDueDate).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full font-medium">
                    {Math.ceil((new Date() - new Date(v.nextDueDate)) / (1000 * 60 * 60 * 24))} days overdue
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="section-title mb-4">All Vaccination Schedule</h2>
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <HiCalendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No upcoming vaccinations scheduled</p>
              <Link to="/my-cows" className="text-primary-600 font-medium text-sm mt-2 inline-block">Add a cow first</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {reminders.map((v, i) => {
                const isOverdue = new Date(v.nextDueDate) < new Date();
                const diffDays = Math.ceil((new Date(v.nextDueDate) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <Link key={i} to={`/vaccination/${v.cowId}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      {isOverdue ? <HiExclamationCircle className="w-5 h-5 text-red-500" /> : diffDays <= 7 ? <HiClock className="w-5 h-5 text-amber-500" /> : <HiCheckCircle className="w-5 h-5 text-green-500" />}
                      <div>
                        <p className="text-sm font-medium text-gray-800">{v.vaccineName}</p>
                        <p className="text-xs text-gray-500">{v.cowName}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      isOverdue ? 'bg-red-100 text-red-700' :
                      diffDays <= 7 ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {isOverdue ? `${Math.abs(diffDays)}d overdue` : `Due in ${diffDays}d`}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="card bg-gradient-to-r from-primary-50 to-green-50 border-primary-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HiShieldCheck className="w-8 h-8 text-primary-600" />
              <div>
                <h3 className="font-semibold text-gray-800">Vaccination Schedule</h3>
                <p className="text-sm text-gray-600">Add vaccination records for your cows</p>
              </div>
            </div>
            <Link to="/my-cows" className="btn-primary text-sm !py-2 !px-4 flex items-center gap-1">
              View Cows <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default VaccinationReminder;