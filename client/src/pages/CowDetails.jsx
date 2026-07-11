import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { cowsAPI } from '../services/api';
import Loading from '../components/Loading';
import { HiArrowLeft, HiPencil, HiTrash } from 'react-icons/hi';

const CowDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cow, setCow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCow = async () => {
      try {
        const res = await cowsAPI.getById(id);
        setCow(res.data.data);
      } catch (err) {
        console.error('Failed to fetch cow:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCow();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this cow?')) return;
    try {
      await cowsAPI.delete(id);
      navigate('/my-cows');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (loading) return <Loading />;
  if (!cow) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cow not found</p>
        <Link to="/my-cows" className="btn-primary mt-4 inline-block">
          Back to My Cows
        </Link>
      </div>
    );
  }

  const details = [
    { label: 'Tag Number', value: cow.tagNumber },
    { label: 'Name', value: cow.name || '—' },
    { label: 'Breed', value: cow.breed || '—' },
    { label: 'Gender', value: cow.gender },
    { label: 'Date of Birth', value: cow.dateOfBirth ? new Date(cow.dateOfBirth).toLocaleDateString() : '—' },
    { label: 'Weight', value: cow.weight ? `${cow.weight} kg` : '—' },
    { label: 'Color', value: cow.color || '—' },
    { label: 'Status', value: cow.status },
    { label: 'Purchase Date', value: cow.purchaseDate ? new Date(cow.purchaseDate).toLocaleDateString() : '—' },
    { label: 'Purchase Price', value: cow.purchasePrice ? `$${cow.purchasePrice}` : '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/my-cows"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="page-title">{cow.name || `Cow #${cow.tagNumber}`}</h1>
            <p className="text-gray-500 mt-1">Cow Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="btn-danger flex items-center gap-2"
          >
            <HiTrash className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cow Info */}
        <div className="lg:col-span-2 card">
          <h2 className="section-title mb-4">General Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {details.map((detail, index) => (
              <div key={index}>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {detail.label}
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {detail.value}
                </p>
              </div>
            ))}
          </div>
          {cow.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-700">{cow.notes}</p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="section-title mb-4">Quick Links</h2>
            <div className="space-y-2">
              <Link
                to={`/health-records/${cow._id}`}
                className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <p className="text-sm font-medium text-blue-700">Health Records</p>
                <p className="text-xs text-blue-500 mt-1">View medical history</p>
              </Link>
              <Link
                to={`/vaccination/${cow._id}`}
                className="block p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <p className="text-sm font-medium text-green-700">Vaccinations</p>
                <p className="text-xs text-green-500 mt-1">View vaccination records</p>
              </Link>
              <Link
                to="/ai-diagnosis"
                className="block p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <p className="text-sm font-medium text-purple-700">AI Diagnosis</p>
                <p className="text-xs text-purple-500 mt-1">Get AI-powered insights</p>
              </Link>
            </div>
          </div>

          <div className="card">
            <h2 className="section-title mb-2">Status</h2>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                cow.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : cow.status === 'sold'
                  ? 'bg-blue-100 text-blue-700'
                  : cow.status === 'deceased'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {cow.status.charAt(0).toUpperCase() + cow.status.slice(1)}
            </span>
          </div>

          <div className="card text-center space-y-4">
            <h2 className="section-title text-left">QR Health Passport</h2>
            <div className="flex justify-center p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  window.location.origin + '/passport/' + cow._id
                )}`}
                alt="Cow Health Passport QR"
                className="w-44 h-44"
              />
            </div>
            <p className="text-xs text-gray-500">
              Scan QR code to view public health credentials and vaccination passport.
            </p>
            <div className="flex gap-2">
              <a
                href={window.location.origin + '/passport/' + cow._id}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary flex-1 text-xs py-2.5 text-center flex items-center justify-center"
              >
                Open Passport
              </a>
              <button
                onClick={() => {
                  window.open(window.location.origin + '/passport/' + cow._id + '?print=true');
                }}
                className="btn-primary flex-1 text-xs py-2.5 flex items-center justify-center"
              >
                Print Info
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CowDetails;