import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, items, total } = req.body;
  const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL;

  if (!GOOGLE_SHEET_WEBHOOK_URL) {
    console.warn("GOOGLE_SHEET_WEBHOOK_URL is not set. Order not sent to Sheets.");
    // Vẫn trả về thành công để demo, hoặc báo lỗi tùy bạn
    return res.status(200).json({ 
      success: true, 
      message: "Order received locally (but Webhook URL is missing)" 
    });
  }

  try {
    // Gửi dữ liệu sang Google Sheets qua Apps Script Webhook
    const response = await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toLocaleString('vi-VN'),
        name,
        email,
        phone,
        items: items.map((i: any) => `${i.title} (x${i.qty})`).join(', '),
        total: `${total.toLocaleString('vi-VN')}đ`
      })
    });

    if (response.ok) {
      return res.status(200).json({ success: true });
    } else {
      throw new Error('Failed to send to Google Sheets');
    }
  } catch (error) {
    console.error("Sheets error:", error);
    return res.status(500).json({ error: "Failed to sync with Google Sheets" });
  }
}
