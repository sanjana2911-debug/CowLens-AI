import { useState, useEffect } from 'react';
import { diagnosisAPI, cowsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HiBeaker, HiLightBulb, HiChip, HiExclamationCircle, HiShieldCheck, HiHeart, HiClipboardList } from 'react-icons/hi';
import Loading from '../components/Loading';

const severityConfig = {
  low: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Low' },
  medium: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'High' },
  critical: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Critical' },
};

const AIDiagnosis = () => {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState('');
  const [selectedCow, setSelectedCow] = useState('');
  const [cows, setCows] = useState([]);
  const [cowsLoading, setCowsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCows = async () => {
      if (cows.length > 0) return;
      setCowsLoading(true);
      try {
        const res = await cowsAPI.getAll();
        setCows(res.data.data);
      } catch {
        // Ignore
      } finally {
        setCowsLoading(false);
      }
    };
    loadCows();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError('Please describe the symptoms');
      return;
    }

    setError('');
    setLoading(true);
    setAnalysis(null);

    try {
      const res = await diagnosisAPI.aiAnalyze({
        symptoms: symptoms.trim(),
        cowId: selectedCow || undefined,
      });
      setAnalysis(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">AI Diagnosis</h1>
        <p className="text-gray-500 mt-1">
          Describe symptoms and get AI-powered preliminary insights for your cattle
        </p>
      </div>

      {/* Future AI Features Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: '🖼️', label: 'Image Detection', desc: 'Upload photos for analysis' },
          { icon: '🔬', label: 'Symptom Checker', desc: 'AI-powered symptom analysis' },
          { icon: '📊', label: 'Health Score', desc: 'Overall wellness score' },
          { icon: '🧠', label: 'Explainable AI', desc: 'Understand AI decisions' },
          { icon: '📱', label: 'QR Passport', desc: 'Digital health passport' },
        ].map((feature, i) => (
          <div key={i} className="card text-center py-4 hover:shadow-md transition-shadow">
            <p className="text-2xl mb-2">{feature.icon}</p>
            <p className="text-xs font-medium text-gray-800">{feature.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{feature.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <HiBeaker className="w-5 h-5 text-primary-600" />
            <h2 className="section-title">Symptom Description</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Cow selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Cow (optional)
              </label>
              <select
                value={selectedCow}
                onChange={(e) => setSelectedCow(e.target.value)}
                className="input-field"
              >
                <option value="">— No cow selected —</option>
                {cows.map((cow) => (
                  <option key={cow._id} value={cow._id}>
                    {cow.name || `Cow #${cow.tagNumber}`} - {cow.breed || 'N/A'}
                  </option>
                ))}
              </select>
              {cowsLoading && <p className="text-xs text-gray-400 mt-1">Loading cows...</p>}
            </div>

            {/* Symptoms textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Describe the symptoms you've observed
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="input-field font-mono text-sm"
                rows="8"
                placeholder={`Describe symptoms in detail, for example:
• Lethargy and reduced appetite
• Nasal discharge and coughing
• Diarrhea for 2 days
• Swollen joints
• Fever (temperature > 39.5°C)`}
                required
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <HiChip className="w-4 h-4 flex-shrink-0" />
              <p>This is an AI-powered preliminary analysis powered by Groq API. Always consult with a veterinarian for proper diagnosis and treatment.</p>
            </div>

            <button
              type="submit"
              disabled={loading || !symptoms.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <HiLightBulb className="w-5 h-5" />
                  Analyze Symptoms
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <HiLightBulb className="w-5 h-5 text-amber-500" />
            <h2 className="section-title">AI Analysis Results</h2>
          </div>

          {!analysis && !loading && (
            <div className="text-center py-16 text-gray-400">
              <HiBeaker className="w-20 h-20 mx-auto mb-4 opacity-30" />
              <p className="font-medium text-gray-500">Awaiting Analysis</p>
              <p className="text-sm mt-1">Enter symptoms above and click "Analyze Symptoms"</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
              <p className="text-gray-600 font-medium">AI is analyzing symptoms...</p>
              <p className="text-xs text-gray-400 mt-1">Evaluating possible conditions</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              {/* Emergency Alert Banner */}
              {analysis.emergencyAlert && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg animate-pulse">
                  <div className="flex items-start gap-3">
                    <HiExclamationCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-800">Emergency Alert</p>
                      <p className="text-sm text-red-700 mt-1">{analysis.emergencyAlert}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Health Score & Severity */}
              <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg border border-primary-100">
                <div className="flex items-center gap-3">
                  <HiHeart className="w-6 h-6 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Health Score</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            analysis.healthScore >= 70 ? 'bg-green-500' :
                            analysis.healthScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${analysis.healthScore}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${
                        analysis.healthScore >= 70 ? 'text-green-700' :
                        analysis.healthScore >= 40 ? 'text-amber-700' : 'text-red-700'
                      }`}>
                        {analysis.healthScore}/100
                      </span>
                    </div>
                  </div>
                </div>
                {analysis.requiresVetAttention && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <HiShieldCheck className="w-3 h-3" />
                    Vet Required
                  </span>
                )}
              </div>

              {/* Possible Diseases */}
              {analysis.possibleDiseases?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <HiClipboardList className="w-4 h-4" />
                    Possible Conditions (Ranked by Probability)
                  </h3>
                  {analysis.possibleDiseases.map((disease, i) => (
                    <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-blue-900">
                              {i + 1}. {disease.disease}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${severityConfig[disease.severity]?.color || severityConfig.medium.color}`}>
                              {severityConfig[disease.severity]?.label || disease.severity}
                            </span>
                          </div>
                          <p className="text-xs text-blue-700 mb-1">{disease.description}</p>
                          <div className="flex items-center gap-2 text-xs text-blue-600">
                            <span className="font-medium">{disease.probability}% confidence</span>
                            <span>•</span>
                            <span className="capitalize">{disease.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Likely Causes */}
              {analysis.likelyCauses && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <h3 className="text-sm font-semibold text-amber-800 mb-2">Likely Causes</h3>
                  <p className="text-sm text-amber-700 whitespace-pre-line">{analysis.likelyCauses}</p>
                </div>
              )}

              {/* Recommended Treatment */}
              {analysis.recommendedTreatment && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <h3 className="text-sm font-semibold text-green-800 mb-2">Recommended Treatment</h3>
                  <p className="text-sm text-green-700 whitespace-pre-line">{analysis.recommendedTreatment}</p>
                </div>
              )}

              {/* Prevention Tips */}
              {analysis.preventionTips && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <h3 className="text-sm font-semibold text-purple-800 mb-2">Prevention Tips</h3>
                  <p className="text-sm text-purple-700 whitespace-pre-line">{analysis.preventionTips}</p>
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600">
                  ⚠️ {analysis.disclaimer || 'This is an AI-assisted assessment generated by Groq. It is not a confirmed veterinary diagnosis. Always consult a licensed veterinarian.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDiagnosis;