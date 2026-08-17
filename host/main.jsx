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

// Returns a JSON string: [{ "name": "MyScript.jsx", "path": "/full/path/MyScript.jsx" }, ...]
// On failure, returns a JSON object: { "error": "..." }
function listScripts(folderPath) {
    try {
        var folder = new Folder(folderPath);
        if (!folder.exists) {
            return '{"error":"Folder does not exist: ' + jsonEscape(folderPath) + '"}';
        }

        var files = folder.getFiles();
        var matched = [];
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f instanceof File && /\.(jsx|jsxbin)$/i.test(f.name)) {
                matched.push(f);
            }
        }

        matched.sort(function (a, b) {
            return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
        });

        var parts = [];
        for (var j = 0; j < matched.length; j++) {
            var displayName;
            try {
                displayName = decodeURI(matched[j].name);
            } catch (decodeErr) {
                displayName = matched[j].name;
            }
            parts.push(
                '{"name":"' + jsonEscape(displayName) + '","path":"' + jsonEscape(matched[j].fsName) + '"}'
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
