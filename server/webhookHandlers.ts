// Stripe webhook handlers for Realista
// Reference: connection:conn_stripe_01KAYT26YTNSFF1S0A9Q4FE38R

import { getStripeSync } from './stripeClient';
import { stripeService } from './stripeService';

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
    // This also verifies the signature internally
    await sync.processWebhook(payload, signature, uuid);

    // Parse the raw payload to extract event data
    // Signature was already verified by sync.processWebhook above
    try {
      const eventData = JSON.parse(payload.toString());
      const eventType = eventData.type;

      console.log(`Received webhook ${eventData.id}: ${eventType} for ${eventData.data?.object?.object || 'unknown'} ${eventData.data?.object?.id || ''}`);

      // Handle subscription-related events
      if (SUBSCRIPTION_EVENTS.includes(eventType)) {
        await WebhookHandlers.handleSubscriptionEvent(eventType, eventData.data?.object);
      }
    } catch (parseError: any) {
      console.error('Error parsing webhook event for sync:', parseError.message);
      // Don't throw - the main webhook processing already succeeded
    }
  }

  private static async handleSubscriptionEvent(eventType: string, data: any): Promise<void> {
    let subscriptionId: string | null = null;

    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        subscriptionId = data?.id;
        console.log(`Subscription event ${eventType}: subscription ${subscriptionId}, status: ${data?.status}`);
        break;
      }
      case 'checkout.session.completed': {
        if (data?.mode === 'subscription' && data?.subscription) {
          subscriptionId = typeof data.subscription === 'string' 
            ? data.subscription 
            : data.subscription.id;
          console.log(`Checkout completed: session ${data.id}, subscription ${subscriptionId}`);
        }
        break;
      }
    }

    if (subscriptionId) {
      console.log(`Syncing subscription status for: ${subscriptionId}`);
      // Wait a moment for stripe-replit-sync to finish writing to the database
      await new Promise(resolve => setTimeout(resolve, 1500));
      try {
        await stripeService.syncSubscriptionStatus(subscriptionId);
        console.log(`Successfully synced subscription ${subscriptionId}`);
      } catch (syncError: any) {
        console.error(`Failed to sync subscription ${subscriptionId}:`, syncError.message);
      }
    }
  }
}
