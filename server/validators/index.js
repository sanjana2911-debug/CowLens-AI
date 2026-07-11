const { body, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Auth validators
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  validate,
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// Cow validators
const createCowValidation = [
  body('tagNumber').trim().notEmpty().withMessage('Tag number is required'),
  body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('weight').optional().isNumeric().withMessage('Weight must be a number'),
  body('purchasePrice').optional().isNumeric().withMessage('Purchase price must be a number'),
  validate,
];

const updateCowValidation = [
  body('tagNumber').optional().trim().notEmpty().withMessage('Tag number cannot be empty'),
  body('gender').optional().isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('weight').optional().isNumeric().withMessage('Weight must be a number'),
  body('purchasePrice').optional().isNumeric().withMessage('Purchase price must be a number'),
  body('healthStatus')
    .optional()
    .isIn(['healthy', 'under_treatment', 'recovering', 'sick', 'critical'])
    .withMessage('Invalid health status'),
  validate,
];

// Health record validators
const createHealthRecordValidation = [
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('type')
    .isIn(['checkup', 'injury', 'illness', 'treatment', 'surgery', 'other'])
    .withMessage('Invalid record type'),
  body('cost').optional().isNumeric().withMessage('Cost must be a number'),
  validate,
];

// Vaccination validators
const createVaccinationValidation = [
  body('vaccineName').trim().notEmpty().withMessage('Vaccine name is required'),
  body('dateGiven').isISO8601().withMessage('Invalid date format'),
  body('nextDueDate').optional().isISO8601().withMessage('Invalid date format'),
  body('cost').optional().isNumeric().withMessage('Cost must be a number'),
  validate,
];

// Diagnosis validators
const createDiagnosisValidation = [
  body('condition').trim().notEmpty().withMessage('Condition is required'),
  body('severity')
    .optional()
    .isIn(['mild', 'moderate', 'severe', 'critical'])
    .withMessage('Invalid severity level'),
  body('status')
    .optional()
    .isIn(['suspected', 'confirmed', 'treated', 'resolved', 'chronic'])
    .withMessage('Invalid diagnosis status'),
  body('confidenceScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Confidence score must be between 0 and 100'),
  validate,
];

const updateDiagnosisValidation = [
  body('condition').optional().trim().notEmpty().withMessage('Condition cannot be empty'),
  body('severity')
    .optional()
    .isIn(['mild', 'moderate', 'severe', 'critical'])
    .withMessage('Invalid severity level'),
  body('status')
    .optional()
    .isIn(['suspected', 'confirmed', 'treated', 'resolved', 'chronic'])
    .withMessage('Invalid diagnosis status'),
  body('healthScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Health score must be between 0 and 100'),
  validate,
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  createCowValidation,
  updateCowValidation,
  createHealthRecordValidation,
  createVaccinationValidation,
  createDiagnosisValidation,
  updateDiagnosisValidation,
};