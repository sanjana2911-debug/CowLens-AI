import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { healthAPI, cowsAPI } from '../services/api';
import Loading from '../components/Loading';
import { HiArrowLeft, HiPlus } from 'react-icons/hi';

const HealthRecords = () => {
  const { cowId } = useParams();
  const [records, setRecords] = useState([]);
  const [cow, setCow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'checkup',
    diagnosis: '',
    symptoms: '',
    treatment: '',
    medication: '',
    veterinarian: '',
    notes: '',
    cost: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cowRes, recordsRes] = await Promise.all([
          cowsAPI.getById(cowId),
          healthAPI.getByCow(cowId),
        ]);
        setCow(cowRes.data.data);
        setRecords(recordsRes.data.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cowId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = {
        ...formData,
        cost: formData.cost ? Number(formData.cost) : undefined,
      };
      const res = await healthAPI.create(cowId, data);
      setRecords([res.data.data, ...records]);
      setShowForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'checkup',
        diagnosis: '',
        symptoms: '',
        treatment: '',
        medication: '',
        veterinarian: '',
        notes: '',
        cost: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add record');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/cow-details/${cowId}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="page-title">Health Records</h1>
            <p className="text-gray-500 mt-1">
              {cow?.name || `Cow #${cow?.tagNumber}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <HiPlus className="w-5 h-5" />
          Add Record
        </button>
      </div>

      {/* Add Record Form */}
      {showForm && (
        <div className="card">
          <h2 className="section-title mb-4">New Health Record</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select name="type" value={formData.type} onChange={handleChange} className="input-field">
                  <option value="checkup">Checkup</option>
                  <option value="injury">Injury</option>
                  <option value="illness">Illness</option>
                  <option value="treatment">Treatment</option>
                  <option value="surgery">Surgery</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                <input type="text" name="diagnosis" value={formData.diagnosis} onChange={handleChange} className="input-field" placeholder="Diagnosis" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Veterinarian</label>
                <input type="text" name="veterinarian" value={formData.veterinarian} onChange={handleChange} className="input-field" placeholder="Dr. Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                <input type="number" name="cost" value={formData.cost} onChange={handleChange} className="input-field" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                <input type="date" name="followUpDate" value={formData.followUpDate} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
              <textarea name="symptoms" value={formData.symptoms} onChange={handleChange} className="input-field" rows="2" placeholder="Symptoms..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment</label>
              <textarea name="treatment" value={formData.treatment} onChange={handleChange} className="input-field" rows="2" placeholder="Treatment administered..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medication</label>
              <textarea name="medication" value={formData.medication} onChange={handleChange} className="input-field" rows="2" placeholder="Medications prescribed..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} className="input-field" rows="2" placeholder="Additional notes..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Save Record</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Records List */}
      {records.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-4">🏥</p>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No health records</h3>
          <p className="text-gray-500">Add your first health record for this cow</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record._id} className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white bg-primary-600 px-2 py-0.5 rounded-full">
                    {record.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(record.date).toLocaleDateString()}
                  </span>
                </div>
                {record.cost && (
                  <span className="text-sm font-medium text-gray-700">${record.cost}</span>
                )}
              </div>
              {record.diagnosis && (
                <p className="text-sm font-medium text-gray-900">Diagnosis: {record.diagnosis}</p>
              )}
              {record.symptoms && (
                <p className="text-sm text-gray-600 mt-1">Symptoms: {record.symptoms}</p>
              )}
              {record.veterinarian && (
                <p className="text-xs text-gray-500 mt-1">Dr. {record.veterinarian}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthRecords;