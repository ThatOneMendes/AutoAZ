const browser = globalThis.browser ?? globalThis.chrome;

// PAGE CHANGE HOOKS

function main() {
    if (window["__AUTOAZ_PAGE_HOOKS__"]) return;
    window["__AUTOAZ_PAGE_HOOKS__"] = true;

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    function urlChanged() {
        window.dispatchEvent(new CustomEvent("url_changed"));
    }

    history.pushState = function (...args) {
        const result = originalPushState.apply(this, args);
        urlChanged();
        return result;
    };

    history.replaceState = function (...args) {
        const result = originalReplaceState.apply(this, args);
        urlChanged();
        return result;
    };

    window.addEventListener("popstate", urlChanged);

    window.addEventListener("history_back", () => history.back());
}

main();
