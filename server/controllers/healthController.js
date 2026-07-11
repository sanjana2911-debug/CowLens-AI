const HealthRecord = require('../models/HealthRecord');
const Cow = require('../models/Cow');

// @desc    Get all health records for a cow
// @route   GET /api/cows/:cowId/health
// @access  Private
const getHealthRecords = async (req, res, next) => {
  try {
    const cow = await Cow.findOne({
      _id: req.params.cowId,
      user: req.user._id,
    });
    if (!cow) {
      res.status(404);
      throw new Error('Cow not found');
    }

    const records = await HealthRecord.find({
      cow: req.params.cowId,
      user: req.user._id,
    }).sort('-date');

    res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single health record
// @route   GET /api/health/:id
// @access  Private
const getHealthRecord = async (req, res, next) => {
  try {
    const record = await HealthRecord.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!record) {
      res.status(404);
      throw new Error('Health record not found');
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create health record
// @route   POST /api/cows/:cowId/health
// @access  Private
const createHealthRecord = async (req, res, next) => {
  try {
    const cow = await Cow.findOne({
      _id: req.params.cowId,
      user: req.user._id,
    });
    if (!cow) {
      res.status(404);
      throw new Error('Cow not found');
    }

    req.body.cow = req.params.cowId;
    req.body.user = req.user._id;

    const record = await HealthRecord.create(req.body);

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update health record
// @route   PUT /api/health/:id
// @access  Private
const updateHealthRecord = async (req, res, next) => {
  try {
    let record = await HealthRecord.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!record) {
      res.status(404);
      throw new Error('Health record not found');
    }

    record = await HealthRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete health record
// @route   DELETE /api/health/:id
// @access  Private
const deleteHealthRecord = async (req, res, next) => {
  try {
    const record = await HealthRecord.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!record) {
      res.status(404);
      throw new Error('Health record not found');
    }

    await record.deleteOne();

    res.json({
      success: true,
      message: 'Health record removed',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealthRecords,
  getHealthRecord,
  createHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
};