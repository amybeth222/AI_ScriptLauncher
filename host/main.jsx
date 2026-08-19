// Script Launcher - host (ExtendScript) side
// Runs inside Illustrator's ExtendScript engine.

function getDefaultFolder() {
    return Folder.desktop.fsName;
}

function chooseFolder() {
    var f = Folder.selectDialog("Choose a folder of scripts");
    if (f) {
        return f.fsName;
    }
    return "null";
}

// ExtendScript's File/Folder .name can come back URI-encoded (e.g. spaces as
// %20) depending on OS/locale, so decode defensively everywhere it's displayed.
function decodeName(str) {
    try {
        return decodeURI(str);
    } catch (e) {
        return str;
    }
}

// Manual JSON escaping - avoids depending on ExtendScript's built-in JSON object,
// which is inconsistent across Illustrator versions.
function jsonEscape(str) {
    str = String(str);
    return str
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
}

// Returns a JSON string: [{ "name": "MyScript.jsx", "path": "/full/path/MyScript.jsx", "folder": "subfolder" }, ...]
// On failure, returns a JSON object: { "error": "..." }
function listScripts(folderPaths) {
    try {
        if (!(folderPaths instanceof Array)) {
            folderPaths = [folderPaths];
        }

        var matched = [];
        function collectScripts(folder, relativePath) {
            var files = folder.getFiles();
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file instanceof Folder) {
                    var folderName = decodeName(file.name);
                    collectScripts(file, relativePath ? relativePath + "/" + folderName : folderName);
                } else if (file instanceof File && /\.(jsx|jsxbin)$/i.test(file.name)) {
                    matched.push({ file: file, folder: relativePath });
                }
            }
        }

        for (var i = 0; i < folderPaths.length; i++) {
            var folder = new Folder(folderPaths[i]);
            if (!folder.exists) {
                return '{"error":"Folder does not exist: ' + jsonEscape(folderPaths[i]) + '"}';
            }
            collectScripts(folder, "");
        }

        matched.sort(function (a, b) {
            var aName = (a.folder + "/" + a.file.name).toLowerCase();
            var bName = (b.folder + "/" + b.file.name).toLowerCase();
            return aName < bName ? -1 : aName > bName ? 1 : 0;
        });

        var parts = [];
        for (var j = 0; j < matched.length; j++) {
            var displayName = decodeName(matched[j].file.name);
            parts.push(
                '{"name":"' + jsonEscape(displayName) + '","path":"' + jsonEscape(matched[j].file.fsName) + '","folder":"' + jsonEscape(matched[j].folder) + '"}'
            );
        }
        return "[" + parts.join(",") + "]";
    } catch (e) {
        return '{"error":"' + jsonEscape(e.toString()) + '"}';
    }
}

// Runs a script file by path. Returns "OK" or an error message.
function runScript(scriptPath) {
    try {
        var f = new File(scriptPath);
        if (!f.exists) {
            return "ERROR: file not found - " + scriptPath;
        }
        $.evalFile(f);
        return "OK";
    } catch (e) {
        return "ERROR: " + e.toString();
    }
}
