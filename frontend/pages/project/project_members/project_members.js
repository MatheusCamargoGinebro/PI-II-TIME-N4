/*
    Autor: 
    project_members.js -> Carrega dinamicamente os membros de um projeto, filtra por busca/atividade e permite vincular novos membros via modal.
*/

import {
	requireAuth,
	listUsers,
	applyRoleRestrictions,
} from "../../../assets/js/repositories/authRepository.js";
import { initAppHeader } from "../../../assets/js/components/header.js";
import {
	getProjects,
	getProject,
	getProjectMembers,
	addProjectMember,
} from "../../../assets/js/repositories/projectRepository.js";
import { normalizeString } from "../../../assets/js/normalize.js";
import {
	showAlertModal,
	showPromptModal,
	showSelectModal,
} from "../../../assets/js/components/modal.js";
import {
	escapeHtml,
	renderProgressSegments,
} from "../../../assets/js/utils/formatters.js";

requireAuth();

const urlParams = new URLSearchParams(window.location.search);
let projectId = urlParams.get("project_id");

const headerPromise = initAppHeader({ activePage: "projects", projectId });

const membersGrid = document.getElementById("project-members-grid");
const searchInput = document.getElementById("member-search");
const activityFilter = document.getElementById("member-activity");
const countLabel = document.getElementById("member-count");
const addMemberBtn = document.getElementById("add-member-btn");

let allMembers = [];
let currentProjectMemberIds = new Set();

function renderMembers() {
	if (!membersGrid) return;

	const query = normalizeString(searchInput?.value.trim() || "");
	const activity = activityFilter?.value || "";

	const filtered = allMembers.filter((m) => {
		const completed = Number(m.completed_tasks || 0);
		const total = Number(m.total_tasks || 0);

		if (activity === "pendentes" && !(completed < total)) return false;
		if (activity === "concluidas" && !(total > 0 && completed === total))
			return false;

		if (query) {
			const haystack = normalizeString(
				`${m.member_name} ${m.member_email} ${m.access_level || ""}`,
			);
			if (!haystack.includes(query)) return false;
		}
		return true;
	});

	if (countLabel) {
		countLabel.textContent = `${filtered.length} ${filtered.length === 1 ? "membro encontrado" : "membros encontrados"}`;
	}

	if (filtered.length === 0) {
		membersGrid.innerHTML = `<p class="text-subtitle font-inter text-small">Nenhum membro encontrado.</p>`;
		return;
	}

	membersGrid.innerHTML = filtered
		.map((m) => {
			const memberId = m.member_id ?? m.user_id;
			const completed = Number(m.completed_tasks || 0);
			const total = Number(m.total_tasks || 0);
			const role = m.access_level || m.authority_level || "Membro da equipe";
			const avatar = m.profile_pic || "../../../assets/images/user.png";

			return `
				<div class="base-card member-card" data-user-id="${escapeHtml(memberId)}">
					<div class="member-card-image-wrapper">
						<img class="member-card-image" src="${escapeHtml(avatar)}" alt="${escapeHtml(m.member_name)}" />
					</div>

					<div class="member-card-info">
						<h4 class="text-neutral font-inter text-large text-weight-medium">${escapeHtml(m.member_name)}</h4>
						<p class="text-subtitle font-inter text-small">${escapeHtml(role)}</p>
						<p class="text-subtitle font-inter text-tiny">${escapeHtml(m.member_email)}</p>
					</div>

					<div class="member-card-progress">
						<div class="between align-center">
							<div class="align-center gap-8">
								<i data-lucide="check-circle-2" class="icon-small" style="color: var(--color-neutral-700)"></i>
								<span class="text-subtitle font-inter text-tiny">Tarefas Concluídas</span>
							</div>
							<div class="member-card-counter font-inter text-regular">
								<span class="text-primary">${completed}</span><span class="text-primary-light">/${total}</span>
							</div>
						</div>
						<div class="progress-bar progress-bar-thin">
							${renderProgressSegments(completed, total, 8, false)}
						</div>
					</div>

					<a href="../project_member_details/project_member_details.html?project_id=${encodeURIComponent(projectId)}&user_id=${encodeURIComponent(memberId)}" class="btn btn-full btn-sm secondary-btn member-card-btn">
						<span>Ver Detalhes</span>
						<i data-lucide="arrow-up-right" class="icon-small" style="color: var(--color-neutral-700)"></i>
					</a>
				</div>
			`;
		})
		.join("");

	if (window.lucide) {
		window.lucide.createIcons({ root: membersGrid });
	}
}

