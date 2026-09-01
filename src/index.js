const browser = globalThis.browser ?? globalThis.chrome;

const letters = ["A", "B", "C", "D", "E"];

const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));
const lerp = (start, goal, alpha) => start + (goal - start) * alpha;
const semiBelievableDelay = () => lerp(527, 1354, Math.random());
const getRandomElementOfArray = (array) => {
    const index = Math.floor(Math.random() * array.length);
    if (index >= array.length) index = array.length - 1;
    return array[index];
};

/**
 * @param {Array<string>} array
 * @returns {Array<string>}
 **/
const trimArray = (array) =>
    array.filter((str) => typeof str == "string" && str.trim() !== "");

history.back = () => window.dispatchEvent(new CustomEvent("history_back"));

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function format(...args) {
    const f = args[0];
    let i = 1;

    if (typeof f !== "string") {
        if (args.length === 0) return "";
        return args
            .map((arg) =>
                typeof arg === "object" ? JSON.stringify(arg) : String(arg),
            )
            .join(" ");
    }

    if (args.length === 1) return f;

    let str = f.replace(/%[sdifjoO%]/g, (match) => {
        if (match === "%%") return "%";
        if (i >= args.length) return match;

        const val = args[i++];
        switch (match) {
            case "%s":
                return String(val);
            case "%d":
            case "%i":
                return String(parseInt(val, 10));
            case "%f":
                return String(parseFloat(val));
            case "%j":
                try {
                    return JSON.stringify(val);
                } catch (_) {
                    return "[Circular]";
                }
            case "%o":
            case "%O":
                try {
                    return JSON.stringify(val, null, 2);
                } catch (_) {
                    return String(val);
                }
            default:
                return match;
        }
    });

    while (i < args.length) {
        const val = args[i++];
        if (val === null || typeof val !== "object") {
            str += " " + val;
        } else {
            try {
                str += " " + JSON.stringify(val);
            } catch (_) {
                str += " " + String(val);
            }
        }
    }

    return str;
}

const oldConsoleLog = console.log;
const oldConsoleError = console.error;
const oldConsoleWarn = console.warn;

console.log = function (...data) {
    oldConsoleLog(...data);
    browser.runtime.sendMessage({
        action: "log",
        level: "LOG",
        content: format(...data),
    });
};

console.warn = function (...data) {
    oldConsoleWarn(...data);
    browser.runtime.sendMessage({
        action: "log",
        level: "WARN",
        content: format(...data),
    });
};

console.error = function (...data) {
    oldConsoleError(...data);
    browser.runtime.sendMessage({
        action: "log",
        level: "ERROR",
        content: format(...data),
    });
};

let inProgress = false;

const materiaFinder = (nome) =>
    [...document.querySelectorAll('[id^="subject_card_"]')].find((element) =>
        element
            .querySelector("p")
            ?.textContent.toLowerCase()
            .includes(nome.toLowerCase()),
    );

const fasiculoFinder = (capitulo) =>
    [...document.querySelectorAll('[id^="fascicle_card_"]')].find((element) =>
        [...element.querySelectorAll("p")].find((p) =>
            p.textContent.toLowerCase().includes(capitulo.toLowerCase()),
        ),
    );

const basicIdFinder = (id) => document.getElementById(id);

const activityFinder = (activityName) =>
    [...document.querySelectorAll('[id^="activity_application_"]')].find(
        (element) =>
            element.querySelector(":scope > p")?.textContent.toLowerCase() ===
            activityName.toLowerCase(),
    );

const firstParagraphFinder = (text) =>
    [...document.querySelectorAll("p")].find((element) =>
        element?.textContent.toLowerCase().includes(text.toLowerCase()),
    );

const checkExitFinder = (h2Text) =>
    [...document.querySelectorAll('a[role="button"]')].find((element) =>
        element.parentElement
            .querySelector(":scope > h2")
            ?.textContent.toLowerCase()
            .includes(h2Text),
    );

const confirmationModalFinder = (label) =>
    document.querySelector(`[aria-labelledby="${label}"] [role="document"]`);

const buttonIdFinder = (id) => document.querySelector(`button[id="${id}"]`);

const basicQuerySelectorFinder = (selectBy) => document.querySelector(selectBy);

const functionRunner = (functionToRun) => functionToRun();

/**
 * @param {string} nome
 * @returns {Promise<HTMLElement>}
 **/
function findElement(nome, attemptFind = materiaFinder, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const materiaExistente = attemptFind(nome);
        if (materiaExistente) return resolve(materiaExistente);

        let timeoutId;

        const observer = new MutationObserver(() => {
            const materia = attemptFind(nome);

            if (!materia) return;

            clearTimeout(timeoutId);
            observer.disconnect();
            resolve(materia);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        timeoutId = setTimeout(() => {
            observer.disconnect();
            reject(new Error("Timeout."));
        }, timeout);
    });
}

function onUrlChange() {
    const currentURL = window.location.href;
    console.log(currentURL);
}

let errors = {};

/**
 * @param {string} materia
 * @param {number} capitulo
 * @param {Array<string>|undefined} respostas
 * @returns {Promise<boolean>}
 */
async function solveFascicle(materia, capitulo, respostas) {
    async function cleanupAndgoBack(error) {
        if (error !== undefined) {
            if (!errors[materia]) {
                errors[materia] = {};
            }

            errors[materia][capitulo] = error;
        }
        console.log("Limpando e saíndo");
        history.back();

        /*const header = await findElement(materia, firstParagraphFinder).catch(
            () =>
                console.error(
                    "Não conseguimos encontrar o cabeçalho desse fasículo! Um erro grave o suficiente para termos que parar o AutoAZ. Sinto muito.",
                ),
        );
        if (!header) return false;

        const exitButton =
            header.parentElement.parentElement.querySelector("button");
        if (!exitButton) {
            console.error(
                "Não conseguimos encontrar o botão de volta desse fascículo! Um erro grave o suficiente para termos que parar o AutoAZ. Mil desculpas...",
            );
            return false;
        }

        exitButton.click();*/

        await delay(semiBelievableDelay());
        return true;
    }

    async function leaveAZCheckInterface(error) {
        if (error !== undefined) {
            if (!errors[materia]) {
                errors[materia] = {};
            }

            errors[materia][capitulo] = error;
        }
        console.log("Saindo da interface da AZ Check.");
        history.back();

        confirmExit: {
            const confirmationModal = await findElement(
                "confirmation-dialog",
                confirmationModalFinder,
                250,
            ).catch(() =>
                console.warn(
                    "Não encontramos o modal de confirmar pra sair. Não é um problema tão grande a não ser que o modal esteja lá so que nós não encontramos de alguma forma...",
                ),
            );
            if (!confirmationModal) break confirmExit;

            const confirmButton = confirmationModal.querySelector(
                'button[id="modal_confirm"]',
            );
            if (!confirmButton) {
                console.error(
                    "Nós encontramos o modal de confirmação mas não encontramos o botão de confirmar... Esse é um GRANDE problema! Sinto muito, vamos ter que para aqui.",
                );
                return false;
            }

            await delay(semiBelievableDelay());

            confirmButton.click();
        }

        /*const exitButton = await findElement("AZ Check", checkExitFinder).catch(
            () =>
                console.error(
                    "Não conseguimos encontrar o botão para sair da interface do AZ Check. Não podemos continuar. Me desculpe.",
                ),
        );
        if (!exitButton) return false;

        exitButton.click();

        await delay(semiBelievableDelay());

        confirmOurExit: {
            const confirmationModal = await findElement(
                "confirmation-dialog",
                confirmationModalFinder,
                3000,
            ).catch(() =>
                console.warn(
                    "Não encontramos o modal de confirmar pra sair. Não é um problema tão grande a não ser que o modal esteja lá so que nós não encontramos de alguma forma...",
                ),
            );
            if (!confirmationModal) break confirmOurExit;

            const confirmButton = confirmationModal.querySelector(
                'button[id="modal_confirm"]',
            );
            if (!confirmButton) {
                console.error(
                    "Nós encontramos o modal de confirmação mas não encontramos o botão de confirmar... Esse é um GRANDE problema! Sinto muito, vamos ter que para aqui.",
                );
                return false;
            }

            confirmButton.click();
        }*/

        await delay(semiBelievableDelay());

        return await cleanupAndgoBack();
    }

    const fasiculo = await findElement(
        `capítulo ${capitulo.toString()}`,
        fasiculoFinder,
    ).catch(() =>
        console.warn(
            `Não conseguimos encontrar o fascículo de capítulo ${capitulo.toString()}! Têm certeza de que você digitou os capítlos corretamente?`,
        ),
    );
    if (!fasiculo) {
        if (!errors[materia]) {
            errors[materia] = {};
        }

        errors[materia][capitulo] =
            "Não conseguimos encontrar o fasciculo desse capítulo.";
        return true;
    }

    if (fasiculo.style.cursor === "unset") {
        console.error("Esse fasciculo não está disponível ainda! Próximo!");

        if (!errors[materia]) {
            errors[materia] = {};
        }

        errors[materia][capitulo] =
            "O fasciculo desse capítulo não está disponível ainda.";
        return true;
    }

    await delay(semiBelievableDelay());

    fasiculo.click();

    const header = await findElement("application-header", basicIdFinder).catch(
        () =>
            console.warn(
                'Não conseguimos encontrar o botão "Atividades AZ"! OOPS! Talvez você não consiga automatizar esse capítulo...',
            ),
    );
    if (!header)
        return await cleanupAndgoBack(
            'O botão "Atividades AZ" não foi encontrado.',
        );

    await delay(semiBelievableDelay());

    header.click();

    const azCheckButton = await findElement("AZ Check", activityFinder).catch(
        () =>
            console.warn(
                'Não conseguimos encontrar o botão "AZ Check"! Talvez você não consiga automatizar esse capítulo...',
            ),
    );
    if (!azCheckButton)
        return await cleanupAndgoBack('O botão "AZ Check" não foi encontrado');

    const azCheckInner = azCheckButton.innerHTML.toLowerCase();

    if (azCheckInner.includes("finalizado")) {
        console.log("Essa AZ Check já foi finalizada! Vamos pra próxima!");
        return await cleanupAndgoBack();
    }

    await delay(semiBelievableDelay());

    azCheckButton.click();

    startCheck: {
        if (
            azCheckInner.includes("iniciado") &&
            !azCheckInner.includes("não iniciado")
        ) {
            console.log(
                "Essa AZ Check já foi iniciada, logo não preciso apertar o botão de começar.",
            );
            break startCheck;
        }

        const startButton = await findElement(
            "startApplicationButton",
            basicIdFinder,
            15000,
        ).catch(() =>
            console.warn('Não conseguimos encontrar o botão de "Começar"!'),
        );
        if (!startButton)
            await leaveAZCheckInterface(
                'A AZ Check não foi iniciada e nós não encontramos o botão de "Começar".',
            );

        await delay(semiBelievableDelay());

        startButton.click();
    }

    const tabsQuestions = await findElement(
        "tabs-questions",
        basicIdFinder,
    ).catch(() => console.warn("Não encontramos a aba de questões..."));
    if (!tabsQuestions)
        return await leaveAZCheckInterface(
            "Não encontramos a aba de questões.",
        );

    let question = await findElement(
        () => tabsQuestions.parentElement.nextElementSibling,
        functionRunner,
    ).catch(() =>
        console.warn(
            "Não conseguimos encontrar a questão inicial! Vamos tentar outro capítulo...",
        ),
    );
    if (!question)
        return await leaveAZCheckInterface(
            "Não encontramos a questão inicial.",
        );

    {
        const responseCardButton = await findElement(
            "tab-responseCard",
            buttonIdFinder,
        ).catch(() =>
            console.warn("Não encontramos o botão do Cartão de Respostas!"),
        );
        if (!responseCardButton)
            return await leaveAZCheckInterface(
                "Não encontramos o botão do Cartão de Respostas.",
            );

        await delay(semiBelievableDelay());

        responseCardButton.click();
    }

    question = await findElement(
        () => tabsQuestions.parentElement.nextElementSibling,
        functionRunner,
    ).catch(() =>
        console.warn(
            "Não conseguimos encontrar a questão inicial! Vamos tentar outro capítulo...",
        ),
    );
    if (!question)
        return await leaveAZCheckInterface(
            "Não encontramos a questão 1 do cartão de respostas.",
        );

    let pressedThatAnswerButton = false;

    questionAnswerLoop: while (question !== null) {
        const answerButton = question.querySelector(
            ':scope > button[id="application_answer_finish"]',
        );
        if (answerButton !== null) {
            pressedThatAnswerButton = true;
            console.log("Chegamos no botão de entregar o AZ Check!");
            if (answerButton.disabled === true) {
                const notDisabledAnymore = await findElement(
                    () => answerButton.disabled !== true,
                    functionRunner,
                ).catch(() =>
                    console.warn(
                        "Mas o botão está desativado... Algum erro na hora de responder uma questão? Emfim, vamos voltar ao início e tentar denovo.",
                    ),
                );
                if (!notDisabledAnymore) {
                    question = tabsQuestions.parentElement.nextElementSibling;
                    continue;
                }
            }

            await delay(semiBelievableDelay());

            answerButton.click();

            console.log(
                "Agora nós esperamos a notificação de tarefa concluída",
            );
            const closeButton = await findElement(
                'button[aria-labelledby="close"],[aria-label="close"]',
                basicQuerySelectorFinder,
                30000,
            ).catch(() =>
                console.error(
                    "Não conseguimos encontrar a notificação de tarefa concluída! Parando o AutoAZ...",
                ),
            );
            if (!closeButton) return false;

            await delay(semiBelievableDelay());

            closeButton.click();

            await delay(semiBelievableDelay());
            await leaveAZCheckInterface();
            break;
        }

        let questionNumber;

        const questionHeader = question.querySelector("h6");
        if (!questionHeader) {
            console.warn(
                "Não encontramos o cabeçalho da questão! Será impossível saber qual resposta usar nessa questão! Vamos responder aleatóriamente.",
            );
        } else {
            questionNumber =
                Number(questionHeader.textContent.split(" ")[1]) - 1;
            if (isNaN(questionNumber)) {
                questionNumber = undefined;
                console.warn(
                    "Texto inválido no cabeçalho da questão! Vamos ter que responder aleatóriamente!",
                );
                console.warn("Texto: %s", questionHeader.textContent);
            }
        }

        let answerDots = [
            ...question.querySelectorAll(
                'label[id^="application_answer_button_"]',
            ),
        ];
        if (answerDots.length <= 0) {
            console.error(
                "Uma questão não possui nenhum botão de resposta! Algo deve ter dado MUITO errado pra isso acontecer. Vamos tentar fazer outro capítulo.",
            );
            console.error("HTMLElement da questão:", question);
            return await leaveAZCheckInterface(
                "Questão não tinha nenhuma opção de resposta.",
            );
        }

        let chosenAnswer;

        getPredefinedAnswer: {
            if (respostas && questionNumber !== undefined) {
                let resposta = respostas[questionNumber];
                if (!resposta) {
                    console.warn(
                        "Não nos deram uma resposta para a questão de numero %d! Vamos responder essa questão aleatóriamente.",
                        questionNumber + 1,
                    );
                    break getPredefinedAnswer;
                }
                resposta = resposta.toUpperCase();
                const respostaIndex = letters.indexOf(resposta);
                if (respostaIndex < 0) {
                    console.warn(
                        "A resposta da questão %d é inválida! Vamos responder aleatóriamente! (Não existe letra %s)",
                        questionNumber + 1,
                        resposta,
                    );
                    break getPredefinedAnswer;
                }

                const answerDot = answerDots[respostaIndex];

                if (!answerDot) {
                    console.warn(
                        "Não existe a letra %s na questão numero %d! Vamos responder aleatóriamente.",
                        resposta,
                        questionNumber + 1,
                    );
                    break getPredefinedAnswer;
                }

                answerDots = [answerDot];
            }
        }

        if (answerDots.length > 1) shuffle(answerDots);

        for (const answerDot of answerDots) {
            const answerStyle = getComputedStyle(answerDot);
            if (answerStyle.cursor === "default") {
                console.warn(
                    "Essa questão está sendo respondida, vamos pular ela e responder outra.",
                );
                question = question.nextElementSibling;
                continue questionAnswerLoop;
            }
            const questionTickBox = [
                ...answerDot.querySelectorAll(":scope > span"),
            ].find((element) => element.querySelector("p") == null);
            if (!questionTickBox) {
                console.warn(
                    "Não achamos o botão de resposta da questão! Vamos tentar outra.",
                );
                question = question.nextElementSibling;
                continue questionAnswerLoop;
            }
            const questionStyle = getComputedStyle(questionTickBox);
            if (questionStyle.color.startsWith("rgba") === false) {
                console.warn(
                    "Essa questão já foi respondida! Vamos pra próxima.",
                );
                question = question.nextElementSibling;
                continue questionAnswerLoop;
            }
            if (!chosenAnswer) {
                chosenAnswer = questionTickBox;
            }
        }

        if (!chosenAnswer) {
            console.warn(
                "Não achamos o botão de resposta da questão! Vamos tentar outra.",
            );
            question = question.nextElementSibling;
            continue;
        }

        console.log("Achamos o botão de resposta! Vamos clicar!");
        chosenAnswer.click();
        await delay(semiBelievableDelay());
        console.log("Próximo!");
        question = question.nextElementSibling;
    }

    if (azCheckButton.innerHTML.toLowerCase().includes("finalizado") == false) {
        console.error(
            "Uma AZ Check não foi finalizada mesmo depois do fim do ciclo de questões...",
        );
        pressedThatAnswerButton = false;
    }

    if (!pressedThatAnswerButton) {
        if (!errors[materia]) {
            errors[materia] = {};
        }

        if (!errors[materia][capitulo]) {
            errors[materia][capitulo] =
                "O botão de entregar atividade não foi apertado. Não sabemos o porquê, pra extensão, nada deu errado o suficiente para percebermos que o botão de entregar a atividade nunca foi apertado.";
        }
    }

    return true;
}

