const mongoose = require('mongoose');

/**
 * Notification Schema - Vaccination reminders, health alerts, system notifications
 */
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'vaccination_reminder',
        'health_alert',
        'diagnosis_update',
        'vaccination_due',
        'health_score',
        'system',
      ],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Please add a message'],
      trim: true,
    },
    // Related entities
    relatedCow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cow',
    },
    relatedVaccination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vaccination',
    },
    relatedDiagnosis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Diagnosis',
    },
    // Severity level
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },
    // Auto-dismiss after date
    expiresAt: {
      type: Date,
    },
    // Action link (frontend route)
    actionLink: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);