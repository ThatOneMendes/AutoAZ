/** @type {typeof browser} */
const ext = globalThis.browser ?? globalThis.chrome;

const port = ext.runtime.connect({ name: "popup" });
let tabID = null;

let estadoDePopupAtual = {
    materias: {},
    respostas: {},
};

/** @type {HTMLFormElement} */
const formComecar = document.getElementById("form-parametros");

/** @type {HTMLDivElement} **/
const logConsole = document.getElementById("log-console");

(() => {
    const exemploMateriasLink = document.getElementById(
        "mostrar-tabela-exemplo-materias",
    );
    const exemploMaterias = document.getElementById("exemplo-materias");

    const exemploRespostasLink = document.getElementById(
        "mostrar-tabela-exemplo-respostas",
    );
    const exemploRespostas = document.getElementById("exemplo-respostas");

    function toggle(exemplo, evento) {
        evento.preventDefault();
        if (exemplo.style.display === "none") {
            exemplo.style.display = "block";
        } else exemplo.style.display = "none";
    }

    exemploMateriasLink.addEventListener(
        "click",
        toggle.bind(null, exemploMaterias),
    );
    exemploRespostasLink.addEventListener(
        "click",
        toggle.bind(null, exemploRespostas),
    );

    const linkAtividades = document.getElementById("atividades-link");
    linkAtividades.addEventListener("click", async (event) => {
        event.preventDefault();

        if (tabID === null)
            return console.warn(
                "tabID ainda é nulo, logo não posso levar o usuário para a página de atividades.",
            );

        await ext.tabs.update(tabID, { url: linkAtividades.href });
    });
})();

function logMessage(message) {
    const timestamp = new Date().toLocaleTimeString();

    let level = "log-info";
    if (message.level === "WARN") level = "log-warn";
    if (message.level === "ERROR") level = "log-error";

    const logHTML = `<div><span class="log-time">[${timestamp}]</span> <span class="${level}">[${message.level}]</span> ${message.content}</div>`;

    logConsole.insertAdjacentHTML("beforeend", logHTML);
}

const oldConsoleLog = console.log;
const oldConsoleWarn = console.warn;
const oldConsoleError = console.error;

function logFlush(data) {
    for (let index = 0; index < data.logs.length; index++) {
        logMessage(data.logs[index]);
    }
    logConsole.scrollTop = logConsole.scrollHeight;
}

function uploadCurrentState() {
    port.postMessage({
        action: "popup_update_state",
        subjectList: listaDeMaterias.value,
        answerList: listaDeRespostas.value,
        tabID,
    });
}

function formInputAlterado() {
    const filhosRespostas = listaDeRespostas.children;
    const filhosMaterias = listaDeMaterias.children;

    let estadoMaterias = {};
    let estadoRespostas = {};

    for (let i = 0; i < filhosMaterias.length; i++) {
        const materiaElement = filhosMaterias[i];
        if (materiaElement.classList.contains("row-valido") === false) continue;

        const [nome, capitulos] = extrairInfoRowMateria(materiaElement);

        estadoMaterias[nome] = capitulos;
    }

    for (let i = 0; i < filhosRespostas.length; i++) {
        const respostaElement = filhosRespostas[i];
        if (respostaElement.classList.contains("row-valido") === false)
            continue;

        const [nome, capitulo, respostas] =
            extrairInfoRowResposta(respostaElement);
        if (typeof estadoRespostas[nome] === "undefined") {
            estadoRespostas[nome] = {
                [capitulo]: respostas,
            };
        } else {
            estadoRespostas[nome][capitulo] = respostas;
        }
    }

    port.postMessage({
        action: "popup_update_state",
        subjectList: estadoMaterias,
        answerList: estadoRespostas,
        tabID,
    });
}

const actionFunctions = {
    popup_log: function (data) {
        logMessage(data);
        logConsole.scrollTop = logConsole.scrollHeight;
    },
    restore_popup_state: function (data) {
        logFlush(data.state);
        listaDeMateriasParaTabelas(data.state.materias);
        listaDeRespostasParaTabelas(data.state.respostas);
        //estadoDePopupAtual.materias = data.state.materias;
        //estadoDePopupAtual.respostas = data.state.respostas;
        formComecar.addEventListener("input", formInputAlterado);
    },
};

window.addEventListener("atualize_estado", formInputAlterado);

