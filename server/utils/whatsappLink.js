function buildWhatsAppLink(phone, customerName, billNumber, invoiceToken) {
  const domain = process.env.APP_DOMAIN || 'http://localhost:5000';
  const link = `${domain}/i/${invoiceToken}`;
  const businessName = process.env.BUSINESS_NAME || 'Kausheen';

  // Normalize phone number
  let normalized = phone.replace(/\s+/g, '').replace(/[^+\d]/g, '');
  if (!normalized.startsWith('+')) normalized = '+91' + normalized.replace(/^0/, '');

  const message =
    `Hi ${customerName}! 🌸\n\n` +
    `Thank you for shopping at *${businessName}*.\n\n` +
    `Your invoice *${billNumber}* is ready:\n` +
    `${link}\n\n` +
    `Visit us again at ${process.env.BUSINESS_ADDRESS} 💛`;

  const waLink = `https://wa.me/${normalized.replace('+','')}?text=${encodeURIComponent(message)}`;
  return { waLink, message, invoiceLink: link };
}

module.exports = buildWhatsAppLink;