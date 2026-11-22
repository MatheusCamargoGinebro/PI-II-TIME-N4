import { requireAuth, initUserProfile } from "../../../assets/js/repositories/authRepository.js";
import { listTasks } from "../../../assets/js/repositories/taskRepository.js";
import { getProject } from "../../../assets/js/repositories/projectRepository.js";
import { normalizeString } from "../../../assets/js/normalize.js";

requireAuth();
initUserProfile();

const tableBody = document.getElementById("table-body");
const searchInput = document.getElementById("search-input");
const countLabel = document.getElementById("visible-count");
const priorityButtons = document.querySelectorAll(".filter-btn");

const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get("project_id");

let currentPriority = "todas";

// Determine status based on current filename
function getTargetStatus() {
    const path = window.location.pathname;
    if (path.includes("tarefas_concluidas")) return "CONCLUIDA";
    if (path.includes("tarefas_pendentes")) return "EM ANDAMENTO,EM REVISAO";
    return "ABERTA";
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-BR");
}

function getPriorityClass(p) {
    const s = String(p).toLowerCase();
    if (s.includes("alta") || s.includes("critica")) return "alta";
    if (s.includes("media")) return "media";
    return "baixa";
}

function getPriorityLabel(p) {
    const s = String(p).toUpperCase();
    if (s === "CRITICA") return "Crítica";
    if (s === "ALTA") return "Alta";
    if (s === "MEDIA") return "Média";
    return "Baixa";
}

function renderTasks(tasks) {
    if (!tableBody) return;

    if (!tasks || tasks.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-16 text-subtitle">Nenhuma demanda encontrada.</td></tr>`;
        if (countLabel) countLabel.textContent = "0";
        return;
    }

    tableBody.innerHTML = tasks.map(task => {
        const pClass = getPriorityClass(task.priority);
        const pLabel = getPriorityLabel(task.priority);
        const code = `TAR${String(task.task_id).padStart(5, "0")}`;
        const assignee = task.responsible_name || "Não atribuído";
        const avatar = task.responsible_profile_pic || "../../../assets/images/user.png";
        const dateLimit = formatDate(task.due_date);
        const project = task.project_title || "-";

        return `
            <tr class="task-row" data-priority="${pClass}" data-task-id="${task.task_id}">
                <td class="code-col"><a href="../demand_details/demand_details.html?task_id=${task.task_id}">${code}</a></td>
                <td class="title-col">${task.title}</td>
                <td><span class="badge-priority ${pClass}">${pLabel}</span></td>
                <td>
                    <div class="assignee-cell">
                        <img src="${avatar}" alt="${assignee}" />
                        <span>${assignee}</span>
                    </div>
                </td>
                <td class="date-col">${dateLimit}</td>
                <td class="project-col"><span class="project-badge">${project}</span></td>
            </tr>
        `;
    }).join("");

    applyFilters();
}

function applyFilters() {
    if (!tableBody) return;
    const query = normalizeString(searchInput ? searchInput.value.trim() : "");
    const rows = tableBody.querySelectorAll(".task-row");
    let visibleCount = 0;

    rows.forEach(row => {
        const rowPriority = row.getAttribute("data-priority");
        const rowText = normalizeString(row.innerText);

        const matchesPriority = currentPriority === "todas" || rowPriority === currentPriority;
        const matchesSearch = rowText.includes(query);

        if (matchesPriority && matchesSearch) {
            row.style.display = "";
            visibleCount++;
        } else {
            row.style.display = "none";
        }
    });

    if (countLabel) {
        countLabel.textContent = String(visibleCount);
    }
}

async function loadStatusTasks() {
    try {
        const status = getTargetStatus();
        const filters = { status };
        if (projectId) {
            filters.fk_project_id = projectId;
        }
        const res = await listTasks(filters);
        if (res.success) {
            renderTasks(res.tasks);
        } else {
            console.error("Erro ao listar tarefas por status:", res.message);
        }

        // Atualiza o breadcrumb com o nome real do projeto
        await updateBreadcrumbProjectName();
    } catch (err) {
        console.error("Erro ao carregar tarefas:", err);
    }
}

async function updateBreadcrumbProjectName() {
    const breadcrumbLink = document.querySelector(".breadcrumbs a[href*='project_details']");
    if (!breadcrumbLink) return;

    if (projectId) {
        try {
            const res = await getProject(projectId);
            if (res.success && res.project) {
                const projectTitle = res.project.project_name || res.project.title || "Projeto";
                breadcrumbLink.textContent = projectTitle;
                breadcrumbLink.href = `../../project/project_details/project_details.html?project_id=${projectId}`;
            }
        } catch (err) {
            console.error("Erro ao obter nome do projeto para breadcrumb:", err);
        }
    } else {
        // Sem project_id — oculta o item do projeto no breadcrumb
        const chevronBefore = breadcrumbLink.previousElementSibling;
        breadcrumbLink.style.display = "none";
        if (chevronBefore && chevronBefore.tagName === "I") {
            chevronBefore.style.display = "none";
        }
    }
}

if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
}

priorityButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        priorityButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const text = normalizeString(btn.textContent.trim());
        if (text.includes("alta") || text.includes("critica")) currentPriority = "alta";
        else if (text.includes("media")) currentPriority = "media";
        else if (text.includes("baixa")) currentPriority = "baixa";
        else currentPriority = "todas";

        applyFilters();
    });
});

// Initial load
loadStatusTasks();
