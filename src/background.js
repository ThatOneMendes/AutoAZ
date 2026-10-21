const DEFAULT_POPUP_STATE = {
    materias: {},
    respostas: {},
    logs: [],
};

const ACTION_ICONS = {
    [true]: {
        [16]: "../icons/icon16_1.png",
        [32]: "../icons/icon32_1.png",
        [64]: "../icons/icon64_1.png",
    },
    [false]: {
        [16]: "../icons/icon16_0.png",
        [32]: "../icons/icon32_0.png",
        [64]: "../icons/icon64_0.png",
    },
};

/** @type {typeof browser} */
const ext = globalThis.browser ?? globalThis.chrome;

/**
 * @typedef {Object} Log
 * @property {string} level
 * @property {string} content
 */

/**
 * @typedef {Object} PopupState
 * @property {string} materias
 * @property {string} respostas
 * @property {Array<Log>} logs
 */

/**
 * @callback PortConnectionHandler
 * @param {browser.runtime.Port} port.
 * @returns {Promise<void>}
 */

/**
 * @type {Object<number, PopupState>}
 */
let popupStates = {};
/** @type {Object<number, browser.runtime.Port>} */
let popupPorts = {};

/**
 * @param {string} key
 * @returns {Promise<PopupState>}
 **/
async function getPopupState(key) {
    let popup_state_stored =
        popupStates[key] ??
        (await ext.storage.session.get({ [key]: DEFAULT_POPUP_STATE }))[key];
    for (const [defaultKey, defaultValue] of Object.entries(
        DEFAULT_POPUP_STATE,
    )) {
        if (typeof popup_state_stored[defaultKey] === "undefined")
            popup_state_stored[defaultKey] = defaultValue;
    }

    return popup_state_stored;
}

/*
 * @param {string} key
 * @returns {Promise<void>}
 */
async function savePopupState(key, state) {
    await ext.storage.session.set({ [key]: state });
}

/** @type {Object<string, (port: browser.runtime.Port, message : Object<string, any>) -> Promise<void>>} */
const messageHandlers = {
    log: async function (port, message) {
        const tabID = port?.sender?.tab?.id ?? port.tabID ?? message.tabID;
        let popupState = await getPopupState(tabID);

        popupState.logs.push({
            content: message.content,
            level: message.level,
        });
        if (popupState.logs.length > 200) popupState.logs.shift();
        /** @type {browser.runtime.Port} */
        const popupPort = popupPorts[tabID];
        if (!popupPort) return;
        popupPort.postMessage({
            action: "popup_log",
            content: message.content,
            level: message.level,
        });
    },
    popup_update_state: async function (port, message) {
        const tabID = port?.sender?.tab?.id ?? port.tabID ?? message.tabID;
        if (!popupPorts[tabID])
            return console.warn("Mensagem sem tab.id.", port);

        let popupState = await getPopupState(tabID);

        popupState.materias = message.subjectList;
        popupState.respostas = message.answerList;
    },
    popup_init: async function (port, message) {
        const tabID = message.tabID;
        if (typeof tabID === "undefined")
            return console.error(
                "Não encontramos uma tabID na mensagem de inicialização de um popup!",
            );

        port.tabID = tabID;

        /** @type {PopupState} */
        let popup_state_stored = await getPopupState(tabID);

        popupStates[tabID] = popup_state_stored;

        port.postMessage({
            action: "restore_popup_state",
            state: popup_state_stored,
        });

        console.log(
            "Um popup foi inicializado, vamos restaurar o estado salvo.",
        );

        popupPorts[tabID] = port;
    },
    set_activity_state: async function (port, message) {
        const tabID = port?.sender?.tab?.id ?? port.tabID ?? message.tabID;
        if (typeof tabID === "undefined")
            return console.warn(
                "Não podemos trocar o ícone de uma aba que não existe...",
            );
        ext.action
            .setIcon({
                tabId: tabID,
                path: ACTION_ICONS[message.active === true],
            })
            .catch(console.error);
    },
};

function onPortMessage(port, message) {
    const messageFunction = messageHandlers[message.action];
    if (!messageFunction)
        return console.error("Mensagem inválida recebida: ", message.action);
    messageFunction(port, message);
}

/** @type{Object<string, PortConnectionHandler>} */
const port_handlers = {
    popup: async function (port) {
        port.onMessage.addListener(onPortMessage.bind(null, port));
        port.onDisconnect.addListener(async () => {
            if (typeof port.tabID === "undefined")
                return console.warn(
                    "Um popup que não tinha tabID desconectou.",
                );
            await savePopupState(port.tabID, popupStates[port.tabID]);
            delete popupPorts[port.tabID];
        });
    },
    index: async function (port) {
        port.onMessage.addListener(onPortMessage.bind(null, port));
        port.onDisconnect.addListener(() => {
            console.log(
                "Um port de um script de conteúdo desconectou. (50% chance de ser erro 50% chance de ser o usuário fechando a página...)",
            );
        });
    },
};

ext.runtime.onConnect.addListener((port) => {
    const onPortConnectFunction = port_handlers[port.name];
    if (!onPortConnectFunction)
        return console.error(
            "Port connectado, mas com nome desconhecido: ",
            port.name,
        );
    onPortConnectFunction(port);
});
