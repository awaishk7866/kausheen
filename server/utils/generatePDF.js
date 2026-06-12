const PDFDocument = require('pdfkit');

const C = {
  pink:   '#D4896A', blush:  '#F2C4B0', beige:  '#F7EDE4',
  ivory:  '#FDFAF7', gold:   '#A6845A', dark:   '#3D2B1F',
  mid:    '#7A5C4A', lite:   '#B09080', border: '#E8CFC0',
  rowAlt: '#FFF5EF',
};

function drawLogo(doc, cx, cy, r) {
  const s = r / 20;
  doc.save();
  // White circle bg
  doc.circle(cx, cy, r).fillColor('#FFFFFF').fill();
  doc.circle(cx, cy, r).strokeColor(C.blush).lineWidth(1).stroke();
  // Tulip petals
  doc.strokeColor(C.gold).lineWidth(0.9 * s).fillColor('transparent');
  // Center petal
  doc.path(`M${cx} ${cy+8*s} C${cx-4*s} ${cy+2*s} ${cx-4*s} ${cy-8*s} ${cx} ${cy-11*s} C${cx+4*s} ${cy-8*s} ${cx+4*s} ${cy+2*s} ${cx} ${cy+8*s}`).stroke();
  // Left petal
  doc.path(`M${cx} ${cy+6*s} C${cx-7*s} ${cy+2*s} ${cx-8*s} ${cy-5*s} ${cx-4*s} ${cy-8*s} C${cx-2*s} ${cy-5*s} ${cx-1*s} ${cy} ${cx} ${cy+3*s}`).stroke();
  // Right petal
  doc.path(`M${cx} ${cy+6*s} C${cx+7*s} ${cy+2*s} ${cx+8*s} ${cy-5*s} ${cx+4*s} ${cy-8*s} C${cx+2*s} ${cy-5*s} ${cx+1*s} ${cy} ${cx} ${cy+3*s}`).stroke();
  // Stem
  doc.moveTo(cx, cy+8*s).lineTo(cx, cy+16*s).stroke();
  // Left leaf
  doc.path(`M${cx} ${cy+13*s} C${cx-5*s} ${cy+11*s} ${cx-6*s} ${cy+8*s} ${cx-3*s} ${cy+7*s}`).stroke();
  // Right leaf
  doc.path(`M${cx} ${cy+11*s} C${cx+5*s} ${cy+9*s} ${cx+6*s} ${cy+6*s} ${cx+3*s} ${cy+5*s}`).stroke();
  doc.restore();
}

