import { requireAuth, initUserProfile, listUsers, applyRoleRestrictions } from "../../../assets/js/repositories/authRepository.js";
import { getProjects, getProject, getProjectMembers, addProjectMember } from "../../../assets/js/repositories/projectRepository.js";
import { normalizeString } from "../../../assets/js/normalize.js";
import { showAlertModal, showSelectModal } from "../../../assets/js/components/modal.js";

requireAuth();
initUserProfile();

const urlParams = new URLSearchParams(window.location.search);
let projectId = urlParams.get("project_id");

const membersGrid = document.querySelector("#project-members-grid");
const searchInput = document.querySelector("#member-search");
const activityFilter = document.querySelector("#member-activity");
const countLabel = document.querySelector("#member-count");
const addMemberBtn = document.querySelector(".project-members-header button");

let allMemberCards = [];
let currentProjectMemberIds = new Set();

function renderMembers(members) {
    if (!membersGrid) return;

    currentProjectMemberIds = new Set(
        (members || []).map((m) => String(m.user_id))
    );

    if (!members || members.length === 0) {
        membersGrid.innerHTML = "<p class='text-subtitle'>Nenhum membro vinculado a este projeto.</p>";
        if (countLabel) countLabel.textContent = "0 membros encontrados";
        return;
    }

    membersGrid.innerHTML = members.map(m => {
        const completed = m.completed_tasks ? Number(m.completed_tasks) : 0;
        const total = m.total_tasks ? Number(m.total_tasks) : 0;
        const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
        const filledSegments = Math.round((progressPercent / 100) * 12);

        const segmentsHtml = Array.from({ length: 12 }, (_, i) =>
            `<div class="progress-bar-segment ${i < filledSegments ? 'progress-bar-filled' : 'progress-bar-empty'}"></div>`
        ).join("");

        return `
            <div class="base-card member-card" data-user-id="${m.user_id}">
                <div class="member-card-header">
                    <img class="member-card-avatar" src="${m.profile_pic || '../../../assets/images/user.png'}" alt="Avatar" />
                    <div>
                        <h3 class="text-neutral text-regular text-weight-medium font-inter member-card-name">${m.member_name}</h3>
                        <p class="text-subtitle font-inter text-small member-card-role">${m.authority_level || 'Membro'}</p>
                    </div>
                </div>

                <div class="member-card-progress">
                    <div class="between align-center">
                        <p class="text-subtitle font-inter text-small">Tarefas</p>
                        <div class="member-card-counter font-inter text-small">
                            <span class="text-primary text-weight-medium">${completed}</span>
                            <span class="text-subtitle">/${total}</span>
                        </div>
                    </div>
                    <div class="progress-bar">
                        ${segmentsHtml}
                    </div>
                </div>

                <div class="member-card-footer between align-center">
                    <span class="text-subtitle font-inter text-tiny">${m.member_email}</span>
                </div>
            </div>
        `;
    }).join("");

    allMemberCards = Array.from(membersGrid.querySelectorAll(".member-card"));
    updateMembers();
    applyRoleRestrictions();

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function updateMembers() {
    const query = normalizeString(searchInput ? searchInput.value.trim() : "");
    const activity = activityFilter ? activityFilter.value : "";
    let visibleCount = 0;

    allMemberCards.forEach((member) => {
        const counter = member.querySelector(".member-card-counter");
        let completed = 0;
        let total = 0;
        if (counter) {
            const [completedText, totalText] = Array.from(counter.children, (element) => element.textContent.trim());
            completed = Number(completedText) || 0;
            total = Number(totalText ? totalText.replace("/", "") : 0) || 0;
        }

        const matchesSearch = normalizeString(member.textContent).includes(query);
        const matchesActivity =
            !activity ||
            (activity === "pendentes" && completed < total) ||
            (activity === "concluidas" && completed === total && total > 0);

        member.hidden = !matchesSearch || !matchesActivity;
        if (!member.hidden) visibleCount += 1;
    });

    if (countLabel) {
        countLabel.textContent = `${visibleCount} ${visibleCount === 1 ? "membro encontrado" : "membros encontrados"}`;
    }
}

async function loadProjectMembers() {
    try {
        if (!projectId) {
            const pRes = await getProjects();
            if (pRes.success && pRes.projects.length > 0) {
                projectId = pRes.projects[0].project_id;
            } else {
                return;
            }
        }

        const panelTab = document.querySelector(".project-members-toolbar a[href*='project_details']");
        if (panelTab) panelTab.href = `../project_details/project_details.html?project_id=${projectId}`;

        const projectBreadcrumb = document.querySelector(".breadcrumb-item[href*='project_details']");
        if (projectBreadcrumb) projectBreadcrumb.href = `../project_details/project_details.html?project_id=${projectId}`;

        const projectRes = await getProject(projectId);
        if (projectRes.success && projectRes.project) {
            const projectTitle = projectRes.project.project_name || projectRes.project.title || "Projeto";
            if (projectBreadcrumb) projectBreadcrumb.textContent = projectTitle;

            const heading = document.querySelector(".project-members-header h2");
            if (heading) heading.textContent = projectTitle;
        }

        const membersRes = await getProjectMembers(projectId);
        if (membersRes.success) {
            renderMembers(membersRes.members);
        } else {
            console.error("Erro ao carregar membros:", membersRes.message);
        }
    } catch (err) {
        console.error("Erro ao carregar membros do projeto:", err);
    }
}

if (searchInput) {
    searchInput.addEventListener("input", updateMembers);
}

if (activityFilter) {
    activityFilter.addEventListener("change", updateMembers);
}

if (addMemberBtn) {
    addMemberBtn.addEventListener("click", async () => {
        try {
            const usersRes = await listUsers();

            if (!usersRes.success || !Array.isArray(usersRes.users) || usersRes.users.length === 0) {
                showAlertModal(
                    usersRes.message || "Não foi possível carregar a lista de usuários disponíveis.",
                    "Atenção"
                );
                return;
            }

            const candidateUsers = usersRes.users.filter(
                (u) => !currentProjectMemberIds.has(String(u.user_id))
            );

            if (candidateUsers.length === 0) {
                showAlertModal("Todos os usuários disponíveis já fazem parte deste projeto.", "Sem usuários novos");
                return;
            }

            const targetUserId = await showSelectModal({
                title: "Adicionar membro ao projeto",
                message: "Selecione um usuário da lista para vincular ao projeto:",
                items: candidateUsers,
                searchPlaceholder: "Buscar por nome, e-mail ou ID...",
                confirmText: "Adicionar",
                getItemId: (u) => u.user_id,
                getSearchText: (u) => normalizeString(`${u.user_id ?? ""} ${u.name ?? ""} ${u.email ?? ""}`),
                renderItem: (u, isSelected) => `
                    <button
                        type="button"
                        role="option"
                        aria-selected="${isSelected}"
                        data-option-id="${u.user_id}"
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
                                src="${u.profile_pic || "../../../assets/images/user.png"}"
                                alt="${u.name}"
                                style="width: 32px; height: 32px; border-radius: var(--radius-full); object-fit: cover; flex-shrink: 0;"
                            />
                            <div style="min-width: 0;">
                                <div class="font-inter text-small text-weight-medium text-neutral" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${u.name}
                                </div>
                                <div class="font-inter text-tiny text-subtitle" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${u.email}
                                </div>
                            </div>
                        </div>
                        <span class="font-inter text-tiny text-subtitle" style="flex-shrink: 0; margin-left: 8px;">ID ${u.user_id}</span>
                    </button>
                `,
            });

            if (!targetUserId) return;

            const res = await addProjectMember(projectId, targetUserId);
            if (res.success) {
                showAlertModal("Membro vinculado com sucesso!", "Sucesso");
                await loadProjectMembers();
            } else {
                showAlertModal(res.message || "Não foi possível vincular o usuário.", "Erro");
            }
        } catch (err) {
            console.error("Erro ao adicionar membro:", err);
            showAlertModal("Erro ao adicionar membro.", "Erro");
        }
    });
}

// Initial load
loadProjectMembers();