const Diagnosis = require('../models/Diagnosis');
const Cow = require('../models/Cow');
const Notification = require('../models/Notification');
const { analyzeSymptoms } = require('../services/groqService');

/**
 * @desc    Get all diagnoses for a cow
 * @route   GET /api/cows/:cowId/diagnoses
 * @access  Private
 */
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

/**
 * @desc    Get single diagnosis
 * @route   GET /api/diagnoses/:id
 * @access  Private
 */
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

/**
 * @desc    Create a diagnosis
 * @route   POST /api/cows/:cowId/diagnoses
 * @access  Private
 */
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

    // Update cow health status based on diagnosis severity
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

    // Create notification for health alert
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

/**
 * @desc    Update a diagnosis
 * @route   PUT /api/diagnoses/:id
 * @access  Private
 */
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

    // If resolving, set resolved date
    if (req.body.status === 'resolved' && !diagnosis.resolvedDate) {
      req.body.resolvedDate = new Date();
    }

    diagnosis = await Diagnosis.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // If resolved, update cow health status
    if (req.body.status === 'resolved') {
      await Cow.findByIdAndUpdate(diagnosis.cow, { healthStatus: 'recovering' });
    }

    res.json({ success: true, data: diagnosis });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a diagnosis
 * @route   DELETE /api/diagnoses/:id
 * @access  Private
 */
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

/**
 * @desc    AI-powered symptom analysis using Groq API
 * @route   POST /api/diagnoses/ai-analyze
 * @access  Private
 */
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

    // If cowId is provided, fetch cow data and related records
    if (cowId) {
      cow = await Cow.findOne({ _id: cowId, user: req.user._id });
      if (!cow) {
        res.status(404);
        throw new Error('Cow not found');
      }

      // Fetch recent health records
      const HealthRecord = require('../models/HealthRecord');
      healthRecords = await HealthRecord.find({ cow: cowId, user: req.user._id })
        .sort('-date')
        .limit(3)
        .lean();

      // Fetch recent vaccinations
      const Vaccination = require('../models/Vaccination');
      vaccinations = await Vaccination.find({ cow: cowId, user: req.user._id })
        .sort('-dateGiven')
        .limit(5)
        .lean();
    }

    // Call Gemini AI service
    const analysis = await analyzeSymptoms(cow, symptoms.trim(), healthRecords, vaccinations);

    // Save diagnosis to database if cow is selected
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

      // Update cow health status
      if (severityMap[topDisease.severity]) {
        cow.healthStatus = severityMap[topDisease.severity];
        cow.healthScore = analysis.data.healthScore;
        await cow.save();
      }

      // Create notification for health alert
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

module.exports = {
  getDiagnoses,
  getDiagnosis,
  createDiagnosis,
  updateDiagnosis,
  deleteDiagnosis,
  aiAnalyzeSymptoms,
};