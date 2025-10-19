/**
 * Migration script to generate slugs for existing agencies, agents, and properties
 * Run this once after adding the slug columns to the database
 */

import { db } from '../server/db';
import { agencies, agents, properties } from '../shared/schema';
import { generateAgencySlug, generateAgentSlug, generatePropertySlug } from '../shared/slug-utils';
import { eq } from 'drizzle-orm';

async function generateSlugs() {
  console.log('Starting slug generation for existing records...\n');

  try {
    // Generate slugs for agencies
    console.log('Processing agencies...');
    const allAgencies = await db.select().from(agencies);
    console.log(`Found ${allAgencies.length} agencies`);
    
    for (const agency of allAgencies) {
      if (!agency.slug) {
        const slug = generateAgencySlug(agency.agencyName);
        await db.update(agencies)
          .set({ slug })
          .where(eq(agencies.id, agency.id));
        console.log(`  ✓ Agency "${agency.agencyName}" → ${slug}`);
      }
    }

    // Generate slugs for agents
    console.log('\nProcessing agents...');
    const allAgents = await db.select().from(agents);
    console.log(`Found ${allAgents.length} agents`);
    
    for (const agent of allAgents) {
      if (!agent.slug) {
        const name = agent.name || 'agente';
        const surname = agent.surname || '';
        const slug = generateAgentSlug(name, surname, agent.id);
        await db.update(agents)
          .set({ slug })
          .where(eq(agents.id, agent.id));
        console.log(`  ✓ Agent "${name} ${surname}" → ${slug}`);
      }
    }

    // Generate slugs for properties
    console.log('\nProcessing properties...');
    const allProperties = await db.select().from(properties);
    console.log(`Found ${allProperties.length} properties`);
    
    for (const property of allProperties) {
      if (!property.slug) {
        const title = property.title || property.type;
        const neighborhood = property.neighborhood;
        const reference = property.reference || undefined;
        const slug = generatePropertySlug(title, neighborhood, reference, property.id);
        await db.update(properties)
          .set({ slug })
          .where(eq(properties.id, property.id));
        console.log(`  ✓ Property "${title}" → ${slug}`);
      }
    }

    console.log('\n✅ Slug generation completed successfully!');
  } catch (error) {
    console.error('❌ Error generating slugs:', error);
    throw error;
  }
}

// Run the migration
generateSlugs()
  .then(() => {
    console.log('\nMigration finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration failed:', error);
    process.exit(1);
  });
