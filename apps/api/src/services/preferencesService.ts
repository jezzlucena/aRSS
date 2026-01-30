import { eq } from 'drizzle-orm';
import { db, userPreferences } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

export interface UpdatePreferencesInput {
  theme?: 'light' | 'dark' | 'system';
  accentColor?: string;
  layout?: 'list' | 'cards' | 'magazine';
  articleView?: 'split' | 'overlay' | 'full';
  fontSize?: 'small' | 'medium' | 'large';
  articleWidth?: 'narrow' | 'wide' | 'full';
}

export async function getPreferences(userId: string) {
  let prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
  });

  if (!prefs) {
    // Create default preferences
    const [newPrefs] = await db
      .insert(userPreferences)
      .values({ userId })
      .returning();
    prefs = newPrefs;
  }

  return prefs;
}

export async function updatePreferences(userId: string, input: UpdatePreferencesInput) {
  // Ensure preferences exist
  await getPreferences(userId);

  const [updated] = await db
    .update(userPreferences)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(userPreferences.userId, userId))
    .returning();

  return updated;
}
