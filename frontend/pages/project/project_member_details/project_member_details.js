import { requireAuth, initUserProfile } from "../../../assets/js/repositories/authRepository.js";
import { getProjectMemberDetails, getProject } from "../../../assets/js/repositories/projectRepository.js";

requireAuth();
initUserProfile();

const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get("project_id");
const userId = urlParams.get("user_id");

const memberAvatar = document.getElementById("member-avatar");
const memberName = document.getElementById("member-name");
const memberEmail = document.getElementById("member-email");
const memberRole = document.getElementById("member-role");
const tasksBody = document.getElementById("member-tasks-body");

const projectLink = document.querySelector(".project-link");
const membersLink = document.querySelector(".members-link");
const memberBreadcrumb = document.querySelector(".member-name-breadcrumb");
const memberTitle = document.querySelector(".member-title");

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-BR");
}

async function loadDetails() {
    if (!projectId || !userId) {
        if (tasksBody) tasksBody.innerHTML = `<tr><td colspan="5" class="text-center p-16 text-subtitle">Parâmetros de projeto ou usuário ausentes.</td></tr>`;
        return;
    }

    if (projectLink) projectLink.href = `../project_details/project_details.html?project_id=${projectId}`;
    if (membersLink) membersLink.href = `../project_members/project_members.html?project_id=${projectId}`;

    try {
        const [projectRes, memberRes] = await Promise.all([
            getProject(projectId),
            getProjectMemberDetails(projectId, userId)
        ]);

        if (projectRes.success && projectRes.project && projectLink) {
            projectLink.textContent = projectRes.project.title;
        }

        if (memberRes.success && memberRes.data) {
            const { user_info, task_list } = memberRes.data;

            if (memberName) memberName.textContent = user_info.name;
            if (memberEmail) memberEmail.textContent = user_info.email;
            if (memberRole) memberRole.textContent = `Nível de autoridade: ${user_info.authority_level}`;
            if (memberAvatar && user_info.profile_pic) memberAvatar.src = user_info.profile_pic;

            if (memberBreadcrumb) memberBreadcrumb.textContent = user_info.name;
            if (memberTitle) memberTitle.textContent = user_info.name;

            if (task_list && task_list.length > 0) {
                tasksBody.innerHTML = task_list.map(t => `
                    <tr>
                        <td>
                            <a href="../../demand/demand_details/demand_details.html?task_id=${t.task_id}" class="dashboard-task-cell font-inter text-weight-medium">
                                ${t.title}
                            </a>
                        </td>
                        <td><span class="dashboard-task-cell">${t.type || 'TAREFA'}</span></td>
                        <td><span class="dashboard-task-cell">${t.priority || 'MEDIA'}</span></td>
                        <td><span class="status-badge">${t.status}</span></td>
                        <td><span class="dashboard-task-cell">${formatDate(t.due_date)}</span></td>
                    </tr>
                `).join("");
            } else {
                tasksBody.innerHTML = `<tr><td colspan="5" class="text-center p-16 text-subtitle">Nenhuma tarefa atribuída a este membro no projeto.</td></tr>`;
            }
        } else {
            if (tasksBody) tasksBody.innerHTML = `<tr><td colspan="5" class="text-center p-16 text-subtitle">${memberRes.message || 'Membro não encontrado.'}</td></tr>`;
        }
    } catch (err) {
        console.error("Erro ao carregar detalhes do membro:", err);
        if (tasksBody) tasksBody.innerHTML = `<tr><td colspan="5" class="text-center p-16 text-subtitle">Erro ao conectar ao servidor.</td></tr>`;
    }
}

loadDetails();
