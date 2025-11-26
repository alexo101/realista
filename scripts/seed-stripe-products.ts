// Seed script for Realista subscription products in Stripe
// Reference: connection:conn_stripe_01KAYT26YTNSFF1S0A9Q4FE38R
// 
// Run this script to create subscription products and prices in Stripe:
// npx tsx scripts/seed-stripe-products.ts

import { getUncachableStripeClient } from '../server/stripeClient';

async function seedProducts() {
  console.log('Starting Stripe product seeding...');
  
  const stripe = await getUncachableStripeClient();
  
  // Check if products already exist
  const existingProducts = await stripe.products.list({ limit: 100 });
  const existingProductNames = existingProducts.data.map(p => p.name);
  
  // ===============================
  // AGENCY SUBSCRIPTION PLANS
  // ===============================
  
  // 1. Agency Pequeña - 29€/month or 290€/year
  if (!existingProductNames.includes('Realista Pro - Agencia Pequeña')) {
    console.log('Creating Agency Pequeña product...');
    const agencyPequena = await stripe.products.create({
      name: 'Realista Pro - Agencia Pequeña',
      description: 'Plan para agencias pequeñas con hasta 3 agentes y 20 propiedades activas',
      metadata: {
        entityType: 'agency',
        planId: 'pequeña',
        order: '1',
        seatsLimit: '3',
        activePropertiesLimit: '20',
      },
    });
    
    await stripe.prices.create({
      product: agencyPequena.id,
      unit_amount: 2900, // 29.00€
      currency: 'eur',
      recurring: { interval: 'month' },
      metadata: { billingPeriod: 'monthly' },
    });
    
    await stripe.prices.create({
      product: agencyPequena.id,
      unit_amount: 29000, // 290.00€
      currency: 'eur',
      recurring: { interval: 'year' },
      metadata: { billingPeriod: 'yearly' },
    });
    
    console.log('Created Agency Pequeña product with monthly and yearly prices');
  }
  
  // 2. Agency Mediana - 79€/month or 790€/year
  if (!existingProductNames.includes('Realista Pro - Agencia Mediana')) {
    console.log('Creating Agency Mediana product...');
    const agencyMediana = await stripe.products.create({
      name: 'Realista Pro - Agencia Mediana',
      description: 'Plan para agencias medianas con hasta 10 agentes y 60 propiedades activas',
      metadata: {
        entityType: 'agency',
        planId: 'mediana',
        order: '2',
        seatsLimit: '10',
        activePropertiesLimit: '60',
      },
    });
    
    await stripe.prices.create({
      product: agencyMediana.id,
      unit_amount: 7900, // 79.00€
      currency: 'eur',
      recurring: { interval: 'month' },
      metadata: { billingPeriod: 'monthly' },
    });
    
    await stripe.prices.create({
      product: agencyMediana.id,
      unit_amount: 79000, // 790.00€
      currency: 'eur',
      recurring: { interval: 'year' },
      metadata: { billingPeriod: 'yearly' },
    });
    
    console.log('Created Agency Mediana product with monthly and yearly prices');
  }
  
  // 3. Agency Líder - 249€/month or 2490€/year
  if (!existingProductNames.includes('Realista Pro - Agencia Líder')) {
    console.log('Creating Agency Líder product...');
    const agencyLider = await stripe.products.create({
      name: 'Realista Pro - Agencia Líder',
      description: 'Plan premium para agencias líderes con agentes ilimitados y propiedades ilimitadas',
      metadata: {
        entityType: 'agency',
        planId: 'lider',
        order: '3',
        seatsLimit: 'unlimited',
        activePropertiesLimit: 'unlimited',
      },
    });
    
    await stripe.prices.create({
      product: agencyLider.id,
      unit_amount: 24900, // 249.00€
      currency: 'eur',
      recurring: { interval: 'month' },
      metadata: { billingPeriod: 'monthly' },
    });
    
    await stripe.prices.create({
      product: agencyLider.id,
      unit_amount: 249000, // 2490.00€
      currency: 'eur',
      recurring: { interval: 'year' },
      metadata: { billingPeriod: 'yearly' },
    });
    
    console.log('Created Agency Líder product with monthly and yearly prices');
  }
  
  // ===============================
  // INDEPENDENT AGENT SUBSCRIPTION PLANS
  // ===============================
  
  // Agent Líder - 20€/month or 200€/year
  if (!existingProductNames.includes('Realista Pro - Agente Líder')) {
    console.log('Creating Agent Líder product...');
    const agentLider = await stripe.products.create({
      name: 'Realista Pro - Agente Líder',
      description: 'Plan premium para agentes independientes con propiedades ilimitadas',
      metadata: {
        entityType: 'agent',
        planId: 'lider',
        order: '1',
        activePropertiesLimit: 'unlimited',
      },
    });
    
    await stripe.prices.create({
      product: agentLider.id,
      unit_amount: 2000, // 20.00€
      currency: 'eur',
      recurring: { interval: 'month' },
      metadata: { billingPeriod: 'monthly' },
    });
    
    await stripe.prices.create({
      product: agentLider.id,
      unit_amount: 20000, // 200.00€
      currency: 'eur',
      recurring: { interval: 'year' },
      metadata: { billingPeriod: 'yearly' },
    });
    
    console.log('Created Agent Líder product with monthly and yearly prices');
  }
  
  console.log('\nStripe product seeding complete!');
  console.log('Products created:');
  console.log('- Agency Pequeña: 29€/month or 290€/year');
  console.log('- Agency Mediana: 79€/month or 790€/year');
  console.log('- Agency Líder: 249€/month or 2490€/year');
  console.log('- Agent Líder: 20€/month or 200€/year');
  console.log('\nNote: Básica/Básico plans are free and do not require Stripe products.');
}

seedProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding products:', error);
    process.exit(1);
  });
