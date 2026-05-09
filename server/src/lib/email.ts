import * as SibApiV3Sdk from "@getbrevo/brevo";

type WelcomeEmailInput = {
  to: string;
  name: string;
};

const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || "https://thithpt-website.web.app";
const brevoApiKey = process.env.BREVO_API_KEY;
const mailFromEmail = process.env.MAIL_FROM_EMAIL || "thithpteduvn.service@gmail.com";
const mailFromName = process.env.MAIL_FROM_NAME || "ThiTHPT";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const sendWelcomeEmail = async ({ to, name }: WelcomeEmailInput): Promise<void> => {
  if (!brevoApiKey) {
    console.warn("[Email] Welcome email skipped: BREVO_API_KEY is not configured.");
    return;
  }

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);

  const safeName = escapeHtml(name);
  const safeAppUrl = escapeHtml(appUrl);
  const subject = "Chào mừng bạn đến với Nền tảng Ôn thi THPT Quốc gia ThiTHPT!";

  console.log(`[Email] Attempting to send welcome email to: ${to}`);

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = { name: mailFromName, email: mailFromEmail };
  sendSmtpEmail.to = [{ email: to, name }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.textContent = [
    `Xin chào ${name},`,
    "",
    "Cảm ơn bạn đã chọn ThiTHPT làm bệ phóng cho hành trình chinh phục kỳ thi THPT Quốc gia. Hành trình đạt điểm cao của bạn chính thức bắt đầu từ hôm nay.",
    "",
    'Tại ThiTHPT, chúng tôi tin vào sức mạnh của việc luyện tập thực tế. Quên đi mớ lý thuyết khô khan, đã đến lúc "thực làm" các bộ đề thi sát với đề minh họa nhất với sự đồng hành của hệ thống chấm điểm và giải thích chi tiết!',
    "",
    `Khám phá ngay: ${appUrl}`,
  ].join("\n");

  sendSmtpEmail.htmlContent = `
    <!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${subject}</title>
      </head>
      <body style="margin:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f172a;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#1e293b;border-radius:24px;border:1px solid #334155;overflow:hidden;">
                <tr>
                  <td style="padding:48px 32px;text-align:center;background:linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
                    <h1 style="margin:0;font-size:32px;line-height:1.2;font-weight:800;color:#ffffff;">Chào mừng đến với ThiTHPT</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 18px;font-size:18px;line-height:1.7;color:#e2e8f0;">Xin chào <strong style="color:#60a5fa;">${safeName}</strong>,</p>
                    <p style="margin:0 0 18px;font-size:17px;line-height:1.7;color:#94a3b8;">Cảm ơn bạn đã chọn <strong>ThiTHPT</strong> làm bệ phóng cho hành trình chinh phục kỳ thi THPT Quốc gia. Hành trình đạt điểm cao của bạn chính thức bắt đầu từ hôm nay.</p>
                    <p style="margin:0 0 28px;font-size:17px;line-height:1.7;color:#94a3b8;">Tại ThiTHPT, chúng tôi tin vào sức mạnh của việc luyện tập thực tế. Quên đi mớ lý thuyết khô khan, đã đến lúc "thực làm" các bộ đề thi sát với đề minh họa nhất với sự đồng hành của hệ thống chấm điểm và giải thích chi tiết!</p>

                    <div style="text-align:center;margin-top:32px;">
                      <a href="${safeAppUrl}" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 32px;border-radius:12px;box-shadow:0 10px 15px -3px rgba(59, 130, 246, 0.5);">Khám Phá Nền Tảng Ngay</a>
                    </div>

                    <p style="margin:40px 0 0;font-size:14px;color:#64748b;text-align:center;">Chúc bạn có những phiên ôn luyện hiệu quả và đạt kết quả thật tốt!</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[Email] Welcome email sent successfully to: ${to}. MessageId: ${(result.body as any)?.messageId}`);
  } catch (error) {
    console.error(`[Email] Failed to send welcome email to ${to}:`, error);
    throw error;
  }
};