function generateBillPDF(sale) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const bufs = [];
    doc.on('data', b => bufs.push(b));
    doc.on('end', () => resolve(Buffer.concat(bufs)));
    doc.on('error', reject);

    const W = 595, M = 40;

    // Header band
    doc.rect(0, 0, W, 4).fillColor(C.pink).fill();
    doc.rect(0, 4, W, 155).fillColor(C.beige).fill();

    // Logo circle
    drawLogo(doc, W / 2, 62, 36);

    // Brand name
    doc.font('Helvetica-Bold').fontSize(18).fillColor(C.gold)
      .text(process.env.BUSINESS_NAME || 'KAUSHEEN', 0, 106, { align: 'center', characterSpacing: 5 });
    doc.font('Helvetica').fontSize(7.5).fillColor(C.lite)
      .text(process.env.BUSINESS_TAGLINE || "Pakistani Suits · Women's Ethnic", 0, 126, { align: 'center' });
    doc.fontSize(7).fillColor(C.mid)
      .text(`${process.env.BUSINESS_ADDRESS}  ·  ${process.env.BUSINESS_PHONE}`, 0, 139, { align: 'center' });

    // Bill info strip
    doc.rect(0, 159, W, 32).fillColor(C.blush).fill();
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.dark)
      .text(`Bill: ${sale.billNumber}`, M, 170)
      .text(`Date: ${new Date(sale.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`, W/2 - 50, 170)
      .text(`Payment: ${sale.paymentMode}`, W - 140, 170);

    // Customer + From boxes
    const boxY = 205;
    doc.rect(M, boxY, 220, 65).fillColor(C.ivory).fill();
    doc.rect(M, boxY, 220, 65).strokeColor(C.border).lineWidth(0.5).stroke();
    doc.font('Helvetica').fontSize(6.5).fillColor(C.lite).text('BILLED TO', M+10, boxY+10, { characterSpacing: 1.5 });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(C.dark).text(sale.customerName, M+10, boxY+22);
    doc.font('Helvetica').fontSize(8).fillColor(C.mid).text(sale.customerPhone || '', M+10, boxY+38);
    if (sale.customerEmail) doc.text(sale.customerEmail, M+10, boxY+50);

    doc.rect(W-M-185, boxY, 185, 65).fillColor(C.ivory).fill();
    doc.rect(W-M-185, boxY, 185, 65).strokeColor(C.border).lineWidth(0.5).stroke();
    doc.font('Helvetica').fontSize(6.5).fillColor(C.lite).text('FROM', W-M-173, boxY+10, { characterSpacing: 1.5 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(C.dark).text(process.env.BUSINESS_NAME || 'Kausheen', W-M-173, boxY+22);
    doc.font('Helvetica').fontSize(7.5).fillColor(C.mid)
      .text(process.env.BUSINESS_ADDRESS || 'Park Street, Kolkata', W-M-173, boxY+36)
      .text(process.env.BUSINESS_PHONE || '', W-M-173, boxY+48);

    // Items table
    const tTop = 288, cols = { n:M, item:M+20, code:218, qty:290, price:328, gst:374, disc:416, total:460 };
    doc.rect(M, tTop, W-M*2, 22).fillColor(C.pink).fill();
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFF');
    ['#','ITEM','CODE','QTY','PRICE','GST%','DISC(₹)','TOTAL'].forEach((h, i) => {
      const x = [cols.n,cols.item,cols.code,cols.qty,cols.price,cols.gst,cols.disc,cols.total][i];
      doc.text(h, x, tTop+8);
    });

    let y = tTop + 22;
    sale.items.forEach((item, i) => {
      doc.rect(M, y, W-M*2, 20).fillColor(i%2===0 ? C.ivory : C.rowAlt).fill();
      doc.font('Helvetica').fontSize(7.5).fillColor(C.dark);
      doc.text(String(i+1), cols.n, y+6);
      doc.text((item.name||'').substring(0,22), cols.item, y+6);
      doc.text(item.code||'', cols.code, y+6);
      doc.text(String(item.quantity), cols.qty, y+6);
      doc.text(`Rs.${item.price?.toFixed(0)}`, cols.price, y+6);
      doc.text(`${item.gst}%`, cols.gst, y+6);
      doc.text(`Rs.${item.discount?.toFixed(0)}`, cols.disc, y+6);
      doc.font('Helvetica-Bold').text(`Rs.${item.subtotal?.toFixed(2)}`, cols.total, y+6);
      y += 20;
    });

    doc.rect(M, y, W-M*2, 1).fillColor(C.border).fill();
    y += 14;

    // Totals
    const tX = 365, tW = W - M - tX;
    const trow = (label, val, col) => {
      doc.font('Helvetica').fontSize(8.5).fillColor(C.mid).text(label, tX, y);
      doc.fillColor(col||C.dark).text(val, tX, y, { align:'right', width: tW });
      y += 15;
    };
    trow('Subtotal',   `Rs.${sale.subtotal?.toFixed(2)}`);
    trow('GST',        `+ Rs.${sale.totalGST?.toFixed(2)}`, C.pink);
    trow('Discount',   `- Rs.${sale.totalDiscount?.toFixed(2)}`, '#5a9e6f');
    y += 4;
    doc.rect(tX-8, y, tW+8, 28).fillColor(C.pink).fill();
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#FFF')
      .text('GRAND TOTAL', tX, y+8)
      .text(`Rs.${sale.grandTotal?.toFixed(2)}`, tX, y+8, { align:'right', width: tW });
    y += 44;

    // Invoice link
    if (sale.invoiceToken) {
      const domain = process.env.APP_DOMAIN || 'http://localhost:5000';
      const link = `${domain}/i/${sale.invoiceToken}`;
      doc.rect(M, y, W-M*2, 28).fillColor('#FEF3ED').fill();
      doc.rect(M, y, W-M*2, 28).strokeColor(C.blush).lineWidth(0.5).stroke();
      doc.font('Helvetica').fontSize(7).fillColor(C.mid)
        .text('View & Download Invoice:', M+10, y+8);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.gold)
        .text(link, M+10, y+18);
      y += 42;
    }

    // Footer
    doc.rect(0, 775, W, 67).fillColor(C.beige).fill();
    doc.rect(0, 775, W, 3).fillColor(C.pink).fill();
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.gold)
      .text('Thank you for shopping at Kausheen! 🌸', 0, 786, { align:'center' });
    doc.font('Helvetica').fontSize(7.5).fillColor(C.lite)
      .text(`${process.env.BUSINESS_ADDRESS}  ·  ${process.env.BUSINESS_INSTAGRAM}  ·  ${process.env.BUSINESS_EMAIL}`, 0, 802, { align:'center' });
    doc.fontSize(7).fillColor(C.lite).text('We hope to see you again soon', 0, 818, { align:'center' });

    doc.end();
  });
}

module.exports = generateBillPDF;