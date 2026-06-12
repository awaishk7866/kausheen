const router = require('express').Router();
const Sale = require('../models/Sale');
const auth = require('../middleware/auth');
const XLSX = require('xlsx');

router.get('/', auth, async (req, res) => {
  try {
    const { from, to, search } = req.query;
    const q = {};
    if (from || to) { q.createdAt = {}; if (from) q.createdAt.$gte = new Date(from); if (to) { const d = new Date(to); d.setHours(23,59,59,999); q.createdAt.$lte = d; } }
    if (search) q.$or = [{ customerName:{$regex:search,$options:'i'} }, { billNumber:{$regex:search,$options:'i'} }, { customerPhone:{$regex:search,$options:'i'} }];
    res.json(await Sale.find(q).sort({ createdAt: -1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/analytics', auth, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart  = new Date(now.getFullYear(), 0, 1);

    const [today, month, year, all] = await Promise.all([
      Sale.find({ createdAt:{$gte:todayStart} }),
      Sale.find({ createdAt:{$gte:monthStart} }),
      Sale.find({ createdAt:{$gte:yearStart} }),
      Sale.find(),
    ]);

    const sum = arr => arr.reduce((s,x) => s + x.grandTotal, 0);

    // Monthly chart (last 12)
    const monthly = [];
    for (let i = 11; i >= 0; i--) {
      const s = new Date(now.getFullYear(), now.getMonth()-i, 1);
      const e = new Date(s.getFullYear(), s.getMonth()+1, 0, 23,59,59);
      const ms = await Sale.find({ createdAt:{$gte:s,$lte:e} });
      monthly.push({ month: s.toLocaleString('default',{month:'short',year:'2-digit'}), revenue: sum(ms), orders: ms.length });
    }

    // Top items
    const map = {};
    all.forEach(s => s.items.forEach(i => {
      if (!map[i.name]) map[i.name] = { name:i.name, qty:0, revenue:0 };
      map[i.name].qty += i.quantity; map[i.name].revenue += i.subtotal;
    }));
    const topItems = Object.values(map).sort((a,b)=>b.revenue-a.revenue).slice(0,5);

    res.json({
      today: { revenue: sum(today), orders: today.length },
      month: { revenue: sum(month), orders: month.length },
      year:  { revenue: sum(year),  orders: year.length  },
      all:   { revenue: sum(all),   orders: all.length   },
      monthly, topItems,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/export', auth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const q = {};
    if (from||to) { q.createdAt={}; if(from) q.createdAt.$gte=new Date(from); if(to){ const d=new Date(to);d.setHours(23,59,59,999);q.createdAt.$lte=d; } }
    const sales = await Sale.find(q).sort({ createdAt:1 });

    const summary = sales.map(s => ({
      'Bill No': s.billNumber, 'Date': new Date(s.createdAt).toLocaleDateString('en-IN'),
      'Customer': s.customerName, 'Phone': s.customerPhone, 'Items': s.items.length,
      'Subtotal': s.subtotal?.toFixed(2), 'GST': s.totalGST?.toFixed(2),
      'Discount': s.totalDiscount?.toFixed(2), 'Grand Total': s.grandTotal?.toFixed(2),
      'Payment': s.paymentMode, 'Invoice Link': `${process.env.APP_DOMAIN}/i/${s.invoiceToken}`,
    }));
    const itemRows = [];
    sales.forEach(s => s.items.forEach(i => itemRows.push({
      'Bill No':s.billNumber, 'Date':new Date(s.createdAt).toLocaleDateString('en-IN'),
      'Customer':s.customerName, 'Item':i.name, 'Code':i.code,
      'Qty':i.quantity, 'Price':i.price, 'GST%':i.gst, 'Disc(Rs)':i.discount, 'Total':i.subtotal?.toFixed(2),
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Sales Summary');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itemRows), 'Item Details');
    const buf = XLSX.write(wb, { type:'buffer', bookType:'xlsx' });
    res.set({ 'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition':`attachment; filename="Kausheen_Sales.xlsx"` });
    res.send(buf);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;