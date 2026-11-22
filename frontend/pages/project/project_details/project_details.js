import { requireAuth, initUserProfile, applyRoleRestrictions } from "../../../assets/js/repositories/authRepository.js";
import { getProjects, getProject, getProjectTasks } from "../../../assets/js/repositories/projectRepository.js";
import { updateTaskStatus } from "../../../assets/js/repositories/taskRepository.js";
import { normalizeString } from "../../../assets/js/normalize.js";

requireAuth();
initUserProfile();

const urlParams = new URLSearchParams(window.location.search);
let projectId = urlParams.get("project_id");

const boardColumns = Array.from(document.querySelectorAll(".project-board-column[data-task-status]"));
const searchInput = document.querySelector("#task-board-search");

const columnToStatusMap = {
    "andamento": "EM ANDAMENTO",
    "revisao": "EM REVISAO",
    "cancelada": "CANCELADA",
    "concluida": "CONCLUIDA"
};

const statusToColumnMap = {
    "ABERTA": "andamento",
    "EM ANDAMENTO": "andamento",
    "EM REVISAO": "revisao",
    "CANCELADA": "cancelada",
    "CONCLUIDA": "concluida"
};

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${meses[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`;
}

function getPriorityBadge(priority) {
    const p = String(priority).toUpperCase();
    if (p === "CRITICA" || p === "ALTA") return "badge-pink";
    if (p === "MEDIA") return "badge-blue";
    return "badge-green";
}

function updateProjectDate() {
    const dateText = document.querySelector(".project-date-info p");
    if (dateText) {
        const now = new Date();
        const diasSemana = ["Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"];
        const meses = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        dateText.textContent = `Hoje é ${diasSemana[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]}`;
    }
}

function renderTaskCard(task) {
    const prazo = formatDate(task.due_date);
    const badge = getPriorityBadge(task.priority);
    const priorityLabel = task.priority ? (task.priority.charAt(0) + task.priority.slice(1).toLowerCase()) : "Média";

    return `
        <div class="project-task-item" data-task-id="${task.task_id}" data-current-status="${task.status}" draggable="true" tabindex="0">
            <div class="between align-center">
                <div>
                    <a href="../../demand/demand_details/demand_details.html?task_id=${task.task_id}" class="text-neutral font-inter text-regular text-weight-medium">
                        ${task.title}
                    </a>
                    <div class="align-center gap-4 text-subtitle text-tiny">
                        <span>${prazo}</span>
                        <span class="dot-separator"></span>
                        <span>${priorityLabel}</span>
                    </div>
                </div>
                <div class="align-center gap-8">
                    <span class="badge-dot ${badge}"></span>
                </div>
            </div>
            ${task.responsible_name ? `
                <div class="align-center gap-8 mt-8">
                    <img src="${task.responsible_profile_pic || '../../../assets/images/user.png'}" class="icon-tiny rounded-full" alt="" style="width: 18px; height: 18px; border-radius: 50%;" />
                    <span class="text-tiny text-subtitle">${task.responsible_name}</span>
                </div>
            ` : ''}
        </div>
    `;
}

function updateSegments(cardIndex, count, total, accent = false) {
    const card = document.querySelector(`.project-details-grid > div:nth-child(${cardIndex})`);
    if (!card) return;
    const segments = card.querySelectorAll(".progress-bar-segment");
    const filledCount = total > 0 ? Math.round((count / total) * segments.length) : 0;
    segments.forEach((seg, idx) => {
        seg.className = "progress-bar-segment";
        if (idx < filledCount) {
            seg.classList.add(accent ? "progress-bar-accent-filled" : "progress-bar-filled");
        } else {
            seg.classList.add(accent ? "progress-bar-accent-empty" : "progress-bar-empty");
        }
    });
}

async function loadProjectData() {
    try {
        updateProjectDate();

        if (!projectId) {
            const projectsRes = await getProjects();
            if (projectsRes.success && projectsRes.projects.length > 0) {
                projectId = projectsRes.projects[0].project_id;
            } else {
                return;
            }
        }

        // Atualiza links com o project_id
        const membersTab = document.querySelector(".project-details-toolbar a[href*='project_members']");
        if (membersTab) membersTab.href = `../project_members/project_members.html?project_id=${projectId}`;

        const addTaskBtn = document.querySelector(".project-details-header a[href*='register_demand']");
        if (addTaskBtn) addTaskBtn.href = `../../demand/register_demand/register_demand.html?project_id=${projectId}`;

        // Atualiza os links das páginas de status com o project_id
        document.querySelectorAll("a[href*='demand_status']").forEach(link => {
            const url = new URL(link.href, window.location.href);
            url.searchParams.set("project_id", projectId);
            link.href = url.pathname + url.search;
        });

        // Obtém métricas e dados do projeto
        const detailsRes = await getProject(projectId);
        if (detailsRes.success && detailsRes.project) {
            const p = detailsRes.project;
            const projectTitle = p.project_name || p.title || "Projeto";

            const heading = document.querySelector(".project-details-header-info h2");
            if (heading) heading.textContent = projectTitle;

            const breadcrumb = document.querySelector(".breadcrumb-item.active");
            if (breadcrumb) breadcrumb.textContent = projectTitle;

            // Extrai as métricas reais retornadas pelo backend
            const total = Number(p.total_tasks ?? 0);
            const abertas = Number(p.abertas ?? 0);
            const emAndamento = Number(p.em_andamento ?? 0);
            const emRevisao = Number(p.em_revisao ?? 0);
            const pendentes = emAndamento + emRevisao;
            const concluidas = Number(p.concluidas ?? 0);

            // Card 1: Total de Tarefas
            const totalH1 = document.querySelector(".project-details-grid > div:nth-child(1) .project-metric-body h1");
            if (totalH1) totalH1.textContent = String(total);
            const totalDesc = document.querySelector(".project-details-grid > div:nth-child(1) .text-subtitle p");
            if (totalDesc) totalDesc.textContent = `${total} ${total === 1 ? 'tarefa no projeto.' : 'tarefas no projeto.'}`;

            // Card 2: Tarefas Abertas
            const abertasH1 = document.querySelector(".project-details-grid > div:nth-child(2) .project-metric-body h1");
            if (abertasH1) abertasH1.textContent = String(abertas);
            updateSegments(2, abertas, total, false);
            const abertasDesc = document.querySelector(".project-details-grid > div:nth-child(2) .text-subtitle p");
            if (abertasDesc) {
                const pct = total > 0 ? Math.round((abertas / total) * 100) : 0;
                abertasDesc.textContent = `${pct}% do total de tarefas.`;
            }

            // Card 3: Tarefas Pendentes
            const pendentesH1 = document.querySelector(".project-details-grid > div:nth-child(3) .project-metric-body h1");
            if (pendentesH1) pendentesH1.textContent = String(pendentes);
            updateSegments(3, pendentes, total, false);
            const pendentesDesc = document.querySelector(".project-details-grid > div:nth-child(3) .text-subtitle p");
            if (pendentesDesc) {
                const pct = total > 0 ? Math.round((pendentes / total) * 100) : 0;
                pendentesDesc.textContent = `${pct}% do total de tarefas.`;
            }

            // Card 4: Tarefas Concluídas
            const concluidasH1 = document.querySelector(".project-details-grid > div:nth-child(4) .project-metric-body h1");
            if (concluidasH1) concluidasH1.textContent = String(concluidas);
            updateSegments(4, concluidas, total, true);
            const concluidasDesc = document.querySelector(".project-details-grid > div:nth-child(4) > div:last-child p");
            if (concluidasDesc) {
                const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;
                concluidasDesc.textContent = `${pct}% do total concluído.`;
            }
        }

        // Obtém tarefas do projeto para o quadro
        const tasksRes = await getProjectTasks(projectId);
        if (tasksRes.success) {
            // Limpa as colunas do quadro
            boardColumns.forEach(col => {
                const list = col.querySelector(".project-task-list");
                if (list) list.innerHTML = "";
            });

            // Popula tarefas
            tasksRes.tasks.forEach(task => {
                const colKey = statusToColumnMap[task.status] || "andamento";
                const column = boardColumns.find(c => c.dataset.taskStatus === colKey);
                if (column) {
                    const list = column.querySelector(".project-task-list");
                    if (list) {
                        list.insertAdjacentHTML("beforeend", renderTaskCard(task));
                    }
                }
            });

            setupDragAndDrop();
            applyTaskSearch();
        }

        // Aplica restrições de permissões (oculta opções de administrador)
        applyRoleRestrictions();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    } catch (err) {
        console.error("Erro ao carregar dados do projeto:", err);
    }
}

function setupDragAndDrop() {
    const taskCards = Array.from(document.querySelectorAll(".project-task-item[data-task-id]"));

    taskCards.forEach((task) => {
        task.addEventListener("dragstart", (event) => {
            task.classList.add("is-dragging");
            event.dataTransfer.setData("text/plain", task.dataset.taskId);
            event.dataTransfer.setData("application/source-col", task.closest(".project-board-column").dataset.taskStatus);
            event.dataTransfer.effectAllowed = "move";
        });
        task.addEventListener("dragend", () => task.classList.remove("is-dragging"));
    });

    boardColumns.forEach((column) => {
        column.addEventListener("dragover", (event) => {
            event.preventDefault();
            column.classList.add("is-drop-target");
            event.dataTransfer.dropEffect = "move";
        });
        column.addEventListener("dragleave", (event) => {
            if (!column.contains(event.relatedTarget)) column.classList.remove("is-drop-target");
        });
        column.addEventListener("drop", async (event) => {
            event.preventDefault();
            column.classList.remove("is-drop-target");
            const taskId = event.dataTransfer.getData("text/plain");
            const sourceCol = event.dataTransfer.getData("application/source-col");
            const targetCol = column.dataset.taskStatus;

            if (sourceCol === targetCol) return;

            const targetStatus = columnToStatusMap[targetCol];
            if (!targetStatus) return;

            const taskCard = document.querySelector(`.project-task-item[data-task-id="${taskId}"]`);
            if (!taskCard) return;

            const previousParent = taskCard.parentElement;
            column.querySelector(".project-task-list").append(taskCard);

            try {
                const res = await updateTaskStatus(taskId, targetStatus);
                if (res.success) {
                    taskCard.dataset.currentStatus = targetStatus;
                    await loadProjectData();
                } else {
                    window.alert(res.message || "Não foi possível alterar o status da demanda.");
                    previousParent.append(taskCard);
                }
            } catch (err) {
                window.alert("Erro ao comunicar com o servidor.");
                previousParent.append(taskCard);
            }
        });
    });
}

function applyTaskSearch() {
    if (!searchInput) return;
    const query = normalizeString(searchInput.value.trim());
    const taskCards = Array.from(document.querySelectorAll(".project-task-item[data-task-id]"));

    taskCards.forEach((task) => {
        task.hidden = !normalizeString(task.textContent).includes(query);
    });
}

if (searchInput) {
    searchInput.addEventListener("input", applyTaskSearch);
}

// Carga inicial
loadProjectData();
