/*
    Autor: 
    project_details.js -> Carrega métricas e quadro Kanban do projeto via API com drag-and-drop respeitando a máquina de estados e RBAC.
*/

import {
	requireAuth,
	applyRoleRestrictions,
} from "../../../assets/js/repositories/authRepository.js";
import { initAppHeader } from "../../../assets/js/components/header.js";
import {
	getProjects,
	getProject,
	getProjectTasks,
} from "../../../assets/js/repositories/projectRepository.js";
import {
	updateTaskStatus,
	cancelTask,
} from "../../../assets/js/repositories/taskRepository.js";
import { normalizeString } from "../../../assets/js/normalize.js";
import {
	showAlertModal,
	showConfirmModal,
} from "../../../assets/js/components/modal.js";
import {
	escapeHtml,
	formatShortDate,
	getPriorityInfo,
	getTypeLabel,
	renderProgressSegments,
} from "../../../assets/js/utils/formatters.js";

requireAuth();

const urlParams = new URLSearchParams(window.location.search);
let projectId = urlParams.get("project_id");

const headerPromise = initAppHeader({ activePage: "projects", projectId });

const boardColumns = Array.from(
	document.querySelectorAll(".project-board-column[data-task-status]"),
);
const searchInput = document.getElementById("task-board-search");

