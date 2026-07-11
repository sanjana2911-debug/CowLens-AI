const express = require('express');
const router = express.Router();
const {
  getCows,
  getCow,
  createCow,
  updateCow,
  deleteCow,
  getDashboardStats,
  getPublicPassport,
} = require('../controllers/cowController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createCowValidation, updateCowValidation } = require('../validators');

// Public passport route (must be defined BEFORE router.use(protect))
router.route('/passport/:id').get(getPublicPassport);

router.use(protect);

router.route('/stats/dashboard').get(getDashboardStats);
router.route('/').get(getCows).post(upload.single('image'), createCowValidation, createCow);
router.route('/:id').get(getCow).put(updateCowValidation, updateCow).delete(deleteCow);

module.exports = router;
