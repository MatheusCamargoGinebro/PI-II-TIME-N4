// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    controllers.ts -> Arquivo responsável pela lógica de controle do módulo de demandas, comentários, histórico e dashboard;
*/

// O============================================================================================O

import { Request, Response } from "express";
import models, {
	HistoryInsertEntry,
	TaskListFilters,
	TaskWithRelations,
	UpdateTaskInput,
} from "./models";
import {
	TaskPriority,
	TaskStatus,
	TaskType,
	format_mysql_datetime,
	validate_status_transition,
} from "./rules";
import project_models from "../projects/models";
import user_models, { PublicUser } from "../users/models";
import { ParsedDueDate, check_national_holiday } from "../../services/holidays";

// O============================================================================================O

// Verifica se o usuário tem acesso a um projeto específico (Admin acessa todos)
const can_access_project = async (
	user: PublicUser,
	project_id: number,
): Promise<boolean> => {
	if (user.authority_level === "Administrador") {
		const project = await project_models.get_project_by_id(project_id);
		return project !== null;
	}

	return project_models.is_user_in_project(user.user_id, project_id);
};

// Verifica se o responsável informado existe e pertence ao projeto (ou é Administrador)
const validate_responsible_user = async (
	responsible_id: number,
	project_id: number,
): Promise<{ valid: boolean; status_code: number; message?: string }> => {
	const target_user = await user_models.get_user_by_id(responsible_id);

	if (!target_user) {
		return {
			valid: false,
			status_code: 404,
			message: "Usuário responsável informado não foi encontrado.",
		};
	}

	if (target_user.authority_level !== "Administrador") {
		const linked = await project_models.is_user_in_project(
			responsible_id,
			project_id,
		);
		if (!linked) {
			return {
				valid: false,
				status_code: 400,
				message:
					"O usuário responsável informado não está vinculado ao projeto desta demanda.",
			};
		}
	}

	return { valid: true, status_code: 200 };
};

// Valida se uma data de prazo cai em feriado nacional via API externa (Seção 2.2.5)
const validate_due_date_holiday = async (
	parsed_date: ParsedDueDate,
): Promise<{ valid: boolean; status_code: number; message?: string }> => {
	try {
		const holiday_check = await check_national_holiday(parsed_date);

		if (holiday_check.is_holiday && holiday_check.holiday) {
			return {
				valid: false,
				status_code: 400,
				message: `A data informada para o prazo de finalização (${parsed_date.date_only}) é um feriado nacional (${holiday_check.holiday.name}) e não pode ser utilizada.`,
			};
		}

		return { valid: true, status_code: 200 };
	} catch (error) {
		return {
			valid: false,
			status_code: 503,
			message:
				"Não foi possível consultar a API externa de feriados nacionais para validar o prazo de finalização. Tente novamente.",
		};
	}
};

// Carrega uma demanda e garante que o usuário autenticado tenha permissão de visualização
const load_accessible_task = async (
	user: PublicUser,
	task_id: number,
): Promise<{
	task: TaskWithRelations | null;
	status_code: number;
	message?: string;
}> => {
	const task = await models.get_task_by_id(task_id);

	if (!task) {
		return {
			task: null,
			status_code: 404,
			message: "Demanda não encontrada.",
		};
	}

	if (user.authority_level !== "Administrador") {
		const has_access = await project_models.is_user_in_project(
			user.user_id,
			task.fk_project_id,
		);
		if (!has_access) {
			return {
				task: null,
				status_code: 403,
				message:
					"Acesso negado. Você não está vinculado ao projeto desta demanda.",
			};
		}
	}

	return { task, status_code: 200 };
};

// O============================================================================================O

// Visão geral das demandas vinculadas ao usuário (suporta filtros de status, prioridade, tipo e busca)
const get_overview = async (__req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const is_admin = user.authority_level === "Administrador";
	const filters = (res.locals.task_filters as TaskListFilters) || {};

	const tasks = await models.get_tasks_by_user_id(
		user.user_id,
		is_admin,
		filters,
	);

	return res.status(200).json({
		message: "Tarefas encontradas com sucesso.",
		total: tasks.length,
		tasks,
	});
};

// O============================================================================================O