function updateCurrentDate() {
	const dateEl = document.getElementById("project-current-date");
	if (!dateEl) return;

	const now = new Date();
	const dias = [
		"Domingo",
		"Segunda-feira",
		"Terça-feira",
		"Quarta-feira",
		"Quinta-feira",
		"Sexta-feira",
		"Sábado",
	];
	const meses = [
		"janeiro",
		"fevereiro",
		"março",
		"abril",
		"maio",
		"junho",
		"julho",
		"agosto",
		"setembro",
		"outubro",
		"novembro",
		"dezembro",
	];
	dateEl.textContent = `Hoje é ${dias[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
}

function updateMetricCard(key, count, total, accent = false) {
	const card = document.querySelector(`[data-project-metric="${key}"]`);
	if (!card) return;

	const valueEl = card.querySelector("[data-metric-value]");
	const barEl = card.querySelector("[data-metric-bar]");
	const subtitleEl = card.querySelector("[data-metric-subtitle]");

	if (valueEl) valueEl.textContent = String(count);
	if (barEl) barEl.innerHTML = renderProgressSegments(count, total, 19, accent);

	if (subtitleEl) {
		if (key === "total") {
			subtitleEl.textContent = `${total} ${total === 1 ? "demanda no projeto" : "demandas no projeto"}`;
		} else {
			const pct = total > 0 ? Math.round((count / total) * 100) : 0;
			subtitleEl.textContent =
				key === "CONCLUIDA"
					? `${pct}% do projeto concluído`
					: `${pct}% do total de demandas`;
		}
	}
}

function renderTaskCard(task) {
	const priorityInfo = getPriorityInfo(task.priority);
	const responsibleName =
		task.responsible_user_name || task.responsible_name || "Não atribuído";
	const avatar =
		task.profile_pic ||
		task.responsible_profile_pic ||
		"../../../assets/images/user.png";

	return `
		<div class="project-task-item" data-task-id="${task.task_id}" data-current-status="${escapeHtml(task.status)}" draggable="true" tabindex="0">
			<div class="between align-center gap-8">
				<a href="../../demand/demand_details/demand_details.html?task_id=${task.task_id}" class="text-neutral font-inter text-small text-weight-semibold">
					${escapeHtml(task.title || task.task_name)}
				</a>
				<span class="badge-dot ${priorityInfo.dotClass}" title="Prioridade ${escapeHtml(priorityInfo.label)}"></span>
			</div>

			<div class="align-center gap-4 text-subtitle text-tiny font-inter" style="flex-wrap: wrap;">
				<span>${escapeHtml(getTypeLabel(task.type))}</span>
				<span class="dot-separator"></span>
				<span>${escapeHtml(priorityInfo.label)}</span>
				<span class="dot-separator"></span>
				<span>${escapeHtml(formatShortDate(task.due_date))}</span>
			</div>

			<div class="align-center gap-8">
				<img src="${escapeHtml(avatar)}" class="project-task-avatar" alt="${escapeHtml(responsibleName)}" />
				<span class="text-tiny text-subtitle font-inter">${escapeHtml(responsibleName)}</span>
			</div>
		</div>
	`;
}

// Vincula eventos de dragstart apenas aos cartões recém-renderizados
function bindTaskCardDragEvents() {
	document
		.querySelectorAll(".project-task-item[data-task-id]")
		.forEach((card) => {
			card.addEventListener("dragstart", (event) => {
				card.classList.add("is-dragging");
				event.dataTransfer.setData("text/plain", card.dataset.taskId);
				event.dataTransfer.setData(
					"application/source-status",
					card.dataset.currentStatus,
				);
				event.dataTransfer.effectAllowed = "move";
			});

			card.addEventListener("dragend", () => {
				card.classList.remove("is-dragging");
			});
		});
}

// Vincula eventos de drop nas colunas UMA ÚNICA VEZ (evita disparos duplicados após recarregar dados)
function initBoardColumnDropZones() {
	boardColumns.forEach((column) => {
		column.addEventListener("dragover", (event) => {
			event.preventDefault();
			column.classList.add("is-drop-target");
			event.dataTransfer.dropEffect = "move";
		});

		column.addEventListener("dragleave", (event) => {
			if (!column.contains(event.relatedTarget)) {
				column.classList.remove("is-drop-target");
			}
		});

		column.addEventListener("drop", async (event) => {
			event.preventDefault();
			column.classList.remove("is-drop-target");

			const taskId = event.dataTransfer.getData("text/plain");
			const sourceStatus = event.dataTransfer.getData(
				"application/source-status",
			);
			const targetStatus = column.dataset.taskStatus;

			if (!taskId || !targetStatus || sourceStatus === targetStatus) return;

			if (targetStatus === "CANCELADA") {
				const confirmed = await showConfirmModal(
					"Deseja cancelar esta demanda? O registro será mantido no histórico.",
					"Cancelar Demanda",
					{ confirmText: "Sim, cancelar", cancelText: "Voltar" },
				);
				if (!confirmed) return;
			}

			const taskCard = document.querySelector(
				`.project-task-item[data-task-id="${taskId}"]`,
			);
			const previousParent = taskCard ? taskCard.parentElement : null;
			if (taskCard) {
				column.querySelector(".project-task-list")?.append(taskCard);
			}

			const res =
				targetStatus === "CANCELADA"
					? await cancelTask(taskId)
					: await updateTaskStatus(taskId, targetStatus);

			if (res.success) {
				await loadProjectData();
			} else {
				if (taskCard && previousParent) {
					previousParent.append(taskCard);
				}
				await showAlertModal(
					res.message || "Não foi possível alterar o status da demanda.",
					"Status não alterado",
				);
			}
		});
	});
}

function applyTaskSearch() {
	if (!searchInput) return;
	const query = normalizeString(searchInput.value.trim());
	document
		.querySelectorAll(".project-task-item[data-task-id]")
		.forEach((card) => {
			card.hidden = !normalizeString(card.textContent).includes(query);
		});
}

function updateProjectLinks() {
	const membersTab = document.getElementById("project-members-tab");
	if (membersTab) {
		membersTab.href = `../project_members/project_members.html?project_id=${encodeURIComponent(projectId)}`;
	}

	const addTaskBtn = document.getElementById("project-add-task-btn");
	if (addTaskBtn) {
		addTaskBtn.href = `../../demand/register_demand/register_demand.html?project_id=${encodeURIComponent(projectId)}`;
	}

	const headerAddTask = document.querySelector("[data-add-task-link]");
	if (headerAddTask) {
		headerAddTask.href = `../../demand/register_demand/register_demand.html?project_id=${encodeURIComponent(projectId)}`;
	}

	// Atualiza todos os links de status para apontar exatamente para a categoria específica + projeto atual
	document.querySelectorAll("a[data-status-link]").forEach((link) => {
		const status = link.dataset.statusLink || "";
		const params = new URLSearchParams();
		if (status) params.set("status", status);
		params.set("project_id", projectId);
		link.href = `../../demand/demands_list/demands_list.html?${params.toString()}`;
	});
}

async function loadProjectData() {
	updateCurrentDate();

	if (!projectId) {
		const projectsRes = await getProjects();
		if (projectsRes.success && projectsRes.projects.length > 0) {
			projectId = String(projectsRes.projects[0].project_id);
		} else {
			await showAlertModal(
				"Nenhum projeto encontrado para exibição.",
				"Atenção",
			);
			window.location.href = "../projects_list/projects_list.html";
			return;
		}
	}

	updateProjectLinks();

	const [detailsRes, tasksRes] = await Promise.all([
		getProject(projectId),
		getProjectTasks(projectId),
	]);

	if (detailsRes.success && detailsRes.project) {
		const p = detailsRes.project;
		const title = p.project_name || p.title || "Projeto";

		document.title = `TaskOps - ${title}`;
		const titleEl = document.getElementById("project-title");
		const breadcrumbEl = document.getElementById("project-breadcrumb-title");
		if (titleEl) titleEl.textContent = title;
		if (breadcrumbEl) breadcrumbEl.textContent = title;

		const total = Number(p.total_tasks || 0);
		updateMetricCard("total", total, total, false);
		updateMetricCard("ABERTA", Number(p.abertas || 0), total, false);
		updateMetricCard("EM ANDAMENTO", Number(p.em_andamento || 0), total, false);
		updateMetricCard("EM REVISAO", Number(p.em_revisao || 0), total, false);
		updateMetricCard("CANCELADA", Number(p.canceladas || 0), total, false);
		updateMetricCard("CONCLUIDA", Number(p.concluidas || 0), total, true);
	}

	if (tasksRes.success) {
		boardColumns.forEach((col) => {
			const list = col.querySelector(".project-task-list");
			if (list) list.innerHTML = "";
		});

		tasksRes.tasks.forEach((task) => {
			const column = boardColumns.find(
				(col) => col.dataset.taskStatus === task.status,
			);
			if (column) {
				column
					.querySelector(".project-task-list")
					?.insertAdjacentHTML("beforeend", renderTaskCard(task));
			}
		});

		bindTaskCardDragEvents();
		applyTaskSearch();
	}

	applyRoleRestrictions();
	if (window.lucide) {
		window.lucide.createIcons();
	}
}

if (searchInput) {
	searchInput.addEventListener("input", applyTaskSearch);
}

initBoardColumnDropZones();
headerPromise.then(() => {
	loadProjectData();
});
