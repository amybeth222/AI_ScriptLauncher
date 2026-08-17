/*
 * Minimal CSInterface implementation.
 * Covers only what Script Launcher needs: evalScript + hostEnvironment.
 * (Swap for Adobe's official CSInterface.js if you want the full API surface.)
 */
function CSInterface() {}

CSInterface.prototype.evalScript = function (script, callback) {
    if (!callback) callback = function () {};
    if (window.__adobe_cep__) {
        window.__adobe_cep__.evalScript(script, callback);
    } else {
        console.error("CEP bridge not available - is this running inside Illustrator?");
    }
};

CSInterface.prototype.getHostEnvironment = function () {
    if (window.__adobe_cep__) {
        return JSON.parse(window.__adobe_cep__.getHostEnvironment());
    }
    return null;
};

CSInterface.prototype.closeExtension = function () {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.closeExtension();
    }
};
