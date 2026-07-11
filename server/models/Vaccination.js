const mongoose = require('mongoose');

const vaccinationSchema = new mongoose.Schema(
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
    vaccineName: {
      type: String,
      required: [true, 'Please add vaccine name'],
      trim: true,
    },
    dateGiven: {
      type: Date,
      required: [true, 'Please add date given'],
    },
    nextDueDate: {
      type: Date,
    },
    batchNumber: {
      type: String,
      trim: true,
    },
    administeredBy: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    cost: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Vaccination', vaccinationSchema);