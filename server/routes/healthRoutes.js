const express = require('express');
const router = express.Router();
const {
  getHealthRecords,
  createHealthRecord,
} = require('../controllers/healthController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getHealthRecords).post(createHealthRecord);

module.exports = router;