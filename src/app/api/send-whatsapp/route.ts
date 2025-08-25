import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { link, filename, caption } = await req.json();
  const token = process.env.WHATSAPP_TOKEN!;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const to = process.env.WHATSAPP_DEFAULT_RECIPIENT!; // 919810421233

  try {
    const resp = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'document',
        document: { link, filename, caption },
      }),
    });

    const json = await resp.json();
    if (!resp.ok) return NextResponse.json(json, { status: resp.status });
    return NextResponse.json({ ok: true, id: json.messages?.[0]?.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
