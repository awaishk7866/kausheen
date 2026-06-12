const mongoose = require('mongoose');
const heldSchema = new mongoose.Schema({
  label: { type: String, default: 'Held Bill' },
  customerName: String, customerPhone: String, customerEmail: String,
  items: Array, paymentMode: { type: String, default: 'Cash' },
}, { timestamps: true });
module.exports = mongoose.model('HeldBill', heldSchema);