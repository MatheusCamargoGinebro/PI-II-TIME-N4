/*
    Autor: 
    dashboard.js -> Carrega dinamicamente as métricas do Dashboard e a listagem filtrável/ordenável de demandas via API.
*/

import { requireAuth } from "../../assets/js/repositories/authRepository.js";
import { initAppHeader } from "../../assets/js/components/header.js";
import {
	getDashboard,
	listTasks,
} from "../../assets/js/repositories/taskRepository.js";
import { normalizeString } from "../../assets/js/normalize.js";
import {
	escapeHtml,
	formatShortDate,
	formatTaskCode,
	getPriorityInfo,
	getStatusInfo,
	getTypeLabel,
	renderProgressSegments,
} from "../../assets/js/utils/formatters.js";

requireAuth();
initAppHeader({ activePage: "dashboard" });

// Atualiza relógio e data atual no topo do Dashboard
function updateClock() {
	const clockEl = document.getElementById("dashboard-clock");
	const dateEl = document.getElementById("dashboard-date");
	const now = new Date();

	if (clockEl) {
		const hours = String(now.getHours()).padStart(2, "0");
		const minutes = String(now.getMinutes()).padStart(2, "0");
		clockEl.textContent = `${hours}h${minutes}`;
	}

	if (dateEl) {
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
		dateEl.textContent = `${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
	}
}

updateClock();
setInterval(updateClock, 30000);

// Atualiza um card de métrica de status com contagem, barra de progresso e percentual real
function updateStatusCard(cardKey, count, total, accent = false) {
	const card = document.querySelector(`[data-metric-card="${cardKey}"]`);
	if (!card) return;

	const valueEl = card.querySelector("[data-metric-value]");
	const barEl = card.querySelector("[data-metric-bar]");
	const subtitleEl = card.querySelector("[data-metric-subtitle]");

	if (valueEl) valueEl.textContent = String(count);
	if (barEl) barEl.innerHTML = renderProgressSegments(count, total, 19, accent);

	if (subtitleEl) {
		const pct = total > 0 ? Math.round((count / total) * 100) : 0;
		subtitleEl.textContent =
			cardKey === "CONCLUIDA"
				? `${pct}% das demandas concluídas`
				: `${pct}% do total de demandas`;
	}
}

// Renderiza listas resumidas (Críticas em aberto / Próximas do prazo)
function renderMiniTaskList(containerId, tasks, emptyMessage) {
	const container = document.getElementById(containerId);
	if (!container) return;

	if (!tasks || tasks.length === 0) {
		container.innerHTML = `<p class="text-subtitle font-inter text-small">${escapeHtml(emptyMessage)}</p>`;
		return;
	}

	container.innerHTML = tasks
		.slice(0, 4)
		.map((task) => {
			const statusInfo = getStatusInfo(task.status);
			return `
				<a href="../demand/demand_details/demand_details.html?task_id=${task.task_id}" class="dashboard-mini-item">
					<span class="dashboard-mini-item-title">${escapeHtml(formatTaskCode(task.task_id))} - ${escapeHtml(task.title)}</span>
					<span class="dashboard-mini-item-meta">${escapeHtml(task.due_date ? formatShortDate(task.due_date) : statusInfo.label)}</span>
				</a>
			`;
		})
		.join("");
}

// Carrega métricas consolidadas do Dashboard pela API (GET /tasks/dashboard)
async function loadMetrics() {
	const res = await getDashboard();
	if (!res.success || !res.dashboard) return;

	const d = res.dashboard;
	const total = Number(d.total_tasks || 0);
	const byStatus = d.by_status || {};
	const byPriority = d.by_priority || {};
	const byType = d.by_type || {};

	// Card Total
	const totalCard = document.querySelector('[data-metric-card="total"]');
	if (totalCard) {
		const valEl = totalCard.querySelector("[data-metric-value]");
		const subEl = totalCard.querySelector("[data-metric-subtitle]");
		if (valEl) valEl.textContent = String(total);
		if (subEl) {
			const activeCount =
				Number(byStatus.ABERTA || 0) +
				Number(byStatus["EM ANDAMENTO"] || 0) +
				Number(byStatus["EM REVISAO"] || 0);
			subEl.textContent = `${activeCount} ${activeCount === 1 ? "demanda ativa" : "demandas ativas"} no momento`;
		}
	}

	// Cards por Status
	updateStatusCard("ABERTA", Number(byStatus.ABERTA || 0), total, false);
	updateStatusCard(
		"EM ANDAMENTO",
		Number(byStatus["EM ANDAMENTO"] || 0),
		total,
		false,
	);
	updateStatusCard("CANCELADA", Number(byStatus.CANCELADA || 0), total, false);
	updateStatusCard(
		"EM REVISAO",
		Number(byStatus["EM REVISAO"] || 0),
		total,
		false,
	);
	updateStatusCard("CONCLUIDA", Number(byStatus.CONCLUIDA || 0), total, true);

	// Resumo por Prioridade
	const priorityList = document.getElementById("dashboard-by-priority");
	if (priorityList) {
		const items = [
			{
				label: "Crítica",
				count: Number(byPriority.CRITICA || 0),
				dot: "badge-pink",
			},
			{ label: "Alta", count: Number(byPriority.ALTA || 0), dot: "badge-pink" },
			{
				label: "Média",
				count: Number(byPriority.MEDIA || 0),
				dot: "badge-blue",
			},
			{
				label: "Baixa",
				count: Number(byPriority.BAIXA || 0),
				dot: "badge-green",
			},
		];
		priorityList.innerHTML = items
			.map(
				(item) => `
					<li class="dashboard-breakdown-item">
						<span class="align-center gap-8">
							<span class="badge-dot ${item.dot}"></span>
							${item.label}
						</span>
						<strong>${item.count}</strong>
					</li>
				`,
			)
			.join("");
	}

	// Resumo por Tipo
	const typeList = document.getElementById("dashboard-by-type");
	if (typeList) {
		const items = [
			{ label: "Tarefa", count: Number(byType.TAREFA || 0) },
			{ label: "Defeito", count: Number(byType.DEFEITO || 0) },
			{ label: "Melhoria", count: Number(byType.MELHORIA || 0) },
			{ label: "Documentação", count: Number(byType.DOCUMENTACAO || 0) },
		];
		typeList.innerHTML = items
			.map(
				(item) => `
					<li class="dashboard-breakdown-item">
						<span>${item.label}</span>
						<strong>${item.count}</strong>
					</li>
				`,
			)
			.join("");
	}

	// Demandas Críticas em Aberto
	const criticalBadge = document.getElementById("critical-open-badge");
	if (criticalBadge)
		criticalBadge.textContent = String(d.critical_open_count || 0);
	renderMiniTaskList(
		"dashboard-critical-list",
		d.critical_open_tasks,
		"Nenhuma demanda crítica em aberto.",
	);

	// Demandas Próximas do Prazo (inclui atrasadas se houver)
	const upcomingBadge = document.getElementById("upcoming-deadline-badge");
	const upcomingTasks = [
		...(d.overdue_tasks || []),
		...(d.upcoming_deadline_tasks || []),
	];
	if (upcomingBadge) upcomingBadge.textContent = String(upcomingTasks.length);
	renderMiniTaskList(
		"dashboard-upcoming-list",
		upcomingTasks,
		`Nenhuma demanda vencendo nos próximos ${d.upcoming_deadline_days || 7} dias.`,
	);
}

// Estado da tabela principal de demandas
let allTasks = [];
let currentSort = "creation_date";

const tbody = document.getElementById("dashboard-tasks-tbody");
const searchInput = document.getElementById("dashboard-task-search");
const statusFilter = document.getElementById("dashboard-task-status");
const priorityFilter = document.getElementById("dashboard-task-priority");
const typeFilter = document.getElementById("dashboard-task-type");
const countLabel = document.getElementById("dashboard-task-count");
const emptyState = document.getElementById("dashboard-task-empty");
const sortButtons = document.querySelectorAll(
	".dashboard-task-tabs [data-sort]",
);

const statusOrder = {
	ABERTA: 0,
	"EM ANDAMENTO": 1,
	"EM REVISAO": 2,
	CONCLUIDA: 3,
	CANCELADA: 4,
};

function renderTasksTable() {
	if (!tbody) return;

	const query = normalizeString(searchInput?.value.trim() || "");
	const selectedStatus = statusFilter?.value || "";
	const selectedPriority = priorityFilter?.value || "";
	const selectedType = typeFilter?.value || "";

	// Aplica filtros combinados + busca textual
	const filtered = allTasks.filter((task) => {
		if (selectedStatus && task.status !== selectedStatus) return false;
		if (selectedPriority && task.priority !== selectedPriority) return false;
		if (selectedType && task.type !== selectedType) return false;

		if (query) {
			const haystack = normalizeString(
				`${formatTaskCode(task.task_id)} ${task.title} ${task.description || ""} ${task.project_title || ""} ${task.responsible_name || ""}`,
			);
			if (!haystack.includes(query)) return false;
		}
		return true;
	});

	// Aplica ordenação conforme a aba selecionada
	filtered.sort((a, b) => {
		if (currentSort === "priority") {
			return (
				getPriorityInfo(a.priority).order - getPriorityInfo(b.priority).order
			);
		}
		if (currentSort === "due_date") {
			const timeA = a.due_date
				? new Date(a.due_date).getTime()
				: Number.MAX_SAFE_INTEGER;
			const timeB = b.due_date
				? new Date(b.due_date).getTime()
				: Number.MAX_SAFE_INTEGER;
			return timeA - timeB;
		}
		if (currentSort === "status") {
			return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
		}
		// Padrão: data de criação mais recente primeiro
		return (
			new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime()
		);
	});

	if (countLabel) {
		countLabel.textContent = `${filtered.length} ${filtered.length === 1 ? "demanda encontrada" : "demandas encontradas"}`;
	}

	if (emptyState) {
		emptyState.hidden = filtered.length > 0;
	}

	tbody.innerHTML = filtered
		.map((task) => {
			const statusInfo = getStatusInfo(task.status);
			const priorityInfo = getPriorityInfo(task.priority);
			const respName = task.responsible_name || "Não atribuído";
			const respEmail = task.responsible_email || "";
			const respAvatar =
				task.responsible_profile_pic || "../../assets/images/user.png";

			return `
				<tr>
					<td>
						<div class="dashboard-user-cell">
							<img class="dashboard-user-avatar" src="${escapeHtml(respAvatar)}" alt="${escapeHtml(respName)}" />
							<div>
								<p class="dashboard-user-name">${escapeHtml(respName)}</p>
								${respEmail ? `<p class="dashboard-user-email">${escapeHtml(respEmail)}</p>` : ""}
							</div>
						</div>
					</td>
					<td>
						<a href="../demand/demand_details/demand_details.html?task_id=${task.task_id}" class="dashboard-task-cell dashboard-task-link">
							${escapeHtml(task.title)}
						</a>
					</td>
					<td><span class="dashboard-task-cell">${escapeHtml(getTypeLabel(task.type))}</span></td>
					<td><span class="dashboard-task-cell">${escapeHtml(task.project_title || "-")}</span></td>
					<td><span class="dashboard-task-cell">${escapeHtml(formatShortDate(task.creation_date))}</span></td>
					<td><span class="dashboard-task-cell">${escapeHtml(formatShortDate(task.due_date))}</span></td>
					<td>
						<div class="align-center gap-8">
							<span class="badge-dot ${priorityInfo.dotClass}"></span>
							<span class="dashboard-task-cell">${escapeHtml(priorityInfo.label)}</span>
						</div>
					</td>
					<td><span class="status-badge ${statusInfo.className}">${escapeHtml(statusInfo.label)}</span></td>
				</tr>
			`;
		})
		.join("");
}

async function loadTasksTable() {
	const res = await listTasks();
	allTasks = res.success ? res.tasks : [];
	renderTasksTable();
}

// Eventos de filtros e ordenação
[searchInput, statusFilter, priorityFilter, typeFilter].forEach((el) => {
	if (!el) return;
	el.addEventListener("input", renderTasksTable);
	el.addEventListener("change", renderTasksTable);
});

sortButtons.forEach((button) => {
	button.addEventListener("click", () => {
		currentSort = button.dataset.sort || "creation_date";
		sortButtons.forEach((item) => {
			const active = item === button;
			item.classList.toggle("tab-active", active);
			item.setAttribute("aria-pressed", String(active));
		});
		renderTasksTable();
	});
});

// Carga inicial em paralelo
Promise.all([loadMetrics(), loadTasksTable()]).then(() => {
	if (window.lucide) {
		window.lucide.createIcons();
	}
});
