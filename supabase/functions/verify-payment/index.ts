/**
 * Supabase Edge Function: verify-payment
 * Queries payment status directly from Midtrans Status API or database,
 * updates payment & order records if status transitioned to settled/paid.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
    const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY') || '';
    const isProduction = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { order_number } = body;

    if (!order_number) {
      return new Response(JSON.stringify({ error: 'order_number is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', order_number)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.payment_status === 'paid') {
      return new Response(JSON.stringify({ success: true, status: 'paid', order_id: order.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Query Midtrans API
    const apiBaseUrl = isProduction ? 'https://api.midtrans.com/v2' : 'https://api.sandbox.midtrans.com/v2';
    let isPaid = false;

    if (midtransServerKey && !midtransServerKey.includes('YOUR_SERVER_KEY')) {
      const auth = 'Basic ' + btoa(midtransServerKey + ':');
      const res = await fetch(`${apiBaseUrl}/${encodeURIComponent(order_number)}/status`, {
        headers: { Authorization: auth, Accept: 'application/json' },
      });

      if (res.ok) {
        const midtransData = await res.json();
        const txStatus = midtransData.transaction_status;
        const fraud = midtransData.fraud_status;

        isPaid = txStatus === 'settlement' || (txStatus === 'capture' && fraud === 'accept');

        if (isPaid) {
          const now = new Date().toISOString();
          await supabase
            .from('payments')
            .update({
              status: 'paid',
              paid_at: midtransData.settlement_time || now,
              raw_response: midtransData,
              updated_at: now,
            })
            .eq('order_id', order.id);

          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'processing',
              updated_at: now,
            })
            .eq('id', order.id);

          await supabase.from('order_status_history').insert({
            id: crypto.randomUUID(),
            order_id: order.id,
            old_status: order.status,
            new_status: 'processing',
            changed_by: 'Verifikasi Gateway',
            note: 'Pembayaran telah diverifikasi sukses melalui Midtrans status query.',
            created_at: now,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: isPaid,
        order_number,
        payment_status: isPaid ? 'paid' : order.payment_status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
