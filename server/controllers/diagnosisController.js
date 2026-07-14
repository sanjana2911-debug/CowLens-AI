const Diagnosis = require('../models/Diagnosis');
const Cow = require('../models/Cow');
const Notification = require('../models/Notification');
const { analyzeSymptoms } = require('../services/groqService');
const { detectDiseases } = require('../services/yoloService');
const { detectCattle } = require('../services/roboflowCowService');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const getDiagnoses = async (req, res, next) => {
  try {
    const cow = await Cow.findOne({ _id: req.params.cowId, user: req.user._id });
    if (!cow) {
      res.status(404);
      throw new Error('Cow not found');
    }

    const diagnoses = await Diagnosis.find({
      cow: req.params.cowId,
      user: req.user._id,
    })
      .sort('-createdAt')
      .populate('healthRecord', 'date type');

    res.json({
      success: true,
      count: diagnoses.length,
      data: diagnoses,
    });
  } catch (error) {
    next(error);
  }
};

const getDiagnosis = async (req, res, next) => {
  try {
    const diagnosis = await Diagnosis.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate([
      { path: 'cow', select: 'name tagNumber breed' },
      { path: 'healthRecord', select: 'date type treatment' },
    ]);

    if (!diagnosis) {
      res.status(404);
      throw new Error('Diagnosis not found');
    }

    res.json({ success: true, data: diagnosis });
  } catch (error) {
    next(error);
  }
};

const createDiagnosis = async (req, res, next) => {
  try {
    const cow = await Cow.findOne({ _id: req.params.cowId, user: req.user._id });
    if (!cow) {
      res.status(404);
      throw new Error('Cow not found');
    }

    req.body.cow = req.params.cowId;
    req.body.user = req.user._id;

    const diagnosis = await Diagnosis.create(req.body);

    const severityMap = {
      mild: 'under_treatment',
      moderate: 'sick',
      severe: 'sick',
      critical: 'critical',
    };
    if (diagnosis.severity && severityMap[diagnosis.severity]) {
      cow.healthStatus = severityMap[diagnosis.severity];
      await cow.save();
    }

    if (['moderate', 'severe', 'critical'].includes(diagnosis.severity)) {
      await Notification.create({
        user: req.user._id,
        type: 'health_alert',
        title: `Health Alert: ${diagnosis.condition}`,
        message: `${cow.name || `Cow #${cow.tagNumber}`} has been diagnosed with ${diagnosis.condition} (${diagnosis.severity})`,
        relatedCow: cow._id,
        relatedDiagnosis: diagnosis._id,
        severity: diagnosis.severity === 'critical' ? 'critical' : 'warning',
        actionLink: `/cow-details/${cow._id}`,
      });
    }

    res.status(201).json({ success: true, data: diagnosis });
  } catch (error) {
    next(error);
  }
};

const updateDiagnosis = async (req, res, next) => {
  try {
    let diagnosis = await Diagnosis.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!diagnosis) {
      res.status(404);
      throw new Error('Diagnosis not found');
    }

    if (req.body.status === 'resolved' && !diagnosis.resolvedDate) {
      req.body.resolvedDate = new Date();
    }

    diagnosis = await Diagnosis.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (req.body.status === 'resolved') {
      await Cow.findByIdAndUpdate(diagnosis.cow, { healthStatus: 'recovering' });
    }

    res.json({ success: true, data: diagnosis });
  } catch (error) {
    next(error);
  }
};

const deleteDiagnosis = async (req, res, next) => {
  try {
    const diagnosis = await Diagnosis.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!diagnosis) {
      res.status(404);
      throw new Error('Diagnosis not found');
    }

    await diagnosis.deleteOne();

    res.json({ success: true, message: 'Diagnosis removed' });
  } catch (error) {
    next(error);
  }
};

