import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Payment Intent Data:', JSON.stringify(paymentIntent, null, 2));
        
        // Extract metadata from the payment intent
        const metadata = {
          ...paymentIntent.metadata,
          payment_intent_id: paymentIntent.id,
          payment_status: paymentIntent.status,
          payment_method: paymentIntent.payment_method,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          created: paymentIntent.created,
          customer_id: paymentIntent.customer,
          receipt_email: paymentIntent.receipt_email,
          shipping: paymentIntent.shipping
        };

        console.log('Extracted Metadata:', JSON.stringify(metadata, null, 2));
        
        // Store transaction data
        const { data: transactionData, error } = await supabaseAdmin
          .from('transactions')
          .insert({
            stripe_payment_intent_id: paymentIntent.id,
            stripe_customer_id: paymentIntent.customer,
            amount: paymentIntent.amount / 100, // Convert from cents to dollars
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            payment_method: paymentIntent.payment_method,
            payment_method_details: paymentIntent.payment_method_details,
            customer_email: paymentIntent.receipt_email,
            customer_name: paymentIntent.shipping?.name,
            metadata: metadata
          })
          .select()
          .single();

        if (error) {
          console.error('Error storing transaction:', error);
          throw error;
        }

        console.log('Transaction saved successfully:', JSON.stringify(transactionData, null, 2));

        // Update investment status if payment_intent_id exists in metadata
        if (paymentIntent.metadata?.investment_id) {
          const { error: investmentError } = await supabaseAdmin
            .from('investments')
            .update({ status: 'COMPLETED' })
            .eq('id', paymentIntent.metadata.investment_id);

          if (investmentError) {
            console.error('Error updating investment:', investmentError);
            throw investmentError;
          }
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Failed Payment Intent Data:', JSON.stringify(paymentIntent, null, 2));
        
        // Update transaction status
        const { error } = await supabaseAdmin
          .from('transactions')
          .update({ 
            status: 'failed',
            metadata: {
              ...paymentIntent.metadata,
              failure_reason: paymentIntent.last_payment_error?.message,
              failure_code: paymentIntent.last_payment_error?.code
            }
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Error updating transaction:', error);
          throw error;
        }

        // Update investment status if payment_intent_id exists in metadata
        if (paymentIntent.metadata?.investment_id) {
          const { error: investmentError } = await supabaseAdmin
            .from('investments')
            .update({ status: 'FAILED' })
            .eq('id', paymentIntent.metadata.investment_id);

          if (investmentError) {
            console.error('Error updating investment:', investmentError);
            throw investmentError;
          }
        }

        break;
      }

      // Add more event types as needed
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: err.message },
      { status: 500 }
    );
  }
} 