const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  code:      { type: String, required: true, unique: true, trim: true, uppercase: true },
  price:     { type: Number, required: true, min: 0 },
  quantity:  { type: Number, required: true, min: 0, default: 0 },
  category:  { type: String, trim: true, default: 'General' },
  lowStock:  { type: Boolean, default: false },
}, { timestamps: true });

// Auto-set lowStock flag
itemSchema.pre('save', function(next) {
  this.lowStock = this.quantity <= parseInt(process.env.LOW_STOCK_THRESHOLD || 5);
  next();
});

itemSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.quantity !== undefined) {
    update.lowStock = update.quantity <= parseInt(process.env.LOW_STOCK_THRESHOLD || 5);
  }
  next();
});

module.exports = mongoose.model('Item', itemSchema);
