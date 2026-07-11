const Cow = require('../models/Cow');
const HealthRecord = require('../models/HealthRecord');
const Vaccination = require('../models/Vaccination');
const Diagnosis = require('../models/Diagnosis');
const Notification = require('../models/Notification');
const { checkVaccinationReminders } = require('./notificationController');

// @desc    Get all cows for user
// @route   GET /api/cows
// @access  Private
const getCows = async (req, res, next) => {
  try {
    const cows = await Cow.find({ user: req.user._id }).sort('-createdAt');
    res.json({
      success: true,
      count: cows.length,
      data: cows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single cow
// @route   GET /api/cows/:id
// @access  Private
const getCow = async (req, res, next) => {
  try {
    const cow = await Cow.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!cow) {
      res.status(404);
      throw new Error('Cow not found');
    }

    res.json({
      success: true,
      data: cow,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a cow
// @route   POST /api/cows
// @access  Private
const createCow = async (req, res, next) => {
  try {
    req.body.user = req.user._id;
    const cow = await Cow.create(req.body);
    res.status(201).json({
      success: true,
      data: cow,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a cow
// @route   PUT /api/cows/:id
// @access  Private
const updateCow = async (req, res, next) => {
  try {
    let cow = await Cow.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!cow) {
      res.status(404);
      throw new Error('Cow not found');
    }

    cow = await Cow.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: cow,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a cow
// @route   DELETE /api/cows/:id
// @access  Private
const deleteCow = async (req, res, next) => {
  try {
    const cow = await Cow.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!cow) {
      res.status(404);
      throw new Error('Cow not found');
    }

    await cow.deleteOne();

    res.json({
      success: true,
      message: 'Cow removed',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get enhanced dashboard stats
// @route   GET /api/cows/stats/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Run vaccination reminder checks
    await checkVaccinationReminders(userId);

    // Core counts
    const totalCows = await Cow.countDocuments({ user: userId });
    const activeCows = await Cow.countDocuments({ user: userId, status: 'active' });

    // Health status breakdown
    const healthyCows = await Cow.countDocuments({ user: userId, healthStatus: 'healthy' });
    const sickCows = await Cow.countDocuments({
      user: userId,
      healthStatus: { $in: ['sick', 'critical'] },
    });
    const underTreatment = await Cow.countDocuments({
      user: userId,
      healthStatus: { $in: ['under_treatment', 'recovering'] },
    });

    // Health records
    const totalHealthRecords = await HealthRecord.countDocuments({ user: userId });

    // Vaccinations
    const upcomingVaccinations = await Vaccination.find({
      user: userId,
      nextDueDate: { $gte: new Date() },
    })
      .sort('nextDueDate')
      .limit(5)
      .populate('cow', 'name tagNumber');

    const vaccinationsDueCount = await Vaccination.countDocuments({
      user: userId,
      nextDueDate: { $gte: new Date() },
    });

    const overdueVaccinations = await Vaccination.countDocuments({
      user: userId,
      nextDueDate: { $lt: new Date() },
    });

    // Recent diagnoses
    const recentDiagnoses = await Diagnosis.find({ user: userId })
      .sort('-createdAt')
      .limit(5)
      .populate('cow', 'name tagNumber')
      .select('condition severity status createdAt');

    const activeDiagnoses = await Diagnosis.countDocuments({
      user: userId,
      status: { $in: ['suspected', 'confirmed', 'treated'] },
    });

    // Notifications
    const unreadNotifications = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    // Health alerts (critical notifications)
    const healthAlerts = await Notification.find({
      user: userId,
      isRead: false,
      severity: { $in: ['warning', 'critical'] },
    })
      .sort('-createdAt')
      .limit(5)
      .populate('relatedCow', 'name tagNumber');

    // Average health score
    const cowsWithScores = await Cow.find({
      user: userId,
      healthScore: { $ne: null },
    }).select('healthScore');

    const avgHealthScore = cowsWithScores.length > 0
      ? Math.round(cowsWithScores.reduce((sum, c) => sum + c.healthScore, 0) / cowsWithScores.length)
      : null;

    res.json({
      success: true,
      data: {
        // Core counts
        totalCows,
        activeCows,
        totalHealthRecords,

        // Health breakdown
        healthyCows,
        sickCows,
        underTreatment,

        // Vaccination stats
        vaccinationsDueCount,
        overdueVaccinations,
        upcomingVaccinations,

        // Diagnosis stats
        activeDiagnoses,
        recentDiagnoses,

        // Notifications
        unreadNotifications,
        healthAlerts,

        // Health score
        avgHealthScore,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public cow health passport (no auth required)
// @route   GET /api/cows/passport/:id
// @access  Public
const getPublicPassport = async (req, res, next) => {
  try {
    const cow = await Cow.findById(req.params.id);
    if (!cow) {
      res.status(404);
      throw new Error('Cow not found');
    }

    const healthRecords = await HealthRecord.find({ cow: req.params.id }).sort('-date');
    const vaccinations = await Vaccination.find({ cow: req.params.id }).sort('-dateGiven');
    const diagnoses = await Diagnosis.find({ cow: req.params.id }).sort('-createdAt');

    res.json({
      success: true,
      data: {
        cow,
        healthRecords,
        vaccinations,
        diagnoses,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCows,
  getCow,
  createCow,
  updateCow,
  deleteCow,
  getDashboardStats,
  getPublicPassport,
};