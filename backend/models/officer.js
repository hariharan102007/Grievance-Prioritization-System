const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  'Water Supply':   { type: Number, default: 50 },
  'Electricity':    { type: Number, default: 50 },
  'Roads':          { type: Number, default: 50 },
  'Sanitation':     { type: Number, default: 50 },
  'Healthcare':     { type: Number, default: 50 },
  'Public Safety':  { type: Number, default: 50 },
  'Transport':      { type: Number, default: 50 },
  'Environment':    { type: Number, default: 50 },
}, { _id: false });

const performanceSchema = new mongoose.Schema({
  resolution_rate:    { type: Number, default: 0 },   // %
  sla_compliance:     { type: Number, default: 0 },   // %
  citizen_rating:     { type: Number, default: 0 },   // /5
  avg_resolution_hrs: { type: Number, default: 0 },
  reopened_count:     { type: Number, default: 0 },
  critical_resolved:  { type: Number, default: 0 },
  total_resolved:     { type: Number, default: 0 },
}, { _id: false });

const officerSchema = new mongoose.Schema(
  {
    name:                { type: String, required: true },
    employee_id:         { type: String, required: true, unique: true },
    email:               { type: String, required: true, unique: true },
    phone:               { type: String },
    designation:         { type: String, default: 'Field Officer' },
    department:          { type: String, required: true },
    assigned_area:       { type: String },
    assigned_categories: [{ type: String }],
    role:                { type: String, enum: ['Officer', 'Supervisor', 'Admin'], default: 'Officer' },
    status:              { type: String, enum: ['active', 'leave', 'unavailable', 'pending'], default: 'pending' },
    skills:              { type: skillSchema, default: () => ({}) },
    performance:         { type: performanceSchema, default: () => ({}) },
    readiness_score:     { type: Number, default: 0 },
    overall_score:       { type: Number, default: 0 },
    current_complaints:  { type: Number, default: 0 },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Officer', officerSchema);
