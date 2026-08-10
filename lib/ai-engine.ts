// AI Processing Layer
// Simulates the Hugging Face Transformers / IndicBERT / XGBoost pipeline
// described in the architecture. Uses keyword + sentiment heuristics that
// mirror what the real models would output, so the UI behavior is faithful
// to the described system without external API calls.

export type Category =
  | 'Water Supply'
  | 'Electricity'
  | 'Roads'
  | 'Sanitation'
  | 'Healthcare'
  | 'Transport'
  | 'Environment'
  | 'Public Safety';

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export type Sentiment = 'urgent' | 'negative' | 'neutral' | 'positive';

export type Language =
  | 'English'
  | 'Hindi'
  | 'Tamil'
  | 'Telugu'
  | 'Bengali'
  | 'Marathi';

export const CATEGORY_DEPARTMENT_MAP: Record<Category, string> = {
  'Water Supply': 'Water Department',
  Electricity: 'Electricity Department',
  Roads: 'Public Works Department',
  Sanitation: 'Sanitation Department',
  Healthcare: 'Health Department',
  Transport: 'Public Works Department',
  Environment: 'Sanitation Department',
  'Public Safety': 'Police Department',
};

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  'Water Supply': [
    'water', 'pipe', 'leakage', 'leak', 'tap', 'drinking water', 'tank',
    'supply', 'paani', 'जल', 'पानी', 'नल', 'தண்ணீர்', 'நீர்',
  ],
  Electricity: [
    'electric', 'wire', 'power', 'current', 'shock', 'streetlight',
    'street light', 'lamp', 'voltage', 'transformer', 'bijli', 'बिजली',
    'करंट', 'மின்', 'வயர்',
  ],
  Roads: [
    'road', 'pothole', 'potholes', 'street', 'highway', 'footpath',
    'sidewalk', 'asphalt', 'tar', 'sadak', 'सड़क', 'தெரு', 'சாலை',
  ],
  Sanitation: [
    'garbage', 'waste', 'trash', 'dustbin', 'sewage', 'drainage', 'drain',
    'smell', 'mosquito', 'cleanliness', 'toilet', 'kachra', 'कचरा',
    'मल', 'गंदगी', 'அழுக்கு', 'மலக்குழாய்',
  ],
  Healthcare: [
    'hospital', 'doctor', 'medical', 'health', 'clinic', 'medicine',
    'nurse', 'patient', 'ambulance', 'treatment', 'अस्पताल', 'மருத்துவ',
    'நோயாளி',
  ],
  Transport: [
    'bus', 'train', 'auto', 'rickshaw', 'taxi', 'metro', 'transport',
    'vehicle', 'traffic', 'stop', 'station', 'बस', 'பஸ்', 'போக்குவரத்து',
  ],
  Environment: [
    'tree', 'pollution', 'air', 'noise', 'river', 'lake', 'park',
    'garden', 'environment', 'climate', 'प्रदूषण', 'மாசு', 'கழிவு',
  ],
  'Public Safety': [
    'police', 'crime', 'theft', 'robbery', 'assault', 'dog', 'dogs',
    'stray', 'safety', 'danger', 'threat', 'suspicious', 'आरक्षा',
    'पुलिस', 'பாதுகாப்பு',
  ],
};

const CRITICAL_KEYWORDS = [
  'live wire', 'electrocution', 'fire', 'flood', 'accident', 'emergency',
  'bleeding', 'unconscious', 'child', 'children', 'school', 'hospital',
  'ambulance', 'electrocute', 'death', 'danger', 'urgent', 'immediately',
  'critical', 'serious', 'risk', 'unsafe',
  'बिजली गिर', 'बिजली क तार', 'जलभराव', 'बाढ़', 'आग', 'तुरंत',
  'உயிரிழப்பு', 'தீ', 'மின்கம்பி', 'விநாசகம்',
];

const HIGH_KEYWORDS = [
  '3 days', '5 days', 'week', 'days', 'not working', 'broken', 'overflow',
  'flooding', 'stuck', 'accident', 'injury', 'no water', 'no power',
  'block', 'blocked', 'ठप', 'बंद', 'सड़क बंद', 'पानी नहीं', 'बिजली नहीं',
  'நீர் இல்லை', 'மின் இல்லை', 'சாலை',
];

const HINDI_INDICATORS = ['मेरे', 'इलाके', 'में', 'पानी', 'नहीं', 'आ', 'रहा',
  'है', 'का', 'की', 'ने', 'से', 'को', 'पर', 'बिजली', 'सड़क', 'अस्पताल',
  'ट्रेन', 'बस', 'अस्पताल', 'शिकायत'];