// Métricas resumidas do Dashboard (Seção 2.4)
const get_dashboard = async (__req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const is_admin = user.authority_level === "Administrador";
	const { project_id, upcoming_days } = res.locals.dashboard_params as {
		project_id?: number;
		upcoming_days: number;
	};

	// Caso um filtro de projeto seja informado, valida se o usuário pode acessá-lo
	if (project_id !== undefined) {
		const has_access = await can_access_project(user, project_id);
		if (!has_access) {
			return res.status(403).json({
				message:
					"Projeto não encontrado ou o usuário não tem acesso ao projeto informado.",
			});
		}
	}

	const dashboard = await models.get_dashboard_metrics({
		user_id: user.user_id,
		is_admin,
		project_id,
		upcoming_days,
	});

	return res.status(200).json({
		message: "Métricas do dashboard obtidas com sucesso.",
		dashboard,
	});
};

// O============================================================================================O

// Lista demandas com filtros combinados, busca textual e ordenação (Seções 2.2.9 e 2.3)
const list_tasks = async (__req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const is_admin = user.authority_level === "Administrador";
	const filters = res.locals.task_filters as TaskListFilters;

	// Se o usuário filtrou explicitamente por um projeto sem vínculo, bloqueia com 403
	if (!is_admin && filters.fk_project_id !== undefined) {
		const has_access = await project_models.is_user_in_project(
			user.user_id,
			filters.fk_project_id,
		);
		if (!has_access) {
			return res.status(403).json({
				message: "Acesso negado. Você não está vinculado ao projeto informado.",
			});
		}
	}

	const tasks = await models.list_tasks(user.user_id, is_admin, filters);

	return res.status(200).json({
		message: "Demandas listadas com sucesso.",
		total: tasks.length,
		tasks,
	});
};

// O============================================================================================O

// Obtém os detalhes completos de uma demanda específica (GET /tasks/:task_id)
const get_task_details = async (__req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const task_id = res.locals.task_id as number;

	const access = await load_accessible_task(user, task_id);

	if (!access.task) {
		return res.status(access.status_code).json({
			message: access.message,
		});
	}

	return res.status(200).json({
		message: "Detalhes da demanda obtidos com sucesso.",
		task: access.task,
	});
};

// O============================================================================================O

// Cadastra uma nova demanda com status inicial forçado para ABERTA e validação de feriado nacional
const create_task = async (__req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const payload = res.locals.create_task_payload as {
		title: string;
		description: string;
		type: TaskType;
		priority: TaskPriority;
		fk_project_id: number;
		fk_user_id: number | null;
		parsed_due_date: ParsedDueDate | null;
	};

	// Apenas Administrador e Líder de Projeto podem criar demandas (Seção 2.1)
	if (user.authority_level === "Membro da equipe") {
		return res.status(403).json({
			message:
				"Acesso negado. Membros da equipe não têm permissão para criar demandas.",
		});
	}

	// Verifica se o projeto existe e se o Líder está vinculado a ele
	const project = await project_models.get_project_by_id(payload.fk_project_id);
	if (!project) {
		return res.status(404).json({
			message: "Projeto associado não encontrado.",
			errorAt: "fk_project_id",
		});
	}

	if (user.authority_level !== "Administrador") {
		const in_project = await project_models.is_user_in_project(
			user.user_id,
			payload.fk_project_id,
		);
		if (!in_project) {
			return res.status(403).json({
				message:
					"Acesso negado. Você só pode criar demandas em projetos aos quais está vinculado.",
				errorAt: "fk_project_id",
			});
		}
	}

	// Valida o responsável caso informado (pode permanecer em branco/null na criação)
	if (payload.fk_user_id !== null) {
		const responsible_check = await validate_responsible_user(
			payload.fk_user_id,
			payload.fk_project_id,
		);
		if (!responsible_check.valid) {
			return res.status(responsible_check.status_code).json({
				message: responsible_check.message,
				errorAt: "fk_user_id",
			});
		}
	}

	// Valida feriado nacional via API externa quando due_date é informado (Seção 2.2.5)
	if (payload.parsed_due_date !== null) {
		const holiday_check = await validate_due_date_holiday(
			payload.parsed_due_date,
		);
		if (!holiday_check.valid) {
			return res.status(holiday_check.status_code).json({
				message: holiday_check.message,
				errorAt: "due_date",
			});
		}
	}

	const task_id = await models.create_task({
		title: payload.title,
		description: payload.description,
		type: payload.type,
		priority: payload.priority,
		due_date: payload.parsed_due_date
			? payload.parsed_due_date.mysql_timestamp
			: null,
		fk_project_id: payload.fk_project_id,
		fk_user_id: payload.fk_user_id,
		fk_creator_id: user.user_id,
	});

	const created_task = await models.get_task_by_id(task_id);

	return res.status(201).json({
		message: "Demanda criada com sucesso.",
		task: created_task,
	});
};

// O============================================================================================O

// Edita informações de uma demanda e registra automaticamente todas as alterações no histórico
const update_task = async (__req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const task_id = res.locals.task_id as number;
	const payload = res.locals.update_task_payload as {
		title?: string;
		description?: string;
		type?: TaskType;
		priority?: TaskPriority;
		status?: TaskStatus;
		fk_user_id?: number | null;
		has_due_date?: boolean;
		parsed_due_date?: ParsedDueDate | null;
	};

	// Membro da equipe não pode editar dados estruturais, prioridade ou responsável (Seção 2.1.3)
	if (user.authority_level === "Membro da equipe") {
		return res.status(403).json({
			message:
				"Acesso negado. Membros da equipe não podem editar demandas, alterar prioridade ou modificar responsáveis.",
		});
	}

	const access = await load_accessible_task(user, task_id);

	if (!access.task) {
		return res.status(access.status_code).json({
			message: access.message,
		});
	}

	const current_task = access.task;

	// Bloqueia edição de demandas já finalizadas
	if (
		current_task.status === "CONCLUIDA" ||
		current_task.status === "CANCELADA"
	) {
		return res.status(400).json({
			message: `Não é possível editar uma demanda com status '${current_task.status}'.`,
		});
	}

	// Caso o status seja enviado na edição, aplica integralmente a máquina de estados e RBAC
	if (payload.status !== undefined && payload.status !== current_task.status) {
		const transition = validate_status_transition({
			current_status: current_task.status,
			next_status: payload.status,
			authority_level: user.authority_level,
			user_id: user.user_id,
			task_responsible_id: current_task.fk_user_id,
		});

		if (!transition.allowed) {
			return res.status(transition.status_code).json({
				message: transition.message,
				errorAt: "status",
			});
		}
	}

	// Valida o novo responsável, se informado e não nulo
	if (
		payload.fk_user_id !== undefined &&
		payload.fk_user_id !== null &&
		payload.fk_user_id !== current_task.fk_user_id
	) {
		const responsible_check = await validate_responsible_user(
			payload.fk_user_id,
			current_task.fk_project_id,
		);
		if (!responsible_check.valid) {
			return res.status(responsible_check.status_code).json({
				message: responsible_check.message,
				errorAt: "fk_user_id",
			});
		}
	}

	// Valida feriado nacional via API externa sempre que um novo prazo for definido
	if (payload.has_due_date && payload.parsed_due_date) {
		const holiday_check = await validate_due_date_holiday(
			payload.parsed_due_date,
		);
		if (!holiday_check.valid) {
			return res.status(holiday_check.status_code).json({
				message: holiday_check.message,
				errorAt: "due_date",
			});
		}
	}

	const update_fields: UpdateTaskInput = {};
	const history_entries: HistoryInsertEntry[] = [];

	if (payload.title !== undefined && payload.title !== current_task.title) {
		update_fields.title = payload.title;
		history_entries.push({
			field_name: "title",
			old_value: current_task.title,
			new_value: payload.title,
			fk_task_id: task_id,
			fk_user_id: user.user_id,
		});
	}

	if (
		payload.description !== undefined &&
		payload.description !== current_task.description
	) {
		update_fields.description = payload.description;
		history_entries.push({
			field_name: "description",
			old_value: current_task.description,
			new_value: payload.description,
			fk_task_id: task_id,
			fk_user_id: user.user_id,
		});
	}

	if (payload.type !== undefined && payload.type !== current_task.type) {
		update_fields.type = payload.type;
		history_entries.push({
			field_name: "type",
			old_value: current_task.type,
			new_value: payload.type,
			fk_task_id: task_id,
			fk_user_id: user.user_id,
		});
	}

	if (
		payload.priority !== undefined &&
		payload.priority !== current_task.priority
	) {
		update_fields.priority = payload.priority;
		history_entries.push({
			field_name: "priority",
			old_value: current_task.priority,
			new_value: payload.priority,
			fk_task_id: task_id,
			fk_user_id: user.user_id,
		});
	}

	if (payload.status !== undefined && payload.status !== current_task.status) {
		update_fields.status = payload.status;
		history_entries.push({
			field_name: "status",
			old_value: current_task.status,
			new_value: payload.status,
			fk_task_id: task_id,
			fk_user_id: user.user_id,
		});
	}

	if (
		payload.fk_user_id !== undefined &&
		payload.fk_user_id !== current_task.fk_user_id
	) {
		update_fields.fk_user_id = payload.fk_user_id;
		history_entries.push({
			field_name: "fk_user_id",
			old_value:
				current_task.fk_user_id !== null
					? String(current_task.fk_user_id)
					: null,
			new_value:
				payload.fk_user_id !== null
					? String(payload.fk_user_id)
					: "SEM RESPONSAVEL",
			fk_task_id: task_id,
			fk_user_id: user.user_id,
		});
	}

	if (payload.has_due_date) {
		const current_due = format_mysql_datetime(current_task.due_date);
		const next_due = payload.parsed_due_date
			? payload.parsed_due_date.mysql_timestamp
			: null;

		if (current_due !== next_due) {
			update_fields.due_date = next_due;
			history_entries.push({
				field_name: "due_date",
				old_value: current_due,
				new_value: next_due ?? "SEM PRAZO",
				fk_task_id: task_id,
				fk_user_id: user.user_id,
			});
		}
	}

	if (history_entries.length === 0) {
		return res.status(200).json({
			message: "Nenhuma alteração detectada na demanda.",
			task: current_task,
		});
	}

	await models.update_task(task_id, update_fields);
	await models.record_history_entries(history_entries);

	const updated_task = await models.get_task_by_id(task_id);

	return res.status(200).json({
		message: "Demanda atualizada com sucesso.",
		task: updated_task,
	});
};

