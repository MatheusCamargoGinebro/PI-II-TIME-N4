import { requireAuth, initUserProfile, listUsers } from "../../../assets/js/repositories/authRepository.js";
import { getProjectMembers } from "../../../assets/js/repositories/projectRepository.js";
import {
    getTaskDetails,
    updateTask,
    updateTaskStatus,
    getTaskComments,
    createTaskComment,
    getTaskHistory
} from "../../../assets/js/repositories/taskRepository.js";
import { normalizeString } from "../../../assets/js/normalize.js";
import { showAlertModal, showSelectModal } from "../../../assets/js/components/modal.js";

requireAuth();
initUserProfile();

const urlParams = new URLSearchParams(window.location.search);
let taskId = urlParams.get("task_id") || "1";

let originalTaskData = null;
let selectedResponsible = null; // { id, name, email, profile_pic, role }

// Form elements
const formDetails = document.getElementById("demand-details-forms");
const formLogs = document.getElementById("demand-logs-forms");
const titleInput = document.getElementById("demand-details-title");
const typeSelect = document.getElementById("demand-details-type");
const prioritySelect = document.getElementById("demand-details-priority");
const projectInput = document.getElementById("demand-details-associated-project");
const statusSelect = document.getElementById("demand-details-status");
const descriptionTextarea = document.getElementById("demand-details-description");

const assigneeCard = document.querySelector(".demand-details-assignee");
const assigneeAvatar = assigneeCard ? assigneeCard.querySelector("img") : null;
const assigneeName = document.getElementById("demand-details-assignee-name");
const assigneeRole = document.getElementById("demand-details-assignee-role");

const saveBtn = document.getElementById("demand-details-save");
const revertBtn = document.getElementById("demand-details-revert-button");

const commentInput = document.getElementById("demand-details-comment");
const commentBtn = document.getElementById("demand-details-comment-button");
const historyContainer = document.querySelector(".demand-details-history");

// Tabs
const infoTab = document.getElementById("demand-details-info-tab");
const historyTab = document.getElementById("demand-details-history-tab");

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

function renderAssignee(responsible) {
    if (!assigneeName || !assigneeRole) return;

    if (responsible && responsible.name) {
        assigneeName.textContent = responsible.name;
        assigneeRole.textContent = responsible.role || "Responsável designado";
        if (assigneeAvatar) {
            assigneeAvatar.src = responsible.profile_pic || "../../../assets/images/user.png";
        }
    } else {
        assigneeName.textContent = "Não atribuído";
        assigneeRole.textContent = "Clique para atribuir";
        if (assigneeAvatar) {
            assigneeAvatar.src = "../../../assets/images/user.png";
        }
    }
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

    formDetails.style.display = "";
    formLogs.style.display = "none";
}

function populateFields(task) {
    originalTaskData = { ...task };
    const code = formatTaskCode(task.task_id);

    const initialResponsibleId = task.fk_user_id ?? task.responsible_id ?? null;
    selectedResponsible = task.responsible_name
        ? {
            id: initialResponsibleId != null ? String(initialResponsibleId) : null,
            name: task.responsible_name,
            email: task.responsible_email || "",
            role: "Responsável designado",
            profile_pic: task.responsible_profile_pic || "../../../assets/images/user.png"
        }
        : null;

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

    if (titleInput) titleInput.value = task.title || "";
    if (typeSelect) typeSelect.value = task.type || "TAREFA";
    if (prioritySelect) prioritySelect.value = task.priority || "MEDIA";
    if (projectInput) {
        projectInput.value = task.project_title || "";
        projectInput.readOnly = true;
    }
    if (statusSelect) statusSelect.value = task.status || "ABERTA";
    if (descriptionTextarea) descriptionTextarea.value = task.description || "";

    const datesPs = document.querySelectorAll(".demand-details-dates > p");
    if (datesPs.length >= 2) {
        datesPs[0].innerHTML = `Criado em: <span>${formatDateTime(task.creation_date)}</span>`;
        datesPs[1].innerHTML = `Prazo: <span>${formatDateTime(task.due_date)}</span>`;
    }

    const requesterName = document.getElementById("demand-details-requester-name");
    const requesterRole = document.getElementById("demand-details-requester-role");
    if (requesterName) requesterName.textContent = task.creator_name || "Criador";
    if (requesterRole) requesterRole.textContent = "Criador da demanda";

    renderAssignee(selectedResponsible);
}
async function getCandidateAssignees(projectId) {
    if (projectId) {
        const membersRes = await getProjectMembers(projectId);
        if (membersRes.success && Array.isArray(membersRes.members) && membersRes.members.length > 0) {
            return membersRes.members
                .map((m, index) => {
                    const rawId = m.user_id ?? m.id ?? m.member_id;
                    if (rawId == null) return null;
                    return {
                        id: String(rawId),
                        name: m.member_name || m.name || "Usuário",
                        email: m.member_email || m.email || "",
                        role: m.authority_level || "Membro de projeto",
                        profile_pic: m.profile_pic || "../../../assets/images/user.png"
                    };
                })
                .filter(Boolean);
        }
    }

    const usersRes = await listUsers();
    if (usersRes.success && Array.isArray(usersRes.users)) {
        return usersRes.users
            .map((u) => {
                const rawId = u.user_id ?? u.id;
                if (rawId == null) return null;
                return {
                    id: String(rawId),
                    name: u.name || "Usuário",
                    email: u.email || "",
                    role: u.authority_level || "Usuário",
                    profile_pic: u.profile_pic || "../../../assets/images/user.png"
                };
            })
            .filter(Boolean);
    }

    return [];
}

