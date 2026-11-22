import { requireAuth, initUserProfile } from "../../../assets/js/repositories/authRepository.js";
import { getProjects, getProjectMembers } from "../../../assets/js/repositories/projectRepository.js";
import { createTask } from "../../../assets/js/repositories/taskRepository.js";

requireAuth();
initUserProfile();

const formulario = document.getElementById("demanda-form");
const botaoCancelar = document.getElementById("botao-cancelar");
const mensagemFormulario = document.getElementById("mensagem-formulario");

const campoNome = document.getElementById("nome");
const campoDescricao = document.getElementById("descricao");
const campoProjeto = document.getElementById("projeto");
const campoTipo = document.getElementById("tipo");
const campoPrioridade = document.getElementById("prioridade");
const campoPrazo = document.getElementById("prazo");
const campoResponsavel = document.getElementById("responsavel");

const urlParams = new URLSearchParams(window.location.search);
const initialProjectId = urlParams.get("project_id");

// Mostra ou limpa a mensagem de erro de um campo
function mostrarErro(campo, mensagem) {
    if (!campo) return;
    const elementoErro = document.getElementById(`erro-${campo.id}`);

    campo.classList.toggle("campo-invalido", mensagem !== "");
    campo.setAttribute("aria-invalid", mensagem !== "" ? "true" : "false");

    if (elementoErro) {
        elementoErro.textContent = mensagem;
    }
}

// Verifica se um campo está preenchido corretamente
function validarCampo(campo) {
    if (!campo) return true;
    const valor = campo.value.trim();
    let mensagem = "";

    if (campo.hasAttribute("required") && valor === "") {
        mensagem = "Este campo é obrigatório.";
    } else if (campo.id === "nome" && valor.length < 3) {
        mensagem = "O nome deve ter pelo menos 3 caracteres.";
    } else if (campo.id === "nome" && valor.length > 256) {
        mensagem = "O nome deve ter no máximo 256 caracteres.";
    } else if (campo.id === "descricao" && valor.length < 10) {
        mensagem = "A descrição deve ter pelo menos 10 caracteres.";
    } else if (campo.id === "projeto" && !valor) {
        mensagem = "Selecione um projeto.";
    } else if (campo.id === "prioridade" && !valor) {
        mensagem = "Selecione uma prioridade.";
    }

    mostrarErro(campo, mensagem);
    return mensagem === "";
}

// Limpa a mensagem geral do formulário
function limparMensagemGeral() {
    mensagemFormulario.textContent = "";
    mensagemFormulario.className = "mensagem-geral";
}

// Carregar lista de projetos
async function carregarProjetos() {
    try {
        const res = await getProjects();
        if (res.success && res.projects.length > 0) {
            campoProjeto.innerHTML = `
                <option value="" disabled ${!initialProjectId ? 'selected' : ''}>Selecione um projeto...</option>
                ${res.projects.map(p => `
                    <option value="${p.project_id}" ${initialProjectId == p.project_id ? 'selected' : ''}>${p.title}</option>
                `).join("")}
            `;

            const selectedProjectId = campoProjeto.value || (initialProjectId && res.projects.some(p => p.project_id == initialProjectId) ? initialProjectId : res.projects[0].project_id);
            if (selectedProjectId) {
                campoProjeto.value = selectedProjectId;
                await carregarResponsaveis(selectedProjectId);
            }
        } else {
            campoProjeto.innerHTML = `<option value="" disabled selected>Nenhum projeto disponível</option>`;
        }
    } catch (err) {
        campoProjeto.innerHTML = `<option value="" disabled selected>Erro ao carregar projetos</option>`;
    }
}

// Carregar membros do projeto selecionado
async function carregarResponsaveis(projectId) {
    if (!projectId) {
        campoResponsavel.innerHTML = `<option value="">Nenhum (não atribuído)</option>`;
        return;
    }

    try {
        campoResponsavel.innerHTML = `<option value="">Carregando membros...</option>`;
        const res = await getProjectMembers(projectId);
        if (res.success && res.members.length > 0) {
            campoResponsavel.innerHTML = `
                <option value="">Nenhum (não atribuído)</option>
                ${res.members.map(m => `
                    <option value="${m.user_id}">${m.name} (${m.email})</option>
                `).join("")}
            `;
        } else {
            campoResponsavel.innerHTML = `<option value="">Nenhum membro encontrado</option>`;
        }
    } catch (err) {
        campoResponsavel.innerHTML = `<option value="">Erro ao carregar membros</option>`;
    }
}

// Recarrega responsáveis ao trocar de projeto
campoProjeto.addEventListener("change", () => {
    carregarResponsaveis(campoProjeto.value);
    validarCampo(campoProjeto);
    limparMensagemGeral();
});

// Validação em tempo real
[campoNome, campoDescricao, campoPrioridade, campoTipo, campoPrazo, campoResponsavel].forEach(campo => {
    if (!campo) return;
    campo.addEventListener("input", () => {
        validarCampo(campo);
        limparMensagemGeral();
    });

    campo.addEventListener("change", () => {
        validarCampo(campo);
        limparMensagemGeral();
    });
});

// Envio do formulário
formulario.addEventListener("submit", async evento => {
    evento.preventDefault();

    const nomeValido = validarCampo(campoNome);
    const descValida = validarCampo(campoDescricao);
    const projValido = validarCampo(campoProjeto);
    const prioValida = validarCampo(campoPrioridade);

    if (!nomeValido || !descValida || !projValido || !prioValida) {
        mensagemFormulario.textContent = "Corrija os campos destacados antes de salvar.";
        mensagemFormulario.className = "mensagem-geral mensagem-erro";
        return;
    }

    const payload = {
        title: campoNome.value.trim(),
        description: campoDescricao.value.trim(),
        type: campoTipo.value || "TAREFA",
        priority: campoPrioridade.value || "MEDIA",
        fk_project_id: Number(campoProjeto.value),
        fk_user_id: campoResponsavel.value ? Number(campoResponsavel.value) : null,
        due_date: campoPrazo.value || null
    };

    try {
        mensagemFormulario.textContent = "Salvando demanda...";
        mensagemFormulario.className = "mensagem-geral";

        const res = await createTask(payload);

        if (res.success) {
            mensagemFormulario.textContent = res.message || "Demanda cadastrada com sucesso!";
            mensagemFormulario.className = "mensagem-geral mensagem-sucesso";
            formulario.reset();
            setTimeout(() => {
                window.location.href = `../../project/project_details/project_details.html?project_id=${payload.fk_project_id}`;
            }, 1500);
        } else {
            mensagemFormulario.textContent = res.message || "Erro ao cadastrar demanda.";
            mensagemFormulario.className = "mensagem-geral mensagem-erro";

            if (res.errorAt === "title") mostrarErro(campoNome, res.message);
            if (res.errorAt === "description") mostrarErro(campoDescricao, res.message);
            if (res.errorAt === "fk_project_id") mostrarErro(campoProjeto, res.message);
            if (res.errorAt === "due_date") mostrarErro(campoPrazo, res.message);
        }
    } catch (err) {
        console.error("Erro ao salvar demanda:", err);
        mensagemFormulario.textContent = "Erro ao conectar com o servidor.";
        mensagemFormulario.className = "mensagem-geral mensagem-erro";
    }
});

// Botão Cancelar
botaoCancelar.addEventListener("click", () => {
    formulario.reset();
    [campoNome, campoDescricao, campoProjeto, campoPrioridade, campoPrazo, campoResponsavel].forEach(c => mostrarErro(c, ""));
    limparMensagemGeral();
});

// Inicialização
carregarProjetos();
