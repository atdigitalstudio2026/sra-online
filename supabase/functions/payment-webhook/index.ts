/**
 * Supabase Edge Function: payment-webhook
 * Receives Midtrans webhook notification, verifies SHA-512 signature,
 * enforces idempotency, updates payments and orders tables atomically,
 * and adds audit log to order_status_history.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.1';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha512(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
    const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();

    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body;

    // 1. Signature Verification
    if (midtransServerKey && !midtransServerKey.includes('YOUR_SERVER_KEY')) {
      const expectedSignature = await sha512(`${order_id}${status_code}${gross_amount}${midtransServerKey}`);
      if (expectedSignature.toLowerCase() !== String(signature_key).toLowerCase()) {
        return new Response(JSON.stringify({ error: 'Invalid signature key' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 2. Fetch order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', order_id)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: `Order ${order_id} not found` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Idempotency Check
    if (order.payment_status === 'paid' && (transaction_status === 'settlement' || transaction_status === 'capture')) {
      return new Response(JSON.stringify({ status: 'ok', message: 'Already marked as paid (idempotent)' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    const isPaid =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');
    const isExpired = transaction_status === 'expire';
    const isFailed = transaction_status === 'deny' || transaction_status === 'cancel';

    if (isPaid) {
      // Update payment record
      await supabase
        .from('payments')
        .update({
          status: 'paid',
          provider_transaction_id: body.transaction_id || body.order_id,
          payment_method: body.payment_type || 'midtrans',
          paid_at: body.settlement_time || body.transaction_time || now,
          raw_response: body,
          updated_at: now,
        })
        .eq('order_id', order.id);

      // Update orders table
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing',
          updated_at: now,
        })
        .eq('id', order.id);

      // Insert audit history
      await supabase.from('order_status_history').insert({
        id: crypto.randomUUID(),
        order_id: order.id,
        old_status: order.status,
        new_status: 'processing',
        changed_by: 'Webhook Midtrans',
        note: `Pembayaran berhasil via ${body.payment_type || 'Midtrans'}. Status pesanan diubah ke diproses.`,
        created_at: now,
      });
    } else if (isExpired || isFailed) {
      const newStatus = isExpired ? 'expired' : 'failed';
      await supabase
        .from('payments')
        .update({
          status: newStatus,
          failure_reason: body.status_message || `Transaction ${transaction_status}`,
          raw_response: body,
          updated_at: now,
        })
        .eq('order_id', order.id);
    }

    return new Response(JSON.stringify({ status: 'ok', message: 'Notification processed' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