const TAMIL_INDICATORS = ['தண்ணீர்', 'இல்லை', 'நான்', 'என்', 'பகுதியில்',
  'மின்', 'பாதுகாப்பு', 'மருத்துவ', 'பஸ்', 'துறை', 'சாலை'];
const TELUGU_INDICATORS = ['నీరు', 'లేదు', 'నా', 'ప్రాంతంలో'];
const BENGALI_INDICATORS = ['জল', 'নেই', 'আমার', 'এলাকায়'];
const MARATHI_INDICATORS = ['पाणी', 'नाही', 'माझ्या', 'भागात'];
function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce(
    (count, kw) => (lower.includes(kw.toLowerCase()) ? count + 1 : count),
    0
  );
}

export function detectLanguage(text: string): Language {
  const normalized = text.toLowerCase();
  if (HINDI_INDICATORS.some((w) => normalized.includes(w))) return 'Hindi';
  if (TAMIL_INDICATORS.some((w) => normalized.includes(w))) return 'Tamil';
  if (TELUGU_INDICATORS.some((w) => normalized.includes(w))) return 'Telugu';
  if (BENGALI_INDICATORS.some((w) => normalized.includes(w))) return 'Bengali';
  if (MARATHI_INDICATORS.some((w) => normalized.includes(w))) return 'Marathi';
  return 'English';
}

export function categorize(text: string): Category {
  const scores = (Object.keys(CATEGORY_KEYWORDS) as Category[]).map(
    (category) => ({
      category,
      score: countMatches(text, CATEGORY_KEYWORDS[category]),
    })
  );
  scores.sort((a, b) => b.score - a.score);
  if (scores[0].score === 0) return 'Sanitation'; // default fallback
  return scores[0].category;
}

export function analyzeSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  if (CRITICAL_KEYWORDS.some((kw) => lower.includes(kw))) return 'urgent';
  if (HIGH_KEYWORDS.some((kw) => lower.includes(kw))) return 'negative';
  if (/(thank|good|resolved|fixed|appreciate)/.test(lower)) return 'positive';
  return 'neutral';
}

export function predictPriority(
  text: string,
  sentiment: Sentiment,
  duplicateCount: number
): Priority {
  const lower = text.toLowerCase();
  let score = 0;

  // Sentiment contribution
  if (sentiment === 'urgent') score += 50;
  else if (sentiment === 'negative') score += 20;

  // Critical keyword contribution
  const criticalHits = countMatches(text, CRITICAL_KEYWORDS);
  score += criticalHits * 15;

  // High keyword contribution
  const highHits = countMatches(text, HIGH_KEYWORDS);
  score += highHits * 8;

  // Duplicate reports boost priority (more people affected)
  score += Math.min(duplicateCount * 5, 25);

  // Location sensitivity
  if (/(school|hospital|market|junction|main road)/.test(lower)) score += 10;

  if (score >= 60) return 'Critical';
  if (score >= 35) return 'High';
  if (score >= 15) return 'Medium';
  return 'Low';
}

export function routeToDepartment(category: Category): string {
  return CATEGORY_DEPARTMENT_MAP[category];
}

// Lightweight duplicate detection: token overlap (Jaccard) on normalized text.
// Mirrors what Sentence Transformers + vector search would do in production.
export function normalizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  setA.forEach((w) => {
    if (setB.has(w)) intersection += 1;
  });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function findDuplicate(
  newText: string,
  existingTexts: { id: string; description: string }[],
  threshold = 0.35
): string | null {
  const newTokens = normalizeText(newText);
  let bestMatch: { id: string; score: number } | null = null;
  for (const existing of existingTexts) {
    const score = jaccardSimilarity(newTokens, normalizeText(existing.description));
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { id: existing.id, score };
    }
  }
  if (bestMatch && bestMatch.score >= threshold) return bestMatch.id;
  return null;
}

export function generateTicketId(): string {
  const num = Math.floor(10000 + Math.random() * 89999);
  return `CMP${num}`;
}

export type AiResult = {
  category: Category;
  department: string;
  priority: Priority;
  sentiment: Sentiment;
  language: Language;
  duplicateOf: string | null;
  ticketId: string;
};

export function processComplaint(
  text: string,
  existingComplaints: { id: string; description: string }[] = []
): AiResult {
  const language = detectLanguage(text);
  const category = categorize(text);
  const department = routeToDepartment(category);
  const sentiment = analyzeSentiment(text);
  const duplicateOf = findDuplicate(text, existingComplaints);
  const priority = predictPriority(text, sentiment, duplicateOf ? 1 : 0);
  const ticketId = generateTicketId();
  return { category, department, priority, sentiment, language, duplicateOf, ticketId };
}
