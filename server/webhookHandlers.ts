// Stripe webhook handlers for Realista
// Reference: connection:conn_stripe_01KAYT26YTNSFF1S0A9Q4FE38R

import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { stripeService } from './stripeService';
import Stripe from 'stripe';

// Events that should trigger subscription sync
const SUBSCRIPTION_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'checkout.session.completed',
];

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    // Validate payload is a Buffer
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    
    // Process the webhook via stripe-replit-sync (syncs to stripe schema)
    await sync.processWebhook(payload, signature, uuid);

    // Parse the event to check if we need to sync subscription status
    try {
      const stripe = await getUncachableStripeClient();
      const webhookSecret = await sync.getWebhookSecret(uuid);
      const event = stripe.webhooks.constructEvent(payload.toString(), signature, webhookSecret);

      console.log(`Stripe webhook received: ${event.type}`);

      // Handle subscription-related events
      if (SUBSCRIPTION_EVENTS.includes(event.type)) {
        await WebhookHandlers.handleSubscriptionEvent(event);
      }
    } catch (parseError: any) {
      console.error('Error parsing webhook event for sync:', parseError.message);
      // Don't throw - the main webhook processing already succeeded
    }
  }

  private static async handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
    let subscriptionId: string | null = null;

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        subscriptionId = subscription.id;
        break;
      }
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          subscriptionId = typeof session.subscription === 'string' 
            ? session.subscription 
            : session.subscription.id;
        }
        break;
      }
    }

    if (subscriptionId) {
      console.log(`Syncing subscription status for: ${subscriptionId}`);
      // Wait a moment for stripe-replit-sync to finish writing to the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      await stripeService.syncSubscriptionStatus(subscriptionId);
    }
  }
}
