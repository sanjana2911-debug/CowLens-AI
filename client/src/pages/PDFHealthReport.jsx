import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';
import { CardSkeleton } from '../components/Skeleton';
import { cowsAPI, healthAPI, vaccinationAPI, diagnosisAPI } from '../services/api';
import { HiDocumentReport, HiPrinter, HiHeart, HiClipboardList, HiShieldCheck, HiBeaker } from 'react-icons/hi';
import toast from 'react-hot-toast';

const PDFHealthReport = () => {
  const [cows, setCows] = useState([]);
  const [selectedCow, setSelectedCow] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchCows = async () => {
      try {
        const res = await cowsAPI.getAll();
        setCows(res.data.data);
      } catch { toast.error('Failed to load cows'); }
      finally { setLoading(false); }
    };
    fetchCows();
  }, []);

  const generateReport = async () => {
    if (!selectedCow) { toast.error('Please select a cow'); return; }
    setGenerating(true);
    try {
      const [cowRes, healthRes, vacRes, diagRes] = await Promise.all([
        cowsAPI.getById(selectedCow),
        healthAPI.getByCow(selectedCow).catch(() => ({ data: { data: [] } })),
        vaccinationAPI.getByCow(selectedCow).catch(() => ({ data: { data: [] } })),
        diagnosisAPI.getByCow(selectedCow).catch(() => ({ data: { data: [] } })),
      ]);
      const cowData = cowRes.data.data;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/passport/${cowData._id}`)}`;
      
      setReport({
        cow: cowData,
        healthRecords: healthRes.data.data || [],
        vaccinations: vacRes.data.data || [],
        diagnoses: diagRes.data.data || [],
        qrCodeUrl,
        generatedAt: new Date().toISOString(),
      });
      toast.success('Report generated successfully');
    } catch { toast.error('Failed to generate report'); }
    finally { setGenerating(false); }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">PDF Health Report</h1>
            <p className="text-gray-500 mt-1">Generate comprehensive health reports</p>
          </div>
          {report && (
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
              <HiPrinter className="w-5 h-5" /> Print / PDF
            </button>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Cow</label>
              <select value={selectedCow} onChange={(e) => setSelectedCow(e.target.value)} className="input-field">
                <option value="">— Select a cow —</option>
                {cows.map((cow) => (
                  <option key={cow._id} value={cow._id}>{cow.name || `Cow #${cow.tagNumber}`} - {cow.breed || 'N/A'}</option>
                ))}
              </select>
            </div>
            <button onClick={generateReport} disabled={!selectedCow || generating} className="btn-primary self-end flex items-center gap-2">
              <HiDocumentReport className="w-5 h-5" />
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {report && (
          <div id="health-report" className="card print:shadow-none print:border-none">
            <div className="text-center mb-6 pb-6 border-b border-gray-200 print:border-gray-300">
              <p className="text-3xl mb-2">🐄</p>
              <h2 className="text-2xl font-bold text-gray-900">Health Report</h2>
              <p className="text-gray-500">{report.cow.name || `Cow #${report.cow.tagNumber}`}</p>
              <p className="text-xs text-gray-400 mt-1">Generated: {new Date(report.generatedAt).toLocaleString()}</p>
            </div>

            {/* QR Code */}
            {report.qrCodeUrl && (
              <div className="flex justify-center mb-6">
                <div className="text-center">
                  <img src={report.qrCodeUrl} alt="QR Code" className="w-32 h-32 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Scan for digital passport</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-primary-50 rounded-lg">
                <HiHeart className="w-5 h-5 mx-auto text-primary-600 mb-1" />
                <p className="text-lg font-bold text-primary-700">{report.healthRecords.length}</p>
                <p className="text-xs text-gray-500">Health Records</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <HiShieldCheck className="w-5 h-5 mx-auto text-green-600 mb-1" />
                <p className="text-lg font-bold text-green-700">{report.vaccinations.length}</p>
                <p className="text-xs text-gray-500">Vaccinations</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <HiBeaker className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                <p className="text-lg font-bold text-blue-700">{report.diagnoses.length}</p>
                <p className="text-xs text-gray-500">Diagnoses</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <HiClipboardList className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                <p className="text-lg font-bold text-amber-700">{report.cow.healthScore || 'N/A'}</p>
                <p className="text-xs text-gray-500">Health Score</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div><span className="text-gray-500">Tag:</span> <span className="font-medium">{report.cow.tagNumber}</span></div>
              <div><span className="text-gray-500">Breed:</span> <span className="font-medium">{report.cow.breed || 'N/A'}</span></div>
              <div><span className="text-gray-500">Gender:</span> <span className="font-medium capitalize">{report.cow.gender}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className="font-medium capitalize">{report.cow.status}</span></div>
              {report.cow.weight && <div><span className="text-gray-500">Weight:</span> <span className="font-medium">{report.cow.weight} kg</span></div>}
              {report.cow.dateOfBirth && <div><span className="text-gray-500">DOB:</span> <span className="font-medium">{new Date(report.cow.dateOfBirth).toLocaleDateString()}</span></div>}
            </div>

            {report.vaccinations.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Vaccination History</h3>
                <div className="space-y-2">
                  {report.vaccinations.map((v, i) => (
                    <div key={i} className="flex justify-between p-2 bg-gray-50 rounded-lg text-sm">
                      <span className="font-medium">{v.vaccineName}</span>
                      <span className="text-gray-500">{new Date(v.dateGiven).toLocaleDateString()}{v.nextDueDate ? ` → Due: ${new Date(v.nextDueDate).toLocaleDateString()}` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.healthRecords.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Recent Health Records</h3>
                <div className="space-y-2">
                  {report.healthRecords.slice(0, 5).map((r, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded-lg text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium capitalize">{r.type}</span>
                        <span className="text-gray-500">{new Date(r.date).toLocaleDateString()}</span>
                      </div>
                      {r.diagnosis && <p className="text-gray-600 text-xs mt-0.5">{r.diagnosis}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-200">
              <p>CowLens AI - Smart Cattle Management</p>
              <p>Report ID: {report.cow._id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
        )}

        {!report && !loading && (
          <div className="card text-center py-12">
            <HiDocumentReport className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
            <p className="text-gray-500">Select a cow and click "Generate Report"</p>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default PDFHealthReport;