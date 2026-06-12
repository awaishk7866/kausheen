const router = require('express').Router();
const Sale = require('../models/Sale');
const Item = require('../models/Item');
const auth = require('../middleware/auth');
const generateBillPDF = require('../utils/generatePDF');
const sendBillEmail   = require('../utils/sendEmail');
const buildWhatsAppLink = require('../utils/whatsappLink');

// Create bill
router.post('/bill', auth, async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail, items, paymentMode } = req.body;
    let subtotal = 0, totalGST = 0, totalDiscount = 0;
    const processed = [];

    for (const item of items) {
      const db = await Item.findById(item.itemId);
      if (!db) return res.status(404).json({ message: `Item not found: ${item.name}` });
      if (db.quantity < item.quantity)
        return res.status(400).json({ message: `Insufficient stock for "${db.name}". Available: ${db.quantity}` });

      const base    = item.price * item.quantity;
      const gstAmt  = (base * (item.gst || 0)) / 100;
      const afterGST = base + gstAmt;
      const discAmt = Math.min(parseFloat(item.discount) || 0, afterGST);
      const total   = afterGST - discAmt;

      subtotal += base; totalGST += gstAmt; totalDiscount += discAmt;
      processed.push({ itemId: item.itemId, name: db.name, code: db.code, price: item.price, quantity: item.quantity, gst: item.gst || 0, discount: discAmt, subtotal: total });
      await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: -item.quantity } });
    }

    const grandTotal = subtotal + totalGST - totalDiscount;
    const sale = new Sale({ customerName, customerPhone: customerPhone||'', customerEmail: customerEmail||'', items: processed, subtotal, totalGST, totalDiscount, grandTotal, paymentMode: paymentMode||'Cash' });
    await sale.save();

    // Build WhatsApp link (always, if phone given)
    let waData = null;
    if (customerPhone?.trim()) {
      waData = buildWhatsAppLink(customerPhone.trim(), customerName, sale.billNumber, sale.invoiceToken);
    }

    // Send email (if email given)
    let emailError = null;
    if (customerEmail?.trim()) {
      try {
        await sendBillEmail(customerEmail.trim(), customerName, sale.billNumber, sale.invoiceToken);
        await Sale.findByIdAndUpdate(sale._id, { emailSent: true });
      } catch (e) { emailError = e.message; }
    }

    const domain = process.env.APP_DOMAIN || 'http://localhost:5000';
    res.json({
      sale,
      invoiceLink: `${domain}/i/${sale.invoiceToken}`,
      waLink: waData?.waLink || null,
      emailSent: !emailError && !!customerEmail,
      emailError,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Public invoice page (no auth)
router.get('/invoice/:token', async (req, res) => {
  try {
    const sale = await Sale.findOne({ invoiceToken: req.params.token });
    if (!sale) return res.status(404).json({ message: 'Invoice not found' });
    res.json(sale);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Download PDF (no auth — public link)
router.get('/invoice/:token/pdf', async (req, res) => {
  try {
    const sale = await Sale.findOne({ invoiceToken: req.params.token });
    if (!sale) return res.status(404).json({ message: 'Invoice not found' });
    const pdf = await generateBillPDF(sale);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=Kausheen_${sale.billNumber}.pdf` });
    res.send(pdf);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;