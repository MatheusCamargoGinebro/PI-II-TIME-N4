
// Validação e integração do formulário de cadastro/edição de demandas do TaskOps

const formulario = document.getElementById("demanda-form");
const botaoCancelar = document.getElementById("botao-cancelar");
const mensagemFormulario = document.getElementById("mensagem-formulario");

const campos = [
    document.getElementById("nome"),
    document.getElementById("descricao"),
    document.getElementById("prioridade"),
    document.getElementById("status"),
    document.getElementById("responsavel")
];

// Endereço do backend
const API_URL = "http://localhost:3000";

// Mostra ou limpa a mensagem de erro de um campo
function mostrarErro(campo, mensagem) {
    const elementoErro = document.getElementById(`erro-${campo.id}`);

    campo.classList.toggle("campo-invalido", mensagem !== "");
    campo.setAttribute("aria-invalid", mensagem !== "" ? "true" : "false");

    if (elementoErro) {
        elementoErro.textContent = mensagem;
    }
}

// Verifica se um campo está preenchido corretamente
function validarCampo(campo) {
    const valor = campo.value.trim();
    let mensagem = "";

    if (valor === "") {
        mensagem = "Este campo é obrigatório.";
    } else if (campo.id === "nome" && valor.length < 3) {
        mensagem = "O nome deve ter pelo menos 3 caracteres.";
    } else if (campo.id === "nome" && valor.length > 100) {
        mensagem = "O nome deve ter no máximo 100 caracteres.";
    } else if (campo.id === "descricao" && valor.length < 10) {
        mensagem = "A descrição deve ter pelo menos 10 caracteres.";
    } else if (campo.id === "descricao" && valor.length > 500) {
        mensagem = "A descrição deve ter no máximo 500 caracteres.";
    }

    mostrarErro(campo, mensagem);

    return mensagem === "";
}

// Limpa a mensagem geral do formulário
function limparMensagemGeral() {
    mensagemFormulario.textContent = "";
    mensagemFormulario.className = "mensagem-geral";
}

// Valida os campos enquanto o usuário digita ou altera uma opção
campos.forEach((campo) => {
    campo.addEventListener("input", () => {
        validarCampo(campo);
        limparMensagemGeral();
    });

    campo.addEventListener("change", () => {
        validarCampo(campo);
        limparMensagemGeral();
    });
});

// Valida todos os campos quando o formulário é enviado
formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const resultados = campos.map((campo) => validarCampo(campo));
    const formularioValido = resultados.every((resultado) => resultado);

    if (!formularioValido) {
        mensagemFormulario.textContent =
            "Corrija os campos destacados antes de continuar.";

        mensagemFormulario.className = "mensagem-geral erro";

        const primeiroCampoInvalido = campos.find(
            (campo, indice) => !resultados[indice]
        );

        if (primeiroCampoInvalido) {
            primeiroCampoInvalido.focus();
        }

        return;
    }

    // Recupera o token de autenticação
    const token = localStorage.getItem("taskops-token");

    if (!token) {
        mensagemFormulario.textContent =
            "Não foi possível identificar sua sessão. Faça login antes de continuar.";

        mensagemFormulario.className = "mensagem-geral erro";
        return;
    }

    // Recupera os dados do projeto pela URL
    const parametros = new URLSearchParams(window.location.search);

    const projectId = Number(parametros.get("project_id"));
    const dueDate = parametros.get("due_date");

    // Recupera o ID numérico do responsável
    const responsibleId = Number(
        document.getElementById("responsavel").value
    );

    // Verifica se as informações necessárias estão disponíveis
    if (
        !Number.isInteger(projectId) ||
        projectId <= 0 ||
        !dueDate ||
        !Number.isInteger(responsibleId) ||
        responsibleId <= 0
    ) {
        mensagemFormulario.textContent =
            "Não foi possível salvar: faltam informações do projeto, do prazo ou do responsável.";

        mensagemFormulario.className = "mensagem-geral erro";
        return;
    }

    // Organiza os dados para enviar ao backend
    const dadosDemanda = {
        title: document.getElementById("nome").value.trim(),
        description: document.getElementById("descricao").value.trim(),
        priority: document.getElementById("prioridade").value,
        status: document.getElementById("status").value,
        due_date: dueDate,
        project_id: projectId,
        responsible_id: responsibleId
    };

    mensagemFormulario.textContent = "Salvando demanda...";
    mensagemFormulario.className = "mensagem-geral";

    try {
        // Envia a demanda para o backend
        const resposta = await fetch(`${API_URL}/tasks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(dadosDemanda)
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.message || "Não foi possível cadastrar a demanda."
            );
        }

        mensagemFormulario.textContent =
            "Demanda cadastrada com sucesso!";

        mensagemFormulario.className = "mensagem-geral sucesso";

        formulario.reset();

        campos.forEach((campo) => {
            mostrarErro(campo, "");
            campo.removeAttribute("aria-invalid");
        });

    } catch (erro) {
        console.error("Erro ao cadastrar demanda:", erro);

        mensagemFormulario.textContent =
            erro.message || "Erro ao conectar com o servidor.";

        mensagemFormulario.className = "mensagem-geral erro";
    }
});

// Limpa os campos e as mensagens quando o usuário clica em Cancelar
botaoCancelar.addEventListener("click", () => {
    formulario.reset();

    campos.forEach((campo) => {
        mostrarErro(campo, "");
        campo.removeAttribute("aria-invalid");
    });

    limparMensagemGeral();
});



// Carrega os participantes do projeto no campo Responsável
async function carregarResponsaveis() {
    const parametros = new URLSearchParams(window.location.search);
    const projectId = Number(parametros.get("project_id"));

    if (!Number.isInteger(projectId) || projectId <= 0) {
        console.warn("ID do projeto não encontrado na URL.");
        return;
    }

    const token = localStorage.getItem("taskops-token");

    if (!token) {
        console.warn("Token de autenticação não encontrado.");
        return;
    }

    try {
        const resposta = await fetch(
            `${API_URL}/tasks/project/${projectId}/members`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.message || "Erro ao buscar participantes.");
        }

        const campoResponsavel = document.getElementById("responsavel");

        // Limpa as opções anteriores
        campoResponsavel.innerHTML = "";

        // Cria a opção inicial
        const opcaoInicial = document.createElement("option");
        opcaoInicial.value = "";
        opcaoInicial.textContent = "Selecione um responsável";
        opcaoInicial.disabled = true;
        opcaoInicial.selected = true;

        campoResponsavel.appendChild(opcaoInicial);

        // Adiciona os participantes recebidos do backend
        resultado.members.forEach((membro) => {
            const opcao = document.createElement("option");

            opcao.value = membro.user_id;
            opcao.textContent = membro.name;

            campoResponsavel.appendChild(opcao);
        });

    } catch (erro) {
        console.error("Erro ao carregar responsáveis:", erro);
        mensagemFormulario.textContent =
            "Não foi possível carregar os responsáveis do projeto.";

        mensagemFormulario.className = "mensagem-geral erro";
    }
}

// Executa o carregamento dos responsáveis
carregarResponsaveis();