async function loadProjectMembers() {
	if (!projectId) {
		const pRes = await getProjects();
		if (pRes.success && pRes.projects.length > 0) {
			projectId = String(pRes.projects[0].project_id);
		} else {
			return;
		}
	}

	const panelTab = document.getElementById("members-panel-tab");
	if (panelTab) {
		panelTab.href = `../project_details/project_details.html?project_id=${encodeURIComponent(projectId)}`;
	}

	const projectBreadcrumb = document.getElementById(
		"members-project-breadcrumb",
	);
	if (projectBreadcrumb) {
		projectBreadcrumb.href = `../project_details/project_details.html?project_id=${encodeURIComponent(projectId)}`;
	}

	const [projectRes, membersRes] = await Promise.all([
		getProject(projectId),
		getProjectMembers(projectId),
	]);

	if (projectRes.success && projectRes.project) {
		const title =
			projectRes.project.project_name || projectRes.project.title || "Projeto";
		document.title = `TaskOps - Membros | ${title}`;
		if (projectBreadcrumb) projectBreadcrumb.textContent = title;
		const pageTitle = document.getElementById("members-page-title");
		if (pageTitle) pageTitle.textContent = `Membros — ${title}`;
	}

	if (membersRes.success) {
		allMembers = membersRes.members || [];
		currentProjectMemberIds = new Set(
			allMembers.map((m) => String(m.member_id ?? m.user_id)),
		);
		renderMembers();
	}

	applyRoleRestrictions();
	if (window.lucide) {
		window.lucide.createIcons();
	}
}

if (searchInput) searchInput.addEventListener("input", renderMembers);
if (activityFilter) activityFilter.addEventListener("change", renderMembers);

// Vincular novo membro ao projeto (modal com busca para Admin ou entrada de ID para Líder)
if (addMemberBtn) {
	addMemberBtn.addEventListener("click", async () => {
		const usersRes = await listUsers();
		let targetUserId = null;

		if (usersRes.success && Array.isArray(usersRes.users)) {
			const candidates = usersRes.users.filter(
				(u) => !currentProjectMemberIds.has(String(u.user_id)),
			);

			if (candidates.length === 0) {
				await showAlertModal(
					"Todos os usuários cadastrados já estão vinculados a este projeto.",
					"Sem usuários novos",
				);
				return;
			}

			targetUserId = await showSelectModal({
				title: "Adicionar membro ao projeto",
				message: "Selecione um usuário da lista para vincular ao projeto:",
				items: candidates,
				searchPlaceholder: "Buscar por nome, e-mail ou ID...",
				confirmText: "Adicionar",
				getItemId: (u) => u.user_id,
				getSearchText: (u) =>
					normalizeString(`${u.user_id} ${u.name} ${u.email}`),
				renderItem: (u, isSelected) => `
					<button
						type="button"
						role="option"
						aria-selected="${isSelected}"
						data-option-id="${escapeHtml(u.user_id)}"
						class="feedback-modal-option between align-center ${isSelected ? "is-selected" : ""}"
					>
						<div class="align-center gap-8" style="min-width: 0;">
							<img
								src="${escapeHtml(u.profile_pic || "../../../assets/images/user.png")}"
								alt="${escapeHtml(u.name)}"
								style="width: 32px; height: 32px; border-radius: 9999px; object-fit: cover; flex-shrink: 0;"
							/>
							<div style="min-width: 0;">
								<div class="font-inter text-small text-weight-medium text-neutral" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
									${escapeHtml(u.name)}
								</div>
								<div class="font-inter text-tiny text-subtitle" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
									${escapeHtml(u.email)}
								</div>
							</div>
						</div>
						<span class="font-inter text-tiny text-subtitle" style="flex-shrink: 0; margin-left: 8px;">ID ${escapeHtml(u.user_id)}</span>
					</button>
				`,
			});
		} else if (usersRes.status === 403) {
			// Líder de projeto pode vincular membro informando o ID do usuário
			targetUserId = await showPromptModal({
				title: "Adicionar membro ao projeto",
				message: "Informe o ID do usuário que deseja vincular a este projeto:",
				placeholder: "Ex.: 4",
				confirmText: "Adicionar",
				validate: (val) =>
					/^\d+$/.test(val) && Number(val) > 0
						? null
						: "Informe um número inteiro positivo válido.",
			});
		} else {
			await showAlertModal(
				usersRes.message ||
					"Não foi possível carregar os usuários disponíveis.",
				"Erro",
			);
			return;
		}

		if (!targetUserId) return;

		const res = await addProjectMember(projectId, targetUserId);
		if (res.success) {
			await showAlertModal(
				"Membro vinculado ao projeto com sucesso!",
				"Sucesso",
			);
			await loadProjectMembers();
		} else {
			await showAlertModal(
				res.message || "Não foi possível vincular o usuário.",
				"Erro",
			);
		}
	});
}

headerPromise.then(() => {
	loadProjectMembers();
});
