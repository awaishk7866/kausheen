const router = require('express').Router();
const Return = require('../models/Return');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const returns = await Return.find().sort({ createdAt: -1 });
    res.json(returns);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const record = await Return.findById(req.params.id);

    if (!record)
      return res.status(404).json({ message: 'Return not found' });

    res.json(record);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const record = new Return(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const record = await Return.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!record)
      return res.status(404).json({ message: 'Return not found' });

    res.json(record);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Return.findByIdAndDelete(req.params.id);
    res.json({ message: 'Return deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;