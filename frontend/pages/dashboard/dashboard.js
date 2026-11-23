import { requireAuth, initUserProfile, applyRoleRestrictions } from "../../assets/js/repositories/authRepository.js";
import { getDashboard, listTasks } from "../../assets/js/repositories/taskRepository.js";
import { normalizeString } from "../../assets/js/normalize.js";
import { showAlertModal } from "../../assets/js/components/modal.js";

// Ensure authenticated
requireAuth();
initUserProfile();

// Format date helper
function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${meses[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`;
}

function formatHour(dateStr) {
    if (!dateStr) return "14h00";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "14h00";
    return `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
}

function updateClock() {
    const clockEl = document.querySelector(".dashboard-header-date h4");
    const dateEl = document.querySelector(".dashboard-header-date p");
    const now = new Date();
    if (clockEl) {
        clockEl.textContent = `${String(now.getHours()).padStart(2, "0")}h${String(now.getMinutes()).padStart(2, "0")}`;
    }
    if (dateEl) {
        const mesesCompletos = [
            "janeiro", "fevereiro", "março", "abril", "maio", "junho",
            "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
        ];
        dateEl.textContent = `${now.getDate()} de ${mesesCompletos[now.getMonth()]} de ${now.getFullYear()}`;
    }
}
updateClock();

// Helper to determine status styling
function getStatusInfo(status) {
    const s = String(status).toUpperCase();
    if (s === "CONCLUIDA") return { label: "Completa", className: "status-complete" };
    if (s === "EM REVISAO") return { label: "Em revisão", className: "status-review" };
    if (s === "EM ANDAMENTO") return { label: "Em andamento", className: "status-review" };
    if (s === "CANCELADA") return { label: "Cancelada", className: "status-late" };
    return { label: "Aberta", className: "" };
}

// Helper to determine priority styling
function getPriorityInfo(priority) {
    const p = String(priority).toUpperCase();
    if (p === "CRITICA") return { label: "Crítica", badge: "badge-pink" };
    if (p === "ALTA") return { label: "Alta", badge: "badge-pink" };
    if (p === "MEDIA") return { label: "Média", badge: "badge-blue" };
    return { label: "Baixa", badge: "badge-green" };
}

// Load and display Dashboard Metrics
async function loadMetrics() {
    try {
        const res = await getDashboard();
        if (!res.success || !res.dashboard) return;
        const d = res.dashboard;

        // Metric Card 1: Total
        const cardTotal = document.querySelector(".dashboard-grid > div:nth-child(1) .dashboard-metric-body h1");
        if (cardTotal) cardTotal.textContent = String(d.total_tasks ?? 0);

        // Metric Card 2: Abertas
        const cardAbertas = document.querySelector(".dashboard-grid > div:nth-child(2) .dashboard-metric-body h1");
        if (cardAbertas) cardAbertas.textContent = String(d.by_status?.ABERTA ?? 0);

        // Metric Card 3: Pendentes / Em andamento
        const cardPendentes = document.querySelector(".dashboard-grid > div:nth-child(3) .dashboard-metric-body h1");
        if (cardPendentes) cardPendentes.textContent = String(d.by_status?.["EM ANDAMENTO"] ?? 0);

        // Metric Card 4: Canceladas
        const cardCanceladas = document.querySelector(".dashboard-grid > div:nth-child(5) .dashboard-metric-body h1");
        if (cardCanceladas) cardCanceladas.textContent = String(d.by_status?.CANCELADA ?? 0);

        // Metric Card 5: Em revisão
        const cardRevisao = document.querySelector(".dashboard-grid > div:nth-child(6) .dashboard-metric-body h1");
        if (cardRevisao) cardRevisao.textContent = String(d.by_status?.["EM REVISAO"] ?? 0);

        // Metric Card 6: Concluídas
        const cardConcluidas = document.querySelector(".dashboard-grid > div:nth-child(7) .dashboard-metric-body h1");
        if (cardConcluidas) cardConcluidas.textContent = String(d.by_status?.CONCLUIDA ?? 0);

        // Render upcoming in Agenda if present
        if (d.upcoming_deadline_tasks && d.upcoming_deadline_tasks.length > 0) {
            const agendaList = document.querySelector(".dashboard-agenda-list");
            if (agendaList) {
                agendaList.innerHTML = d.upcoming_deadline_tasks.slice(0, 3).map(task => `
                    <div class="dashboard-agenda-item">
                        <div class="align-center gap-8">
                            <div class="card-icon">
                                <i data-lucide="calendar" class="icon-small" style="color: var(--color-neutral-700)"></i>
                            </div>
                            <div>
                                <a href="../demand/demand_details/demand_details.html?task_id=${task.task_id}" class="text-neutral font-inter text-regular text-weight-medium">
                                    ${task.title}
                                </a>
                                <div class="align-center gap-4 text-subtitle text-tiny">
                                    <span>${formatDate(task.due_date)}</span>
                                    <i data-lucide="dot" class="icon-tiny"></i>
                                    <span>${formatHour(task.due_date)}</span>
                                </div>
                            </div>
                        </div>
                        <i data-lucide="ellipsis-vertical" class="icon-small" style="color: var(--color-neutral-700)"></i>
                    </div>
                `).join("");
            }
        }
    } catch (err) {
        console.error("Erro ao carregar métricas do dashboard:", err);
    }
}

// Load and manage Tasks Table
async function loadTasksTable() {
    const taskTable = document.querySelector(".dashboard-tasks-table");
    if (!taskTable) return;

    const taskBody = taskTable.querySelector("tbody");
    const searchInput = document.querySelector("#dashboard-task-search");
    const statusFilter = document.querySelector("#dashboard-task-status");
    const countLabel = document.querySelector("#dashboard-task-count");
    const emptyState = document.querySelector("#dashboard-task-empty");
    const sortButtons = document.querySelectorAll(".dashboard-task-tabs [data-sort]");

    const priorityOrder = { critica: 0, alta: 1, media: 2, baixa: 3 };
    let currentSort = "default";
    let allTaskRows = [];

    try {
        const res = await listTasks();
        const tasks = res.success ? res.tasks : [];

        if (tasks.length > 0) {
            taskBody.innerHTML = tasks.map(task => {
                const statusInfo = getStatusInfo(task.status);
                const priorityInfo = getPriorityInfo(task.priority);
                const respName = task.responsible_name || "Não atribuído";
                const respEmail = task.responsible_email || "";
                const respAvatar = task.responsible_profile_pic || "../../assets/images/user.png";
                const projTitle = task.project_title || "Sem projeto";
                const prazo = formatDate(task.due_date);

                return `
                    <tr data-task-id="${task.task_id}" data-priority="${normalizeString(priorityInfo.label)}" data-deadline="${task.due_date || ''}">
                        <td>
                            <div class="dashboard-user-cell">
                                
                                <div>
                                    <p class="dashboard-user-name">${respName}</p>
                                    <p class="dashboard-user-email">${respEmail}</p>
                                </div>
                            </div>
                        </td>
                        <td><a href="../demand/demand_details/demand_details.html?task_id=${task.task_id}" class="dashboard-task-cell">${task.title}</a></td>
                        <td><span class="dashboard-task-cell">${projTitle}</span></td>
                        <td><span class="dashboard-task-cell">${prazo}</span></td>
                        <td>
                            <div class="align-center gap-8">
                                <span class="badge-dot ${priorityInfo.badge}"></span>
                                <span class="dashboard-task-cell">${priorityInfo.label}</span>
                            </div>
                        </td>
                        <td><span class="status-badge ${statusInfo.className}">${statusInfo.label}</span></td>
                    </tr>
                `;
            }).join("");
        }
    } catch (err) {
        console.error("Erro ao carregar lista de tarefas:", err);
    }

    allTaskRows = Array.from(taskBody.querySelectorAll("tr"));

    const getCellText = (row, index) => normalizeString(row.cells[index]?.textContent.trim() || "");

    const updateTasks = () => {
        const query = normalizeString(searchInput.value.trim());
        const status = normalizeString(statusFilter.value);
        let visibleCount = 0;

        allTaskRows.forEach((task) => {
            const matchesSearch = normalizeString(task.textContent).includes(query);
            const matchesStatus = !status || getCellText(task, 5) === status;
            task.hidden = !matchesSearch || !matchesStatus;
            if (!task.hidden) visibleCount += 1;
        });

        const visibleTasks = allTaskRows.filter((task) => !task.hidden);
        if (currentSort === "priority") {
            visibleTasks.sort((first, second) =>
                (priorityOrder[getCellText(first, 4)] ?? 99) -
                (priorityOrder[getCellText(second, 4)] ?? 99)
            );
        } else if (currentSort === "deadline") {
            visibleTasks.sort((first, second) => getCellText(first, 3).localeCompare(getCellText(second, 3), "pt-BR"));
        } else {
            visibleTasks.sort((first, second) => allTaskRows.indexOf(first) - allTaskRows.indexOf(second));
        }

        visibleTasks.forEach((task) => taskBody.append(task));
        countLabel.textContent = `${visibleCount} ${visibleCount === 1 ? "tarefa encontrada" : "tarefas encontradas"}`;
        emptyState.hidden = visibleCount > 0;
    };

    searchInput.addEventListener("input", updateTasks);
    statusFilter.addEventListener("change", updateTasks);
    sortButtons.forEach((button) => {
        button.addEventListener("click", () => {
            currentSort = button.dataset.sort;
            sortButtons.forEach((item) => {
                const active = item === button;
                item.classList.toggle("tab-active", active);
                item.setAttribute("aria-pressed", String(active));
            });
            updateTasks();
        });
    });

    updateTasks();
    applyRoleRestrictions();
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Initial invocation
loadMetrics();
loadTasksTable();
