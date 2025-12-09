# Migration Guide

## Settings Migration

User settings are stored in localStorage with schema versioning.

### Current Schema (v1)

```typescript
interface Settings {
  version: 1;
  data: {
    camera_id?: string;
    theme_mode?: 'light' | 'dark';
    seed_color?: string;
    sidebar_position?: 'left' | 'right';
    // ... other settings
  };
}
```

### Adding a Migration

1. Increment `CURRENT_VERSION` in `SettingsMigration.ts`
2. Add migration logic:

```typescript
if (version < 2) {
  // v1 -> v2: Rename 'camera_id' to 'activeDeviceId'
  if (data.camera_id) {
    data.activeDeviceId = data.camera_id;
    delete data.camera_id;
  }
  console.log('[Settings] Migrated v1 -> v2');
}
```

3. Test with old settings in localStorage

### Breaking Changes

If a migration cannot preserve data:
1. Log clear warning
2. Reset to defaults
3. Show user notification on first load
