/*
    Autor: 
    project_member_details.js -> Carrega dinamicamente os dados de um membro e suas demandas atribuídas em um projeto.
*/

import { requireAuth } from "../../../assets/js/repositories/authRepository.js";
import { initAppHeader } from "../../../assets/js/components/header.js";
import {
	getProjectMemberDetails,
	getProject,
} from "../../../assets/js/repositories/projectRepository.js";
import {
	escapeHtml,
	formatShortDate,
	formatTaskCode,
	getPriorityInfo,
	getStatusInfo,
	getTypeLabel,
} from "../../../assets/js/utils/formatters.js";

requireAuth();

const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get("project_id");
const userId = urlParams.get("user_id");

const headerPromise = initAppHeader({ activePage: "projects", projectId });

const memberAvatar = document.getElementById("member-avatar");
const memberName = document.getElementById("member-name");
const memberEmail = document.getElementById("member-email");
const memberRole = document.getElementById("member-role");
const tasksBody = document.getElementById("member-tasks-body");

const projectLink = document.querySelector(".project-link");
const membersLink = document.querySelector(".members-link");
const memberBreadcrumb = document.querySelector(".member-name-breadcrumb");
const memberTitle = document.querySelector(".member-title");

async function loadDetails() {
	if (!projectId || !userId) {
		if (tasksBody) {
			tasksBody.innerHTML = `<tr><td colspan="6" class="text-subtitle" style="text-align: center; padding: 16px;">Parâmetros de projeto ou usuário ausentes.</td></tr>`;
		}
		return;
	}

	if (projectLink)
		projectLink.href = `../project_details/project_details.html?project_id=${encodeURIComponent(projectId)}`;
	if (membersLink)
		membersLink.href = `../project_members/project_members.html?project_id=${encodeURIComponent(projectId)}`;

	const [projectRes, memberRes] = await Promise.all([
		getProject(projectId),
		getProjectMemberDetails(projectId, userId),
	]);

	if (projectRes.success && projectRes.project && projectLink) {
		projectLink.textContent =
			projectRes.project.project_name || projectRes.project.title || "Projeto";
	}

	if (memberRes.success && memberRes.data) {
		const { user_info, task_list } = memberRes.data;

		document.title = `TaskOps - ${user_info.name}`;
		if (memberName) memberName.textContent = user_info.name;
		if (memberEmail) memberEmail.textContent = user_info.email;
		if (memberRole)
			memberRole.textContent = `Perfil: ${user_info.authority_level}`;
		if (memberAvatar && user_info.profile_pic)
			memberAvatar.src = user_info.profile_pic;
		if (memberBreadcrumb) memberBreadcrumb.textContent = user_info.name;
		if (memberTitle) memberTitle.textContent = user_info.name;

		if (task_list && task_list.length > 0) {
			tasksBody.innerHTML = task_list
				.map((t) => {
					const title = t.task_title || t.title || "Demanda";
					const priorityInfo = getPriorityInfo(t.priority);
					const statusInfo = getStatusInfo(t.status);

					return `
						<tr>
							<td>
								<a href="../../demand/demand_details/demand_details.html?task_id=${t.task_id}" class="dashboard-task-link">
									${escapeHtml(formatTaskCode(t.task_id))}
								</a>
							</td>
							<td>
								<a href="../../demand/demand_details/demand_details.html?task_id=${t.task_id}" class="dashboard-task-cell dashboard-task-link">
									${escapeHtml(title)}
								</a>
							</td>
							<td><span class="dashboard-task-cell">${escapeHtml(getTypeLabel(t.type))}</span></td>
							<td>
								<div class="align-center gap-8">
									<span class="badge-dot ${priorityInfo.dotClass}"></span>
									<span class="dashboard-task-cell">${escapeHtml(priorityInfo.label)}</span>
								</div>
							</td>
							<td><span class="status-badge ${statusInfo.className}">${escapeHtml(statusInfo.label)}</span></td>
							<td><span class="dashboard-task-cell">${escapeHtml(formatShortDate(t.due_date))}</span></td>
						</tr>
					`;
				})
				.join("");
		} else {
			tasksBody.innerHTML = `<tr><td colspan="6" class="text-subtitle" style="text-align: center; padding: 16px;">Nenhuma demanda atribuída a este membro neste projeto.</td></tr>`;
		}
	} else {
		if (tasksBody) {
			tasksBody.innerHTML = `<tr><td colspan="6" class="text-subtitle" style="text-align: center; padding: 16px;">${escapeHtml(memberRes.message || "Membro não encontrado.")}</td></tr>`;
		}
	}

	if (window.lucide) {
		window.lucide.createIcons();
	}
}

headerPromise.then(() => {
	loadDetails();
});
