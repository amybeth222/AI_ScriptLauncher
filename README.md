# Script Launcher (Illustrator CEP panel)

A dockable panel that scans a folder you choose and lists every `.jsx`/`.jsxbin`
script in it as a clickable RUN button — no more digging through File > Scripts.

## What's in here

```
ScriptLauncher/
  CSXS/manifest.xml     - extension manifest (host: Illustrator, CEP 9)
  client/index.html      - panel UI
  client/style.css       - dark theme, acid-green accent
  client/main.js          - panel logic (scan / filter / run / persist folder)
  client/lib/CSInterface.js - minimal JS<->host bridge
  host/main.jsx           - ExtendScript: list files, run a script, folder picker
```

## Install (unsigned / dev mode — fastest for local use)

**Mac:**
1. Enable debug mode so Illustrator loads unsigned extensions:
   ```
   defaults write com.adobe.CSXS.9 PlayerDebugMode 1
   ```
2. Copy the whole `ScriptLauncher` folder into:
   ```
   ~/Library/Application Support/Adobe/CEP/extensions/
   ```
3. Restart Illustrator.
4. Open it via **Window > Extensions > Script Launcher**.

**Windows:**
1. Add a registry DWORD `PlayerDebugMode` = `1` under
   `HKEY_CURRENT_USER\Software\Adobe\CSXS.9`
2. Copy the `ScriptLauncher` folder into:
   ```
   C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\
   ```
3. Restart Illustrator, then **Window > Extensions > Script Launcher**.

If the panel doesn't show up, double check the folder name matches the
`ExtensionBundleId` structure (the `ScriptLauncher` folder itself should sit
directly inside `extensions/`, with `CSXS/manifest.xml` inside it).

## Using it

- First launch defaults to your Desktop. Click the 📁 button to point it at
  wherever you keep your `.jsx` files (e.g. a synced Script Depository folder).
- The folder choice is remembered (stored in the panel's localStorage) so it
  reopens on the same folder next time.
- Click anywhere on a script row (or the RUN button) to execute it via
  `$.evalFile()`.
- ⟳ rescans the current folder if you've added/removed scripts.
- The search box filters the visible list by filename.

## Packaging for real distribution later

This is set up for local/dev use (unsigned, PlayerDebugMode). If you ever want
to hand it to someone else or distribute via Adobe Exchange, you'd package it
into a signed `.zxp` with ZXPSignCmd and a self-signed or purchased certificate
— happy to set that up when you're ready for it.

## Notes / easy extensions

- Currently non-recursive (top-level folder only). Say the word if you want
  subfolder scanning with collapsible groups.
- `.jsxbin` files are listed too, since `$.evalFile()` runs those fine.
- Swap `client/lib/CSInterface.js` for Adobe's official CSInterface.js from
  the CEP-Resources repo if you want the fuller API (persistent state,
  network access flags, etc.) — this build only wires up what the launcher needs.
