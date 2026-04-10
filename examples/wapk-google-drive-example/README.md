# WAPK Google Drive Example

This example shows a direct Google Drive WAPK workflow with `elit.config.ts`.

Required environment variables:

- `GOOGLE_DRIVE_ACCESS_TOKEN`
- `ELIT_WAPK_GOOGLE_DRIVE_FILE_ID`

Optional environment variables:

- `ELIT_WAPK_GOOGLE_DRIVE_SHARED_DRIVE=true`
- `ELIT_WAPK_PASSWORD`

Typical flow:

```powershell
npx elit wapk pack .
npx elit wapk
```

With the provided `elit.config.ts`, `npx elit wapk` reads and writes the archive directly through the Google Drive API.