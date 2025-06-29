const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

const sessionSchema = new mongoose.Schema({
  sessionUuid: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  users: [userSchema],
  lastActive: {
    type: Date,
    default: Date.now
  }
});

// Clean up old sessions periodically
sessionSchema.index({ lastActive: 1 }, { expireAfterSeconds: 86400 * 7 }); // Auto-delete after 7 days

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;