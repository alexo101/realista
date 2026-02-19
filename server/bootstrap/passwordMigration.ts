import { db } from "../db";
import { agents, clients } from "@shared/schema";
import { eq, isNotNull } from "drizzle-orm";
import { hashPassword, isPasswordHashed } from "../security/password";

export async function migrateLegacyPlaintextPasswords(): Promise<void> {
  const [agentRows, clientRows] = await Promise.all([
    db
      .select({ id: agents.id, password: agents.password })
      .from(agents)
      .where(isNotNull(agents.password)),
    db
      .select({ id: clients.id, password: clients.password })
      .from(clients)
      .where(isNotNull(clients.password)),
  ]);

  let migratedAgents = 0;
  for (const row of agentRows) {
    if (!row.password || isPasswordHashed(row.password)) continue;
    const hashed = await hashPassword(row.password);
    await db.update(agents).set({ password: hashed }).where(eq(agents.id, row.id));
    migratedAgents++;
  }

  let migratedClients = 0;
  for (const row of clientRows) {
    if (!row.password || isPasswordHashed(row.password)) continue;
    const hashed = await hashPassword(row.password);
    await db.update(clients).set({ password: hashed }).where(eq(clients.id, row.id));
    migratedClients++;
  }

  if (migratedAgents > 0 || migratedClients > 0) {
    console.log(
      `[security] Migrated plaintext passwords. agents=${migratedAgents}, clients=${migratedClients}`,
    );
  }
}
