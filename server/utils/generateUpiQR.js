const QRCode = require('qrcode');

async function generateUPIQR(amount, billNumber) {
  const upiId   = process.env.UPI_ID   || 'yourname@upi';
  const upiName = process.env.UPI_NAME || 'Store';
  const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${parseFloat(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent('Bill ' + billNumber)}`;
  const qrDataURL = await QRCode.toDataURL(upiString, {
    errorCorrectionLevel: 'M', width: 280, margin: 2,
    color: { dark: '#3D2B1F', light: '#FFFFFF' },
  });
  return { qrDataURL, upiString, upiId, upiName, amount };
}

module.exports = generateUPIQR;