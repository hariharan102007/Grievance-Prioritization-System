const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, unique: true },
    description: { type: String },
    categories:  [{ type: String }],
    color:       { type: String, default: '#3b82f6' },
    icon:        { type: String, default: 'Building2' },
    active:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);
