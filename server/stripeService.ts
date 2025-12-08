// Stripe service for Realista subscriptions
// Reference: connection:conn_stripe_01KAYT26YTNSFF1S0A9Q4FE38R

import { db } from './db';
import { getUncachableStripeClient } from './stripeClient';
import { sql, eq } from 'drizzle-orm';
import { agencies, agents, networks } from '@shared/schema';

type EntityType = 'agency' | 'agent' | 'network';

/**
 * StripeService: Handles direct Stripe API operations for Realista subscriptions
 * 
 * Subscription Plans:
 * - Agencies: Básica (free), Pequeña (29€/month or 290€/year), Mediana (79€/month or 790€/year), Líder (249€/month or 2490€/year)
 * - Independent Agents: Básico (free), Líder (20€/month or 200€/year)
 */
export class StripeService {
  // Create customer in Stripe for agency, agent, or network
  async createCustomer(email: string, name: string, entityType: EntityType, entityId: number) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      name,
      metadata: { 
        entityType,
        entityId: String(entityId),
      },
    });
  }

  // Create checkout session for subscription
  // SECURITY: intendedPlan is passed for audit/debugging purposes
  // The actual plan upgrade is determined by the Stripe price's product metadata
  async createCheckoutSession(
    customerId: string, 
    priceId: string, 
    successUrl: string, 
    cancelUrl: string,
    entityType: EntityType,
    entityId: number,
    intendedPlan?: string,
    billingCycle?: 'monthly' | 'yearly'
  ) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        entityType,
        entityId: String(entityId),
        intendedPlan: intendedPlan || '',
        billingCycle: billingCycle || '',
      },
      subscription_data: {
        metadata: {
          entityType,
          entityId: String(entityId),
          intendedPlan: intendedPlan || '',
          billingCycle: billingCycle || '',
        },
      },
    });
  }

  // Create customer portal session for managing subscription
  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  // Read operations - query from stripe schema (synced by stripe-replit-sync)
  async getProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return result.rows[0] || null;
  }

  async listProducts(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

  async getPrice(priceId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE id = ${priceId}`
    );
    return result.rows[0] || null;
  }

  async listPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

  // Get prices for a specific product
  async getPricesForProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE product = ${productId} AND active = true`
    );
    return result.rows;
  }

  // Get subscription from stripe schema
  async getSubscription(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] || null;
  }

  // Get invoices for a customer from stripe schema
  async getCustomerInvoices(customerId: string, limit = 10) {
    const result = await db.execute(
      sql`SELECT id, amount_paid, currency, status, created, hosted_invoice_url 
          FROM stripe.invoices 
          WHERE customer = ${customerId} 
          ORDER BY created DESC 
          LIMIT ${limit}`
    );
    return result.rows;
  }

  // Get products with their prices (for displaying subscription options)
  async listProductsWithPrices(entityType: EntityType) {
    const result = await db.execute(
      sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active,
          pr.metadata as price_metadata
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true
        AND p.metadata->>'entityType' = ${entityType}
        ORDER BY p.metadata->>'order', pr.unit_amount
      `
    );
    
    // Group prices by product
    const productsMap = new Map();
    for (const row of result.rows as any[]) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          active: row.product_active,
          metadata: row.product_metadata,
          prices: []
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
          active: row.price_active,
          metadata: row.price_metadata,
        });
      }
    }

    return Array.from(productsMap.values());
  }

  // Map Stripe product name to subscription plan name
  private mapProductToSubscriptionPlan(productName: string): string {
    const nameMap: Record<string, string> = {
      'Agency Pequeña': 'pequeña',
      'Agency Mediana': 'mediana',
      'Agency Líder': 'lider',
      'Agent Líder': 'lider',
      'Network Básica': 'basica',
      'Network Pro': 'pro',
      'Network Enterprise': 'enterprise',
    };
    return nameMap[productName] || 'basico';
  }

  // Map seat limits and properties limits based on plan
  private getPlanLimits(plan: string, entityType: EntityType) {
    if (entityType === 'agency') {
      // Limits matching shared/schema.ts SUBSCRIPTION_LIMITS
      // null = unlimited (stored as 999999 in database)
      const limits: Record<string, { seats: number; properties: number }> = {
        'basica': { seats: 1, properties: 2 },
        'pequeña': { seats: 2, properties: 10 },
        'mediana': { seats: 6, properties: 30 },
        'lider': { seats: 999999, properties: 999999 }, // unlimited
      };
      return limits[plan] || limits['basica'];
    } else if (entityType === 'network') {
      // Network limits - agencies, agents, and properties limits
      const limits: Record<string, { agencies: number; agents: number; properties: number }> = {
        'basica': { agencies: 5, agents: 25, properties: 100 },
        'pro': { agencies: 20, agents: 100, properties: 500 },
        'enterprise': { agencies: 999999, agents: 999999, properties: 999999 }, // unlimited
      };
      return limits[plan] || limits['basica'];
    } else {
      // Agent limits - basico gets same as agency basica, lider is unlimited
      const limits: Record<string, { seats: number; properties: number }> = {
        'basico': { seats: 1, properties: 2 },
        'lider': { seats: 1, properties: 999999 }, // unlimited properties
      };
      return limits[plan] || limits['basico'];
    }
  }

  // Sync subscription status from stripe.subscriptions to our tables
  // This is called after webhook events are processed by stripe-replit-sync
  async syncSubscriptionStatus(subscriptionId: string): Promise<void> {
    try {
      // Get subscription from stripe schema
      const subResult = await db.execute(
        sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
      );
      
      if (subResult.rows.length === 0) {
        console.log(`Subscription ${subscriptionId} not found in stripe schema`);
        return;
      }

      const subscription = subResult.rows[0] as any;
      const metadata = subscription.metadata || {};
      const entityType = metadata.entityType as EntityType;
      const entityId = parseInt(metadata.entityId, 10);

      if (!entityType || !entityId) {
        console.log(`Missing entityType or entityId in subscription metadata: ${subscriptionId}`);
        return;
      }

      // Access subscription items correctly: items.data[0] (Stripe's structure)
      // stripe-replit-sync stores items as {data: [...], ...}
      const items = subscription.items;
      const firstItem = items?.data?.[0] || items?.[0];
      const priceId = firstItem?.price?.id || firstItem?.price;
      
      if (!priceId) {
        console.log(`No price ID found in subscription items for ${subscriptionId}`);
        console.log('Subscription items structure:', JSON.stringify(items, null, 2));
        // Don't reset to free tier if we can't determine the plan
        return;
      }

      // Get the product name to determine the plan
      const priceResult = await db.execute(
        sql`SELECT p.name, p.metadata as product_metadata, pr.recurring 
            FROM stripe.prices pr 
            JOIN stripe.products p ON pr.product = p.id 
            WHERE pr.id = ${priceId}`
      );
      
      if (priceResult.rows.length === 0) {
        console.log(`Price ${priceId} not found in stripe.prices`);
        return;
      }
      
      const priceRow = priceResult.rows[0] as any;
      const productName = priceRow?.name || '';
      const productMetadata = priceRow?.product_metadata || {};
      
      // Use planId from metadata if available, otherwise map from product name
      const planName = productMetadata.planId || this.mapProductToSubscriptionPlan(productName);
      const limits = this.getPlanLimits(planName, entityType);
      
      // Determine if yearly billing from the recurring object
      const recurring = priceRow?.recurring || firstItem?.price?.recurring;
      const isYearly = recurring?.interval === 'year';
      
      // Update the appropriate table based on subscription status
      const isActive = ['active', 'trialing'].includes(subscription.status);

      console.log(`Syncing subscription: planName=${planName}, isActive=${isActive}, isYearly=${isYearly}, limits=${JSON.stringify(limits)}`);

      // Get default limits for free tier
      const getDefaultPlan = () => {
        if (entityType === 'agency') return 'basica';
        if (entityType === 'network') return 'basica';
        return 'basico';
      };
      const freeTierLimits = this.getPlanLimits(getDefaultPlan(), entityType);

      if (entityType === 'agency') {
        await db.update(agencies)
          .set({
            stripeSubscriptionId: isActive ? subscriptionId : null,
            subscriptionPlan: isActive ? planName : 'basica',
            isYearlyBilling: isActive ? isYearly : false,
            seatsLimit: isActive ? (limits as any).seats : (freeTierLimits as any).seats,
            activePropertiesLimit: isActive ? (limits as any).properties : (freeTierLimits as any).properties,
          })
          .where(eq(agencies.id, entityId));
        
        console.log(`Updated agency ${entityId} subscription: ${planName}, active: ${isActive}`);
      } else if (entityType === 'network') {
        await db.update(networks)
          .set({
            stripeSubscriptionId: isActive ? subscriptionId : null,
            subscriptionPlan: isActive ? planName : 'basica',
            isYearlyBilling: isActive ? isYearly : false,
            agenciesLimit: isActive ? (limits as any).agencies : (freeTierLimits as any).agencies,
            totalSeatsLimit: isActive ? (limits as any).agents : (freeTierLimits as any).agents,
            totalActivePropertiesLimit: isActive ? (limits as any).properties : (freeTierLimits as any).properties,
          })
          .where(eq(networks.id, entityId));
        
        console.log(`Updated network ${entityId} subscription: ${planName}, active: ${isActive}`);
      } else {
        await db.update(agents)
          .set({
            stripeSubscriptionId: isActive ? subscriptionId : null,
            subscriptionPlan: isActive ? planName : 'basico',
            isYearlyBilling: isActive ? isYearly : false,
          })
          .where(eq(agents.id, entityId));
        
        console.log(`Updated agent ${entityId} subscription: ${planName}, active: ${isActive}`);
      }
    } catch (error) {
      console.error(`Error syncing subscription status for ${subscriptionId}:`, error);
    }
  }

  // Update customer ID in our tables after creating a Stripe customer
  async updateCustomerId(entityType: EntityType, entityId: number, customerId: string): Promise<void> {
    if (entityType === 'agency') {
      await db.update(agencies)
        .set({ stripeCustomerId: customerId })
        .where(eq(agencies.id, entityId));
    } else if (entityType === 'network') {
      await db.update(networks)
        .set({ stripeCustomerId: customerId })
        .where(eq(networks.id, entityId));
    } else {
      await db.update(agents)
        .set({ stripeCustomerId: customerId })
        .where(eq(agents.id, entityId));
    }
  }

  // Get customer by entity type and ID
  async getCustomerByEntity(entityType: EntityType, entityId: number): Promise<string | null> {
    if (entityType === 'agency') {
      const result = await db.select({ stripeCustomerId: agencies.stripeCustomerId })
        .from(agencies)
        .where(eq(agencies.id, entityId));
      return result[0]?.stripeCustomerId || null;
    } else if (entityType === 'network') {
      const result = await db.select({ stripeCustomerId: networks.stripeCustomerId })
        .from(networks)
        .where(eq(networks.id, entityId));
      return result[0]?.stripeCustomerId || null;
    } else {
      const result = await db.select({ stripeCustomerId: agents.stripeCustomerId })
        .from(agents)
        .where(eq(agents.id, entityId));
      return result[0]?.stripeCustomerId || null;
    }
  }

  // Activate free tier (Básica for agencies/networks, Básico for agents)
  async activateFreeTier(entityType: EntityType, entityId: number): Promise<void> {
    const getDefaultPlan = () => {
      if (entityType === 'agency') return 'basica';
      if (entityType === 'network') return 'basica';
      return 'basico';
    };
    const limits = this.getPlanLimits(getDefaultPlan(), entityType);
    
    if (entityType === 'agency') {
      await db.update(agencies)
        .set({
          subscriptionPlan: 'basica',
          isYearlyBilling: false,
          seatsLimit: (limits as any).seats,
          activePropertiesLimit: (limits as any).properties,
        })
        .where(eq(agencies.id, entityId));
      console.log(`Activated free tier for agency ${entityId}`);
    } else if (entityType === 'network') {
      await db.update(networks)
        .set({
          subscriptionPlan: 'basica',
          isYearlyBilling: false,
          agenciesLimit: (limits as any).agencies,
          totalSeatsLimit: (limits as any).agents,
          totalActivePropertiesLimit: (limits as any).properties,
        })
        .where(eq(networks.id, entityId));
      console.log(`Activated free tier for network ${entityId}`);
    } else {
      await db.update(agents)
        .set({
          subscriptionPlan: 'basico',
          isYearlyBilling: false,
        })
        .where(eq(agents.id, entityId));
      console.log(`Activated free tier for agent ${entityId}`);
    }
  }
}

export const stripeService = new StripeService();
