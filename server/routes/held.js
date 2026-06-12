const router = require('express').Router();
const HeldBill = require('../models/Heldbill');
const auth = require('../middleware/auth');
router.get('/', auth, async (req,res) => { try { res.json(await HeldBill.find().sort({createdAt:-1})); } catch(e){res.status(500).json({message:e.message});} });
router.post('/', auth, async (req,res) => { try { const b=new HeldBill(req.body); await b.save(); res.status(201).json(b); } catch(e){res.status(400).json({message:e.message});} });
router.delete('/:id', auth, async (req,res) => { try { await HeldBill.findByIdAndDelete(req.params.id); res.json({message:'Deleted'}); } catch(e){res.status(500).json({message:e.message});} });
module.exports = router;