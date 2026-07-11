const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const cowRoutes = require('./cowRoutes');
const {
  getHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
} = require('../controllers/healthController');
const {
  getVaccination,
  updateVaccination,
  deleteVaccination,
} = require('../controllers/vaccinationController');
const {
  getHealthRecords,
  createHealthRecord,
} = require('../controllers/healthController');
const {
  getVaccinations,
  createVaccination,
} = require('../controllers/vaccinationController');
const {
  getDiagnoses,
  getDiagnosis,
  createDiagnosis,
  updateDiagnosis,
  deleteDiagnosis,
  aiAnalyzeSymptoms,
  aiDetectImage,
} = require('../controllers/diagnosisController');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createHealthRecordValidation,
  createVaccinationValidation,
  createDiagnosisValidation,
  updateDiagnosisValidation,
} = require('../validators');

// Auth routes
router.use('/auth', authRoutes);

// Cow routes
router.use('/cows', cowRoutes);

// Nested health routes
router.get('/cows/:cowId/health', protect, getHealthRecords);
router.post('/cows/:cowId/health', protect, createHealthRecordValidation, createHealthRecord);

// Nested vaccination routes
router.get('/cows/:cowId/vaccinations', protect, getVaccinations);
router.post('/cows/:cowId/vaccinations', protect, createVaccinationValidation, createVaccination);

// Nested diagnosis routes
router.get('/cows/:cowId/diagnoses', protect, getDiagnoses);
router.post('/cows/:cowId/diagnoses', protect, createDiagnosisValidation, createDiagnosis);

// AI diagnosis analysis endpoint
router.post('/diagnoses/ai-analyze', protect, aiAnalyzeSymptoms);

// YOLO image-based disease detection endpoint
router.post('/diagnoses/ai-detect-image', protect, upload.single('image'), aiDetectImage);

// Direct health routes
router.get('/health/:id', protect, getHealthRecord);
router.put('/health/:id', protect, updateHealthRecord);
router.delete('/health/:id', protect, deleteHealthRecord);

// Direct vaccination routes
router.get('/vaccinations/:id', protect, getVaccination);
router.put('/vaccinations/:id', protect, updateVaccination);
router.delete('/vaccinations/:id', protect, deleteVaccination);

// Direct diagnosis routes
router.get('/diagnoses/:id', protect, getDiagnosis);
router.put('/diagnoses/:id', protect, updateDiagnosisValidation, updateDiagnosis);
router.delete('/diagnoses/:id', protect, deleteDiagnosis);

// Notification routes
router.get('/notifications', protect, getNotifications);
router.get('/notifications/unread-count', protect, getUnreadCount);
router.put('/notifications/read-all', protect, markAllAsRead);
router.put('/notifications/:id/read', protect, markAsRead);
router.delete('/notifications/:id', protect, deleteNotification);

module.exports = router;