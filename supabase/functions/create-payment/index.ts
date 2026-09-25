/**
 * Supabase Edge Function: create-payment
 * Receives orderId / orderNumber, validates order from Supabase database,
 * retrieves verified grand_total from database (never trusts frontend amount),
 * calls Midtrans Snap API, saves payment record in `payments`, and returns token & URL.
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
    const { order_id, order_number, payment_method } = body;

    const identifier = order_number || order_id;
    if (!identifier) {
      return new Response(JSON.stringify({ error: 'order_id or order_number is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch order from database
    let query = supabase.from('orders').select('*');
    if (identifier.startsWith('ORD-')) {
      query = query.eq('order_number', identifier);
    } else {
      query = query.eq('id', identifier);
    }

    const { data: order, error: orderErr } = await query.single();
    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found in database' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Validate order status
    if (order.payment_status === 'paid') {
      return new Response(JSON.stringify({ error: 'Order is already paid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.status === 'cancelled') {
      return new Response(JSON.stringify({ error: 'Order is cancelled' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Security Rule: Strictly take amount from database order.grand_total
    const grossAmount = Math.round(Number(order.grand_total));

    // 4. Create Midtrans Snap Transaction
    const snapBaseUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1'
      : 'https://app.sandbox.midtrans.com/snap/v1';

    let snapToken = `snap_token_${Date.now()}`;
    let redirectUrl = `/payment/result?order_id=${encodeURIComponent(order.order_number)}`;
    let rawResponse: any = { mode: 'simulated_fallback' };

    if (midtransServerKey && !midtransServerKey.includes('YOUR_SERVER_KEY')) {
      const authHeader = 'Basic ' + btoa(midtransServerKey + ':');
      const snapRes = await fetch(`${snapBaseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: order.order_number,
            gross_amount: grossAmount,
          },
          customer_details: {
            first_name: order.customer_name,
            phone: order.customer_phone,
            email: order.customer_email || 'customer@example.com',
          },
        }),
      });

      const snapData = await snapRes.json();
      if (!snapRes.ok) {
        throw new Error(snapData.error_messages?.join(', ') || snapData.message || 'Midtrans error');
      }

      snapToken = snapData.token;
      redirectUrl = snapData.redirect_url;
      rawResponse = snapData;
    }

    // 5. Store payment record
    const paymentId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await supabase.from('payments').insert({
      id: paymentId,
      order_id: order.id,
      provider: 'midtrans',
      provider_transaction_id: snapToken,
      payment_method: payment_method || 'bank_transfer',
      amount: grossAmount,
      currency: 'IDR',
      status: 'pending',
      payment_token: snapToken,
      payment_url: redirectUrl,
      expires_at: expiresAt,
      raw_response: rawResponse,
    });

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentId,
        order_id: order.id,
        order_number: order.order_number,
        amount: grossAmount,
        currency: 'IDR',
        payment_token: snapToken,
        payment_url: redirectUrl,
        expires_at: expiresAt,
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