// O============================================================================================O

// Atualiza o status de uma demanda aplicando máquina de estados (Seção 2.2.4) e RBAC (Seção 2.1)
const update_task_status = async (__req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const task_id = res.locals.task_id as number;
	const {
		status: next_status,
		has_due_date,
		parsed_due_date,
	} = res.locals.update_status_payload as {
		status: TaskStatus;
		has_due_date: boolean;
		parsed_due_date: ParsedDueDate | null;
	};

	const access = await load_accessible_task(user, task_id);

	if (!access.task) {
		return res.status(access.status_code).json({
			message: access.message,
		});
	}

	const current_task = access.task;

	const transition = validate_status_transition({
		current_status: current_task.status,
		next_status,
		authority_level: user.authority_level,
		user_id: user.user_id,
		task_responsible_id: current_task.fk_user_id,
	});

	if (!transition.allowed) {
		return res.status(transition.status_code).json({
			message: transition.message,
			errorAt: "status",
		});
	}

	const update_fields: UpdateTaskInput = { status: next_status };
	const history_entries: HistoryInsertEntry[] = [
		{
			field_name: "status",
			old_value: current_task.status,
			new_value: next_status,
			fk_task_id: task_id,
			fk_user_id: user.user_id,
		},
	];

	// Permite definir prazo de finalização junto à mudança de status (ex.: ao passar para EM ANDAMENTO)
	if (has_due_date) {
		if (user.authority_level === "Membro da equipe") {
			return res.status(403).json({
				message:
					"Acesso negado. Membros da equipe não podem alterar o prazo de finalização da demanda.",
				errorAt: "due_date",
			});
		}

		if (parsed_due_date) {
			const holiday_check = await validate_due_date_holiday(parsed_due_date);
			if (!holiday_check.valid) {
				return res.status(holiday_check.status_code).json({
					message: holiday_check.message,
					errorAt: "due_date",
				});
			}
		}

		const current_due = format_mysql_datetime(current_task.due_date);
		const next_due = parsed_due_date ? parsed_due_date.mysql_timestamp : null;

		if (current_due !== next_due) {
			update_fields.due_date = next_due;
			history_entries.push({
				field_name: "due_date",
				old_value: current_due,
				new_value: next_due ?? "SEM PRAZO",
				fk_task_id: task_id,
				fk_user_id: user.user_id,
			});
		}
	}

	await models.update_task(task_id, update_fields);
	await models.record_history_entries(history_entries);

	const updated_task = await models.get_task_by_id(task_id);

	return res.status(200).json({
		message: "Status da demanda atualizado com sucesso.",
		task: updated_task,
	});
};

