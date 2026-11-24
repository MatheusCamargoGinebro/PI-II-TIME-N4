/*
    Autor: 
    demands_list.js -> Controla a tela dinâmica de listagem de demandas filtrada por status e/ou projeto via API.
*/

import { requireAuth } from "../../../assets/js/repositories/authRepository.js";
import { initAppHeader } from "../../../assets/js/components/header.js";
import { listTasks } from "../../../assets/js/repositories/taskRepository.js";
import { getProject } from "../../../assets/js/repositories/projectRepository.js";
import { normalizeString } from "../../../assets/js/normalize.js";
import {
	escapeHtml,
	formatShortDate,
	formatTaskCode,
	getPriorityInfo,
	getStatusInfo,
	getTypeLabel,
} from "../../../assets/js/utils/formatters.js";

requireAuth();

const urlParams = new URLSearchParams(window.location.search);
const rawStatus = (urlParams.get("status") || "").trim().toUpperCase();
const projectId = urlParams.get("project_id");

initAppHeader({
	activePage: projectId ? "projects" : "dashboard",
	projectId,
});

// Metadados textuais para cada status de demanda
const STATUS_CONFIG = {
	"": {
		title: "Todas as Demandas",
		breadcrumb: "Todas as Demandas",
		nounSingular: "demanda cadastrada",
		nounPlural: "demandas cadastradas",
	},
	ABERTA: {
		title: "Tarefas Abertas",
		breadcrumb: "Tarefas Abertas",
		nounSingular: "demanda aberta nesta etapa",
		nounPlural: "demandas abertas nesta etapa",
	},
	"EM ANDAMENTO": {
		title: "Tarefas em Andamento",
		breadcrumb: "Em Andamento",
		nounSingular: "demanda em andamento nesta etapa",
		nounPlural: "demandas em andamento nesta etapa",
	},
	"EM REVISAO": {
		title: "Tarefas em Revisão",
		breadcrumb: "Em Revisão",
		nounSingular: "demanda em revisão nesta etapa",
		nounPlural: "demandas em revisão nesta etapa",
	},
	CONCLUIDA: {
		title: "Tarefas Concluídas",
		breadcrumb: "Tarefas Concluídas",
		nounSingular: "demanda concluída nesta etapa",
		nounPlural: "demandas concluídas nesta etapa",
	},
	CANCELADA: {
		title: "Tarefas Canceladas",
		breadcrumb: "Tarefas Canceladas",
		nounSingular: "demanda cancelada nesta etapa",
		nounPlural: "demandas canceladas nesta etapa",
	},
	"EM ANDAMENTO,EM REVISAO": {
		title: "Tarefas Pendentes",
		breadcrumb: "Tarefas Pendentes",
		nounSingular: "demanda pendente nesta etapa",
		nounPlural: "demandas pendentes nesta etapa",
	},
};

const currentConfig = STATUS_CONFIG[rawStatus] || STATUS_CONFIG[""];

const pageTitleEl = document.getElementById("page-title");
const pageSubtitleEl = document.getElementById("page-subtitle");
const breadcrumbEl = document.getElementById("demands-breadcrumb");
const statusTabsEl = document.getElementById("status-tabs");
const priorityButtons = document.querySelectorAll(
	"#priority-filters .filter-btn",
);
const typeFilterEl = document.getElementById("type-filter");
const sortSelectEl = document.getElementById("sort-select");
const searchInputEl = document.getElementById("search-input");
const tableBodyEl = document.getElementById("table-body");
const footerInfoEl = document.getElementById("footer-info");
const pageIndicatorEl = document.getElementById("page-indicator");
const prevPageBtn = document.getElementById("prev-page-btn");
const nextPageBtn = document.getElementById("next-page-btn");

const PAGE_SIZE = 10;
let fetchedTasks = [];
let selectedPriority = "";
let currentPage = 1;

// Atualiza título da aba e links de status preservando project_id quando presente
function setupPageMetadata() {
	document.title = `TaskOps - ${currentConfig.title}`;
	if (pageTitleEl) pageTitleEl.textContent = currentConfig.title;

	if (statusTabsEl) {
		statusTabsEl.querySelectorAll("a[data-status]").forEach((link) => {
			const tabStatus = link.dataset.status || "";
			const params = new URLSearchParams();
			if (tabStatus) params.set("status", tabStatus);
			if (projectId) params.set("project_id", projectId);
			const qs = params.toString();
			link.href = `./demands_list.html${qs ? `?${qs}` : ""}`;
			link.classList.toggle("tab-active", tabStatus === rawStatus);
		});
	}
}

// Atualiza o breadcrumb dinamicamente com o projeto (quando filtrado por projeto)
async function setupBreadcrumb() {
	if (!breadcrumbEl) return;

	if (projectId) {
		let projectTitle = `Projeto #${projectId}`;
		const res = await getProject(projectId);
		if (res.success && res.project) {
			projectTitle =
				res.project.project_name || res.project.title || projectTitle;
		}

		breadcrumbEl.innerHTML = `
			<a href="../../project/projects_list/projects_list.html" class="breadcrumb-item">Projetos</a>
			<i data-lucide="chevron-right" class="breadcrumb-separator"></i>
			<a href="../../project/project_details/project_details.html?project_id=${encodeURIComponent(projectId)}" class="breadcrumb-item">${escapeHtml(projectTitle)}</a>
			<i data-lucide="chevron-right" class="breadcrumb-separator"></i>
			<span class="breadcrumb-item active">${escapeHtml(currentConfig.breadcrumb)}</span>
		`;
	} else {
		breadcrumbEl.innerHTML = `
			<a href="../../dashboard/dashboard.html" class="breadcrumb-item">Dashboard</a>
			<i data-lucide="chevron-right" class="breadcrumb-separator"></i>
			<span class="breadcrumb-item active">${escapeHtml(currentConfig.breadcrumb)}</span>
		`;
	}

	if (window.lucide) {
		window.lucide.createIcons({ root: breadcrumbEl });
	}
}

