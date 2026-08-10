const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema(
  {
    language: { type: String, required: true, enum: ['en', 'ta'] },
    key:      { type: String, required: true },
    text:     { type: String, required: true },
  },
  { timestamps: true }
);

translationSchema.index({ language: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Translation', translationSchema);
