import nodemailer from 'nodemailer';

// Konfigurasi menggunakan environment variables (.env)
// Pastikan untuk menambahkan variable ini di file .env Anda
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Gunakan App Password (bukan password login biasa)
  },
});

/**
 * Mengirim email notifikasi reset password
 */
export const sendResetPasswordEmail = async (userEmail: string, resetToken: string) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  try {
    await transporter.sendMail({
      from: '"Imagenic Admin" <no-reply@imagenic.com>',
      to: userEmail,
      subject: "Reset Password - Imagenic",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Reset Password</h2>
          <p>Anda telah meminta untuk mereset password akun Anda.</p>
          <p>Silakan klik link di bawah ini untuk membuat password baru:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        </div>
      `,
    });
    console.log(`[Email] Reset password sent to ${userEmail}`);
  } catch (error) {
    console.error("[Email Error] Failed to send reset password email:", error);
  }
};

/**
 * Mengirim email notifikasi leads ke Admin
 */
export const sendLeadNotification = async (adminEmail: string, leadData: { name: string; email: string; phone?: string; message: string }) => {
  try {
    await transporter.sendMail({
      from: '"Imagenic System" <no-reply@imagenic.com>',
      to: adminEmail,
      subject: "✨ Lead Baru dari Website",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Halo Admin, Anda mendapatkan Lead Baru!</h2>
          <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr>
              <td style="font-weight: bold; width: 30%;">Nama</td>
              <td>${leadData.name}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Email</td>
              <td>${leadData.email}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">No. HP</td>
              <td>${leadData.phone || '-'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Pesan</td>
              <td>${leadData.message}</td>
            </tr>
          </table>
          <p>Mohon segera follow-up lead ini.</p>
        </div>
      `,
    });
    console.log(`[Email] Lead notification sent to Admin (${adminEmail})`);
  } catch (error) {
    console.error("[Email Error] Failed to send lead notification email:", error);
  }
};

/**
 * Mengirim email notifikasi booking ke Vendor
 */
export const sendVendorBookingNotification = async (vendorEmail: string, bookingDetails: { date: string; serviceName: string; clientName: string }) => {
  try {
    await transporter.sendMail({
      from: '"Imagenic Admin" <no-reply@imagenic.com>',
      to: vendorEmail,
      subject: "📅 Pemberitahuan Booking Baru",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Halo Vendor,</h2>
          <p>Anda mendapatkan pesanan/booking baru!</p>
          <ul>
            <li><strong>Klien:</strong> ${bookingDetails.clientName}</li>
            <li><strong>Tanggal:</strong> ${bookingDetails.date}</li>
            <li><strong>Layanan:</strong> ${bookingDetails.serviceName}</li>
          </ul>
          <p>Mohon segera login ke dashboard Anda untuk detail lebih lanjut dan melakukan konfirmasi kesediaan.</p>
        </div>
      `,
    });
    console.log(`[Email] Vendor booking notification sent to ${vendorEmail}`);
  } catch (error) {
    console.error("[Email Error] Failed to send vendor booking notification email:", error);
  }
};
