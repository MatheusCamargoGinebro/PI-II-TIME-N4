/*
    Autor: 
    demand_details.js -> Gerencia visualização, edição, ciclo de vida de status, cancelamento lógico, responsável, comentários e histórico de uma demanda.
*/

import {
	requireAuth,
	listUsers,
	getUser,
	isTeamMember,
} from "../../../assets/js/repositories/authRepository.js";
import { initAppHeader } from "../../../assets/js/components/header.js";
import { getProjectMembers } from "../../../assets/js/repositories/projectRepository.js";
import {
	getTaskDetails,
	updateTask,
	updateTaskStatus,
	cancelTask,
	getTaskComments,
	createTaskComment,
	getTaskHistory,
} from "../../../assets/js/repositories/taskRepository.js";
import { normalizeString } from "../../../assets/js/normalize.js";
import {
	showAlertModal,
	showConfirmModal,
	showSelectModal,
} from "../../../assets/js/components/modal.js";
import {
	escapeHtml,
	formatDateTime,
	formatTaskCode,
	getAllowedNextStatuses,
	toDateInputValue,
} from "../../../assets/js/utils/formatters.js";

requireAuth();
const headerPromise = initAppHeader({ activePage: "projects" });

const urlParams = new URLSearchParams(window.location.search);
const taskId = urlParams.get("task_id");

let currentUser = getUser();
let originalTaskData = null;
let selectedResponsible = null; // { id: string | null, name, email, profile_pic, role }

// Referências dos elementos do DOM
const formDetails = document.getElementById("demand-details-forms");
const formLogs = document.getElementById("demand-logs-forms");
const titleInput = document.getElementById("demand-details-title");
const typeSelect = document.getElementById("demand-details-type");
const prioritySelect = document.getElementById("demand-details-priority");
const projectInput = document.getElementById(
	"demand-details-associated-project",
);
const statusSelect = document.getElementById("demand-details-status");
const descriptionTextarea = document.getElementById(
	"demand-details-description",
);
const dueDateInput = document.getElementById("demand-details-due-date");
const createdAtEl = document.getElementById("demand-created-at");
const updatedAtEl = document.getElementById("demand-updated-at");
const slaAlertEl = document.getElementById("demand-details-sla-alert");
const readonlyNoticeEl = document.getElementById("demand-readonly-notice");

const requesterAvatar = document.getElementById(
	"demand-details-requester-avatar",
);
const requesterName = document.getElementById("demand-details-requester-name");
const requesterRole = document.getElementById("demand-details-requester-role");

const assigneeCard = document.getElementById("demand-assignee-card");
const assigneeAvatar = document.getElementById(
	"demand-details-assignee-avatar",
);
const assigneeName = document.getElementById("demand-details-assignee-name");
const assigneeRole = document.getElementById("demand-details-assignee-role");

const saveBtn = document.getElementById("demand-details-save");
const revertBtn = document.getElementById("demand-details-revert-button");
const cancelBtn = document.getElementById("demand-details-cancel-button");

const commentInput = document.getElementById("demand-details-comment");
const commentBtn = document.getElementById("demand-details-comment-button");
const historyContainer = document.getElementById("demand-history-list");

const infoTab = document.getElementById("demand-details-info-tab");
const historyTab = document.getElementById("demand-details-history-tab");

// Troca de abas (Informações gerais / Histórico e anotações)
if (infoTab && historyTab && formDetails && formLogs) {
	infoTab.addEventListener("click", () => {
		infoTab.classList.add("demand-details-selected-tab");
		historyTab.classList.remove("demand-details-selected-tab");
		formDetails.style.display = "";
		formLogs.style.display = "none";
	});

	historyTab.addEventListener("click", () => {
		historyTab.classList.add("demand-details-selected-tab");
		infoTab.classList.remove("demand-details-selected-tab");
		formDetails.style.display = "none";
		formLogs.style.display = "block";
	});
}

