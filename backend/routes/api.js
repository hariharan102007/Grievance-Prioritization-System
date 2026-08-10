const express = require('express');
const router  = express.Router();
const Translation = require('../models/translation');
const { getSupportedLanguages } = require('../utils/language');

// GET /api/languages
router.get('/languages', (req, res) => {
  res.json({ languages: getSupportedLanguages() });
});

// GET /api/translate?language=ta
router.get('/translate', async (req, res) => {
  const { language } = req.query;
  if (!language) return res.status(400).json({ error: 'language query param required' });
  try {
    const docs = await Translation.find({ language });
    const result = {};
    docs.forEach(d => { result[d.key] = d.text; });
    res.json({ language, translations: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/translate  { language, key, text }
router.post('/translate', async (req, res) => {
  const { language, key, text } = req.body;
  if (!language || !key || !text) {
    return res.status(400).json({ error: 'language, key and text are required' });
  }
  try {
    const doc = await Translation.findOneAndUpdate(
      { language, key },
      { text },
      { upsert: true, new: true }
    );
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/seed  – seeds default English + Tamil translations
router.post('/seed', async (req, res) => {
  const defaults = [
    // English
    { language: 'en', key: 'nav.home',        text: 'Home' },
    { language: 'en', key: 'nav.about',       text: 'About' },
    { language: 'en', key: 'nav.contact',     text: 'Contact' },
    { language: 'en', key: 'hero.title',      text: 'Welcome to DSA Project' },
    { language: 'en', key: 'hero.subtitle',   text: 'Learn Data Structures & Algorithms' },
    // Tamil
    { language: 'ta', key: 'nav.home',        text: '???????' },
    { language: 'ta', key: 'nav.about',       text: '?????' },
    { language: 'ta', key: 'nav.contact',     text: '???????' },
    { language: 'ta', key: 'hero.title',      text: 'DSA ????????????? ????????????' },
    { language: 'ta', key: 'hero.subtitle',   text: '???? ????????????? & ????????????? ??????????????????' },
  ];
  try {
    for (const item of defaults) {
      await Translation.findOneAndUpdate(
        { language: item.language, key: item.key },
        { text: item.text },
        { upsert: true }
      );
    }
    res.json({ message: 'Seeded default translations successfully', count: defaults.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