if (assigneeCard) {
    assigneeCard.setAttribute("role", "button");
    assigneeCard.setAttribute("tabindex", "0");
    assigneeCard.title = "Clique para alterar o responsável";

    const openAssigneeModal = async () => {
        try {
            const projectId = originalTaskData?.fk_project_id;
            const candidates = await getCandidateAssignees(projectId);

            if (candidates.length === 0) {
                showAlertModal("Nenhum usuário disponível para atribuir à demanda.", "Atenção");
                return;
            }

            const chosenId = await showSelectModal({
                title: "Alterar responsável",
                message: "Selecione o membro responsável pela demanda:",
                items: candidates,
                searchPlaceholder: "Buscar por nome, e-mail ou ID...",
                confirmText: "Selecionar",
                getItemId: (u) => u.id,
                getSearchText: (u) => normalizeString(`${u.id} ${u.name} ${u.email} ${u.role}`),
                renderItem: (u, isSelected) => `
                    <button
                        type="button"
                        role="option"
                        aria-selected="${isSelected}"
                        data-option-id="${u.id}"
                        class="base-card between align-center"
                        style="
                            width: 100%;
                            text-align: left;
                            padding: 10px 12px;
                            cursor: pointer;
                            border-radius: var(--radius-lg);
                            border: 1px solid ${isSelected ? "var(--color-primary-500)" : "var(--color-neutral-200)"};
                            background: ${isSelected ? "var(--color-primary-100)" : "var(--color-neutral-100)"};
                        "
                    >
                        <div class="align-center gap-8" style="min-width: 0;">
                            <img
                                src="${u.profile_pic}"
                                alt="${u.name}"
                                style="width: 32px; height: 32px; border-radius: var(--radius-full); object-fit: cover; flex-shrink: 0;"
                            />
                            <div style="min-width: 0;">
                                <div class="font-inter text-small text-weight-medium text-neutral" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${u.name}
                                </div>
                                <div class="font-inter text-tiny text-subtitle" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${u.email || u.role}
                                </div>
                            </div>
                        </div>
                        <span class="font-inter text-tiny text-subtitle" style="flex-shrink: 0; margin-left: 8px;">ID ${u.id}</span>
                    </button>
                `,
            });

            if (!chosenId) return;

            const picked = candidates.find((c) => String(c.id) === String(chosenId));
            if (picked) {
                selectedResponsible = picked;
                renderAssignee(selectedResponsible);
            }
        } catch (err) {
            console.error("Erro ao carregar responsáveis:", err);
            showAlertModal("Erro ao carregar lista de responsáveis.", "Erro");
        }
    };

    assigneeCard.addEventListener("click", openAssigneeModal);
    assigneeCard.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openAssigneeModal();
        }
    });
}

async function loadTask() {
    try {
        const res = await getTaskDetails(taskId);
        if (res.success && res.task) {
            populateFields(res.task);
            await loadCommentsAndHistory();
        } else {
            showAlertModal(res.message || "Demanda não encontrada.", "Atenção");
        }
    } catch (err) {
        console.error("Erro ao carregar detalhes da demanda:", err);
    }
}

async function loadCommentsAndHistory() {
    if (!historyContainer) return;

    try {
        const [commentsRes, historyRes] = await Promise.all([
            getTaskComments(taskId),
            getTaskHistory(taskId)
        ]);

        const comments = (commentsRes.success && commentsRes.comments) ? commentsRes.comments : [];
        const history = (historyRes.success && historyRes.history) ? historyRes.history : [];

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
                author: h.actor_name || h.user_name || "Sistema",
                summary: h.summary,
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
                            <p>${item.summary || `<strong>${item.author}</strong> alterou <strong>${item.field}</strong>.`}</p>
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

if (commentBtn && commentInput) {
    commentBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const content = commentInput.value.trim();
        if (!content) {
            showAlertModal("Digite um comentário antes de enviar.", "Atenção");
            return;
        }

        try {
            const res = await createTaskComment(taskId, content);
            if (res.success) {
                commentInput.value = "";
                await loadCommentsAndHistory();
            } else {
                showAlertModal(res.message || "Erro ao adicionar comentário.", "Erro");
            }
        } catch (err) {
            showAlertModal("Erro ao enviar comentário.", "Erro");
        }
    });
}

if (saveBtn) {
    saveBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        if (!titleInput.value.trim()) {
            showAlertModal("O título da demanda não pode ser vazio.", "Atenção");
            return;
        }

        try {
            if (statusSelect && originalTaskData && statusSelect.value !== originalTaskData.status) {
                const statusRes = await updateTaskStatus(taskId, statusSelect.value);
                if (!statusRes.success) {
                    showAlertModal(statusRes.message || "Erro ao alterar status da demanda.", "Erro");
                    return;
                }
            }

            const updatePayload = {
                title: titleInput.value.trim(),
                description: descriptionTextarea.value.trim(),
                type: typeSelect.value,
                priority: prioritySelect.value
            };

            if (selectedResponsible && selectedResponsible.id != null) {
                updatePayload.fk_user_id = Number(selectedResponsible.id);
            }

            const updateRes = await updateTask(taskId, updatePayload);
            if (updateRes.success) {
                showAlertModal("Alterações salvas com sucesso!", "Sucesso");
                await loadTask();
            } else {
                showAlertModal(updateRes.message || "Erro ao atualizar demanda.", "Erro");
            }
        } catch (err) {
            showAlertModal("Erro ao salvar alterações.", "Erro");
        }
    });
}

if (revertBtn) {
    revertBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (originalTaskData) {
            populateFields(originalTaskData);
        }
    });
}

if (formDetails) formDetails.addEventListener("submit", (e) => e.preventDefault());
if (formLogs) formLogs.addEventListener("submit", (e) => e.preventDefault());

loadTask();