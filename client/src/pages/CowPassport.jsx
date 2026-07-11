import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cowsAPI, healthAPI, vaccinationAPI, diagnosisAPI } from '../services/api';
import Loading from '../components/Loading';
import { HiArrowLeft, HiShieldCheck, HiClipboardList, HiBeaker } from 'react-icons/hi';
import { HiOutlineQrCode } from 'react-icons/hi2';

/**
 * CowPassport - Digital Health Passport for a cow
 * Displays a comprehensive health summary including vaccinations, diagnoses, and records
 */
const CowPassport = () => {
  const { id } = useParams();
  const [cow, setCow] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cowRes, healthRes, vacRes, diagRes] = await Promise.all([
          cowsAPI.getById(id),
          healthAPI.getByCow(id).catch(() => ({ data: { data: [] } })),
          vaccinationAPI.getByCow(id).catch(() => ({ data: { data: [] } })),
          diagnosisAPI.getByCow(id).catch(() => ({ data: { data: [] } })),
        ]);
        setCow(cowRes.data.data);
        setHealthRecords(healthRes.data.data || []);
        setVaccinations(vacRes.data.data || []);
        setDiagnoses(diagRes.data.data || []);
      } catch (err) {
        console.error('Failed to load passport data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (cow?._id) {
      // Generate QR code pointing to public passport page
      const passportUrl = `${window.location.origin}/passport/${cow._id}`;
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(passportUrl)}`);
    }
  }, [cow]);

  if (loading) return <Loading />;
  if (!cow) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cow not found</p>
        <Link to="/my-cows" className="btn-primary mt-4 inline-block">Back to My Cows</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/cow-details/${id}`} className="p-2 hover:bg-gray-100 rounded-lg">
          <HiArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="page-title">Digital Health Passport</h1>
          <p className="text-gray-500 mt-1">{cow.name || `Cow #${cow.tagNumber}`}</p>
        </div>
      </div>

      {/* QR Code */}
      <div className="card flex items-center gap-4">
        {qrCodeUrl ? (
          <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20 rounded-lg" />
        ) : (
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
            <HiOutlineQrCode className="w-10 h-10 text-gray-400" />
          </div>
        )}
        <div>
          <h2 className="font-semibold text-gray-900">QR Health Passport</h2>
          <p className="text-sm text-gray-500">Scan to view this cow's complete health history</p>
          <p className="text-xs text-gray-400 mt-1">Passport ID: {cow.tagNumber}-{cow._id.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      {/* Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-3">
          <HiShieldCheck className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Vaccinations</p>
            <p className="text-xl font-bold">{vaccinations.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <HiClipboardList className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">Health Records</p>
            <p className="text-xl font-bold">{healthRecords.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <HiBeaker className="w-8 h-8 text-purple-500" />
          <div>
            <p className="text-sm text-gray-500">Diagnoses</p>
            <p className="text-xl font-bold">{diagnoses.length}</p>
          </div>
        </div>
      </div>

      {/* Vaccination Timeline */}
      {vaccinations.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-4">Vaccination History</h2>
          <div className="space-y-2">
            {vaccinations.map((v) => (
              <div key={v._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{v.vaccineName}</p>
                  <p className="text-xs text-gray-500">Given: {new Date(v.dateGiven).toLocaleDateString()}</p>
                </div>
                {v.nextDueDate && (
                  <span className="text-xs text-gray-500">Next: {new Date(v.nextDueDate).toLocaleDateString()}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Diagnoses */}
      {diagnoses.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-4">Diagnosis History</h2>
          <div className="space-y-2">
            {diagnoses.slice(0, 5).map((d) => (
              <div key={d._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{d.condition}</p>
                  <p className="text-xs text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  d.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  d.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  d.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>{d.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cow Info Summary */}
      <div className="card">
        <h2 className="section-title mb-4">Cow Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Tag:</span> <span className="font-medium">{cow.tagNumber}</span></div>
          <div><span className="text-gray-500">Breed:</span> <span className="font-medium">{cow.breed || 'N/A'}</span></div>
          <div><span className="text-gray-500">Gender:</span> <span className="font-medium capitalize">{cow.gender}</span></div>
          <div><span className="text-gray-500">Health:</span> <span className="font-medium capitalize">{cow.healthStatus}</span></div>
          {cow.weight && <div><span className="text-gray-500">Weight:</span> <span className="font-medium">{cow.weight} {cow.weightUnit}</span></div>}
          {cow.dateOfBirth && <div><span className="text-gray-500">DOB:</span> <span className="font-medium">{new Date(cow.dateOfBirth).toLocaleDateString()}</span></div>}
        </div>
      </div>
    </div>
  );
};

export default CowPassport;