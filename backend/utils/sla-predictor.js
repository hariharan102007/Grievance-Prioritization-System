/**
 * SLA Predictor
 * Predicts whether a complaint will breach its SLA deadline
 */

const SLA_HOURS = {
  Critical: 4,
  High:     24,
  Medium:   72,
  Low:      168,
};

const DEPT_AVG_RESOLUTION = {
  'Electricity Department':  6,
  'Water Department':        12,
  'Public Works Department': 36,
  'Sanitation Department':   18,
  'Health Department':       8,
  'Police Department':       10,
  'Revenue Department':      48,
  'General Administration':  24,
};

function predictSLA(complaint) {
  const slaHours = SLA_HOURS[complaint.priority] || 72;
  const createdAt = new Date(complaint.created_at || complaint.createdAt);
  const now = new Date();
  const ageHours = (now - createdAt) / 3600000;
  const remaining = slaHours - ageHours;
  const deptAvg = DEPT_AVG_RESOLUTION[complaint.department] || 24;
  const deadline = new Date(createdAt.getTime() + slaHours * 3600000);

  let risk;
  if (remaining < 0) {
    risk = 'Overdue';
  } else if (remaining < deptAvg * 0.5) {
    risk = 'HighRisk';
  } else if (remaining < deptAvg * 1.5) {
    risk = 'AtRisk';
  } else {
    risk = 'OnTrack';
  }

  return {
    risk,
    slaHours,
    ageHours: Math.round(ageHours * 10) / 10,
    remainingHours: Math.round(remaining * 10) / 10,
    deadline: deadline.toISOString(),
  };
}

function priorityScore(complaint) {
  const priorityBase = { Critical: 80, High: 60, Medium: 40, Low: 20 };
  const sentimentBonus = { urgent: 15, negative: 8, neutral: 0, positive: -5 };
  const sla = predictSLA(complaint);
  const slaBonus = sla.risk === 'Overdue' ? 20 : sla.risk === 'HighRisk' ? 12 : sla.risk === 'AtRisk' ? 5 : 0;
  const dupBonus = Math.min((complaint.duplicate_count || 0) * 2, 10);
  const base = priorityBase[complaint.priority] || 40;
  const sentiment = sentimentBonus[complaint.sentiment] || 0;
  return Math.min(100, base + sentiment + slaBonus + dupBonus);
}

module.exports = { predictSLA, priorityScore, SLA_HOURS };
