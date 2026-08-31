const browser = globalThis.browser ?? globalThis.chrome;

const port = browser.runtime.connect({ name: "popup" });

/**@type {HTMLButtonElement} **/
const start = document.getElementById("vamos-comecar-a-trollagem");

/** @type {HTMLTextAreaElement} **/
const listaDeMaterias = document.getElementById("lista");

/** @type {HTMLTextAreaElement} **/
const listaDeRespostas = document.getElementById("respostas");

/** @type {HTMLDivElement} **/
const logConsole = document.getElementById("log-console");

start.addEventListener("click", async () => {
    console.log("clickclick");
    const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
    });
    if (!tab?.id) return;

    browser.tabs.sendMessage(tab.id, {
        action: "start",
        content: listaDeMaterias.value,
        answers: listaDeRespostas.value,
    });
});

function logMessage(message) {
    const timestamp = new Date().toLocaleTimeString();

    let level = "log-info";
    if (message.level === "WARN") level = "log-warn";
    if (message.level === "ERROR") level = "log-error";

    const logHTML = `<div><span class="log-time">[${timestamp}]</span> <span class="${level}">[${message.level}]</span> ${message.content}</div>`;

    logConsole.insertAdjacentHTML("beforeend", logHTML);
}

function logFlush(data) {
    for (let index = 0; index < data.logs.length; index++) {
        logMessage(data.logs[index]);
    }
    logConsole.scrollTop = logConsole.scrollHeight;
}

function uploadCurrentState() {
    port.postMessage({
        action: "popup_update_state",
        state: {
            subjectList: listaDeMaterias.value,
            answerList: listaDeRespostas.value,
        },
    });
}

const actionFunctions = {
    popup_log: function (data) {
        logMessage(data);
        logConsole.scrollTop = logConsole.scrollHeight;
    },
    restore_popup_state: function (data) {
        const state = data.state;
        logFlush(state);
        listaDeMaterias.value = state.subjectListContents;
        listaDeRespostas.value = state.answerListContents;
        listaDeRespostas.addEventListener("change", uploadCurrentState);
        listaDeMaterias.addEventListener("change", uploadCurrentState);
    },
};

port.onMessage.addListener((message) => {
    const action = actionFunctions[message.action];
    if (!action) return;
    action(message);
});

/*window.addEventListener("load", () => {
    browser.runtime.sendMessage({ action: "popup_open" });
});

window.addEventListener("unload", () => {
    browser.runtime.sendMessage({
        action: "popup_close",
        state: {
            subjectList: listaDeMaterias.value,
            answerList: listaDeRespostas.value,
        },
    });
});*/
