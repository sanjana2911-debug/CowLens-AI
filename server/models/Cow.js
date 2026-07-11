const mongoose = require('mongoose');

/**
 * Cow Schema - Core cattle management with health tracking
 */
const cowSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tagNumber: {
      type: String,
      required: [true, 'Please add a tag number'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    breed: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: true,
    },
    dateOfBirth: {
      type: Date,
    },
    weight: {
      type: Number,
      min: 0,
    },
    weightUnit: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg',
    },
    color: {
      type: String,
      trim: true,
    },
    // Health status tracking
    healthStatus: {
      type: String,
      enum: ['healthy', 'under_treatment', 'recovering', 'sick', 'critical'],
      default: 'healthy',
    },
    healthScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    lastCheckup: {
      type: Date,
    },
    lastVaccination: {
      type: Date,
    },
    // Lifecycle status
    status: {
      type: String,
      enum: ['active', 'sold', 'deceased', 'transferred'],
      default: 'active',
    },
    // Purchase / ownership info
    purchaseDate: {
      type: Date,
    },
    purchasePrice: {
      type: Number,
      min: 0,
    },
    // Location within farm
    location: {
      type: String,
      trim: true,
    },
    // Notes
    notes: {
      type: String,
      trim: true,
    },
    // Image (future: QR code, health passport)
    image: {
      type: String,
      default: '',
    },
    qrCode: {
      type: String,
      default: '',
    },
    // Tracking tags for AI features
    tags: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for age in years
cowSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const now = new Date();
  const diff = now - this.dateOfBirth;
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
});

// Indexes
cowSchema.index({ user: 1, tagNumber: 1 }, { unique: true });
cowSchema.index({ user: 1, healthStatus: 1 });
cowSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Cow', cowSchema);