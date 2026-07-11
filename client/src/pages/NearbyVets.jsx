import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiLocationMarker, HiPhone, HiStar } from 'react-icons/hi';
import Loading from '../components/Loading';

const NearbyVets = () => {
  const [loading] = useState(false);

  const vets = [
    {
      id: 1,
      name: 'Green Valley Veterinary Clinic',
      address: '123 Farm Road, Dairy District',
      phone: '+1 (555) 123-4567',
      rating: 4.8,
      distance: '2.3 km',
      hours: 'Mon-Sat: 8AM-6PM',
      services: ['Emergency', 'Vaccination', 'Surgery', 'Checkup'],
    },
    {
      id: 2,
      name: 'Livestock Health Center',
      address: '456 Cattle Drive, Rural County',
      phone: '+1 (555) 987-6543',
      rating: 4.5,
      distance: '5.1 km',
      hours: 'Mon-Fri: 9AM-5PM',
      services: ['Vaccination', 'Treatment', 'Consultation'],
    },
    {
      id: 3,
      name: 'Animal Care Hospital',
      address: '789 Vet Lane, Farmington',
      phone: '+1 (555) 456-7890',
      rating: 4.2,
      distance: '8.7 km',
      hours: '24/7 Emergency',
      services: ['Emergency', 'Surgery', 'Pharmacy'],
    },
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Nearby Veterinarians</h1>
        <p className="text-gray-500 mt-1">Find veterinary clinics near your location</p>
      </div>

      <div className="card bg-gradient-to-br from-primary-50 to-emerald-50 p-8 text-center">
        <HiLocationMarker className="w-12 h-12 text-primary-600 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Veterinary Clinic Locator</h2>
        <p className="text-sm text-gray-600 mb-4">Interactive map coming soon</p>
        <div className="inline-flex items-center gap-2 text-sm text-primary-600 font-medium">
          <span>{vets.length} clinics found in your area</span>
        </div>
      </div>

      <div className="space-y-4">
        {vets.map((vet) => (
          <div key={vet.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{vet.name}</h3>
                  <div className="flex items-center gap-1 text-amber-500">
                    <HiStar className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-700">{vet.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <HiLocationMarker className="w-4 h-4 text-gray-400" />
                  {vet.address} &middot; {vet.distance}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <HiPhone className="w-4 h-4 text-gray-400" />
                  {vet.phone}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {vet.services.map((service) => (
                    <span key={service} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                      {service}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">{vet.hours}</p>
              </div>
              <a
                href={`tel:${vet.phone}`}
                className="btn-primary text-sm !py-2 !px-3 flex items-center gap-1"
              >
                <HiPhone className="w-4 h-4" />
                Call
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearbyVets;