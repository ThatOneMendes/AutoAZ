/** @type {HTMLTableRowElement} */
const PLACEHOLDER_LINHA = document.getElementById("placeholder-linha-de-lista");

/** @type {HTMLTableRowElement} */
const PLACEHOLDER_RESPOSTA = document.getElementById(
    "placeholder-linha-de-resposta",
);

/** @type {HTMLTableSectionElement} */
const listaDeMaterias = document.getElementById("lista-materias");

/** @type {HTMLTableSectionElement} */
const listaDeRespostas = document.getElementById("lista-respostas");

/**
 * @param {HTMLTableElement} listaAlvo
 * @param {HTMLTableRowElement} placeholderAlvo
 */
function novaCartela(listaAlvo, placeholderAlvo) {
    /** @type {HTMLTableRowElement} */
    const cartela = placeholderAlvo.cloneNode(true);
    delete cartela.id;
    cartela.classList.add("row-valido");

    /** @type {HTMLButtonElement} */
    const botaoDeRemover = cartela.querySelector(".remover-cartela");
    botaoDeRemover.addEventListener("click", () => {
        listaAlvo.removeChild(cartela);
        window.dispatchEvent(new CustomEvent("atualize_estado"));
    });

    listaAlvo.appendChild(cartela);
}

listaDeMaterias
    .querySelector(".nova-cartela")
    .addEventListener(
        "click",
        novaCartela.bind(null, listaDeMaterias, PLACEHOLDER_LINHA),
    );
listaDeRespostas
    .querySelector(".nova-cartela")
    .addEventListener(
        "click",
        novaCartela.bind(null, listaDeRespostas, PLACEHOLDER_RESPOSTA),
    );

/**
 * @param {Object<string, Object<number, string>>} respostasObject
 */
function listaDeRespostasParaTabelas(respostasObject) {
    for (const [materia, capitulos] of Object.entries(respostasObject)) {
        for (const [capitulo, respostas] of Object.entries(capitulos)) {
            /** @type {HTMLTableRowElement} */
            let rowRespostas = PLACEHOLDER_RESPOSTA.cloneNode(true);
            delete rowRespostas.id;
            rowRespostas.classList.add("row-valido");

            rowRespostas.querySelector(".materia-input").value = materia;
            rowRespostas.querySelector(".capitulo-input").value = capitulo;
            rowRespostas.querySelector(".respostas-input").value = respostas;

            /** @type {HTMLButtonElement} */
            const botaoDeRemover =
                rowRespostas.querySelector(".remover-cartela");
            botaoDeRemover.addEventListener("click", () => {
                listaDeRespostas.removeChild(rowRespostas);
                window.dispatchEvent(new CustomEvent("atualize_estado"));
            });

            listaDeRespostas.appendChild(rowRespostas);
        }
    }
}

function extrairInfoRowResposta(row) {
    return [
        row.querySelector(".materia-input").value,
        row.querySelector(".capitulo-input").value,
        row.querySelector(".respostas-input").value,
    ];
}

/**
 * @param {Array<number>} sequencia
 * @returns {Array<Array<number>|number>}
 */
function criarSequenciaDeCapitulos(sequencia) {
    let resultado = [];
    let chain = [];

    for (const numero of sequencia) {
        if (chain.length == 0) {
            chain.push(numero);
            continue;
        }

        if (chain[chain.length - 1] === numero - 1) {
            chain.push(numero);
        } else {
            resultado.push(
                chain.length === 1
                    ? chain[0]
                    : [chain[0], chain[chain.length - 1]],
            );
            chain = [numero];
        }
    }
    if (chain.length > 0)
        resultado.push(
            chain.length === 1 ? chain[0] : [chain[0], chain[chain.length - 1]],
        );

    return resultado;
}

/**
 * @param {Object<string,Array<number>|string>} materias
 */
function listaDeMateriasParaTabelas(materias) {
    for (const [materia, capitulos] of Object.entries(materias)) {
        /** @type {HTMLTableRowElement} */
        let rowMateria = PLACEHOLDER_LINHA.cloneNode(true);
        delete rowMateria.id;
        rowMateria.classList.add("row-valido");

        rowMateria.querySelector(".materia-input").value = materia;

        if (Array.isArray(capitulos)) {
            const sequencia = criarSequenciaDeCapitulos(capitulos);
            rowMateria.querySelector(".capitulo-input").value = sequencia
                .toString()
                .replaceAll(",", ", ");
        } else {
            rowMateria.querySelector(".capitulo-input").value =
                String(capitulos);
        }

        /** @type {HTMLButtonElement} */
        const botaoDeRemover = rowMateria.querySelector(".remover-cartela");
        botaoDeRemover.addEventListener("click", () => {
            listaDeMaterias.removeChild(rowMateria);
            window.dispatchEvent(new CustomEvent("atualize_estado"));
        });

        listaDeMaterias.appendChild(rowMateria);
    }
}

function extrairInfoRowMateria(row) {
    return [
        row.querySelector(".materia-input").value,
        row.querySelector(".capitulo-input").value,
    ];
}

function tornarStringDeCapitulosEmArray(capitulos) {
    capitulos = capitulos.trim();
    {
        if (capitulos.length <= 0) return [null, "O texto está vazio."];
        const capituloNumero = Math.floor(Number(capitulos));
        if (Number.isNaN(capituloNumero) === false) return [capituloNumero];
    }
    if (capitulos.includes("~") === false)
        return [
            null,
            `${capitulos} não é um numero válido e nem um intervalo.`,
        ];
    const intervalo = capitulos.split("~");
    if (intervalo.length !== 2)
        return [
            null,
            "Só deve existir dois numeros no intervalo de capítulos.",
        ];
    const capituloInicialTexto = intervalo[0].trim();
    const capituloFinalTexto = intervalo[1].trim();
    if (capituloInicialTexto.length <= 0 || capituloFinalTexto.length <= 0)
        return [null, "Um dos capítulos do intervalo não existe."];

    const capituloInicial = Math.floor(Number(capituloInicialTexto));
    const capituloFinal = Math.floor(Number(capituloFinalTexto));

    if (Number.isNaN(capituloInicial) || Number.isNaN(capituloFinal))
        return [null, "Um dos capítulos do intervalo é inválido."];

    if (capituloInicial === capituloFinal) return [capituloInicial];

    let capitulosIntervalo = [];
    for (let i = capituloInicial; i <= capituloFinal; i++) {
        capitulosIntervalo.push(i);
    }

    return capitulosIntervalo;
}

/**
 * @param {HTMLTableRowElement} row
 * @returns {[[boolean, string|undefined], string|undefined, number[]|undefined]}
 */
function serializarRowListaDeMaterias(row) {
    /** @type {HTMLInputElement} */
    const materiaInput = row.querySelector(".materia-input");
    /** @type {HTMLInputElement} */
    const capitulosInput = row.querySelector(".capitulo-input");

    const nomeMateria = materiaInput.value.trim();
    if (nomeMateria.length <= 0)
        return [[false, `Nome de matéria inválida (${materiaInput.value})`]];

    let capitulosDaMateria = [];
    const capitulosSplit = trimArray(capitulosInput.value.trim().split(","));
    if (capitulosSplit.length <= 0)
        return [
            [
                false,
                `Matéria ${nomeMateria} não possui nenhum capítulo válido.`,
            ],
        ];

    for (const capituloText of capitulosSplit) {
        const capitulos = tornarStringDeCapitulosEmArray(capituloText);
        if (capitulos[0] === null) {
            return [
                [
                    false,
                    `Erro no parsing de um dos capítulos da matéria ${nomeMateria}: ${capitulos[1]}`,
                ],
            ];
        }
        for (const capitulo of capitulos) {
            if (capitulosDaMateria.includes(capitulo)) continue;
            capitulosDaMateria.push(capitulo);
        }
    }

    capitulosDaMateria.sort((a, b) => a - b);

    return [[true], nomeMateria, capitulosDaMateria];
}

/**
 * @param {HTMLTableRowElement} row
 * @returns {[[boolean, string|undefined], string|undefined, number|undefined, string[]|undefined}
 */
function serializarRowListaDeRespostas(row) {
    /** @type {HTMLInputElement} */
    const materiaInput = row.querySelector(".materia-input");
    /** @type {HTMLInputElement} */
    const capitulosInput = row.querySelector(".capitulo-input");
    /** @type {HTMLInputElement} */
    const respostasInput = row.querySelector(".respostas-input");

    const nomeMateria = materiaInput.value.trim();
    if (nomeMateria.length <= 0)
        return [[false, `Nome de matéria inválida (${materiaInput.value})`]];

    const capitulo = Math.floor(Number(capitulosInput.value.trim()));
    if (Number.isNaN(capitulo) || capitulosInput.value.trim().length <= 0)
        return [
            [
                false,
                `Capítulo inválido para a lista de respostas da matéria ${nomeMateria}: "${capitulosInput.value}"`,
            ],
        ];

    const respostaSheet = respostasInput.value
        .split("")
        .map((str) => str.toUpperCase());

    for (const letra of respostaSheet) {
        if (letras.includes(letra) === false) {
            return [
                [
                    false,
                    `Não existe letra ${letra} em uma resposta da AZ Check. Pelo menos não ainda.`,
                ],
            ];
        }
    }

    return [[true], nomeMateria, capitulo, respostaSheet];
}
