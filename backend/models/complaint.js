const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    ticket_id:      { type: String, required: true, unique: true },
    title:          { type: String, required: true },
    description:    { type: String, required: true },
    category:       { type: String },
    department:     { type: String },
    priority:       { type: String, enum: ['Low','Medium','High','Critical'], default: 'Medium' },
    status:         { type: String, enum: ['Registered','Assigned','In Progress','Resolved'], default: 'Registered' },
    location:       { type: String },
    language:       { type: String, default: 'English' },
    sentiment:      { type: String, enum: ['positive','neutral','negative','urgent'], default: 'neutral' },
    duplicate_of:   { type: String, default: null },
    duplicate_count:{ type: Number, default: 0 },
    photo_url:      { type: String, default: null },
    assigned_to:    { type: mongoose.Schema.Types.ObjectId, ref: 'Officer', default: null },
    resolved_at:    { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Complaint', complaintSchema);
