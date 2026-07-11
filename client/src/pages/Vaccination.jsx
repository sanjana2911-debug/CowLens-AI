import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { vaccinationAPI, cowsAPI } from '../services/api';
import Loading from '../components/Loading';
import { HiArrowLeft, HiPlus } from 'react-icons/hi';

const Vaccination = () => {
  const { cowId } = useParams();
  const [records, setRecords] = useState([]);
  const [cow, setCow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vaccineName: '',
    dateGiven: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    batchNumber: '',
    administeredBy: '',
    notes: '',
    cost: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cowRes, recordsRes] = await Promise.all([
          cowsAPI.getById(cowId),
          vaccinationAPI.getByCow(cowId),
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
    if (!formData.vaccineName || !formData.dateGiven) {
      setError('Vaccine name and date are required');
      return;
    }
    try {
      const data = {
        ...formData,
        cost: formData.cost ? Number(formData.cost) : undefined,
      };
      const res = await vaccinationAPI.create(cowId, data);
      setRecords((currentRecords) => [res.data.data, ...currentRecords]);
      setShowForm(false);
      setFormData({
        vaccineName: '',
        dateGiven: new Date().toISOString().split('T')[0],
        nextDueDate: '',
        batchNumber: '',
        administeredBy: '',
        notes: '',
        cost: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add vaccination');
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
            <h1 className="page-title">Vaccinations</h1>
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
          Add Vaccination
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="section-title mb-4">New Vaccination</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Name *</label>
                <input type="text" name="vaccineName" value={formData.vaccineName} onChange={handleChange} className="input-field" placeholder="e.g., BVD Vaccine" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Given *</label>
                <input type="date" name="dateGiven" value={formData.dateGiven} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
                <input type="date" name="nextDueDate" value={formData.nextDueDate} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                <input type="text" name="batchNumber" value={formData.batchNumber} onChange={handleChange} className="input-field" placeholder="Batch #" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Administered By</label>
                <input type="text" name="administeredBy" value={formData.administeredBy} onChange={handleChange} className="input-field" placeholder="Veterinarian name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                <input type="number" name="cost" value={formData.cost} onChange={handleChange} className="input-field" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} className="input-field" rows="2" placeholder="Additional notes..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {records.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-4">💉</p>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vaccination records</h3>
          <p className="text-gray-500">Add your first vaccination record for this cow</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record._id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{record.vaccineName}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      Given: {new Date(record.dateGiven).toLocaleDateString()}
                    </span>
                    {record.nextDueDate && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        new Date(record.nextDueDate) < new Date()
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        Due: {new Date(record.nextDueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {record.batchNumber && (
                  <span className="text-xs text-gray-400">Batch: {record.batchNumber}</span>
                )}
              </div>
              {record.administeredBy && (
                <p className="text-xs text-gray-500 mt-2">By: {record.administeredBy}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Vaccination;