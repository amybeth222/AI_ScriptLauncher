(function () {
    var csInterface = new CSInterface();
    var STORAGE_KEY = "scriptLauncher.folder";
    var SETTINGS_KEY = "scriptLauncher.settings";
    var ORDER_KEY = "scriptLauncher.order.";

    var folderPathEl = document.getElementById("folder-path");
    var scriptListEl = document.getElementById("script-list");
    var searchEl = document.getElementById("search");
    var statusEl = document.getElementById("status");
    var chooseFolderBtn = document.getElementById("choose-folder-btn");
    var refreshBtn = document.getElementById("refresh-btn");
    var settingsBtn = document.getElementById("settings-btn");
    var settingsPanelEl = document.getElementById("settings-panel");
    var textSizeEl = document.getElementById("text-size");
    var textColorEl = document.getElementById("text-color");
    var buttonColorEl = document.getElementById("button-color");
    var rowSpacingEl = document.getElementById("row-spacing");

    var currentFolders = [];
    var allScripts = [];
    var settings = {
        textSize: 11,
        textColor: "#e0e0e0",
        buttonColor: "#caff00",
        rowSpacing: 6
    };

    function setStatus(msg, type) {
        statusEl.textContent = msg;
        statusEl.parentElement.className = type || "";
    }

    function getOrderStorageKey() {
        return ORDER_KEY + currentFolders.slice().sort().join("|");
    }

    function readOrderState() {
        try {
            var raw = localStorage.getItem(getOrderStorageKey());
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function writeOrderState(order) {
        localStorage.setItem(getOrderStorageKey(), JSON.stringify(order));
    }

    function reorderKeyList(list, sourceKey, targetKey) {
        var sourceIndex = list.indexOf(sourceKey);
        var targetIndex = list.indexOf(targetKey);
        if (sourceIndex === -1 || targetIndex === -1 || sourceKey === targetKey) {
            return list;
        }
        var moved = list.splice(sourceIndex, 1)[0];
        list.splice(targetIndex, 0, moved);
        return list;
    }

    function scriptKey(script) {
        return "script:" + script.path;
    }

    function folderKey(folderName) {
        return "folder:" + folderName;
    }

    function captureCurrentOrderFromDom() {
        var nextOrder = [];
        Array.prototype.forEach.call(scriptListEl.children, function (child) {
            if (child && child.dataset && child.dataset.orderId) {
                nextOrder.push(child.dataset.orderId);
            }
        });
        if (nextOrder.length) {
            writeOrderState(nextOrder);
        }
    }

    var DRAG_THRESHOLD = 6;
    var GRIP_SVG = '<svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true">' +
        '<circle cx="2.5" cy="2.5" r="1.5"/><circle cx="7.5" cy="2.5" r="1.5"/>' +
        '<circle cx="2.5" cy="8" r="1.5"/><circle cx="7.5" cy="8" r="1.5"/>' +
        '<circle cx="2.5" cy="13.5" r="1.5"/><circle cx="7.5" cy="13.5" r="1.5"/>' +
        '</svg>';

    function createDragHandle() {
        var handle = document.createElement("span");
        handle.className = "drag-handle";
        handle.title = "Drag to reorder";
        handle.innerHTML = GRIP_SVG;
        return handle;
    }

    function findInsertionTarget(container, y, excludeEl) {
        var children = Array.prototype.filter.call(container.children, function (child) {
            return child !== excludeEl && child.dataset && child.dataset.orderId;
        });
        for (var i = 0; i < children.length; i++) {
            var rect = children[i].getBoundingClientRect();
            if (y < rect.top + rect.height / 2) {
                return children[i];
            }
        }
        return null;
    }

    function wasJustDragged(element) {
        if (element.dataset.justDragged === "1") {
            element.dataset.justDragged = "";
            return true;
        }
        return false;
    }

    // Native HTML5 drag-and-drop (dragstart/dragover/drop) does not fire
    // reliably inside CEP panels (Illustrator renders extensions via CEF in
    // off-screen mode), so reordering is implemented with plain mouse events.
    // `handleEl` is where the drag starts (the grip icon); `element` is the
    // row/section that actually gets moved and reordered.
    function attachDragHandlers(handleEl, element) {
        var pointerState = null;

        function onMouseMove(event) {
            if (!pointerState) {
                return;
            }
            var dx = event.clientX - pointerState.startX;
            var dy = event.clientY - pointerState.startY;
            if (!pointerState.dragging) {
                if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
                    return;
                }
                pointerState.dragging = true;
                element.classList.add("is-dragging");
            }

            var container = element.parentElement;
            if (!container) {
                return;
            }
            var target = findInsertionTarget(container, event.clientY, element);
            if (target) {
                if (target.previousSibling !== element) {
                    container.insertBefore(element, target);
                    captureCurrentOrderFromDom();
                }
            } else if (container.lastChild !== element) {
                container.appendChild(element);
                captureCurrentOrderFromDom();
            }
        }

        function onMouseUp() {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            if (pointerState && pointerState.dragging) {
                element.classList.remove("is-dragging");
                captureCurrentOrderFromDom();
                element.dataset.justDragged = "1";
                setTimeout(function () {
                    element.dataset.justDragged = "";
                }, 300);
            }
            pointerState = null;
        }

        handleEl.addEventListener("mousedown", function (event) {
            if (event.button !== 0) {
                return;
            }
            event.preventDefault();
            pointerState = {
                startX: event.clientX,
                startY: event.clientY,
                dragging: false
            };
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }

    function createScriptItem(script, isDraggable) {
        var item = document.createElement("div");
        item.className = "script-item";
        if (isDraggable) {
            item.className += " draggable-item";
            item.dataset.orderId = scriptKey(script);
            var handle = createDragHandle();
            item.appendChild(handle);
            attachDragHandlers(handle, item);
        }

        var name = document.createElement("span");
        name.className = "name";
        name.textContent = script.name;
        name.title = script.path;

        var btn = document.createElement("button");
        btn.className = "run-btn";
        btn.type = "button";
        btn.textContent = "RUN";
        btn.addEventListener("click", function (e) {
            e.stopPropagation();
            runScript(script);
        });

        var scriptInfo = document.createElement("div");
        scriptInfo.className = "script-info";
        scriptInfo.appendChild(name);
        item.appendChild(scriptInfo);
        item.appendChild(btn);
        item.addEventListener("click", function () {
            if (wasJustDragged(item)) {
                return;
            }
            runScript(script);
        });

        return item;
    }

    function createFolderSection(folderName, folderScripts) {
        var section = document.createElement("section");
        section.className = "folder-section draggable-item";
        section.dataset.orderId = folderKey(folderName);

        var header = document.createElement("div");
        header.className = "folder-header";

        var handle = createDragHandle();
        attachDragHandlers(handle, section);

        var toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "folder-toggle";
        toggle.textContent = folderName + " (" + folderScripts.length + ")";
        toggle.setAttribute("aria-expanded", "true");

        header.appendChild(handle);
        header.appendChild(toggle);

        var content = document.createElement("div");
        content.className = "folder-content";

        var orderedScripts = folderScripts.slice();
        var savedOrder = readOrderState();
        var scriptKeys = folderScripts.map(function (script) {
            return scriptKey(script);
        });
        var savedFolderOrder = savedOrder.filter(function (key) {
            return scriptKeys.indexOf(key) !== -1;
        });
        if (savedFolderOrder.length) {
            orderedScripts = savedFolderOrder.map(function (key) {
                return folderScripts.filter(function (script) {
                    return scriptKey(script) === key;
                })[0];
            }).filter(Boolean);
        }
        orderedScripts.forEach(function (script) {
            content.appendChild(createScriptItem(script, false));
        });

        toggle.addEventListener("click", function () {
            if (wasJustDragged(section)) {
                return;
            }
            var isCollapsed = content.hidden;
            content.hidden = !isCollapsed;
            toggle.setAttribute("aria-expanded", isCollapsed ? "true" : "false");
        });

        section.appendChild(header);
        section.appendChild(content);
        return section;
    }

    function render(scripts) {
        scriptListEl.innerHTML = "";
        if (!scripts.length) {
            var empty = document.createElement("div");
            empty.id = "empty-state";
            empty.textContent = currentFolders.length ? "No .jsx scripts found in this folder." : "Choose a folder to get started.";
            scriptListEl.appendChild(empty);
            return;
        }

        var rootScripts = [];
        var folderGroups = {};
        scripts.forEach(function (script) {
            if (script.folder) {
                if (!folderGroups[script.folder]) {
                    folderGroups[script.folder] = [];
                }
                folderGroups[script.folder].push(script);
            } else {
                rootScripts.push(script);
            }
        });

        var entries = [];
        rootScripts.forEach(function (script) {
            entries.push({ key: scriptKey(script), type: "script", value: script });
        });
        Object.keys(folderGroups).sort().forEach(function (folderName) {
            entries.push({ key: folderKey(folderName), type: "folder", value: folderName });
        });

        var savedOrder = readOrderState();
        entries.sort(function (a, b) {
            var aIndex = savedOrder.indexOf(a.key);
            var bIndex = savedOrder.indexOf(b.key);
            if (aIndex === -1 && bIndex === -1) {
                return 0;
            }
            if (aIndex === -1) {
                return 1;
            }
            if (bIndex === -1) {
                return -1;
            }
            return aIndex - bIndex;
        });

        var finalOrder = entries.map(function (entry) {
            return entry.key;
        });
        writeOrderState(finalOrder);

        entries.forEach(function (entry) {
            if (entry.type === "script") {
                scriptListEl.appendChild(createScriptItem(entry.value, true));
            } else {
                scriptListEl.appendChild(createFolderSection(entry.value, folderGroups[entry.value]));
            }
        });
    }

    function applyFilter() {
        var q = searchEl.value.trim().toLowerCase();
        if (!q) {
            render(allScripts);
            return;
        }
        render(allScripts.filter(function (script) {
            return script.name.toLowerCase().indexOf(q) !== -1;
        }));
    }

    function scanFolder(path) {
        setStatus("Scanning...");
        var jsxCall = "listScripts(" + JSON.stringify(path) + ")";
        csInterface.evalScript(jsxCall, function (result) {
            if (!result || result === "EvalScript error." || result === "undefined") {
                setStatus("Host script didn't respond (" + result + "). Try reopening the panel.", "error");
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
            setStatus(allScripts.length + " script" + (allScripts.length === 1 ? "" : "s") + " found", "success");
        });
    }

    function setFolders(paths) {
        currentFolders = paths;
        folderPathEl.textContent = paths.length === 1 ? paths[0] : paths.length + " folders selected";
        folderPathEl.title = paths.join("\n");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(paths));
        scanFolder(paths);
    }

    function applySettings() {
        document.documentElement.style.setProperty("--script-font-size", settings.textSize + "px");
        document.documentElement.style.setProperty("--script-text-color", settings.textColor);
        document.documentElement.style.setProperty("--button-color", settings.buttonColor);
        document.documentElement.style.setProperty("--row-spacing", settings.rowSpacing + "px");
        textSizeEl.value = settings.textSize;
        textColorEl.value = settings.textColor;
        buttonColorEl.value = settings.buttonColor;
        rowSpacingEl.value = settings.rowSpacing;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    function updateSetting() {
        settings.textSize = Number(textSizeEl.value) || 11;
        settings.textColor = textColorEl.value;
        settings.buttonColor = buttonColorEl.value;
        settings.rowSpacing = Number(rowSpacingEl.value) || 6;
        applySettings();
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
            if (!result || result === "null") {
                return;
            }
            setFolders([result]);
        });
    });

    refreshBtn.addEventListener("click", function () {
        if (currentFolders.length) {
            scanFolder(currentFolders);
        }
    });

    searchEl.addEventListener("input", applyFilter);
    settingsBtn.addEventListener("click", function () {
        var isHidden = settingsPanelEl.hidden;
        settingsPanelEl.hidden = !isHidden;
        settingsBtn.setAttribute("aria-expanded", isHidden ? "true" : "false");
    });
    textSizeEl.addEventListener("input", updateSetting);
    textColorEl.addEventListener("input", updateSetting);
    buttonColorEl.addEventListener("input", updateSetting);
    rowSpacingEl.addEventListener("input", updateSetting);

    var saved = localStorage.getItem(STORAGE_KEY);
    var savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
        try {
            var parsedSettings = JSON.parse(savedSettings);
            for (var key in settings) {
                if (parsedSettings.hasOwnProperty(key)) {
                    settings[key] = parsedSettings[key];
                }
            }
        } catch (e) {
            localStorage.removeItem(SETTINGS_KEY);
        }
    }
    applySettings();

    if (saved) {
        try {
            var parsedFolders = JSON.parse(saved);
            setFolders(Array.isArray(parsedFolders) ? parsedFolders : [parsedFolders]);
        } catch (e) {
            setFolders([saved]);
        }
    } else {
        csInterface.evalScript("getDefaultFolder()", function (result) {
            if (result && result !== "null") {
                setFolders([result]);
            }
        });
    }
})();
