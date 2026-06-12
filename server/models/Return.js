const mongoose = require('mongoose');
const retItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  name: String, code: String, quantity: Number, price: Number, refund: Number,
});
const returnSchema = new mongoose.Schema({
  returnNumber:  { type: String, unique: true },
  originalBill:  { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
  billNumber:    String, customerName: String, customerPhone: String,
  items:         [retItemSchema],
  totalRefund:   Number, reason: String,
  refundMode:    { type: String, enum: ['Cash','UPI','Exchange'], default: 'Cash' },
}, { timestamps: true });
returnSchema.pre('save', async function(next) {
  if (!this.returnNumber) {
    const c = await mongoose.model('Return').countDocuments();
    this.returnNumber = `RET-${String(c+1).padStart(4,'0')}`;
  }
  next();
});
module.exports = mongoose.model('Return', returnSchema);