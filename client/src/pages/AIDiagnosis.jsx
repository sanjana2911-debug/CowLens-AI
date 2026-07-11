import { useState, useEffect, useRef } from 'react';
import { diagnosisAPI, cowsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AnimatedPage from '../components/AnimatedPage';
import { HiBeaker, HiLightBulb, HiChip, HiExclamationCircle, HiShieldCheck, HiHeart, HiClipboardList, HiPhotograph, HiUpload, HiEye, HiCheckCircle, HiXCircle, HiInformationCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';

const severityConfig = {
  low: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Low' },
  medium: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'High' },
  critical: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Critical' },
};

const ConfidenceGauge = ({ value = 0 }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value, 100);
  const offset = circumference - (progress / 100) * circumference;
  const color = progress >= 70 ? '#22c55e' : progress >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" className="transform -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute mt-[22px]">
        <span className="text-2xl font-bold" style={{ color }}>{Math.round(progress)}%</span>
      </div>
    </div>
  );
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [yoloResult, setYoloResult] = useState(null);
  const [yoloLoading, setYoloLoading] = useState(false);
  const [yoloMode, setYoloMode] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadCows = async () => {
      if (cows.length > 0) return;
      setCowsLoading(true);
      try {
        const res = await cowsAPI.getAll();
        setCows(res.data.data);
      } catch { /* ignore */ }
      finally { setCowsLoading(false); }
    };
    loadCows();
  }, []);

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { setError('Please select a valid image file (JPG, PNG, or WebP)'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Image size must be less than 10MB'); return; }
    setError('');
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setYoloResult(null);
    setAnalysis(null);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null); setImagePreview(null); setYoloResult(null); setAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (yoloMode) {
      if (!selectedImage) { setError('Please select an image to analyze'); return; }
      await handleImageDetection();
    } else {
      if (!symptoms.trim()) { setError('Please describe the symptoms'); return; }
      await handleSymptomAnalysis();
    }
  };

  const handleImageDetection = async () => {
    setError(''); setLoading(true); setYoloLoading(true); setAnalysis(null); setYoloResult(null);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      if (symptoms.trim()) formData.append('symptoms', symptoms.trim());
      if (selectedCow) formData.append('cowId', selectedCow);
      const res = await diagnosisAPI.aiDetectImage(formData);
      const data = res.data.data;
      setYoloResult(data.yoloDetection);
      if (data.combinedAnalysis) setAnalysis(data.combinedAnalysis);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Image analysis failed. Please try again.');
      toast.error('Image analysis failed');
    } finally { setLoading(false); setYoloLoading(false); }
  };

  const handleSymptomAnalysis = async () => {
    setError(''); setLoading(true); setAnalysis(null);
    try {
      const res = await diagnosisAPI.aiAnalyze({ symptoms: symptoms.trim(), cowId: selectedCow || undefined });
      setAnalysis(res.data.data);
      toast.success('Analysis complete');
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.');
      toast.error('Analysis failed');
    } finally { setLoading(false); }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return 'bg-green-500';
    if (confidence >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">AI Diagnosis</h1>
          <p className="text-gray-500 mt-1">
            {yoloMode ? 'Upload a cow image for AI-powered disease detection' : 'Describe symptoms and get AI-powered preliminary insights for your cattle'}
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => { setYoloMode(false); setError(''); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!yoloMode ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <HiLightBulb className="inline w-4 h-4 mr-1" /> Symptom Analysis
          </button>
          <button onClick={() => { setYoloMode(true); setError(''); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${yoloMode ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <HiPhotograph className="inline w-4 h-4 mr-1" /> Image Detection
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              {yoloMode ? <HiPhotograph className="w-5 h-5 text-primary-600" /> : <HiBeaker className="w-5 h-5 text-primary-600" />}
              <h2 className="section-title">{yoloMode ? 'Image Upload' : 'Symptom Description'}</h2>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Cow (optional)</label>
                <select value={selectedCow} onChange={(e) => setSelectedCow(e.target.value)} className="input-field">
                  <option value="">— No cow selected —</option>
                  {cows.map((cow) => (
                    <option key={cow._id} value={cow._id}>{cow.name || `Cow #${cow.tagNumber}`} - {cow.breed || 'N/A'}</option>
                  ))}
                </select>
                {cowsLoading && <p className="text-xs text-gray-400 mt-1">Loading cows...</p>}
              </div>

              {yoloMode ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Cow Image</label>
                    {!imagePreview ? (
                      <div onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all">
                        <HiUpload className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WebP (max 10MB)</p>
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden border border-gray-200">
                        <img src={imagePreview} alt="Cow preview" className="w-full h-64 object-cover" />
                        <button type="button" onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                          <HiXCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageSelect} className="hidden" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Symptoms (optional)</label>
                    <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
                      className="input-field font-mono text-sm" rows="4"
                      placeholder="Describe symptoms you've observed (optional). If entered, Groq AI will combine image findings with symptoms." />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Describe the symptoms you've observed</label>
                  <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
                    className="input-field font-mono text-sm" rows="8" required
                    placeholder={`Describe symptoms in detail, for example:\n• Lethargy and reduced appetite\n• Nasal discharge and coughing\n• Diarrhea for 2 days\n• Swollen joints\n• Fever (temperature > 39.5°C)`} />
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <HiChip className="w-4 h-4 flex-shrink-0" />
                <p>AI-powered preliminary analysis. Always consult a veterinarian for proper diagnosis.</p>
              </div>

              <button type="submit" disabled={loading || (yoloMode ? !selectedImage : !symptoms.trim())}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{yoloMode ? 'Analyzing Image...' : 'Analyzing with AI...'}</>
                ) : (
                  <>{yoloMode ? <HiEye className="w-5 h-5" /> : <HiLightBulb className="w-5 h-5" />}{yoloMode ? 'Detect Diseases from Image' : 'Analyze Symptoms'}</>
                )}
              </button>
            </form>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              {yoloResult ? <HiPhotograph className="w-5 h-5 text-primary-600" /> : <HiLightBulb className="w-5 h-5 text-amber-500" />}
              <h2 className="section-title">AI Analysis Results</h2>
            </div>

            {!analysis && !yoloResult && !loading && (
              <div className="text-center py-16 text-gray-400">
                {yoloMode ? (
                  <><HiPhotograph className="w-20 h-20 mx-auto mb-4 opacity-30" /><p className="font-medium text-gray-500">Awaiting Image</p><p className="text-sm mt-1">Upload a cow image to begin</p></>
                ) : (
                  <><HiBeaker className="w-20 h-20 mx-auto mb-4 opacity-30" /><p className="font-medium text-gray-500">Awaiting Analysis</p><p className="text-sm mt-1">Enter symptoms and click analyze</p></>
                )}
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-600 font-medium">{yoloLoading ? 'AI is analyzing the image...' : 'AI is analyzing symptoms...'}</p>
                <p className="text-xs text-gray-400 mt-1">Using Groq AI for medical reasoning</p>
              </div>
            )}

            {yoloResult && !loading && (
              <div className="space-y-4 mb-4">
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
                  <h3 className="text-sm font-semibold text-primary-800 flex items-center gap-2 mb-3">
                    <HiEye className="w-4 h-4" /> Image Detection Results
                  </h3>
                  {yoloResult.annotatedImageUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-gray-200">
                      <img src={yoloResult.annotatedImageUrl} alt="Annotated cow" className="w-full object-cover max-h-80" />
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      {yoloResult.detectedDiseases?.length > 0 ? `${yoloResult.detectedDiseases.length} condition(s) detected` : 'No conditions detected'}
                    </span>
                    {yoloResult.totalDetections > 0 && (
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">{yoloResult.confidence}% confidence</span>
                    )}
                  </div>
                  {yoloResult.detections?.length > 0 && (
                    <div className="space-y-2">
                      {yoloResult.detections.map((detection, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
                          <div className="flex items-center gap-2">
                            <HiCheckCircle className="w-4 h-4 text-primary-600" />
                            <span className="text-sm font-medium text-gray-800">{detection.disease}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${getConfidenceColor(detection.confidence)}`} style={{ width: `${detection.confidence}%` }} />
                            </div>
                            <span className="text-xs font-medium text-gray-600 min-w-[3rem] text-right">{detection.confidence}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {analysis && (
              <div className="space-y-4">
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

                {/* Confidence Gauge + Health Score */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-primary-50 rounded-lg border border-primary-100 flex flex-col items-center">
                    <p className="text-xs font-medium text-gray-500 mb-2">Confidence</p>
                    <ConfidenceGauge value={analysis.possibleDiseases?.[0]?.probability || 0} />
                  </div>
                  <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
                    <div className="flex items-center gap-2 mb-2">
                      <HiHeart className="w-5 h-5 text-primary-600" />
                      <p className="text-sm font-medium text-gray-700">Health Score</p>
                    </div>
                    <p className={`text-3xl font-bold ${analysis.healthScore >= 70 ? 'text-green-600' : analysis.healthScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {analysis.healthScore}/100
                    </p>
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${analysis.healthScore >= 70 ? 'bg-green-500' : analysis.healthScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${analysis.healthScore}%` }} />
                    </div>
                    {analysis.requiresVetAttention && (
                      <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        <HiShieldCheck className="w-3 h-3" /> Vet Required
                      </span>
                    )}
                  </div>
                </div>

                {yoloResult && analysis.possibleDiseases && (
                  <div className="p-2 bg-gradient-to-r from-primary-50 to-amber-50 rounded-lg border border-primary-100 text-center">
                    <p className="text-xs font-medium text-primary-700">🧬 Combined Analysis: Image Detection + Groq AI reasoning</p>
                  </div>
                )}

                {analysis.possibleDiseases?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <HiClipboardList className="w-4 h-4" /> Possible Conditions (Ranked by Probability)
                    </h3>
                    {analysis.possibleDiseases.map((disease, i) => (
                      <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-blue-900">{i + 1}. {disease.disease}</p>
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

                {analysis.likelyCauses && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <h3 className="text-sm font-semibold text-amber-800 mb-2">Likely Causes</h3>
                    <p className="text-sm text-amber-700 whitespace-pre-line">{analysis.likelyCauses}</p>
                  </div>
                )}

                {analysis.recommendedTreatment && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <h3 className="text-sm font-semibold text-green-800 mb-2">Recommended Treatment</h3>
                    <p className="text-sm text-green-700 whitespace-pre-line">{analysis.recommendedTreatment}</p>
                  </div>
                )}

                {analysis.preventionTips && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <h3 className="text-sm font-semibold text-purple-800 mb-2">Prevention Tips</h3>
                    <p className="text-sm text-purple-700 whitespace-pre-line">{analysis.preventionTips}</p>
                  </div>
                )}

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600">⚠️ {analysis.disclaimer || 'This is an AI-assisted assessment. Always consult a licensed veterinarian.'}</p>
                </div>
              </div>
            )}

            {yoloResult && !analysis && !loading && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700">💡 <strong>Tip:</strong> Add symptom descriptions above and re-analyze to get a combined diagnosis with health scores and treatment recommendations.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default AIDiagnosis;