import { requireAuth, initUserProfile } from "../../../assets/js/repositories/authRepository.js";
import {
    getTaskDetails,
    updateTask,
    updateTaskStatus,
    getTaskComments,
    createTaskComment,
    getTaskHistory
} from "../../../assets/js/repositories/taskRepository.js";

requireAuth();
initUserProfile();

const urlParams = new URLSearchParams(window.location.search);
let taskId = urlParams.get("task_id") || "1";

let originalTaskData = null;

// Form elements
const formDetails = document.getElementById("demand-details-forms");
const formLogs = document.getElementById("demand-logs-forms");
const titleInput = document.getElementById("demand-details-title");
const typeSelect = document.getElementById("demand-details-type");
const prioritySelect = document.getElementById("demand-details-priority");
const projectInput = document.getElementById("demand-details-associated-project");
const statusSelect = document.getElementById("demand-details-status");
const descriptionTextarea = document.getElementById("demand-details-description");

const saveBtn = document.getElementById("demand-details-save");
const revertBtn = document.getElementById("demand-details-revert-button");

const commentInput = document.getElementById("demand-details-comment");
const commentBtn = document.getElementById("demand-details-comment-button");
const historyContainer = document.querySelector(".demand-details-history");

// Tabs
const infoTab = document.getElementById("demand-details-info-tab");
const historyTab = document.getElementById("demand-details-history-tab");

// Date formatting
function formatDateTime(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatTaskCode(id) {
    return `TAR${String(id).padStart(5, "0")}`;
}

// Tab Switching
if (infoTab && historyTab && formDetails && formLogs) {
    infoTab.addEventListener("click", (e) => {
        e.preventDefault();
        infoTab.classList.add("demand-details-selected-tab");
        historyTab.classList.remove("demand-details-selected-tab");
        formDetails.style.display = "";
        formLogs.style.display = "none";
    });

    historyTab.addEventListener("click", (e) => {
        e.preventDefault();
        historyTab.classList.add("demand-details-selected-tab");
        infoTab.classList.remove("demand-details-selected-tab");
        formDetails.style.display = "none";
        formLogs.style.display = "block";
    });

    // Default view: info tab
    formDetails.style.display = "";
    formLogs.style.display = "none";
}

// Populate UI with task data
function populateFields(task) {
    originalTaskData = { ...task };
    const code = formatTaskCode(task.task_id);

    // Headings and breadcrumb
    const mainHeading = document.querySelector(".details-heading h1");
    if (mainHeading) mainHeading.textContent = code;

    const sectionHeadingText = document.querySelector(".demand-details-section-heading p");
    if (sectionHeadingText) sectionHeadingText.textContent = `Informações da demanda ${code}`;

    const breadcrumbCode = document.querySelector(".details-breadcrumb-link span");
    if (breadcrumbCode) breadcrumbCode.textContent = code;

    const projectBreadcrumb = document.querySelector(".details-breadcrumb ul li:nth-child(3) a");
    if (projectBreadcrumb && task.project_title) {
        projectBreadcrumb.textContent = task.project_title;
        projectBreadcrumb.href = `../../project/project_details/project_details.html?project_id=${task.fk_project_id}`;
    }

    // Inputs
    if (titleInput) titleInput.value = task.title || "";
    if (typeSelect) typeSelect.value = task.type || "TAREFA";
    if (prioritySelect) prioritySelect.value = task.priority || "MEDIA";
    if (projectInput) {
        projectInput.value = task.project_title || "";
        projectInput.readOnly = true;
    }
    if (statusSelect) statusSelect.value = task.status || "ABERTA";
    if (descriptionTextarea) descriptionTextarea.value = task.description || "";

    // Dates
    const datesPs = document.querySelectorAll(".demand-details-dates > p");
    if (datesPs.length >= 2) {
        datesPs[0].innerHTML = `Criado em: <span>${formatDateTime(task.creation_date)}</span>`;
        datesPs[1].innerHTML = `Prazo: <span>${formatDateTime(task.due_date)}</span>`;
    }

    // Users
    const requesterName = document.getElementById("demand-details-requester-name");
    const requesterRole = document.getElementById("demand-details-requester-role");
    if (requesterName) requesterName.textContent = task.creator_name || "Criador";
    if (requesterRole) requesterRole.textContent = "Criador da demanda";

    const assigneeName = document.getElementById("demand-details-assignee-name");
    const assigneeRole = document.getElementById("demand-details-assignee-role");
    if (assigneeName) assigneeName.textContent = task.responsible_name || "Não atribuído";
    if (assigneeRole) assigneeRole.textContent = task.responsible_name ? "Responsável designado" : "-";
}

// Load Task Details
async function loadTask() {
    try {
        const res = await getTaskDetails(taskId);
        if (res.success && res.task) {
            populateFields(res.task);
            await loadCommentsAndHistory();
        } else {
            window.alert(res.message || "Demanda não encontrada.");
        }
    } catch (err) {
        console.error("Erro ao carregar detalhes da demanda:", err);
    }
}

// Load comments and audit history
async function loadCommentsAndHistory() {
    if (!historyContainer) return;

    try {
        const [commentsRes, historyRes] = await Promise.all([
            getTaskComments(taskId),
            getTaskHistory(taskId)
        ]);

        const comments = (commentsRes.success && commentsRes.comments) ? commentsRes.comments : [];
        const history = (historyRes.success && historyRes.history) ? historyRes.history : [];

        // Combine and sort by date descending
        const items = [];

        comments.forEach(c => {
            items.push({
                type: "comment",
                author: c.author_name || "Usuário",
                content: c.content,
                date: new Date(c.creation_date)
            });
        });

        history.forEach(h => {
            items.push({
                type: "system",
                author: h.user_name || "Sistema",
                field: h.field_name,
                oldValue: h.old_value,
                newValue: h.new_value,
                date: new Date(h.date)
            });
        });

        items.sort((a, b) => b.date - a.date);

        if (items.length === 0) {
            historyContainer.innerHTML = "<p class='text-subtitle p-16'>Nenhum histórico ou anotação registrado.</p>";
            return;
        }

        historyContainer.innerHTML = items.map(item => {
            if (item.type === "comment") {
                return `
                    <div class="demand-details-history-entry demand-details-history-entry-comment">
                        <div class="demand-details-section-heading">
                            <div class="demand-details-history-title">
                                <span class="demand-details-history-icon demand-details-comment-icon" aria-hidden="true"></span>
                                <p>Comentário</p>
                            </div>
                            <div class="demand-details-history-date">
                                <p>${formatDateTime(item.date)}</p>
                            </div>
                        </div>
                        <div class="demand-details-history-content">
                            <p class="demand-details-history-author">${item.author}:</p>
                            <p class="demand-details-history-comment">${item.content}</p>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="demand-details-history-entry demand-details-history-entry-system">
                        <div class="demand-details-section-heading">
                            <div class="demand-details-history-title">
                                <span class="demand-details-history-icon demand-details-system-icon" aria-hidden="true"></span>
                                <p>Sistema</p>
                            </div>
                            <div class="demand-details-history-date">
                                <p>${formatDateTime(item.date)}</p>
                            </div>
                        </div>
                        <div class="demand-details-history-content">
                            <p><strong>${item.author}</strong> alterou <strong>${item.field}</strong>.</p>
                            <p class="demand-details-history-change">De: ${item.oldValue ?? '(vazio)'} → Para: ${item.newValue}</p>
                        </div>
                    </div>
                `;
            }
        }).join("");
    } catch (err) {
        console.error("Erro ao carregar histórico/comentários:", err);
    }
}

// Add comment
if (commentBtn && commentInput) {
    commentBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const content = commentInput.value.trim();
        if (!content) {
            window.alert("Digite um comentário antes de enviar.");
            return;
        }

        try {
            const res = await createTaskComment(taskId, content);
            if (res.success) {
                commentInput.value = "";
                await loadCommentsAndHistory();
            } else {
                window.alert(res.message || "Erro ao adicionar comentário.");
            }
        } catch (err) {
            window.alert("Erro ao enviar comentário.");
        }
    });
}