/**
 * @param {Object<string, Array<number>>} listaDeMaterias
 * @param {Object<string, Object<number, Array<string>>} listaDeRespostas
 **/
async function startTheTrolling(listaDeMaterias, listaDeRespostas) {
    inProgress = true;
    cardSolver: for (const [materia, capitulos] of Object.entries(
        listaDeMaterias,
    )) {
        const card = await findElement(materia, materiaFinder, 1000).catch(() =>
            console.warn(
                `Não conseguimos encontrar a matéria com nome "${materia}"! Têm certeza de que você escreveu o nome correto?`,
            ),
        );
        if (!card) {
            if (!errors[materia]) {
                errors[materia] = {};
            }
            errors[materia][0] =
                "Não conseguimos encontrar o card dessa matéria, todos os capítulos dessa matéria não foram automatizados.";
            continue;
        }

        await delay(semiBelievableDelay());

        card.click();

        for (const capitulo of capitulos) {
            let arrayRespostas;
            const respostas = listaDeRespostas[materia];
            if (respostas) arrayRespostas = respostas[capitulo];
            const shouldWeStay = await solveFascicle(
                materia,
                capitulo,
                arrayRespostas,
            );
            if (shouldWeStay === false) break cardSolver;
        }

        history.back();
    }

    console.log("Terminamos!");

    if (Object.keys(errors).length > 0) {
        console.warn(
            "Porém! O AutoAZ NÃO conseguiu automatizar alguns capítulos de algumas matérias devido a imprevistos!",
        );
        console.warn(
            "A seguir vem uma lista das matérias e seus capítulos que não foram automatizados, junto com o motivo.",
        );
        for (const [materia, capitulos] of Object.entries(errors)) {
            console.warn("/----------/");
            console.warn(materia);
            for (const [capitulo, erro] of Object.entries(capitulos)) {
                console.warn("Capítulo %d: %s", capitulo, erro);
            }
        }

        console.warn("Sentimos muito por isso.");
    }

    errors = {};

    inProgress = false;
}

