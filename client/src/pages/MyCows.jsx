import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cowsAPI } from '../services/api';
import Loading from '../components/Loading';
import { HiPlus, HiEye, HiPencil, HiTrash } from 'react-icons/hi';

const MyCows = () => {
  const [cows, setCows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCows = async () => {
    try {
      const res = await cowsAPI.getAll();
      setCows(res.data.data);
    } catch (err) {
      console.error('Failed to fetch cows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCows();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this cow?')) return;
    try {
      await cowsAPI.delete(id);
      setCows(cows.filter((c) => c._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">My Cows</h1>
          <p className="text-gray-500 mt-1">
            Manage your cattle herd
          </p>
        </div>
        <Link to="/add-cow" className="btn-primary flex items-center gap-2">
          <HiPlus className="w-5 h-5" />
          Add Cow
        </Link>
      </div>

      {cows.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-4">🐄</p>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cows yet</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first cow</p>
          <Link to="/add-cow" className="btn-primary inline-flex items-center gap-2">
            <HiPlus className="w-5 h-5" />
            Add Your First Cow
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {cows.map((cow) => (
            <div key={cow._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-xl">
                    🐄
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {cow.name || `Cow #${cow.tagNumber}`}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">Tag: {cow.tagNumber}</span>
                      {cow.breed && (
                        <span className="text-xs text-gray-500">Breed: {cow.breed}</span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          cow.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : cow.status === 'sold'
                            ? 'bg-blue-100 text-blue-700'
                            : cow.status === 'deceased'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {cow.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/cow-details/${cow._id}`}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <HiEye className="w-5 h-5" />
                  </Link>
                  <Link
                    to={`/cow-details/${cow._id}`}
                    className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <HiPencil className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(cow._id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <HiTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCows;