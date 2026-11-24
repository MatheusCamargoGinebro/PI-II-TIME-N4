/*
    Autor: 
    register_demand.js -> Valida e envia o cadastro de uma nova demanda para a API, carregando projetos e membros vinculados dinamicamente.
*/

import {
	requireAuth,
	isTeamMember,
} from "../../../assets/js/repositories/authRepository.js";
import { initAppHeader } from "../../../assets/js/components/header.js";
import {
	getProjects,
	getProjectMembers,
} from "../../../assets/js/repositories/projectRepository.js";
import { createTask } from "../../../assets/js/repositories/taskRepository.js";
import { showAlertModal } from "../../../assets/js/components/modal.js";
import { escapeHtml } from "../../../assets/js/utils/formatters.js";

requireAuth();

const urlParams = new URLSearchParams(window.location.search);
const initialProjectId = urlParams.get("project_id");

const headerPromise = initAppHeader({
	activePage: "projects",
	projectId: initialProjectId,
});

const formulario = document.getElementById("demanda-form");
const botaoCancelar = document.getElementById("botao-cancelar");
const botaoSalvar = document.getElementById("botao-salvar");
const mensagemFormulario = document.getElementById("mensagem-formulario");

const campoNome = document.getElementById("nome");
const campoDescricao = document.getElementById("descricao");
const campoProjeto = document.getElementById("projeto");
const campoTipo = document.getElementById("tipo");
const campoPrioridade = document.getElementById("prioridade");
const campoPrazo = document.getElementById("prazo");
const campoResponsavel = document.getElementById("responsavel");

// Ajusta destino do botão Cancelar conforme origem
if (botaoCancelar && initialProjectId) {
	botaoCancelar.href = `../../project/project_details/project_details.html?project_id=${encodeURIComponent(initialProjectId)}`;
}

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

// Valida um campo individualmente
function validarCampo(campo) {
	if (!campo) return true;
	const valor = campo.value.trim();
	let mensagem = "";

	if (campo.hasAttribute("required") && valor === "") {
		mensagem = "Este campo é obrigatório.";
	} else if (campo.id === "nome" && valor.length < 3) {
		mensagem = "O título deve ter pelo menos 3 caracteres.";
	} else if (campo.id === "nome" && valor.length > 256) {
		mensagem = "O título deve ter no máximo 256 caracteres.";
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

function limparMensagemGeral() {
	if (!mensagemFormulario) return;
	mensagemFormulario.textContent = "";
	mensagemFormulario.className = "mensagem-geral";
}

// Carrega membros vinculados ao projeto selecionado (usando member_id retornado pela API)
async function carregarResponsaveis(projectId) {
	if (!projectId) {
		campoResponsavel.innerHTML = `<option value="">Nenhum (não atribuído)</option>`;
		return;
	}

	campoResponsavel.innerHTML = `<option value="">Carregando membros...</option>`;
	const res = await getProjectMembers(projectId);

	if (res.success && Array.isArray(res.members) && res.members.length > 0) {
		campoResponsavel.innerHTML = `
			<option value="">Nenhum (não atribuído)</option>
			${res.members
				.map((m) => {
					const id = m.member_id ?? m.user_id;
					return `<option value="${escapeHtml(id)}">${escapeHtml(m.member_name)} (${escapeHtml(m.member_email)})</option>`;
				})
				.join("")}
		`;
	} else {
		campoResponsavel.innerHTML = `<option value="">Nenhum (não atribuído)</option>`;
	}
}

// Carrega projetos disponíveis para o usuário autenticado
async function carregarProjetos() {
	const res = await getProjects();
	if (res.success && res.projects.length > 0) {
		campoProjeto.innerHTML = `
			<option value="" disabled ${!initialProjectId ? "selected" : ""}>Selecione um projeto...</option>
			${res.projects
				.map(
					(p) =>
						`<option value="${p.project_id}" ${String(initialProjectId) === String(p.project_id) ? "selected" : ""}>${escapeHtml(p.title)}</option>`,
				)
				.join("")}
		`;

		const selectedProjectId =
			initialProjectId &&
			res.projects.some(
				(p) => String(p.project_id) === String(initialProjectId),
			)
				? initialProjectId
				: String(res.projects[0].project_id);

		campoProjeto.value = selectedProjectId;
		await carregarResponsaveis(selectedProjectId);
	} else {
		campoProjeto.innerHTML = `<option value="" disabled selected>Nenhum projeto disponível</option>`;
	}
}

campoProjeto.addEventListener("change", () => {
	carregarResponsaveis(campoProjeto.value);
	validarCampo(campoProjeto);
	limparMensagemGeral();
});

[
	campoNome,
	campoDescricao,
	campoPrioridade,
	campoTipo,
	campoPrazo,
	campoResponsavel,
].forEach((campo) => {
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

// Envio do formulário para POST /tasks
formulario.addEventListener("submit", async (evento) => {
	evento.preventDefault();

	const nomeValido = validarCampo(campoNome);
	const descValida = validarCampo(campoDescricao);
	const projValido = validarCampo(campoProjeto);
	const prioValida = validarCampo(campoPrioridade);

	if (!nomeValido || !descValida || !projValido || !prioValida) {
		mensagemFormulario.textContent =
			"Corrija os campos destacados antes de salvar.";
		mensagemFormulario.className = "mensagem-geral mensagem-erro";
		return;
	}

	const payload = {
		title: campoNome.value.trim(),
		description: campoDescricao.value.trim(),
		type: campoTipo.value || "TAREFA",
		priority: campoPrioridade.value,
		fk_project_id: Number(campoProjeto.value),
		fk_user_id: campoResponsavel.value ? Number(campoResponsavel.value) : null,
		due_date: campoPrazo.value || null,
	};

	if (botaoSalvar) botaoSalvar.disabled = true;
	mensagemFormulario.textContent = "Salvando demanda...";
	mensagemFormulario.className = "mensagem-geral";

	const res = await createTask(payload);
	if (botaoSalvar) botaoSalvar.disabled = false;

	if (res.success) {
		mensagemFormulario.textContent =
			res.message || "Demanda cadastrada com sucesso!";
		mensagemFormulario.className = "mensagem-geral mensagem-sucesso";
		await showAlertModal(
			"Demanda cadastrada com sucesso com status Aberta!",
			"Sucesso",
		);
		window.location.href = `../../project/project_details/project_details.html?project_id=${payload.fk_project_id}`;
	} else {
		mensagemFormulario.textContent =
			res.message || "Erro ao cadastrar demanda.";
		mensagemFormulario.className = "mensagem-geral mensagem-erro";

		if (res.errorAt === "title") mostrarErro(campoNome, res.message);
		if (res.errorAt === "description") mostrarErro(campoDescricao, res.message);
		if (res.errorAt === "fk_project_id") mostrarErro(campoProjeto, res.message);
		if (res.errorAt === "fk_user_id")
			mostrarErro(campoResponsavel, res.message);
		if (res.errorAt === "due_date") mostrarErro(campoPrazo, res.message);
	}
});

// Inicialização com verificação de permissão (Membro não cria demandas — Seção 2.1.3)
async function init() {
	await headerPromise;

	if (isTeamMember()) {
		await showAlertModal(
			"Membros da equipe não têm permissão para cadastrar novas demandas.",
			"Acesso restrito",
		);
		window.location.href = "../../dashboard/dashboard.html";
		return;
	}

	await carregarProjetos();
	if (window.lucide) {
		window.lucide.createIcons();
	}
}

init();