const aiAnalyzeSymptoms = async (req, res, next) => {
  try {
    const { symptoms, cowId } = req.body;

    if (!symptoms || !symptoms.trim()) {
      res.status(400);
      throw new Error('Symptoms description is required');
    }

    let cow = null;
    let healthRecords = [];
    let vaccinations = [];

    if (cowId) {
      cow = await Cow.findOne({ _id: cowId, user: req.user._id });
      if (!cow) {
        res.status(404);
        throw new Error('Cow not found');
      }

      const HealthRecord = require('../models/HealthRecord');
      healthRecords = await HealthRecord.find({ cow: cowId, user: req.user._id })
        .sort('-date')
        .limit(3)
        .lean();

      const Vaccination = require('../models/Vaccination');
      vaccinations = await Vaccination.find({ cow: cowId, user: req.user._id })
        .sort('-dateGiven')
        .limit(5)
        .lean();
    }

    const analysis = await analyzeSymptoms(cow, symptoms.trim(), healthRecords, vaccinations);

    let savedDiagnosis = null;
    if (cow) {
      const topDisease = analysis.data.possibleDiseases[0];
      const severityMap = {
        low: 'under_treatment',
        medium: 'sick',
        high: 'sick',
        critical: 'critical',
      };

      savedDiagnosis = await Diagnosis.create({
        cow: cow._id,
        user: req.user._id,
        source: 'ai',
        condition: topDisease.disease,
        category: topDisease.category,
        severity: topDisease.severity,
        symptoms: symptoms.trim(),
        confidenceScore: topDisease.probability,
        healthScore: analysis.data.healthScore,
        status: 'suspected',
        treatment: analysis.data.recommendedTreatment,
        likelyCauses: analysis.data.likelyCauses,
        preventionTips: analysis.data.preventionTips,
        requiresVetAttention: analysis.data.requiresVetAttention,
        disclaimer: analysis.data.disclaimer || 'This is an AI-assisted assessment generated by Groq. It is not a confirmed veterinary diagnosis. Always consult a licensed veterinarian.',
        conditionsCount: analysis.data.possibleDiseases.length,
        rawResponse: JSON.stringify(analysis.data),
      });

      if (severityMap[topDisease.severity]) {
        cow.healthStatus = severityMap[topDisease.severity];
        cow.healthScore = analysis.data.healthScore;
        await cow.save();
      }

      if (['high', 'critical'].includes(topDisease.severity)) {
        await Notification.create({
          user: req.user._id,
          type: 'health_alert',
          title: `Health Alert: ${topDisease.disease}`,
          message: `${cow.name || `Cow #${cow.tagNumber}`} has been diagnosed with ${topDisease.disease} (${topDisease.severity} severity)`,
          relatedCow: cow._id,
          relatedDiagnosis: savedDiagnosis._id,
          severity: topDisease.severity === 'critical' ? 'critical' : 'warning',
          actionLink: `/cow-details/${cow._id}`,
        });
      }
    }

    res.json({
      success: true,
      data: {
        ...analysis.data,
        diagnosisId: savedDiagnosis?._id || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * aiDetectImage — Image-based AI diagnosis pipeline.
 *
 * Flow:
 *   1. Validate uploaded file exists.
 *   2. Run Roboflow Cattle Detection to verify the image contains a cow.
 *   3. If NO cow detected → HTTP 400 immediately.
 *      - Do NOT call disease detection.
 *      - Do NOT call Groq.
 *      - Do NOT save to MongoDB.
 *   4. If cow detected → proceed with existing disease detection pipeline:
 *      - Roboflow disease classification workflow
 *      - Groq AI symptom analysis (if symptoms provided)
 *      - MongoDB Diagnosis save
 *      - Notification creation (if severe)
 *      - Return standard response format
 */
const aiDetectImage = async (req, res, next) => {
  try {
    // --- Step 1: Validate uploaded file ---
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a cow image');
    }

    const { symptoms, cowId } = req.body;
    const imagePath = req.file.path;
    const originalName = req.file.originalname;

    // --- Step 2: Run Roboflow Cattle Detection ---
    // This is the ONLY gatekeeper. If no cow is detected, reject immediately.
    console.log(`[CattleCheck] Starting cattle detection for: ${originalName}`);
    const cattleDetection = await detectCattle(imagePath);

    console.log(`[CattleCheck] Result: isCow=${cattleDetection.isCow}, confidence=${cattleDetection.confidence}%`);
    console.log(`[CattleCheck] Predictions: ${JSON.stringify(cattleDetection.predictions)}`);

    if (!cattleDetection.isCow) {
      // No cow detected — reject immediately.
      // Do NOT proceed to disease detection, Groq, or MongoDB.
      console.log(`[CattleCheck] REJECTED: No cow detected in image. Returning HTTP 400.`);

      // Clean up the uploaded file
      try {
        fs.unlinkSync(imagePath);
      } catch (cleanupError) {
        console.warn('Failed to clean up uploaded file:', cleanupError.message);
      }

      return res.status(400).json({
        success: false,
        message: 'Please upload a cow image.',
      });
    }

    // --- Step 3: Cow confirmed — proceed with disease detection pipeline ---
    console.log(`[CattleCheck] ACCEPTED: Cow detected. Proceeding to disease detection.`);

    // Run the existing Roboflow disease classification workflow
    const yoloResult = await detectDiseases(imagePath, req.file.originalname);

    // --- Step 4: Groq analysis (only if symptoms were provided) ---
    let combinedAnalysis = null;
    if (symptoms && symptoms.trim()) {
      let cow = null;
      let healthRecords = [];
      let vaccinations = [];

      if (cowId) {
        cow = await Cow.findOne({ _id: cowId, user: req.user._id });
        if (cow) {
          const HealthRecord = require('../models/HealthRecord');
          const Vaccination = require('../models/Vaccination');
          healthRecords = await HealthRecord.find({ cow: cowId, user: req.user._id })
            .sort('-date')
            .limit(3)
            .lean();
          vaccinations = await Vaccination.find({ cow: cowId, user: req.user._id })
            .sort('-dateGiven')
            .limit(5)
            .lean();
        }
      }

      const yoloFindings = yoloResult.detectedDiseases.length > 0
        ? `\n\nIMAGE ANALYSIS FINDINGS (Roboflow detected):\nDetected conditions: ${yoloResult.detectedDiseases.join(', ')}\nConfidence: ${yoloResult.confidence}%\n\nPlease incorporate these visual findings into your diagnosis.`
        : '\n\nIMAGE ANALYSIS: No specific disease patterns detected in the image. The cow appears visually normal.';

      const enhancedSymptoms = `${symptoms.trim()}${yoloFindings}`;
      const analysis = await analyzeSymptoms(cow, enhancedSymptoms, healthRecords, vaccinations);

      // --- Step 5: Save diagnosis to MongoDB (if cow selected) ---
      let savedDiagnosis = null;
      if (cow && analysis.data.possibleDiseases?.length > 0) {
        const topDisease = analysis.data.possibleDiseases[0];
        const severityMap = {
          low: 'under_treatment',
          medium: 'sick',
          high: 'sick',
          critical: 'critical',
        };

        savedDiagnosis = await Diagnosis.create({
          cow: cow._id,
          user: req.user._id,
          source: 'ai',
          condition: topDisease.disease,
          category: topDisease.category,
          severity: topDisease.severity,
          symptoms: enhancedSymptoms,
          confidenceScore: topDisease.probability,
          healthScore: analysis.data.healthScore,
          status: 'suspected',
          treatment: analysis.data.recommendedTreatment,
          likelyCauses: analysis.data.likelyCauses,
          preventionTips: analysis.data.preventionTips,
          requiresVetAttention: analysis.data.requiresVetAttention,
          disclaimer: analysis.data.disclaimer || 'This is an AI-assisted assessment generated by Groq with Roboflow image analysis. Always consult a licensed veterinarian.',
          conditionsCount: analysis.data.possibleDiseases.length,
          rawResponse: JSON.stringify(analysis.data),
          imageAnalysis: {
            imageUrl: yoloResult.annotatedImageUrl || '',
            findings: yoloResult.detectedDiseases.join(', ') || 'No visual findings',
            detectedConditions: yoloResult.detectedDiseases,
          },
        });

        if (severityMap[topDisease.severity]) {
          cow.healthStatus = severityMap[topDisease.severity];
          cow.healthScore = analysis.data.healthScore;
          await cow.save();
        }

        if (['high', 'critical'].includes(topDisease.severity)) {
          await Notification.create({
            user: req.user._id,
            type: 'health_alert',
            title: `Health Alert: ${topDisease.disease}`,
            message: `${cow.name || `Cow #${cow.tagNumber}`} diagnosed with ${topDisease.disease} (Roboflow + symptom analysis)`,
            relatedCow: cow._id,
            relatedDiagnosis: savedDiagnosis._id,
            severity: topDisease.severity === 'critical' ? 'critical' : 'warning',
            actionLink: `/cow-details/${cow._id}`,
          });
        }
      }

      combinedAnalysis = {
        ...analysis.data,
        yoloDetection: {
          detectedDiseases: yoloResult.detectedDiseases,
          detections: yoloResult.detections,
          confidence: yoloResult.confidence,
          boundingBoxes: yoloResult.boundingBoxes,
          annotatedImageUrl: yoloResult.annotatedImageUrl,
        },
        diagnosisId: savedDiagnosis?._id || null,
      };
    }

    // --- Step 6: Clean up uploaded file ---
    try {
      fs.unlinkSync(imagePath);
    } catch (cleanupError) {
      console.warn('Failed to clean up uploaded file:', cleanupError.message);
    }

    // --- Step 7: Return standard response ---
    res.json({
      success: true,
      data: {
        yoloDetection: {
          detectedDiseases: yoloResult.detectedDiseases,
          detections: yoloResult.detections,
          confidence: yoloResult.confidence,
          boundingBoxes: yoloResult.boundingBoxes,
          annotatedImageUrl: yoloResult.annotatedImageUrl,
          imageWidth: yoloResult.imageWidth,
          imageHeight: yoloResult.imageHeight,
          totalDetections: yoloResult.totalDetections,
        },
        combinedAnalysis,
      },
    });
  } catch (error) {
    // Clean up on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Image analysis failed',
      code: error.code || 'UNKNOWN_ERROR',
      details: error.response?.data || null,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

module.exports = {
  getDiagnoses,
  getDiagnosis,
  createDiagnosis,
  updateDiagnosis,
  deleteDiagnosis,
  aiAnalyzeSymptoms,
  aiDetectImage,
};