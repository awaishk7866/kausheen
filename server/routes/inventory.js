const router = require('express').Router();
const Item = require('../models/Item');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    const q = search ? { $or: [{ name: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }, { category: { $regex: search, $options: 'i' } }] } : {};
    res.json(await Item.find(q).sort({ createdAt: -1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/low-stock', auth, async (req, res) => {
  try { res.json(await Item.find({ lowStock: true })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const items = await Item.find({
      $or: [{ name: { $regex: q, $options: 'i' } }, { code: { $regex: q, $options: 'i' } }],
      quantity: { $gt: 0 }
    }).limit(8);
    res.json(items);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try { const item = new Item(req.body); await item.save(); res.status(201).json(item); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await Item.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;