// Calcula mensagem real de prazo / SLA a partir da data limite e status da demanda
function updateSlaMessage(task) {
	if (!slaAlertEl) return;
	slaAlertEl.classList.remove("is-overdue");

	if (task.status === "CONCLUIDA") {
		slaAlertEl.textContent = "Demanda concluída.";
		return;
	}
	if (task.status === "CANCELADA") {
		slaAlertEl.textContent = "Demanda cancelada.";
		return;
	}
	if (!task.due_date) {
		slaAlertEl.textContent = "Sem prazo de finalização definido.";
		return;
	}

	const diffMs = new Date(task.due_date).getTime() - Date.now();
	const diffHours = Math.round(Math.abs(diffMs) / (1000 * 60 * 60));
	const diffDays = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

	if (diffMs < 0) {
		slaAlertEl.classList.add("is-overdue");
		slaAlertEl.innerHTML =
			diffHours < 24
				? `Prazo vencido há <b>${diffHours} ${diffHours === 1 ? "hora" : "horas"}</b>`
				: `Prazo vencido há <b>${diffDays} ${diffDays === 1 ? "dia" : "dias"}</b>`;
	} else if (diffHours < 24) {
		slaAlertEl.innerHTML = `Faltam <b>${Math.max(1, diffHours)} ${diffHours === 1 ? "hora" : "horas"}</b> para o prazo`;
	} else {
		slaAlertEl.innerHTML = `Faltam <b>${diffDays} ${diffDays === 1 ? "dia" : "dias"}</b> para o prazo`;
	}
}

// Renderiza o cartão do responsável designado
function renderAssignee(responsible, canChangeResponsible) {
	if (!assigneeName || !assigneeRole) return;

	if (responsible && responsible.id !== null && responsible.name) {
		assigneeName.textContent = responsible.name;
		assigneeRole.textContent = responsible.role || "Responsável designado";
		if (assigneeAvatar) {
			assigneeAvatar.src =
				responsible.profile_pic || "../../../assets/images/user.png";
		}
	} else {
		assigneeName.textContent = "Não atribuído";
		assigneeRole.textContent = canChangeResponsible
			? "Clique para atribuir"
			: "Sem responsável";
		if (assigneeAvatar) {
			assigneeAvatar.src = "../../../assets/images/user.png";
		}
	}
}

// Configura permissões de edição e transições de status conforme perfil e ciclo de vida (Seções 2.1 e 2.2.4)
function applyPermissions(task) {
	const member = isTeamMember();
	const isFinalized =
		task.status === "CONCLUIDA" || task.status === "CANCELADA";
	const canEditFields = !member && !isFinalized;
	const allowedNextStatuses = getAllowedNextStatuses(task, currentUser);
	const canChangeStatus = allowedNextStatuses.length > 0;

	if (titleInput) titleInput.disabled = !canEditFields;
	if (typeSelect) typeSelect.disabled = !canEditFields;
	if (prioritySelect) prioritySelect.disabled = !canEditFields;
	if (descriptionTextarea) descriptionTextarea.disabled = !canEditFields;
	if (dueDateInput) dueDateInput.disabled = !canEditFields;

	// Habilita no select apenas o status atual + transições válidas para este perfil
	if (statusSelect) {
		statusSelect.disabled = !canChangeStatus;
		Array.from(statusSelect.options).forEach((option) => {
			const isCurrent = option.value === task.status;
			const isAllowed = allowedNextStatuses.includes(option.value);
			option.disabled = !isCurrent && !isAllowed;
		});
	}

	if (assigneeCard) {
		assigneeCard.classList.toggle("is-readonly", !canEditFields);
		assigneeCard.setAttribute("tabindex", canEditFields ? "0" : "-1");
		assigneeCard.title = canEditFields
			? "Clique para alterar o responsável"
			: "Alteração de responsável não disponível";
	}

	const canSave = canEditFields || canChangeStatus;
	if (saveBtn) saveBtn.hidden = !canSave;
	if (revertBtn) revertBtn.hidden = !canSave;

	// Botão de cancelamento lógico: apenas Admin/Líder e se ainda não finalizada
	if (cancelBtn) {
		cancelBtn.hidden = member || isFinalized;
	}

	// Mensagem informativa quando os campos estão em modo leitura
	if (readonlyNoticeEl) {
		if (isFinalized) {
			readonlyNoticeEl.textContent = `Esta demanda está ${task.status === "CONCLUIDA" ? "concluída" : "cancelada"} e não pode mais ser editada. O histórico e os comentários continuam disponíveis.`;
			readonlyNoticeEl.hidden = false;
		} else if (member && canChangeStatus) {
			readonlyNoticeEl.textContent =
				"Como Membro da equipe, você pode atualizar o status desta demanda atribuída a você e registrar comentários.";
			readonlyNoticeEl.hidden = false;
		} else if (member) {
			readonlyNoticeEl.textContent =
				"Modo visualização: você pode acompanhar os detalhes, consultar o histórico e registrar comentários.";
			readonlyNoticeEl.hidden = false;
		} else {
			readonlyNoticeEl.hidden = true;
		}
	}

	renderAssignee(selectedResponsible, canEditFields);
}

