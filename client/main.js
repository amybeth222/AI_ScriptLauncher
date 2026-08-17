(function () {
    var csInterface = new CSInterface();
    var STORAGE_KEY = "scriptLauncher.folder";

    var folderPathEl = document.getElementById("folder-path");
    var scriptListEl = document.getElementById("script-list");
    var searchEl = document.getElementById("search");
    var statusEl = document.getElementById("status");
    var chooseFolderBtn = document.getElementById("choose-folder-btn");
    var refreshBtn = document.getElementById("refresh-btn");

    var currentFolder = null;
    var allScripts = []; // [{name, path}]

    function setStatus(msg, type) {
        statusEl.textContent = msg;
        statusEl.parentElement.className = type || "";
    }

    function escapeHtml(str) {
        var div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    function render(scripts) {
        scriptListEl.innerHTML = "";
        if (!scripts.length) {
            var empty = document.createElement("div");
            empty.id = "empty-state";
            empty.textContent = currentFolder
                ? "No .jsx scripts found in this folder."
                : "Choose a folder to get started.";
            scriptListEl.appendChild(empty);
            return;
        }
        scripts.forEach(function (script) {
            var item = document.createElement("div");
            item.className = "script-item";

            var name = document.createElement("span");
            name.className = "name";
            name.textContent = script.name;
            name.title = script.path;

            var btn = document.createElement("button");
            btn.className = "run-btn";
            btn.textContent = "RUN";
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                runScript(script);
            });

            item.appendChild(name);
            item.appendChild(btn);
            item.addEventListener("click", function () {
                runScript(script);
            });

            scriptListEl.appendChild(item);
        });
    }

    function applyFilter() {
        var q = searchEl.value.trim().toLowerCase();
        if (!q) {
            render(allScripts);
            return;
        }
        render(
            allScripts.filter(function (s) {
                return s.name.toLowerCase().indexOf(q) !== -1;
            })
        );
    }

    function scanFolder(path) {
        setStatus("Scanning...");
        var jsxCall = "listScripts(" + JSON.stringify(path) + ")";
        csInterface.evalScript(jsxCall, function (result) {
            if (!result || result === "EvalScript error." || result === "undefined") {
                setStatus(
                    "Host script didn't respond (" + result + "). Try reopening the panel.",
                    "error"
                );
                allScripts = [];
                render(allScripts);
                return;
            }
            var parsed;
            try {
                parsed = JSON.parse(result);
            } catch (e) {
                setStatus("Unexpected response: " + result, "error");
                allScripts = [];
                render(allScripts);
                return;
            }
            if (parsed && parsed.error) {
                setStatus(parsed.error, "error");
                allScripts = [];
                render(allScripts);
                return;
            }
            allScripts = parsed;
            applyFilter();
            setStatus(
                allScripts.length + " script" + (allScripts.length === 1 ? "" : "s") + " found",
                "success"
            );
        });
    }

    function setFolder(path) {
        currentFolder = path;
        folderPathEl.textContent = path;
        folderPathEl.title = path;
        localStorage.setItem(STORAGE_KEY, path);
        scanFolder(path);
    }

    function runScript(script) {
        setStatus("Running " + script.name + "...");
        var jsxCall = "runScript(" + JSON.stringify(script.path) + ")";
        csInterface.evalScript(jsxCall, function (result) {
            if (result && result.indexOf("ERROR") === 0) {
                setStatus(result, "error");
            } else {
                setStatus(script.name + " ran successfully.", "success");
            }
        });
    }

    chooseFolderBtn.addEventListener("click", function () {
        csInterface.evalScript("chooseFolder()", function (result) {
            if (result && result !== "null") {
                setFolder(result);
            }
        });
    });

    refreshBtn.addEventListener("click", function () {
        if (currentFolder) {
            scanFolder(currentFolder);
        }
    });

    searchEl.addEventListener("input", applyFilter);

    // Init: use saved folder, else fall back to Desktop.
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        setFolder(saved);
    } else {
        csInterface.evalScript("getDefaultFolder()", function (result) {
            setFolder(result);
        });
    }
})();
