/*
    Autor: 
    header.js -> Renderiza o cabeçalho padronizado no estilo do Dashboard em todas as telas autenticadas, sem chevron ao lado do usuário.
*/

import {
	initUserProfile,
	getFrontendRoot,
} from "../repositories/authRepository.js";

/**
 * Monta o cabeçalho padrão TaskOps dentro do elemento <header id="app-header"> (ou primeiro <header>).
 * @param {Object} options
 * @param {"dashboard"|"projects"|"demands"} [options.activePage="dashboard"] - Qual item de navegação destacar
 * @param {string|null} [options.projectId=null] - Opcional: pré-seleciona o projeto no botão "Adicionar Tarefa"
 */
export async function initAppHeader({
	activePage = "dashboard",
	projectId = null,
} = {}) {
	const headerEl =
		document.getElementById("app-header") || document.querySelector("header");
	if (!headerEl) return null;

	const root = getFrontendRoot();
	const dashboardHref = `${root}pages/dashboard/dashboard.html`;
	const projectsHref = `${root}pages/project/projects_list/projects_list.html`;
	const newDemandHref = projectId
		? `${root}pages/demand/register_demand/register_demand.html?project_id=${encodeURIComponent(projectId)}`
		: `${root}pages/demand/register_demand/register_demand.html`;

	const dashboardBtnClass =
		activePage === "dashboard"
			? "btn btn-lg primary-btn"
			: "btn btn-lg ghost-btn";
	const projectsBtnClass =
		activePage === "projects"
			? "btn btn-lg primary-btn"
			: "btn btn-lg ghost-btn";

	headerEl.className = "header";
	headerEl.innerHTML = `
		<nav class="nav">
			<a href="${dashboardHref}" class="nav-logo-link" aria-label="Ir para o Dashboard">
				<img src="${root}assets/images/logo.png" alt="TaskOps" />
			</a>

			<ul class="nav-list">
				<li><a href="${dashboardHref}" class="${dashboardBtnClass}">Dashboard</a></li>
				<li><a href="${projectsHref}" class="${projectsBtnClass}">Projetos</a></li>
			</ul>
		</nav>

		<div class="header-actions">
			<a href="${newDemandHref}" class="btn btn-lg primary-btn" data-add-task-link>
				<i data-lucide="plus" class="icon-medium" style="color: var(--color-accent-100)"></i>
				Adicionar Tarefa
			</a>

			<div class="user-profile" role="button" tabindex="0" title="Clique para sair da conta">
				<div class="align-center gap-16">
					<img class="user-profile-avatar" src="${root}assets/images/user.png" alt="Avatar do usuário" />
					<div class="user-profile-info">
						<p class="user-profile-name text-large">Carregando...</p>
						<p class="user-profile-email font-inter text-tiny text-subtitle"></p>
					</div>
				</div>
				<i data-lucide="log-out" class="icon-medium" style="color: var(--color-primary-500)" aria-hidden="true"></i>
			</div>
		</div>
	`;

	if (window.lucide && typeof window.lucide.createIcons === "function") {
		window.lucide.createIcons({ root: headerEl });
	}

	return initUserProfile();
}