// Preenche todos os campos com os dados reais vindos da API
function populateFields(task) {
	originalTaskData = { ...task };
	const code = formatTaskCode(task.task_id);

	const initialResponsibleId = task.fk_user_id ?? task.responsible_id ?? null;
	selectedResponsible =
		initialResponsibleId !== null && task.responsible_name
			? {
					id: String(initialResponsibleId),
					name: task.responsible_name,
					email: task.responsible_email || "",
					role: "Responsável designado",
					profile_pic:
						task.responsible_profile_pic || "../../../assets/images/user.png",
				}
			: { id: null, name: null, email: "", role: "", profile_pic: null };

	document.title = `TaskOps - ${code} | ${task.title}`;

	const headingEl = document.getElementById("demand-heading-code");
	if (headingEl) headingEl.textContent = `${code} — ${task.title}`;

	const sectionTitleEl = document.getElementById("demand-section-title");
	if (sectionTitleEl)
		sectionTitleEl.textContent = `Informações da demanda ${code}`;

	const breadcrumbCode = document.getElementById("breadcrumb-task-code");
	if (breadcrumbCode) breadcrumbCode.textContent = code;

	const projectBreadcrumb = document.getElementById("breadcrumb-project-link");
	if (projectBreadcrumb && task.project_title) {
		projectBreadcrumb.textContent = task.project_title;
		projectBreadcrumb.href = `../../project/project_details/project_details.html?project_id=${task.fk_project_id}`;
	}

	const demandsBreadcrumb = document.getElementById("breadcrumb-demands-link");
	if (demandsBreadcrumb && task.fk_project_id) {
		demandsBreadcrumb.href = `../demands_list/demands_list.html?project_id=${task.fk_project_id}`;
	}

	if (titleInput) titleInput.value = task.title || "";
	if (typeSelect) typeSelect.value = task.type || "TAREFA";
	if (prioritySelect) prioritySelect.value = task.priority || "MEDIA";
	if (projectInput) projectInput.value = task.project_title || "";
	if (statusSelect) statusSelect.value = task.status || "ABERTA";
	if (descriptionTextarea) descriptionTextarea.value = task.description || "";
	if (dueDateInput) dueDateInput.value = toDateInputValue(task.due_date);

	if (createdAtEl) createdAtEl.textContent = formatDateTime(task.creation_date);
	if (updatedAtEl) updatedAtEl.textContent = formatDateTime(task.updated_at);
	updateSlaMessage(task);

	if (requesterName) requesterName.textContent = task.creator_name || "Criador";
	if (requesterRole)
		requesterRole.textContent = task.creator_email || "Criador da demanda";
	if (requesterAvatar && task.creator_profile_pic) {
		requesterAvatar.src = task.creator_profile_pic;
	}

	applyPermissions(task);
}

// Busca candidatos a responsável vinculados ao projeto
async function getCandidateAssignees(projectId) {
	const candidates = [
		{
			id: "UNASSIGNED",
			name: "Sem responsável",
			email: "Remover atribuição da demanda",
			role: "",
			profile_pic: "../../../assets/images/user.png",
		},
	];

	if (projectId) {
		const membersRes = await getProjectMembers(projectId);
		if (membersRes.success && Array.isArray(membersRes.members)) {
			membersRes.members.forEach((m) => {
				const rawId = m.member_id ?? m.user_id ?? m.id;
				if (rawId == null) return;
				candidates.push({
					id: String(rawId),
					name: m.member_name || m.name || "Usuário",
					email: m.member_email || m.email || "",
					role: m.access_level || m.authority_level || "Membro do projeto",
					profile_pic: m.profile_pic || "../../../assets/images/user.png",
				});
			});
			return candidates;
		}
	}

	const usersRes = await listUsers();
	if (usersRes.success && Array.isArray(usersRes.users)) {
		usersRes.users.forEach((u) => {
			if (u.user_id == null) return;
			candidates.push({
				id: String(u.user_id),
				name: u.name || "Usuário",
				email: u.email || "",
				role: u.authority_level || "Usuário",
				profile_pic: u.profile_pic || "../../../assets/images/user.png",
			});
		});
	}

	return candidates;
}