// O============================================================================================O

// Cancela uma demanda sem exclusão física (Seções 2.2.4 e 2.2.8) e grava no histórico
const cancel_task = async (__req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const task_id = res.locals.task_id as number;

	if (user.authority_level === "Membro da equipe") {
		return res.status(403).json({
			message:
				"Acesso negado. Membros da equipe não têm permissão para cancelar demandas.",
		});
	}

	const access = await load_accessible_task(user, task_id);

	if (!access.task) {
		return res.status(access.status_code).json({
			message: access.message,
		});
	}

	const current_task = access.task;

	const transition = validate_status_transition({
		current_status: current_task.status,
		next_status: "CANCELADA",
		authority_level: user.authority_level,
		user_id: user.user_id,
		task_responsible_id: current_task.fk_user_id,
	});

	if (!transition.allowed) {
		return res.status(transition.status_code).json({
			message: transition.message,
		});
	}

	await models.update_task(task_id, { status: "CANCELADA" });
	await models.record_history_entries([
		{
			field_name: "status",
			old_value: current_task.status,
			new_value: "CANCELADA",
			fk_task_id: task_id,
			fk_user_id: user.user_id,
		},
	]);

	const cancelled_task = await models.get_task_by_id(task_id);

	return res.status(200).json({
		message: "Demanda cancelada com sucesso.",
		task: cancelled_task,
	});
};

// O============================================================================================O

// Bloqueia explicitamente qualquer tentativa de exclusão física de demandas (Seção 2.2.8)
const block_physical_delete = (__req: Request, res: Response) => {
	return res.status(405).json({
		message:
			"A exclusão física de demandas não é permitida. Utilize o cancelamento (PATCH /tasks/:task_id/cancel).",
	});
};

// O============================================================================================O

// Lista os comentários vinculados a uma demanda (Seção 2.2.6)
const list_task_comments = async (__req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const task_id = res.locals.task_id as number;

	const access = await load_accessible_task(user, task_id);

	if (!access.task) {
		return res.status(access.status_code).json({
			message: access.message,
		});
	}

	const comments = await models.get_task_comments(task_id);

	return res.status(200).json({
		message: "Comentários obtidos com sucesso.",
		comments,
	});
};

// O============================================================================================O

// Registra um novo comentário em uma demanda (permitido para todos os perfis com acesso ao projeto)
const create_task_comment = async (req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const task_id = res.locals.task_id as number;
	const content = req.body.content as string;

	const access = await load_accessible_task(user, task_id);

	if (!access.task) {
		return res.status(access.status_code).json({
			message: access.message,
		});
	}

	const comment = await models.create_task_comment(
		task_id,
		user.user_id,
		content,
	);

	return res.status(201).json({
		message: "Comentário registrado com sucesso.",
		comment,
	});
};

// O============================================================================================O

// Lista o histórico completo da demanda: histórico de alterações e lista de comentários (Seções 2.2.6 e 2.2.7)
const list_task_history = async (__req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const task_id = res.locals.task_id as number;

	const access = await load_accessible_task(user, task_id);

	if (!access.task) {
		return res.status(access.status_code).json({
			message: access.message,
		});
	}

	const [history, comments] = await Promise.all([
		models.get_task_history(task_id),
		models.get_task_comments(task_id),
	]);

	return res.status(200).json({
		message: "Histórico da demanda obtido com sucesso.",
		history,
		comments,
	});
};

// O============================================================================================O

export default {
	get_overview,
	get_dashboard,
	list_tasks,
	get_task_details,
	create_task,
	update_task,
	update_task_status,
	cancel_task,
	block_physical_delete,
	list_task_comments,
	create_task_comment,
	list_task_history,
};

// O============================================================================================O
