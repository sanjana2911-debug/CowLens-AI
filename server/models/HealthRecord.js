const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema(
  {
    cow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cow',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Please add a date'],
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['checkup', 'injury', 'illness', 'treatment', 'surgery', 'other'],
      required: true,
    },
    diagnosis: {
      type: String,
      trim: true,
    },
    symptoms: {
      type: String,
      trim: true,
    },
    treatment: {
      type: String,
      trim: true,
    },
    medication: {
      type: String,
      trim: true,
    },
    veterinarian: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    followUpDate: {
      type: Date,
    },
    cost: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('HealthRecord', healthRecordSchema);