// Modal de seleção de responsável (apenas Admin e Líder em demandas abertas/em andamento/em revisão)
if (assigneeCard) {
	const openAssigneeModal = async () => {
		if (!originalTaskData) return;
		if (
			isTeamMember() ||
			originalTaskData.status === "CONCLUIDA" ||
			originalTaskData.status === "CANCELADA"
		) {
			return;
		}

		const candidates = await getCandidateAssignees(
			originalTaskData.fk_project_id,
		);
		const chosenId = await showSelectModal({
			title: "Alterar responsável",
			message: "Selecione o membro responsável pela demanda:",
			items: candidates,
			searchPlaceholder: "Buscar por nome, e-mail ou ID...",
			confirmText: "Selecionar",
			getItemId: (u) => u.id,
			getSearchText: (u) =>
				normalizeString(`${u.id} ${u.name} ${u.email} ${u.role}`),
			renderItem: (u, isSelected) => `
				<button
					type="button"
					role="option"
					aria-selected="${isSelected}"
					data-option-id="${escapeHtml(u.id)}"
					class="feedback-modal-option between align-center ${isSelected ? "is-selected" : ""}"
				>
					<div class="align-center gap-8" style="min-width: 0;">
						<img
							src="${escapeHtml(u.profile_pic)}"
							alt="${escapeHtml(u.name)}"
							style="width: 32px; height: 32px; border-radius: 9999px; object-fit: cover; flex-shrink: 0;"
						/>
						<div style="min-width: 0;">
							<div class="font-inter text-small text-weight-medium text-neutral" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
								${escapeHtml(u.name)}
							</div>
							<div class="font-inter text-tiny text-subtitle" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
								${escapeHtml(u.email || u.role)}
							</div>
						</div>
					</div>
					<span class="font-inter text-tiny text-subtitle" style="flex-shrink: 0; margin-left: 8px;">
						${u.id === "UNASSIGNED" ? "-" : `ID ${escapeHtml(u.id)}`}
					</span>
				</button>
			`,
		});

		if (!chosenId) return;

		if (chosenId === "UNASSIGNED") {
			selectedResponsible = {
				id: null,
				name: null,
				email: "",
				role: "",
				profile_pic: null,
			};
		} else {
			const picked = candidates.find((c) => String(c.id) === String(chosenId));
			if (picked) selectedResponsible = picked;
		}
		renderAssignee(selectedResponsible, true);
	};

	assigneeCard.addEventListener("click", openAssigneeModal);
	assigneeCard.addEventListener("keydown", (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			openAssigneeModal();
		}
	});
}

// Carrega comentários e histórico de alterações em linha do tempo unificada
async function loadCommentsAndHistory() {
	if (!historyContainer || !taskId) return;

	const [commentsRes, historyRes] = await Promise.all([
		getTaskComments(taskId),
		getTaskHistory(taskId),
	]);

	const comments = commentsRes.success ? commentsRes.comments : [];
	const history = historyRes.success ? historyRes.history : [];

	const timeline = [
		...comments.map((c) => ({
			type: "comment",
			author: c.author_name || "Usuário",
			content: c.content || "",
			date: new Date(c.creation_date),
		})),
		...history.map((h) => ({
			type: "system",
			author: h.actor_name || "Sistema",
			summary: h.summary,
			field: h.field_name,
			oldValue: h.old_value,
			newValue: h.new_value,
			date: new Date(h.date),
		})),
	];

	timeline.sort((a, b) => b.date - a.date);

	if (timeline.length === 0) {
		historyContainer.innerHTML = `<p class="text-subtitle font-inter text-small">Nenhum histórico ou anotação registrado até o momento.</p>`;
		return;
	}

	historyContainer.innerHTML = timeline
		.map((item) => {
			if (item.type === "comment") {
				return `
					<div class="demand-details-history-entry demand-details-history-entry-comment">
						<div class="demand-details-section-heading">
							<div class="demand-details-history-title">
								<span class="demand-details-history-icon demand-details-comment-icon" aria-hidden="true"></span>
								<p>Comentário</p>
							</div>
							<div class="demand-details-history-date">
								<p>${escapeHtml(formatDateTime(item.date))}</p>
							</div>
						</div>
						<div class="demand-details-history-content">
							<p class="demand-details-history-author">${escapeHtml(item.author)}:</p>
							<p class="demand-details-history-comment">${escapeHtml(item.content)}</p>
						</div>
					</div>
				`;
			}

			return `
				<div class="demand-details-history-entry demand-details-history-entry-system">
					<div class="demand-details-section-heading">
						<div class="demand-details-history-title">
							<span class="demand-details-history-icon demand-details-system-icon" aria-hidden="true"></span>
							<p>Sistema</p>
						</div>
						<div class="demand-details-history-date">
							<p>${escapeHtml(formatDateTime(item.date))}</p>
						</div>
					</div>
					<div class="demand-details-history-content">
						<p>${escapeHtml(item.summary || `${item.author} alterou ${item.field}.`)}</p>
					</div>
				</div>
			`;
		})
		.join("");
}