const asurELES = ["/atividades", "/atividades/"];

async function startButtonClicked(event) {
    event.preventDefault();

    const [tab] = await browser.tabs.query({
        currentWindow: true,
        active: true,
    });
    if (!tab?.url)
        return console.error(
            "Não achamos a aba que está atrelada a esse popup! (???)",
        );
    {
        const url = new URL(tab?.url);
        if (asurELES.includes(url.pathname) === false) {
            console.error(
                `O AutoAZ só pode iniciar na aba de atividades! (Você esta em: "${url.href}"\nVocê deve ir para: "https://app.redeaz.com.br/atividades")`,
            );
            return;
        }
    }

    const filhosMaterias = listaDeMaterias.children;
    const filhosRespostas = listaDeRespostas.children;

    if (filhosMaterias.length - 1 <= 0) {
        console.error("A lista de matérias está vazia!");
        return;
    }

    let materias = {};
    let respostas = {};

    for (let i = 0; i < filhosMaterias.length; i++) {
        const materiaElement = filhosMaterias[i];
        if (materiaElement.classList.contains("row-valido") === false) continue;

        const [[sucesso, mensagem], materia, capitulos] =
            serializarRowListaDeMaterias(materiaElement);
        if (sucesso === false) {
            console.error(mensagem);
            return;
        }
        materias[materia] = capitulos;
    }

    for (let i = 0; i < filhosRespostas.length; i++) {
        const respostaElement = filhosRespostas[i];
        if (respostaElement.classList.contains("row-valido") === false)
            continue;

        const [[sucesso, mensagem], materia, capitulo, respostasObjeto] =
            serializarRowListaDeRespostas(respostaElement);
        if (sucesso === false) {
            console.error(mensagem);
            return;
        }
        if (typeof materias[materia] === "undefined") {
            console.error(
                'Nos deram uma lista de respostas para a matéria "%s" que não existe na lista de matérias a serem respondidas.',
                materia,
            );
        }
        if (materias[materia].includes(capitulo) === false) {
            console.error(
                "Capítulo %d includo na lista de resposta não está presente na lista de capítulos a serem respondidos da matéria %s.",
                capitulo,
                materia,
            );
            return;
        }
        if (typeof respostas[materia] === "undefined") {
            respostas[materia] = {
                [capitulo]: respostasObjeto,
            };
        } else {
            respostas[materia][capitulo] = respostasObjeto;
        }
    }

    console.log("Vamos começar o AutoAZ. Respondendo seguintes matérias:");
    for (const [materia, capitulos] of Object.entries(materias)) {
        console.log("%s: %s", materia, capitulos.toString());
    }

    if (Object.keys(respostas).length > 0) {
        console.log("Com as seguintes respostas:");
        for (const [materia, capituloObjeto] of Object.entries(respostas)) {
            console.log("%s:", materia);
            for (const [capitulo, respostas] of Object.entries(
                capituloObjeto,
            )) {
                console.log("Capítulo %d: %s", capitulo, respostas);
            }
        }
    } else console.log("O usuário não quiz inserir uma lista de respostas.");

    ext.tabs.sendMessage(tab.id, {
        action: "start",
        materias: materias,
        respostas: respostas,
    });
}

async function init() {
    const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
    });
    if (!tab) throw new Error("Não achamos a aba atrelada a esse popup. (???)");
    if (typeof tab.id === "undefined") {
        console.error(tab);
        throw new Error("Não possui .id!");
    }
    tabID = tab.id;

    port.onMessage.addListener((message) => {
        const action = actionFunctions[message.action];
        if (!action) return;
        action(message);
    });

    port.postMessage({
        action: "popup_init",
        tabID,
    });

    console.log = function (...args) {
        oldConsoleLog(...args);
        port.postMessage({
            action: "log",
            level: "LOG",
            content: format(...args),
            tabID,
        });
    };

    console.warn = function (...args) {
        oldConsoleWarn(...args);
        port.postMessage({
            action: "log",
            level: "WARN",
            content: format(...args),
            tabID,
        });
    };

    console.error = function (...args) {
        oldConsoleError(...args);
        port.postMessage({
            action: "log",
            level: "ERROR",
            content: format(...args),
            tabID,
        });
    };

    formComecar.addEventListener("submit", startButtonClicked);
}

init();
