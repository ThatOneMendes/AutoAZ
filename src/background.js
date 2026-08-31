const browser = globalThis.browser ?? globalThis.chrome;

let logStack = [];

let listContents = "";
let answerContents = "";
let currentPort = null;

const actionFunctions = {
    log: function (message) {
        logStack.push({ level: message.level, content: message.content });
        if (logStack.length > 200) logStack.shift();
        if (!currentPort) return;
        currentPort.postMessage({
            action: "popup_log",
            level: message.level,
            content: message.content,
        });
    },
    popup_update_state: function (message) {
        const state = message.state;
        listContents = state.subjectList;
        answerContents = state.answerList;
    },
};

function onMessage(message) {
    const actionFunction = actionFunctions[message.action];
    if (!actionFunction) return;
    actionFunction(message);
}

browser.runtime.onMessage.addListener(onMessage);

browser.runtime.onConnect.addListener((port) => {
    if (port.name !== "popup") return;

    currentPort = port;
    port.postMessage({
        action: "restore_popup_state",
        state: {
            logs: logStack,
            subjectListContents: listContents,
            answerListContents: answerContents,
        },
    });
    console.log("Popup aberto, vamos restaurar o estado anterior!");

    port.onMessage.addListener(onMessage);
    port.onDisconnect.addListener(() => {
        currentPort = null;
        console.log("Popup fechou.");
    });
});
