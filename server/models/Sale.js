const mongoose = require('mongoose');
const crypto = require('crypto');

const saleItemSchema = new mongoose.Schema({
  itemId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  name:      String,
  code:      String,
  price:     Number,
  quantity:  Number,
  gst:       Number,
  discount:  Number,
  subtotal:  Number,
});

const saleSchema = new mongoose.Schema({
  billNumber:    { type: String, unique: true },
  invoiceToken: {
  type: String,
  unique: true,
  index: true
},
  customerName:  { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String, default: '' },
  items:         [saleItemSchema],
  subtotal:      Number,
  totalGST:      Number,
  totalDiscount: Number,
  grandTotal:    Number,
  paymentMode:   { type: String, enum: ['Cash', 'Card', 'UPI'], default: 'Cash' },
  emailSent:     { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate bill number
saleSchema.pre('save', async function(next) {
  if (!this.invoiceToken) {
  this.invoiceToken = crypto.randomBytes(16).toString('hex');
  }
  if (!this.billNumber) {
    const count = await mongoose.model('Sale').countDocuments();
    const date = new Date();
    this.billNumber = `KSH-${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}-${String(count+1).padStart(4,'0')}`;
  }
  next();
});

module.exports = mongoose.model('Sale', saleSchema);
