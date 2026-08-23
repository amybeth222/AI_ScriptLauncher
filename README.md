# Script Launcher (Illustrator CEP panel)

A dockable panel that scans a folder you choose and lists every `.jsx`/`.jsxbin`
script in it as a clickable RUN button — no more digging through File > Scripts.

## What's in here

```
ScriptLauncher/
  CSXS/manifest.xml       - extension manifest (host: Illustrator, CEP 9)
  client/index.html       - panel UI
  client/style.css        - dark theme, customizable UI color accent
  client/main.js          - panel logic (scan / filter / run / persist folders)
  client/lib/CSInterface.js - minimal JS<->host bridge
  client/icons/           - panel icon (docked-panel badge, light/dark/@2x)
  host/main.jsx            - ExtendScript: list files, run a script, folder picker
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

- First launch defaults to your Desktop. Open ⚙ **Settings** and use
  **+ Add Folder** under "Folder Sources" to point it at wherever you keep
  your `.jsx` files (e.g. a synced Script Depository folder).
- You can add multiple folder sources. With just one folder, its scripts
  show in a flat list same as always. Once you add a second (or more), each
  source's scripts — including ones sitting directly in its root — collapse
  into their own named toggle group, so scripts from different sources don't
  get mixed together. Remove a source anytime with the × next to it.
- Folder choices are remembered (stored in the panel's localStorage) so it
  reopens on the same folders next time.
- Scanning is recursive — subfolders show up as collapsible groups.
- Click anywhere on a script row (or the RUN button) to execute it via
  `$.evalFile()`.
- Drag the grip icon (⣿) on the left of a row or folder group to reorder the
  list. The order is remembered per folder selection.
- ⟳ rescans the current folders if you've added/removed scripts.
- The search box filters the visible list by filename.
- ⚙ opens display settings: text size/color, **UI Color** (drives the RUN
  button, hover/focus borders, and every accent stroke in the panel), row
  spacing, and Folder Sources.
- ⓘ opens an About popup with the current version number and author/site
  info.

## Packaging as a `.zxp` for distribution

Right now the panel only runs unsigned, with `PlayerDebugMode` on (see
Install above) — that's fine for you, but anyone else you hand the folder to
would need to enable the same debug flag on their own machine. A `.zxp` is a
single signed installer file that skips all of that: people just double-click
it (via [ZXP Installer](https://aescripts.com/learn/zxp-installer/) or the
Anastasiy Extension Manager) and the panel shows up in Illustrator.

1. **Get `ZXPSignCmd`** — download it from Adobe's
   [CEP-Resources releases](https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD)
   (pick the binary for your OS) and make it executable.
2. **Create a signing certificate** (one-time, self-signed is fine for
   sharing with a team — recipients will just see an "unverified developer"
   warning they can click through):
   ```
   ZXPSignCmd -selfSignedCert US CA "Your Name" ScriptLauncher yourPassword cert.p12
   ```
3. **Sign and package**:
   ```
   find ScriptLauncher -iname ".DS_Store" -delete
   ZXPSignCmd -sign ScriptLauncher ScriptLauncher.zxp cert.p12 yourPassword
   ```
   (run this from the parent folder that contains `ScriptLauncher/`.
   The `.DS_Store` cleanup matters: Adobe Exchange's upload scanner rejects
   packages containing macOS's hidden Finder metadata files.)
4. Send people the resulting `ScriptLauncher.zxp` — they install it with
   ZXP Installer / Anastasiy's Extension Manager and it just works, no
   debug-mode registry/defaults tweaks required.

Script Launcher is also submitted to Adobe Exchange (Developer Distribution)
as "Illustrator Script Launcher" — a self-signed `.zxp` works fine there too,
no purchased certificate needed. Repackage and resubmit a new version there
any time the code changes meaningfully.

## Notes / easy extensions

- `.jsxbin` files are listed too, since `$.evalFile()` runs those fine.
- Swap `client/lib/CSInterface.js` for Adobe's official CSInterface.js from
  the CEP-Resources repo if you want the fuller API (persistent state,
  network access flags, etc.) — this build only wires up what the launcher needs.
