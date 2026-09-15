import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const NOTIFY_EMAIL = Deno.env.get('CONTACT_NOTIFY_EMAIL');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim();
    const message = String(body.message ?? '').trim();

    const errors: string[] = [];
    if (name.length < 2 || name.length > 100) errors.push('Please enter your name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255) errors.push('Please enter a valid email address.');
    if (message.length < 10 || message.length > 5000) errors.push('Message must be between 10 and 5000 characters.');
    if (errors.length) return json({ error: errors.join(' ') }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data, error } = await admin
      .from('contact_messages')
      .insert({ name, email, message })
      .select('id')
      .single();
    if (error) {
      console.error('contact insert failed:', error.message);
      return json({ error: 'Could not save your message. Please try again.' }, 500);
    }

    let emailed = false;
    if (NOTIFY_EMAIL) {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_ROLE}` },
          body: JSON.stringify({
            purpose: 'transactional',
            idempotency_key: `contact-${data.id}`,
            to: NOTIFY_EMAIL,
            subject: `New contact message from ${name}`,
            html: `<p><strong>${name}</strong> (${email}) wrote:</p><p>${message.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`,
          }),
        });
        emailed = res.ok;
        if (!res.ok) console.error('contact email failed:', res.status, await res.text());
      } catch (mailErr) {
        console.error('contact email threw:', mailErr instanceof Error ? mailErr.message : String(mailErr));
      }
      if (emailed) await admin.from('contact_messages').update({ emailed: true }).eq('id', data.id);
    }

    return json({ ok: true, emailed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('send-contact-message failed:', msg);
    return json({ error: msg }, 500);
  }
});