// Filtra, ordena e pagina as demandas carregadas da API
function renderTable() {
	if (!tableBodyEl) return;

	const searchTerm = normalizeString(searchInputEl?.value.trim() || "");
	const selectedType = typeFilterEl?.value || "";

	const filtered = fetchedTasks.filter((task) => {
		if (selectedPriority && task.priority !== selectedPriority) return false;
		if (selectedType && task.type !== selectedType) return false;

		if (searchTerm) {
			const text = normalizeString(
				`${formatTaskCode(task.task_id)} ${task.title} ${task.description || ""} ${task.responsible_name || ""} ${task.project_title || ""}`,
			);
			if (!text.includes(searchTerm)) return false;
		}
		return true;
	});

	const totalFiltered = filtered.length;
	const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
	if (currentPage > totalPages) currentPage = totalPages;

	const startIdx = (currentPage - 1) * PAGE_SIZE;
	const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

	// Atualiza subtítulo dinâmico (total real na etapa vinda da API)
	if (pageSubtitleEl) {
		const totalStage = fetchedTasks.length;
		const noun =
			totalStage === 1 ? currentConfig.nounSingular : currentConfig.nounPlural;
		pageSubtitleEl.innerHTML = `Você possui <strong>${totalStage}</strong> ${noun}`;
	}

	// Renderiza linhas da tabela
	if (pageItems.length === 0) {
		tableBodyEl.innerHTML = `
			<tr>
				<td colspan="9" class="table-empty-cell">Nenhuma demanda encontrada para os filtros selecionados.</td>
			</tr>
		`;
	} else {
		tableBodyEl.innerHTML = pageItems
			.map((task) => {
				const code = formatTaskCode(task.task_id);
				const priorityInfo = getPriorityInfo(task.priority);
				const statusInfo = getStatusInfo(task.status);
				const assignee = task.responsible_name || "Não atribuído";
				const avatar =
					task.responsible_profile_pic || "../../../assets/images/user.png";

				return `
					<tr>
						<td class="code-col">
							<a href="../demand_details/demand_details.html?task_id=${task.task_id}">${escapeHtml(code)}</a>
						</td>
						<td class="title-col">
							<a href="../demand_details/demand_details.html?task_id=${task.task_id}">${escapeHtml(task.title)}</a>
						</td>
						<td>${escapeHtml(getTypeLabel(task.type))}</td>
						<td><span class="badge-priority ${priorityInfo.pillClass}">${escapeHtml(priorityInfo.label)}</span></td>
						<td><span class="status-pill ${statusInfo.className}">${escapeHtml(statusInfo.label)}</span></td>
						<td>
							<div class="assignee-cell">
								<img src="${escapeHtml(avatar)}" alt="${escapeHtml(assignee)}" />
								<span>${escapeHtml(assignee)}</span>
							</div>
						</td>
						<td>${escapeHtml(formatShortDate(task.creation_date))}</td>
						<td>${escapeHtml(formatShortDate(task.due_date))}</td>
						<td>${escapeHtml(task.project_title || "-")}</td>
					</tr>
				`;
			})
			.join("");
	}

	// Atualiza rodapé e controles de paginação
	if (footerInfoEl) {
		footerInfoEl.innerHTML = `Mostrando <strong>${pageItems.length}</strong> de <strong>${totalFiltered}</strong> ${totalFiltered === 1 ? "demanda" : "demandas"}`;
	}
	if (pageIndicatorEl) {
		pageIndicatorEl.textContent = `Página ${currentPage} de ${totalPages}`;
	}
	if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
	if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
}

// Busca demandas diretamente da API respeitando status, projeto e ordenação
async function loadDemands() {
	const [sortBy, sortOrder] = (
		sortSelectEl?.value || "creation_date:DESC"
	).split(":");
	const filters = {
		sort_by: sortBy,
		sort_order: sortOrder,
	};

	if (rawStatus) {
		filters.status = rawStatus;
	}
	if (projectId) {
		filters.fk_project_id = projectId;
	}

	const res = await listTasks(filters);
	fetchedTasks = res.success ? res.tasks : [];
	currentPage = 1;
	renderTable();
}

// Eventos dos filtros
priorityButtons.forEach((btn) => {
	btn.addEventListener("click", () => {
		priorityButtons.forEach((b) => b.classList.remove("active"));
		btn.classList.add("active");
		selectedPriority = btn.dataset.priority || "";
		currentPage = 1;
		renderTable();
	});
});

if (typeFilterEl) {
	typeFilterEl.addEventListener("change", () => {
		currentPage = 1;
		renderTable();
	});
}

if (sortSelectEl) {
	sortSelectEl.addEventListener("change", loadDemands);
}

if (searchInputEl) {
	searchInputEl.addEventListener("input", () => {
		currentPage = 1;
		renderTable();
	});
}

if (prevPageBtn) {
	prevPageBtn.addEventListener("click", () => {
		if (currentPage > 1) {
			currentPage -= 1;
			renderTable();
		}
	});
}

if (nextPageBtn) {
	nextPageBtn.addEventListener("click", () => {
		currentPage += 1;
		renderTable();
	});
}

// Inicialização
setupPageMetadata();
Promise.all([setupBreadcrumb(), loadDemands()]).then(() => {
	if (window.lucide) {
		window.lucide.createIcons();
	}
});
