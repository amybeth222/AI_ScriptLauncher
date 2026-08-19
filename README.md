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
- Scanning is recursive — subfolders show up as collapsible groups.
- Click anywhere on a script row (or the RUN button) to execute it via
  `$.evalFile()`.
- Drag the grip icon (⣿) on the left of a row or folder group to reorder the
  list. The order is remembered per folder selection.
- ⟳ rescans the current folder if you've added/removed scripts.
- The search box filters the visible list by filename.
- ⚙ opens display settings: text size/color, RUN button color, row spacing.

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
   ZXPSignCmd -sign ScriptLauncher ScriptLauncher.zxp cert.p12 yourPassword
   ```
   (run this from the parent folder that contains `ScriptLauncher/`)
4. Send people the resulting `ScriptLauncher.zxp` — they install it with
   ZXP Installer / Anastasiy's Extension Manager and it just works, no
   debug-mode registry/defaults tweaks required.

If you'd rather distribute through Adobe Exchange, that needs a purchased
(non-self-signed) certificate — worth revisiting if this ever needs to reach
people outside your team.

## Notes / easy extensions

- `.jsxbin` files are listed too, since `$.evalFile()` runs those fine.
- Swap `client/lib/CSInterface.js` for Adobe's official CSInterface.js from
  the CEP-Resources repo if you want the fuller API (persistent state,
  network access flags, etc.) — this build only wires up what the launcher needs.
