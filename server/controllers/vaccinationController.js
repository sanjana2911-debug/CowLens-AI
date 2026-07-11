const Vaccination = require('../models/Vaccination');
const Cow = require('../models/Cow');

// @desc    Get all vaccinations for a cow
// @route   GET /api/cows/:cowId/vaccinations
// @access  Private
const getVaccinations = async (req, res, next) => {
  try {
    const cow = await Cow.findOne({
      _id: req.params.cowId,
      user: req.user._id,
    });
    if (!cow) {
      res.status(404);
      throw new Error('Cow not found');
    }

    const vaccinations = await Vaccination.find({
      cow: req.params.cowId,
      user: req.user._id,
    }).sort('-dateGiven');

    res.json({
      success: true,
      count: vaccinations.length,
      data: vaccinations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vaccination
// @route   GET /api/vaccinations/:id
// @access  Private
const getVaccination = async (req, res, next) => {
  try {
    const vaccination = await Vaccination.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!vaccination) {
      res.status(404);
      throw new Error('Vaccination record not found');
    }

    res.json({
      success: true,
      data: vaccination,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create vaccination record
// @route   POST /api/cows/:cowId/vaccinations
// @access  Private
const createVaccination = async (req, res, next) => {
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

    const vaccination = await Vaccination.create(req.body);

    res.status(201).json({
      success: true,
      data: vaccination,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vaccination record
// @route   PUT /api/vaccinations/:id
// @access  Private
const updateVaccination = async (req, res, next) => {
  try {
    let vaccination = await Vaccination.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!vaccination) {
      res.status(404);
      throw new Error('Vaccination record not found');
    }

    vaccination = await Vaccination.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: vaccination,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vaccination record
// @route   DELETE /api/vaccinations/:id
// @access  Private
const deleteVaccination = async (req, res, next) => {
  try {
    const vaccination = await Vaccination.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!vaccination) {
      res.status(404);
      throw new Error('Vaccination record not found');
    }

    await vaccination.deleteOne();

    res.json({
      success: true,
      message: 'Vaccination record removed',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVaccinations,
  getVaccination,
  createVaccination,
  updateVaccination,
  deleteVaccination,
};