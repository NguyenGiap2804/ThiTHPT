import nodemailer from "nodemailer";

type WelcomeEmailInput = {
  to: string;
  name: string;
};

const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || "https://thithpt-website.web.app";
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE === "true";
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM || smtpUser || "ThiTHPT <no-reply@thithpt.pro>";

const isEmailConfigured = (): boolean => Boolean(smtpHost && smtpUser && smtpPass);

const getTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost!,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser!,
      pass: smtpPass!,
    },
  });
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const sendWelcomeEmail = async ({ to, name }: WelcomeEmailInput): Promise<void> => {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn("Welcome email skipped: SMTP is not configured.");
    return;
  }

  const safeName = escapeHtml(name);
  const safeAppUrl = escapeHtml(appUrl);

  await transporter.sendMail({
    from: mailFrom,
    to,
    subject: "Chào mừng đến với THPT.PRO",
    text: [
      `Xin chào ${name},`,
      "",
      "Cảm ơn bạn đã đăng ký tài khoản THPT.PRO. Từ hôm nay, bạn có thể luyện đề, xem lời giải và theo dõi kết quả học tập trên hệ thống.",
      "",
      `Khám phá ngay: ${appUrl}`,
    ].join("\n"),
    html: `
      <!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Chào mừng đến với THPT.PRO</title>
        </head>
        <body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:24px;border:1px solid #e5eaf3;overflow:hidden;">
                  <tr>
                    <td style="padding:36px 32px;background:#101828;color:#ffffff;">
                      <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#93c5fd;font-weight:700;">THPT.PRO</div>
                      <h1 style="margin:16px 0 0;font-size:34px;line-height:1.15;font-weight:800;">Chào mừng đến với THPT.PRO</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px;">
                      <p style="margin:0 0 18px;font-size:18px;line-height:1.7;color:#475569;">Xin chào <strong style="color:#0f172a;">${safeName}</strong>,</p>
                      <p style="margin:0 0 18px;font-size:17px;line-height:1.7;color:#475569;">Cảm ơn bạn đã đăng ký tài khoản THPT.PRO. Hệ thống đã sẵn sàng để bạn luyện đề, xem lời giải và theo dõi tiến bộ học tập mỗi ngày.</p>
                      <p style="margin:0 0 28px;font-size:17px;line-height:1.7;color:#475569;">Chúc bạn có những phiên ôn luyện hiệu quả và đạt kết quả thật tốt trong kỳ thi THPT.</p>
                      <a href="${safeAppUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:800;font-size:16px;padding:15px 24px;border-radius:14px;">Khám phá ngay</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
};
