/*
    Autor: 
    projects_list.js -> Carrega projetos dinamicamente pela API, aplica filtros/busca e permite criação de projetos via modal (Administrador).
*/

import {
	requireAuth,
	isAdmin,
} from "../../../assets/js/repositories/authRepository.js";
import { initAppHeader } from "../../../assets/js/components/header.js";
import {
	getProjects,
	createProject,
} from "../../../assets/js/repositories/projectRepository.js";
import { normalizeString } from "../../../assets/js/normalize.js";
import {
	showAlertModal,
	showPromptModal,
} from "../../../assets/js/components/modal.js";
import {
	escapeHtml,
	renderProgressSegments,
} from "../../../assets/js/utils/formatters.js";

requireAuth();
const headerPromise = initAppHeader({ activePage: "projects" });

const projectsContainer = document.getElementById("projects-list");
const searchInput = document.getElementById("project-search");
const filterButtons = document.querySelectorAll(
	".project-filter-tabs [data-filter]",
);
const emptyState = document.getElementById("projects-empty-state");
const summaryEl = document.getElementById("projects-summary");
const createProjectBtn = document.getElementById("create-project-btn");

let allProjects = [];
let selectedFilter = "todos";

function renderProjects() {
	if (!projectsContainer) return;

	const query = normalizeString(searchInput?.value.trim() || "");

	const filtered = allProjects.filter((project) => {
		const total = Number(project.total_tasks || 0);
		const completed = Number(project.completed_tasks || 0);
		const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

		if (selectedFilter === "ativos" && !(total > 0 && progress < 100))
			return false;
		if (selectedFilter === "concluidos" && !(total > 0 && progress === 100))
			return false;
		if (selectedFilter === "sem_demandas" && total !== 0) return false;

		if (query) {
			const haystack = normalizeString(
				`${project.title} #${project.project_id}`,
			);
			if (!haystack.includes(query)) return false;
		}
		return true;
	});

	if (summaryEl) {
		const count = filtered.length;
		summaryEl.innerHTML = `Você tem <span class="text-primary">${count}</span> ${count === 1 ? "projeto" : "projetos"}`;
	}

	if (emptyState) {
		emptyState.hidden = filtered.length > 0;
	}

	projectsContainer.innerHTML = filtered
		.map((p) => {
			const total = Number(p.total_tasks || 0);
			const completed = Number(p.completed_tasks || 0);
			const members = Number(p.total_members || 0);
			const progressPercent =
				total > 0 ? Math.round((completed / total) * 100) : 0;

			return `
				<div class="project-card base-card" data-project-id="${p.project_id}">
					<div class="project-card-header">
						<a href="../project_details/project_details.html?project_id=${p.project_id}" class="text-neutral text-medium text-weight-medium font-inter">
							${escapeHtml(p.title)}
						</a>
						<a href="../project_details/project_details.html?project_id=${p.project_id}" class="card-icon card-icon-clickable" aria-label="Abrir projeto ${escapeHtml(p.title)}">
							<i data-lucide="arrow-up-right" class="icon-small" style="color: var(--color-neutral-700)"></i>
						</a>
					</div>

					<div class="project-card-progress">
						<p class="text-label text-small text-weight-medium font-inter">Progresso</p>
						<h1 class="text-primary">${progressPercent}%</h1>
						<div class="progress-bar">
							${renderProgressSegments(completed, total, 16, false)}
						</div>
					</div>

					<div class="project-card-footer">
						<div class="align-center gap-8">
							<i data-lucide="check-square" class="icon-small" style="color: var(--color-neutral-700)"></i>
							<p class="text-label text-tiny text-weight-medium font-inter">${completed}/${total} ${total === 1 ? "demanda" : "demandas"}</p>
						</div>
						<p class="text-label text-tiny font-inter">${members} ${members === 1 ? "membro" : "membros"}</p>
					</div>
				</div>
			`;
		})
		.join("");

	if (window.lucide) {
		window.lucide.createIcons({ root: projectsContainer });
	}
}

async function loadProjects() {
	const res = await getProjects();
	allProjects = res.success ? res.projects : [];
	renderProjects();
}

if (searchInput) {
	searchInput.addEventListener("input", renderProjects);
}

filterButtons.forEach((button) => {
	button.addEventListener("click", () => {
		selectedFilter = button.dataset.filter || "todos";
		filterButtons.forEach((item) => {
			const active = item === button;
			item.classList.toggle("tab-active", active);
			item.setAttribute("aria-pressed", String(active));
		});
		renderProjects();
	});
});

// Modal de criação de novo projeto (exclusivo Administrador)
if (createProjectBtn) {
	createProjectBtn.addEventListener("click", async () => {
		if (!isAdmin()) return;

		const title = await showPromptModal({
			title: "Criar novo projeto",
			message: "Informe o nome do projeto que deseja cadastrar:",
			placeholder: "Ex.: Portal do Cliente v2",
			confirmText: "Criar Projeto",
			validate: (val) =>
				val.length < 3 ? "O nome deve ter pelo menos 3 caracteres." : null,
		});

		if (!title) return;

		const res = await createProject(title);
		if (res.success) {
			await showAlertModal("Projeto criado com sucesso!", "Sucesso");
			await loadProjects();
		} else {
			await showAlertModal(
				res.message || "Não foi possível criar o projeto.",
				"Erro",
			);
		}
	});
}

headerPromise.then(() => {
	loadProjects();
});
