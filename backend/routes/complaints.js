const express = require('express');
const router = express.Router();
const Complaint = require('../models/complaint');
const Officer = require('../models/officer');
const { predictSLA, priorityScore } = require('../utils/sla-predictor');

// GET /api/complaints?status=&department=&priority=&limit=
router.get('/', async (req, res) => {
  try {
    const { status, department, priority, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (priority) filter.priority = priority;
    const complaints = await Complaint.find(filter)
      .sort({ created_at: -1 }).limit(Number(limit)).lean();
    res.json(complaints);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/complaints/priority-queue — AI ranked list
router.get('/priority-queue', async (req, res) => {
  try {
    const open = await Complaint.find({
      status: { $in: ['Registered', 'Assigned', 'In Progress'] },
      duplicate_of: null,
    }).lean();
    const ranked = open
      .map(c => ({ ...c, ai_score: priorityScore(c), sla: predictSLA(c) }))
      .sort((a, b) => b.ai_score - a.ai_score);
    res.json(ranked);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/complaints/sla-risk — SLA predictions
router.get('/sla-risk', async (req, res) => {
  try {
    const open = await Complaint.find({
      status: { $in: ['Registered', 'Assigned', 'In Progress'] },
    }).lean();
    const withSLA = open.map(c => ({ ...c, sla: predictSLA(c) }));
    const grouped = {
      Overdue:  withSLA.filter(c => c.sla.risk === 'Overdue'),
      HighRisk: withSLA.filter(c => c.sla.risk === 'HighRisk'),
      AtRisk:   withSLA.filter(c => c.sla.risk === 'AtRisk'),
      OnTrack:  withSLA.filter(c => c.sla.risk === 'OnTrack'),
    };
    res.json(grouped);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/complaints/:id
router.get('/:id', async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id)
      .populate('assigned_to', 'name email department designation').lean();
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json({ ...c, sla: predictSLA(c), ai_score: priorityScore(c) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/complaints/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, officer_remarks } = req.body;
    const updates = { status, officer_remarks };
    if (status === 'Resolved') updates.resolved_at = new Date();
    const c = await Complaint.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!c) return res.status(404).json({ error: 'Not found' });
    if (status === 'Resolved' && c.assigned_to) {
      await Officer.findByIdAndUpdate(c.assigned_to, {
        $inc: { current_complaints: -1 },
      });
    }
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/complaints — create new
router.post('/', async (req, res) => {
  try {
    const c = await Complaint.create(req.body);
    res.status(201).json(c);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /api/complaints/stats/summary
router.get('/stats/summary', async (req, res) => {
  try {
    const all = await Complaint.find({ duplicate_of: null }).lean();
    const total = all.length;
    const resolved = all.filter(c => c.status === 'Resolved').length;
    const critical = all.filter(c => c.priority === 'Critical' && c.status !== 'Resolved').length;
    const open = all.filter(c => c.status !== 'Resolved').length;
    const byDept = {};
    const byStatus = {};
    const byPriority = {};
    all.forEach(c => {
      byDept[c.department] = (byDept[c.department] || 0) + 1;
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      byPriority[c.priority] = (byPriority[c.priority] || 0) + 1;
    });
    res.json({ total, resolved, critical, open, byDept, byStatus, byPriority });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
