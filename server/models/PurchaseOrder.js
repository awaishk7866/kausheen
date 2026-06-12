const mongoose = require('mongoose');
const poItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  name: String, code: String,
  orderedQty: Number, receivedQty: { type: Number, default: 0 }, unitCost: { type: Number, default: 0 },
});
const poSchema = new mongoose.Schema({
  poNumber:      { type: String, unique: true },
  supplier:      { type: String, required: true },
  supplierPhone: { type: String, default: '' },
  items:         [poItemSchema],
  status:        { type: String, enum: ['Pending','Partial','Received','Cancelled'], default: 'Pending' },
  notes:         String, expectedDate: Date, receivedDate: Date, totalCost: { type: Number, default: 0 },
}, { timestamps: true });
poSchema.pre('save', async function(next) {
  if (!this.poNumber) {
    const c = await mongoose.model('PurchaseOrder').countDocuments();
    this.poNumber = `PO-${String(c+1).padStart(4,'0')}`;
  }
  next();
});
module.exports = mongoose.model('PurchaseOrder', poSchema);