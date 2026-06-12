const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();
app.use(cors({ origin: "https://kausheen-git-main-awaishk7866s-projects.vercel.app" }));
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/auth',            require('./routes/auth'));
app.use('/api/inventory',       require('./routes/inventory'));
app.use('/api/sales',           require('./routes/sales'));
app.use('/api/pos',             require('./routes/pos'));
app.use('/api/held',            require('./routes/held'));
app.use('/api/purchase-orders', require('./routes/purchaseorders'));
app.use('/api/returns',         require('./routes/returns'));

 // UPI QR endpoint
 app.post('/api/upi-qr', require('./middleware/auth'), async (req, res) => {
   try {
     const { amount, billNumber } = req.body;
     const data = await require('./utils/generateUpiQR')(amount, billNumber || 'BILL');
     res.json(data);
   } catch (e) { res.status(500).json({ message: e.message }); }
 });

// ── PUBLIC INVOICE PAGE ─────────────────────────────────────────────────────
// Serves a beautiful branded HTML page — no login needed
app.get('/i/:token', async (req, res) => {
  try {
    const Sale = require('./models/Sale');
    const sale = await Sale.findOne({ invoiceToken: req.params.token });
    if (!sale) return res.status(404).send('<h2 style="font-family:sans-serif;text-align:center;margin-top:80px;color:#999">Invoice not found or expired.</h2>');

    const domain = process.env.APP_DOMAIN || `http://localhost:${process.env.PORT || 5000}`;
    const pdfUrl = `${domain}/api/pos/invoice/${sale.invoiceToken}/pdf`;
    const C = { pink:'#D4896A', blush:'#F2C4B0', beige:'#F7EDE4', gold:'#A6845A', dark:'#3D2B1F', mid:'#7A5C4A', lite:'#B09080', border:'#E8CFC0' };

    const itemRows = sale.items.map((item, i) => `
      <tr style="background:${i%2===0?'#fff':'#FFF5EF'}">
        <td style="padding:9px 12px;border-bottom:1px solid ${C.border};color:${C.dark};font-weight:600">${item.name}</td>
        <td style="padding:9px 12px;border-bottom:1px solid ${C.border};color:${C.mid};font-family:monospace;font-size:12px">${item.code}</td>
        <td style="padding:9px 12px;border-bottom:1px solid ${C.border};color:${C.dark};text-align:center">${item.quantity}</td>
        <td style="padding:9px 12px;border-bottom:1px solid ${C.border};color:${C.mid}">₹${item.price?.toFixed(0)}</td>
        <td style="padding:9px 12px;border-bottom:1px solid ${C.border};color:${C.mid}">${item.gst}%</td>
        <td style="padding:9px 12px;border-bottom:1px solid ${C.border};color:#5a9e6f">₹${item.discount?.toFixed(0)}</td>
        <td style="padding:9px 12px;border-bottom:1px solid ${C.border};color:${C.dark};font-weight:700">₹${item.subtotal?.toFixed(2)}</td>
      </tr>`).join('');

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${process.env.BUSINESS_NAME} — Invoice ${sale.billNumber}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#F0E8E0;font-family:'DM Sans',sans-serif;min-height:100vh;padding:16px}
.card{max-width:680px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(61,43,31,0.12)}
.header{background:${C.beige};padding:32px 24px 24px;text-align:center;border-bottom:3px solid ${C.pink}}
.logo-circle{width:72px;height:72px;background:#fff;border-radius:50%;border:2px solid ${C.blush};display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 2px 12px rgba(212,137,106,0.15)}
.brand{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:600;color:${C.gold};letter-spacing:5px}
.tagline{font-size:11px;color:${C.lite};margin-top:4px}
.bill-strip{background:${C.blush};padding:10px 24px;display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between}
.bill-strip span{font-size:12px;color:${C.dark};font-weight:500}
.section{padding:20px 24px}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
@media(max-width:480px){.two-col{grid-template-columns:1fr}}
.info-box{background:${C.beige};border:1px solid ${C.border};border-radius:10px;padding:14px 16px}
.info-label{font-size:10px;color:${C.lite};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px}
.info-name{font-family:'Cormorant Garamond',serif;font-size:16px;color:${C.dark};font-weight:600}
.info-sub{font-size:12px;color:${C.mid};margin-top:3px}
table{width:100%;border-collapse:collapse;font-size:13px}
thead tr{background:${C.pink}}
thead th{padding:10px 12px;text-align:left;color:#fff;font-size:11px;letter-spacing:0.5px;font-weight:600}
.totals{background:${C.beige};border-radius:10px;padding:16px 20px;margin-top:16px}
.total-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:${C.mid}}
.total-row.grand{border-top:2px solid ${C.pink};margin-top:8px;padding-top:12px}
.total-row.grand span{font-size:18px;color:${C.pink};font-weight:700;font-family:'Cormorant Garamond',serif}
.total-row.grand label{font-size:14px;color:${C.dark};font-weight:600}
.download-btn{display:block;text-align:center;background:${C.pink};color:#fff;text-decoration:none;padding:14px;font-size:14px;font-weight:600;letter-spacing:1px;border-radius:10px;margin:16px 0 0;transition:background 0.2s}
.download-btn:hover{background:#c07555}
.footer{background:${C.beige};padding:18px 24px;text-align:center;border-top:1px solid ${C.border}}
.footer p{font-size:11px;color:${C.lite};line-height:1.7}
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="logo-circle">
      <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 32 C22 32 15 22 15 14 C15 8 18 4 22 4 C26 4 29 8 29 14 C29 22 22 32 22 32Z" stroke="${C.gold}" stroke-width="1.2" fill="rgba(166,132,90,0.08)" stroke-linecap="round"/>
        <path d="M22 30 C22 30 12 24 11 16 C10 9 15 5 19 7 C21 8 22 13 22 17" stroke="${C.gold}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
        <path d="M22 30 C22 30 32 24 33 16 C34 9 29 5 25 7 C23 8 22 13 22 17" stroke="${C.gold}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
        <line x1="22" y1="32" x2="22" y2="44" stroke="${C.gold}" stroke-width="1.1" stroke-linecap="round"/>
        <path d="M22 39 C22 39 15 36 13 31" stroke="${C.gold}" stroke-width="1" fill="none" stroke-linecap="round"/>
        <path d="M22 36 C22 36 29 33 31 28" stroke="${C.gold}" stroke-width="1" fill="none" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="brand">${(process.env.BUSINESS_NAME||'KAUSHEEN').toUpperCase()}</div>
    <div class="tagline">${process.env.BUSINESS_TAGLINE||"Pakistani Suits · Women's Ethnic"}</div>
  </div>

  <div class="bill-strip">
    <span>📄 Bill: <strong>${sale.billNumber}</strong></span>
    <span>📅 ${new Date(sale.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span>
    <span>💳 ${sale.paymentMode}</span>
  </div>

  <div class="section">
    <div class="two-col">
      <div class="info-box">
        <div class="info-label">Billed To</div>
        <div class="info-name">${sale.customerName}</div>
        ${sale.customerPhone ? `<div class="info-sub">📞 ${sale.customerPhone}</div>` : ''}
        ${sale.customerEmail ? `<div class="info-sub">✉️ ${sale.customerEmail}</div>` : ''}
      </div>
      <div class="info-box">
        <div class="info-label">From</div>
        <div class="info-name">${process.env.BUSINESS_NAME||'Kausheen'}</div>
        <div class="info-sub">📍 ${process.env.BUSINESS_ADDRESS}</div>
        <div class="info-sub">${process.env.BUSINESS_INSTAGRAM}</div>
      </div>
    </div>

    <div style="overflow-x:auto;border-radius:10px;overflow:hidden;border:1px solid ${C.border}">
      <table>
        <thead>
          <tr>
            <th>Item</th><th>Code</th><th style="text-align:center">Qty</th>
            <th>Price</th><th>GST</th><th>Disc</th><th>Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    <div class="totals">
      <div class="total-row"><label>Subtotal</label><span>₹${sale.subtotal?.toFixed(2)}</span></div>
      <div class="total-row"><label>GST</label><span style="color:${C.pink}">+ ₹${sale.totalGST?.toFixed(2)}</span></div>
      <div class="total-row"><label>Discount</label><span style="color:#5a9e6f">- ₹${sale.totalDiscount?.toFixed(2)}</span></div>
      <div class="total-row grand"><label>Grand Total</label><span>₹${sale.grandTotal?.toFixed(2)}</span></div>
    </div>

    <a href="${pdfUrl}" class="download-btn">⬇ Download PDF Invoice</a>
  </div>

  <div class="footer">
    <p>Thank you for shopping at ${process.env.BUSINESS_NAME}! 🌸</p>
    <p>${process.env.BUSINESS_ADDRESS} · ${process.env.BUSINESS_INSTAGRAM}</p>
    <p>${process.env.BUSINESS_EMAIL}</p>
  </div>
</div>
</body>
</html>`);
  } catch (e) { res.status(500).send('Server error'); }
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(e => console.error('❌ MongoDB:', e.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));