// Carrega a demanda da API
async function loadTask() {
	currentUser = (await headerPromise) || getUser();

	if (!taskId) {
		await showAlertModal(
			"Nenhuma demanda selecionada. Retornando ao Dashboard.",
			"Atenção",
		);
		window.location.href = "../../dashboard/dashboard.html";
		return;
	}

	const res = await getTaskDetails(taskId);
	if (!res.success || !res.task) {
		await showAlertModal(res.message || "Demanda não encontrada.", "Erro");
		window.location.href = "../../dashboard/dashboard.html";
		return;
	}

	populateFields(res.task);
	await loadCommentsAndHistory();

	if (window.lucide) {
		window.lucide.createIcons();
	}
}

// Registro de novo comentário
if (commentBtn && commentInput) {
	commentBtn.addEventListener("click", async () => {
		const content = commentInput.value.trim();
		if (!content) {
			await showAlertModal("Digite um comentário antes de enviar.", "Atenção");
			commentInput.focus();
			return;
		}

		commentBtn.disabled = true;
		const res = await createTaskComment(taskId, content);
		commentBtn.disabled = false;

		if (res.success) {
			commentInput.value = "";
			await loadCommentsAndHistory();
		} else {
			await showAlertModal(
				res.message || "Erro ao adicionar comentário.",
				"Erro",
			);
		}
	});
}

// Salvar alterações respeitando RBAC (Membro altera apenas status; Admin/Líder altera todos os campos)
if (saveBtn) {
	saveBtn.addEventListener("click", async () => {
		if (!originalTaskData) return;

		const member = isTeamMember();
		const nextStatus = statusSelect?.value;
		const statusChanged = nextStatus && nextStatus !== originalTaskData.status;

		// Membro da equipe só pode chamar atualização de status
		if (member) {
			if (!statusChanged) {
				await showAlertModal(
					"Nenhuma alteração de status foi selecionada.",
					"Atenção",
				);
				return;
			}
			const statusRes = await updateTaskStatus(taskId, nextStatus);
			if (statusRes.success) {
				await showAlertModal("Status atualizado com sucesso!", "Sucesso");
				await loadTask();
			} else {
				await showAlertModal(
					statusRes.message || "Não foi possível alterar o status.",
					"Erro",
				);
			}
			return;
		}

		// Validação para Administrador e Líder de Projeto
		const title = titleInput.value.trim();
		const description = descriptionTextarea.value.trim();
		if (!title) {
			await showAlertModal(
				"O título da demanda não pode ser vazio.",
				"Atenção",
			);
			titleInput.focus();
			return;
		}
		if (!description) {
			await showAlertModal(
				"A descrição da demanda não pode ser vazia.",
				"Atenção",
			);
			descriptionTextarea.focus();
			return;
		}

		const updatePayload = {
			title,
			description,
			type: typeSelect.value,
			priority: prioritySelect.value,
			fk_user_id: selectedResponsible?.id
				? Number(selectedResponsible.id)
				: null,
			due_date: dueDateInput?.value ? dueDateInput.value : null,
		};

		if (statusChanged) {
			updatePayload.status = nextStatus;
		}

		saveBtn.disabled = true;
		const updateRes = await updateTask(taskId, updatePayload);
		saveBtn.disabled = false;

		if (updateRes.success) {
			await showAlertModal(
				updateRes.message || "Alterações salvas com sucesso!",
				"Sucesso",
			);
			await loadTask();
		} else {
			await showAlertModal(
				updateRes.message || "Erro ao atualizar demanda.",
				"Erro",
			);
		}
	});
}

// Cancelamento lógico de demanda (Seções 2.2.4 e 2.2.8 — nunca exclusão física)
if (cancelBtn) {
	cancelBtn.addEventListener("click", async () => {
		if (!originalTaskData) return;

		const confirmed = await showConfirmModal(
			"Tem certeza que deseja cancelar esta demanda? O registro e o histórico serão preservados no sistema.",
			"Cancelar Demanda",
			{ confirmText: "Sim, cancelar", cancelText: "Voltar" },
		);
		if (!confirmed) return;

		const res = await cancelTask(taskId);
		if (res.success) {
			await showAlertModal("Demanda cancelada com sucesso!", "Sucesso");
			await loadTask();
		} else {
			await showAlertModal(
				res.message || "Não foi possível cancelar a demanda.",
				"Erro",
			);
		}
	});
}

// Reverter alterações locais no formulário
if (revertBtn) {
	revertBtn.addEventListener("click", () => {
		if (originalTaskData) {
			populateFields(originalTaskData);
		}
	});
}

if (formDetails)
	formDetails.addEventListener("submit", (e) => e.preventDefault());
if (formLogs) formLogs.addEventListener("submit", (e) => e.preventDefault());

loadTask();