// Save changes
if (saveBtn) {
    saveBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        if (!titleInput.value.trim()) {
            window.alert("O título da demanda não pode ser vazio.");
            return;
        }

        try {
            // First check if status changed
            if (statusSelect && originalTaskData && statusSelect.value !== originalTaskData.status) {
                const statusRes = await updateTaskStatus(taskId, statusSelect.value);
                if (!statusRes.success) {
                    window.alert(statusRes.message || "Erro ao alterar status da demanda.");
                    return;
                }
            }

            // Update other fields
            const updatePayload = {
                title: titleInput.value.trim(),
                description: descriptionTextarea.value.trim(),
                type: typeSelect.value,
                priority: prioritySelect.value
            };

            const updateRes = await updateTask(taskId, updatePayload);
            if (updateRes.success) {
                window.alert("Alterações salvas com sucesso!");
                await loadTask();
            } else {
                window.alert(updateRes.message || "Erro ao atualizar demanda.");
            }
        } catch (err) {
            window.alert("Erro ao salvar alterações.");
        }
    });
}

// Revert changes
if (revertBtn) {
    revertBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (originalTaskData) {
            populateFields(originalTaskData);
        }
    });
}

// Prevent default form submits
if (formDetails) formDetails.addEventListener("submit", (e) => e.preventDefault());
if (formLogs) formLogs.addEventListener("submit", (e) => e.preventDefault());

// Initial load
loadTask();
