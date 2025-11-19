import { db } from "../server/db";
import { agencies } from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { ALL_ZONES } from "../shared/schema";

/**
 * Migration script to convert agencies with all Barcelona or Madrid neighborhoods
 * to use the ALL_ZONES sentinel value instead of storing all individual neighborhoods
 */

async function migrateAllZonesToSentinel() {
  console.log("Starting migration to convert full neighborhood lists to ALL_ZONES...");
  
  // Import neighborhood utilities
  const { getAllNeighborhoodsByCity } = await import("../client/src/utils/neighborhoods.js");
  
  const barcelonaNeighborhoods = getAllNeighborhoodsByCity("Barcelona");
  const madridNeighborhoods = getAllNeighborhoodsByCity("Madrid");
  
  console.log(`Barcelona has ${barcelonaNeighborhoods.length} neighborhoods`);
  console.log(`Madrid has ${madridNeighborhoods.length} neighborhoods`);
  
  // Get all agencies with influence neighborhoods
  const allAgencies = await db
    .select()
    .from(agencies)
    .where(sql`cardinality(${agencies.agencyInfluenceNeighborhoods}) > 0`);
  
  console.log(`Found ${allAgencies.length} agencies with influence neighborhoods`);
  
  let migratedCount = 0;
  
  for (const agency of allAgencies) {
    const neighborhoods = agency.agencyInfluenceNeighborhoods || [];
    
    // Check if this agency has ALL Barcelona neighborhoods
    const hasAllBarcelona = neighborhoods.length === barcelonaNeighborhoods.length &&
      barcelonaNeighborhoods.every(n => neighborhoods.includes(n));
    
    // Check if this agency has ALL Madrid neighborhoods  
    const hasAllMadrid = neighborhoods.length === madridNeighborhoods.length &&
      madridNeighborhoods.every(n => neighborhoods.includes(n));
    
    if (hasAllBarcelona || hasAllMadrid) {
      console.log(`Migrating agency ${agency.id} (${agency.agencyName}) - has all ${hasAllBarcelona ? 'Barcelona' : 'Madrid'} zones`);
      
      await db
        .update(agencies)
        .set({ agencyInfluenceNeighborhoods: [ALL_ZONES] })
        .where(eq(agencies.id, agency.id));
      
      migratedCount++;
    }
  }
  
  console.log(`✅ Migration complete! Migrated ${migratedCount} agencies to use ALL_ZONES`);
}

migrateAllZonesToSentinel()
  .then(() => {
    console.log("Migration successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
