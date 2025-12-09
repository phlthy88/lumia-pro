export const CURRENT_VERSION = 1;

interface VersionedSettings {
  version: number;
  data: Record<string, unknown>;
}

export function migrateSettings(): void {
  const raw = localStorage.getItem('lumia_settings');
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    const version = parsed.version ?? 0;

    if (version < CURRENT_VERSION) {
      // Run migrations sequentially
      let data = parsed.data ?? parsed;

      // v0 -> v1: example migration
      if (version < 1) {
        // Add any schema changes here if needed in future
        console.log('[Settings] Migrated v0 -> v1');
      }

      localStorage.setItem('lumia_settings', JSON.stringify({
        version: CURRENT_VERSION,
        data
      }));
    }
  } catch (e) {
    console.error('[Settings] Migration failed, using defaults', e);
    localStorage.removeItem('lumia_settings');
  }
}
