const express = require('express');
const router = express.Router();
const Officer = require('../models/officer');
const Complaint = require('../models/complaint');
const { assignOfficer, rankOfficers } = require('../utils/ai-assignment');

// GET /api/officers � list all with workload
router.get('/', async (req, res) => {
  try {
    const officers = await Officer.find().lean();
    const withWorkload = await Promise.all(officers.map(async (o) => {
      const count = await Complaint.countDocuments({
        assigned_to: o._id,
        status: { $in: ['Assigned', 'In Progress'] },
      });
      return { ...o, current_complaints: count };
    }));
    res.json(withWorkload);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/officers/:id
router.get('/:id', async (req, res) => {
  try {
    const officer = await Officer.findById(req.params.id).lean();
    if (!officer) return res.status(404).json({ error: 'Not found' });
    const complaints = await Complaint.find({ assigned_to: req.params.id })
      .sort({ created_at: -1 }).limit(20).lean();
    const activeCount = complaints.filter(c =>
      ['Assigned', 'In Progress'].includes(c.status)).length;
    res.json({ ...officer, current_complaints: activeCount, complaints });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/officers � register new officer
router.post('/', async (req, res) => {
  try {
    const officer = await Officer.create(req.body);
    res.status(201).json(officer);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/officers/:id
router.put('/:id', async (req, res) => {
  try {
    const officer = await Officer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!officer) return res.status(404).json({ error: 'Not found' });
    res.json(officer);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /api/officers/:id/performance
router.get('/:id/performance', async (req, res) => {
  try {
    const officer = await Officer.findById(req.params.id).lean();
    if (!officer) return res.status(404).json({ error: 'Not found' });
    const all = await Complaint.find({ assigned_to: req.params.id }).lean();
    const resolved = all.filter(c => c.status === 'Resolved');
    const total = all.length;
    const resolution_rate = total > 0 ? Math.round((resolved.length / total) * 100) : 0;
    const avgHrs = resolved.length > 0
      ? resolved.reduce((s, c) => {
          if (!c.resolved_at) return s;
          return s + (new Date(c.resolved_at) - new Date(c.created_at)) / 3600000;
        }, 0) / resolved.length : 0;
    res.json({
      ...officer.performance,
      resolution_rate,
      avg_resolution_hrs: Math.round(avgHrs * 10) / 10,
      total_assigned: total,
      total_resolved: resolved.length,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/officers/assign � AI auto-assign
router.post('/assign', async (req, res) => {
  try {
    const { complaint_id } = req.body;
    const complaint = await Complaint.findById(complaint_id).lean();
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    const officers = await Officer.find({ status: 'active' }).lean();
    const best = assignOfficer(complaint, officers);
    if (!best) return res.status(404).json({ error: 'No available officer' });
    await Complaint.findByIdAndUpdate(complaint_id, {
      assigned_to: best._id,
      status: 'Assigned',
    });
    await Officer.findByIdAndUpdate(best._id, { $inc: { current_complaints: 1 } });
    res.json({ assigned_to: best, complaint_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/officers/rank/:complaint_id � top 3 officer matches
router.get('/rank/:complaint_id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.complaint_id).lean();
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    const officers = await Officer.find({ status: 'active' }).lean();
    const ranked = rankOfficers(complaint, officers);
    res.json(ranked);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
