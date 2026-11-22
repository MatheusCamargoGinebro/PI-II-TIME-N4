import { requireAuth, initUserProfile, listUsers, applyRoleRestrictions } from "../../../assets/js/repositories/authRepository.js";
import { getProjects, getProject, getProjectMembers, addProjectMember } from "../../../assets/js/repositories/projectRepository.js";
import { normalizeString } from "../../../assets/js/normalize.js";

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

function renderMembers(members) {
    if (!membersGrid) return;

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
                        <h3 class="text-neutral text-regular text-weight-medium font-inter member-card-name">${m.name}</h3>
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
                    <span class="text-subtitle font-inter text-tiny">${m.email}</span>
                    <a href="../project_member_details/project_member_details.html?project_id=${projectId}&user_id=${m.user_id}" class="member-card-link text-primary font-inter text-small align-center gap-4">
                        <span>Ver Detalhes</span>
                        <i data-lucide="arrow-up-right" class="icon-small" style="color: var(--color-primary-500)"></i>
                    </a>
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

        // Set navigation links
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
            // First check if user list is accessible (Admin)
            const usersRes = await listUsers();
            let targetUserId = null;

            if (usersRes.success && usersRes.users.length > 0) {
                const userListText = usersRes.users
                    .map(u => `ID ${u.user_id}: ${u.name} (${u.email})`)
                    .join("\n");
                const input = window.prompt(`Digite o ID do usuário para vincular ao projeto:\n\n${userListText}`);
                if (!input) return;
                targetUserId = input.trim();
            } else {
                const input = window.prompt("Digite o ID do usuário para vincular ao projeto:");
                if (!input) return;
                targetUserId = input.trim();
            }

            const res = await addProjectMember(projectId, targetUserId);
            if (res.success) {
                window.alert("Membro vinculado com sucesso!");
                await loadProjectMembers();
            } else {
                window.alert(res.message || "Não foi possível vincular o usuário.");
            }
        } catch (err) {
            window.alert("Erro ao adicionar membro.");
        }
    });
}

// Initial load
loadProjectMembers();