const eventActions = {
    start: function (data) {
        if (inProgress) {
            console.warn("Nós já estamos respondendo a uma lista!");
            return;
        }

        if (
            trimArray(
                window.location.href.split("?")[0].split("/").reverse(),
            )[0].endsWith("atividades") === false
        ) {
            console.error(
                "Não podemos começar aqui! Vá para a pagina de atividades! (https://app.redeaz.com.br/atividades)",
            );
            return;
        }

        console.log("AutoAZ vai começar agora.");
        /** @type {string} **/
        const texto = data.content;

        if (texto.length <= 0) {
            console.warn("Nos entregaram uma lista de matérias vazia...");
            return;
        }

        let materiasECapitulos = {};
        const materiasText = texto.split("\n");
        for (let index = 0; index < materiasText.length; index++) {
            const materia = materiasText[index];
            if (materia.length <= 0) continue;

            const [nome, capitulosText] = materia.split(":");
            if (nome.length <= 0 || capitulosText.length <= 0) {
                console.warn(
                    'Matéria inválida. Vamos pular essa aí. (nome: "%s", capítulos string: "%s")',
                    nome,
                    capitulosText,
                );
                continue;
            }

            const capitulos = capitulosText.split(",");
            materiasECapitulos[nome] = [];

            for (let jindex = 0; jindex < capitulos.length; jindex++) {
                const capitulo = Number(capitulos[jindex] || NaN);
                if (Number.isNaN(capitulo)) {
                    console.warn(
                        'Numero de capítulo inválido para matéria "%s": "%s"',
                        nome,
                        capitulos[jindex],
                    );
                    continue;
                }

                materiasECapitulos[nome].push(capitulo);
            }

            if (materiasECapitulos[nome].length <= 0) {
                console.warn(
                    'Matéria "%s" não possui nenhum capítulo válido.',
                    nome,
                );
                delete materiasECapitulos[nome];
            }
        }

        /** @type {string} **/
        const respostasText = data.answers;
        let materiasCapitulosERespostas = {};
        parseAnswers: {
            if (respostasText.length <= 0) {
                console.log(
                    "Nos deram uma lista de respostas vazia. Vamos responder aleatoriamente.",
                );
                break parseAnswers;
            }

            const respostasChunks = trimArray(respostasText.split("\n"));
            for (let index = 0; index < respostasChunks.length; index++) {
                const respostaChunk = respostasChunks[index];
                const [materia, capitulo, respostas] = respostaChunk.split(":");
                if (!(materia && capitulo && respostas)) {
                    console.warn(
                        "Parametros inválidos em uma chunk de resposta!",
                    );
                    console.warn('Deveria ser: "MATÉRIA:CAPÍTULO:RESPOSTAS"');
                    console.warn(
                        `É: "${materia || "INVÁLIDO"}:${capitulo || "INVÁLIDO"}:${respostas || "INVÁLIDO"}"`,
                    );
                    continue;
                }
                if (!materiasECapitulos[materia]) {
                    console.warn(
                        `A matéria ${materia} inclusa na lista de respostas não está na lista de matérias a serem respondidas! Vamos ignorar essa matéria.`,
                    );
                    continue;
                }

                const capituloNumber = Number(capitulo || NaN);
                if (Number.isNaN(capituloNumber)) {
                    console.warn(
                        "Nos deram um capítulo inválido (%s) para a matéria %s na lista de respostas! Vamos ignorar esse capítulo.",
                        capitulo,
                        materia,
                    );
                    continue;
                }

                if (!materiasECapitulos[materia].indexOf(capituloNumber) < 0) {
                    console.warn(
                        "O capítulo %s da matéria %s não existe na lista de matérias a serem respondidas! Vamos ignorar esse capítulo.",
                        capitulo,
                        materia,
                    );
                    continue;
                }

                if (!materiasCapitulosERespostas[materia]) {
                    materiasCapitulosERespostas[materia] = {};
                }

                materiasCapitulosERespostas[materia][capituloNumber] =
                    respostas.split("");
            }
        }

        startTheTrolling(materiasECapitulos, materiasCapitulosERespostas);
    },
    url_changed: onUrlChange,
};

function init() {
    browser.runtime.onMessage.addListener((message) => {
        if (eventActions[message.action]) eventActions[message.action](message);
    });

    onUrlChange();

    window.addEventListener("url_changed", onUrlChange);
}

init();
