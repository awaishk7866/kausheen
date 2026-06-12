const nodemailer = require('nodemailer');

async function sendBillEmail(customerEmail, customerName, billNumber, invoiceToken) {
  if (!process.env.EMAIL_USER || process.env.EMAIL_PASS === 'your_16_char_app_password_here') {
    throw new Error('Email not configured in .env');
  }

  const domain = process.env.APP_DOMAIN || 'http://localhost:5000';
  const invoiceLink = `${domain}/i/${invoiceToken}`;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 587, secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false },
  });

  await transporter.verify();

  await transporter.sendMail({
    from: `"${process.env.BUSINESS_NAME}" <${process.env.EMAIL_USER}>`,
    to: customerEmail,
    subject: `Your Invoice from ${process.env.BUSINESS_NAME} — ${billNumber}`,
    html: `
    <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#F7EDE4;padding:0;border-radius:10px;overflow:hidden;">
      <div style="background:#F2C4B0;padding:32px 24px;text-align:center;border-bottom:3px solid #D4896A;">
        <h1 style="color:#A6845A;letter-spacing:6px;font-size:22px;margin:0 0 6px;">${process.env.BUSINESS_NAME?.toUpperCase()}</h1>
        <p style="color:#B09080;font-size:11px;margin:0;">${process.env.BUSINESS_TAGLINE}</p>
      </div>
      <div style="background:#fff;padding:28px 24px;">
        <p style="color:#3D2B1F;font-size:15px;margin:0 0 12px;">Dear <strong>${customerName}</strong>,</p>
        <p style="color:#7A5C4A;font-size:13px;line-height:1.8;margin:0 0 20px;">
          Thank you for shopping at ${process.env.BUSINESS_NAME}! Your invoice <strong style="color:#A6845A;">${billNumber}</strong> is ready.
        </p>
        <div style="background:#FEF3ED;border:1px solid #E8CFC0;border-radius:8px;padding:16px 20px;text-align:center;margin:0 0 20px;">
          <p style="color:#7A5C4A;font-size:12px;margin:0 0 8px;">View &amp; Download Your Invoice</p>
          <a href="${invoiceLink}" style="display:inline-block;background:#D4896A;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:bold;letter-spacing:1px;">
            Open Invoice →
          </a>
          <p style="color:#B09080;font-size:10px;margin:10px 0 0;word-break:break-all;">${invoiceLink}</p>
        </div>
        <p style="color:#B09080;font-size:11px;line-height:1.6;margin:0;">
          Visit us at ${process.env.BUSINESS_ADDRESS} · Follow us ${process.env.BUSINESS_INSTAGRAM}
        </p>
      </div>
      <div style="background:#F7EDE4;padding:14px;text-align:center;border-top:1px solid #E8CFC0;">
        <p style="color:#B09080;font-size:10px;margin:0;">© ${new Date().getFullYear()} ${process.env.BUSINESS_NAME} · ${process.env.BUSINESS_ADDRESS}</p>
      </div>
    </div>`,
  });
}

module.exports = sendBillEmail;