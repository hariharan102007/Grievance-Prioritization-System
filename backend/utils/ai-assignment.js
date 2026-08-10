/**
 * AI Assignment Engine
 * Score = (Skill Match x 0.40) + (Availability x 0.35) + (Location Proximity x 0.25)
 */

const DEPT_CATEGORY_MAP = {
  'Water Department':         'Water Supply',
  'Electricity Department':   'Electricity',
  'Public Works Department':  'Roads',
  'Sanitation Department':    'Sanitation',
  'Health Department':        'Healthcare',
  'Police Department':        'Public Safety',
  'Revenue Department':       'Transport',
  'General Administration':   'Environment',
};

const MAX_WORKLOAD = 20; // max complaints before fully loaded

function skillScore(officer, department) {
  const category = DEPT_CATEGORY_MAP[department] || 'Environment';
  const skill = officer.skills ? (officer.skills[category] || 50) : 50;
  return skill / 100; // 0-1
}

function availabilityScore(officer) {
  if (officer.status !== 'active') return 0;
  const load = officer.current_complaints || 0;
  return Math.max(0, 1 - load / MAX_WORKLOAD);
}

function locationScore(officer, complaintLat, complaintLng) {
  if (!officer.location || !officer.location.lat || !complaintLat) return 0.5;
  const dlat = officer.location.lat - complaintLat;
  const dlng = officer.location.lng - complaintLng;
  const distKm = Math.sqrt(dlat * dlat + dlng * dlng) * 111;
  return Math.max(0, 1 - distKm / 20); // 20km max radius
}

function computeScore(officer, complaint) {
  const s = skillScore(officer, complaint.department);
  const a = availabilityScore(officer);
  const l = locationScore(officer, complaint.lat, complaint.lng);
  return (s * 0.40) + (a * 0.35) + (l * 0.25);
}

function assignOfficer(complaint, officers) {
  const eligible = officers.filter(
    (o) => o.status === 'active' && o.department === complaint.department
  );
  if (eligible.length === 0) {
    // Fallback: any active officer
    const fallback = officers.filter((o) => o.status === 'active');
    if (fallback.length === 0) return null;
    return fallback.reduce((best, o) =>
      computeScore(o, complaint) > computeScore(best, complaint) ? o : best
    );
  }
  return eligible.reduce((best, o) =>
    computeScore(o, complaint) > computeScore(best, complaint) ? o : best
  );
}

function rankOfficers(complaint, officers) {
  return officers
    .filter((o) => o.status === 'active')
    .map((o) => ({
      officer: o,
      score: Math.round(computeScore(o, complaint) * 100),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

module.exports = { assignOfficer, rankOfficers, computeScore };
