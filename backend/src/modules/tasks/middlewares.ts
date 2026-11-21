// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    middlewares.ts -> Arquivo responsável pelas validações de parâmetros, filtros e payloads do módulo de demandas;
*/

// O============================================================================================O

import { Request, Response, NextFunction } from "express";
import {
	SortOrder,
	TaskPriority,
	TaskSortField,
	TaskStatus,
	TaskType,
	VALID_SORT_FIELDS,
	VALID_TASK_PRIORITIES,
	VALID_TASK_STATUSES,
	VALID_TASK_TYPES,
	normalize_task_priority,
	normalize_task_status,
	normalize_task_type,
} from "./rules";
import { TaskListFilters } from "./models";
import { parse_due_date } from "../../services/holidays";

// O============================================================================================O

// Valida o parâmetro task_id da URL como inteiro positivo
const task_id_param = (req: Request, res: Response, next: NextFunction) => {
	const raw_id = req.params.task_id;
	const parsed = Number(raw_id);

	if (!raw_id || !Number.isInteger(parsed) || parsed <= 0) {
		return res.status(400).json({
			message:
				"ID da demanda não fornecido ou inválido nos parâmetros da requisição.",
			errorAt: "task_id",
		});
	}

	res.locals.task_id = parsed;

	return next();
};

// O============================================================================================O

// Valida os campos obrigatórios e opcionais no cadastro de uma nova demanda (POST /tasks)
const create_task_body = (req: Request, res: Response, next: NextFunction) => {
	const {
		title,
		description,
		type,
		priority,
		fk_project_id,
		fk_user_id,
		due_date,
	} = req.body;

	if (typeof title !== "string" || title.trim().length === 0) {
		return res.status(400).json({
			message: "O título da demanda é obrigatório.",
			errorAt: "title",
		});
	}

	if (title.trim().length > 256) {
		return res.status(400).json({
			message: "O título da demanda deve ter no máximo 256 caracteres.",
			errorAt: "title",
		});
	}

	if (typeof description !== "string" || description.trim().length === 0) {
		return res.status(400).json({
			message: "A descrição da demanda é obrigatória.",
			errorAt: "description",
		});
	}

	const normalized_type = normalize_task_type(type);
	if (!normalized_type) {
		return res.status(400).json({
			message: `Tipo de demanda inválido. Valores aceitos: ${VALID_TASK_TYPES.join(", ")}.`,
			errorAt: "type",
		});
	}

	const normalized_priority = normalize_task_priority(priority);
	if (!normalized_priority) {
		return res.status(400).json({
			message: `Prioridade inválida. Valores aceitos: ${VALID_TASK_PRIORITIES.join(", ")}.`,
			errorAt: "priority",
		});
	}

	const parsed_project_id = Number(fk_project_id);
	if (
		fk_project_id === undefined ||
		fk_project_id === null ||
		fk_project_id === "" ||
		!Number.isInteger(parsed_project_id) ||
		parsed_project_id <= 0
	) {
		return res.status(400).json({
			message:
				"O projeto associado (fk_project_id) é obrigatório e deve ser um inteiro positivo.",
			errorAt: "fk_project_id",
		});
	}

	// Responsável é opcional na criação (Seção 2.2.5)
	let parsed_user_id: number | null = null;
	if (fk_user_id !== undefined && fk_user_id !== null && fk_user_id !== "") {
		const num = Number(fk_user_id);
		if (!Number.isInteger(num) || num <= 0) {
			return res.status(400).json({
				message:
					"O ID do responsável (fk_user_id) deve ser um número inteiro positivo ou nulo.",
				errorAt: "fk_user_id",
			});
		}
		parsed_user_id = num;
	}

	// Prazo de finalização é opcional na criação, mas se informado precisa ser uma data válida
	let parsed_due_date = null;
	if (due_date !== undefined && due_date !== null && due_date !== "") {
		parsed_due_date = parse_due_date(due_date);
		if (!parsed_due_date) {
			return res.status(400).json({
				message:
					"Prazo de finalização (due_date) inválido. Utilize o formato YYYY-MM-DD ou ISO 8601.",
				errorAt: "due_date",
			});
		}
	}

	res.locals.create_task_payload = {
		title: title.trim(),
		description: description.trim(),
		type: normalized_type,
		priority: normalized_priority,
		fk_project_id: parsed_project_id,
		fk_user_id: parsed_user_id,
		parsed_due_date,
	};

	return next();
};

// O============================================================================================O

// Valida os campos editáveis de uma demanda (PUT / PATCH /tasks/:task_id)
const update_task_body = (req: Request, res: Response, next: NextFunction) => {
	const { title, description, type, priority, status, fk_user_id, due_date } =
		req.body;

	const payload: {
		title?: string;
		description?: string;
		type?: TaskType;
		priority?: TaskPriority;
		status?: TaskStatus;
		fk_user_id?: number | null;
		has_due_date?: boolean;
		parsed_due_date?: ReturnType<typeof parse_due_date>;
	} = {};

	let has_any_field = false;

	if (title !== undefined) {
		if (typeof title !== "string" || title.trim().length === 0) {
			return res.status(400).json({
				message: "O título da demanda deve ser uma string não vazia.",
				errorAt: "title",
			});
		}
		if (title.trim().length > 256) {
			return res.status(400).json({
				message: "O título da demanda deve ter no máximo 256 caracteres.",
				errorAt: "title",
			});
		}
		payload.title = title.trim();
		has_any_field = true;
	}

	if (description !== undefined) {
		if (typeof description !== "string" || description.trim().length === 0) {
			return res.status(400).json({
				message: "A descrição da demanda deve ser uma string não vazia.",
				errorAt: "description",
			});
		}
		payload.description = description.trim();
		has_any_field = true;
	}

	if (type !== undefined) {
		const normalized_type = normalize_task_type(type);
		if (!normalized_type) {
			return res.status(400).json({
				message: `Tipo de demanda inválido. Valores aceitos: ${VALID_TASK_TYPES.join(", ")}.`,
				errorAt: "type",
			});
		}
		payload.type = normalized_type;
		has_any_field = true;
	}

	if (priority !== undefined) {
		const normalized_priority = normalize_task_priority(priority);
		if (!normalized_priority) {
			return res.status(400).json({
				message: `Prioridade inválida. Valores aceitos: ${VALID_TASK_PRIORITIES.join(", ")}.`,
				errorAt: "priority",
			});
		}
		payload.priority = normalized_priority;
		has_any_field = true;
	}

	if (status !== undefined) {
		const normalized_status = normalize_task_status(status);
		if (!normalized_status) {
			return res.status(400).json({
				message: `Status inválido. Valores aceitos: ${VALID_TASK_STATUSES.join(", ")}.`,
				errorAt: "status",
			});
		}
		payload.status = normalized_status;
		has_any_field = true;
	}

	if (fk_user_id !== undefined) {
		if (fk_user_id === null || fk_user_id === "") {
			payload.fk_user_id = null;
		} else {
			const num = Number(fk_user_id);
			if (!Number.isInteger(num) || num <= 0) {
				return res.status(400).json({
					message:
						"O ID do responsável (fk_user_id) deve ser um número inteiro positivo ou nulo.",
					errorAt: "fk_user_id",
				});
			}
			payload.fk_user_id = num;
		}
		has_any_field = true;
	}

	if (due_date !== undefined) {
		payload.has_due_date = true;
		if (due_date === null || due_date === "") {
			payload.parsed_due_date = null;
		} else {
			const parsed = parse_due_date(due_date);
			if (!parsed) {
				return res.status(400).json({
					message:
						"Prazo de finalização (due_date) inválido. Utilize o formato YYYY-MM-DD ou ISO 8601.",
					errorAt: "due_date",
				});
			}
			payload.parsed_due_date = parsed;
		}
		has_any_field = true;
	}

	if (!has_any_field) {
		return res.status(400).json({
			message: "Informe ao menos um campo válido para atualização da demanda.",
		});
	}

	res.locals.update_task_payload = payload;

	return next();
};

// O============================================================================================O

// Valida o payload da atualização de status (PATCH /tasks/:task_id/status)
const update_status_body = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const { status, due_date } = req.body;

	const normalized_status = normalize_task_status(status);
	if (!normalized_status) {
		return res.status(400).json({
			message: `Status obrigatório ou inválido. Valores aceitos: ${VALID_TASK_STATUSES.join(", ")}.`,
			errorAt: "status",
		});
	}

	let has_due_date = false;
	let parsed_due_date = null;

	// Permite definir opcionalmente o prazo ao mudar status (ex.: ao iniciar "Em andamento", Seção 2.2.5)
	if (due_date !== undefined) {
		has_due_date = true;
		if (due_date !== null && due_date !== "") {
			parsed_due_date = parse_due_date(due_date);
			if (!parsed_due_date) {
				return res.status(400).json({
					message:
						"Prazo de finalização (due_date) inválido. Utilize o formato YYYY-MM-DD ou ISO 8601.",
					errorAt: "due_date",
				});
			}
		}
	}

	res.locals.update_status_payload = {
		status: normalized_status,
		has_due_date,
		parsed_due_date,
	};

	return next();
};

// O============================================================================================O

// Valida o conteúdo de um novo comentário (POST /tasks/:task_id/comments)
const comment_body = (req: Request, res: Response, next: NextFunction) => {
	const { content } = req.body;

	if (typeof content !== "string" || content.trim().length === 0) {
		return res.status(400).json({
			message: "O conteúdo do comentário é obrigatório.",
			errorAt: "content",
		});
	}

	req.body.content = content.trim();

	return next();
};

// O============================================================================================O

// Faz o parse e validação dos filtros, busca textual e ordenação na listagem de demandas (Seção 2.3)
const list_tasks_query = (req: Request, res: Response, next: NextFunction) => {
	const filters: TaskListFilters = {};

	const parse_multi_param = (raw: unknown): string[] => {
		if (typeof raw === "string") {
			return raw
				.split(",")
				.map((s) => s.trim())
				.filter((s) => s.length > 0);
		}
		if (Array.isArray(raw)) {
			return raw
				.flatMap((v) => (typeof v === "string" ? v.split(",") : []))
				.map((s) => s.trim())
				.filter((s) => s.length > 0);
		}
		return [];
	};

	// Filtro por status (aceita valor único ou múltiplos separados por vírgula)
	if (req.query.status !== undefined && req.query.status !== "") {
		const raw_values = parse_multi_param(req.query.status);
		const normalized: TaskStatus[] = [];
		for (const item of raw_values) {
			const val = normalize_task_status(item);
			if (!val) {
				return res.status(400).json({
					message: `Filtro status inválido: '${item}'. Valores aceitos: ${VALID_TASK_STATUSES.join(", ")}.`,
					errorAt: "status",
				});
			}
			normalized.push(val);
		}
		filters.statuses = normalized;
	}

	// Filtro por prioridade
	if (req.query.priority !== undefined && req.query.priority !== "") {
		const raw_values = parse_multi_param(req.query.priority);
		const normalized: TaskPriority[] = [];
		for (const item of raw_values) {
			const val = normalize_task_priority(item);
			if (!val) {
				return res.status(400).json({
					message: `Filtro priority inválido: '${item}'. Valores aceitos: ${VALID_TASK_PRIORITIES.join(", ")}.`,
					errorAt: "priority",
				});
			}
			normalized.push(val);
		}
		filters.priorities = normalized;
	}

	// Filtro por tipo
	if (req.query.type !== undefined && req.query.type !== "") {
		const raw_values = parse_multi_param(req.query.type);
		const normalized: TaskType[] = [];
		for (const item of raw_values) {
			const val = normalize_task_type(item);
			if (!val) {
				return res.status(400).json({
					message: `Filtro type inválido: '${item}'. Valores aceitos: ${VALID_TASK_TYPES.join(", ")}.`,
					errorAt: "type",
				});
			}
			normalized.push(val);
		}
		filters.types = normalized;
	}

	// Filtro para listar apenas demandas atribuídas ao usuário autenticado (mine=true ou only_mine=true)
	const raw_mine = req.query.mine ?? req.query.only_mine;
	if (raw_mine !== undefined && raw_mine !== "") {
		const mine_str = String(raw_mine).trim().toLowerCase();
		if (mine_str === "true" || mine_str === "1") {
			filters.mine = true;
		} else if (mine_str !== "false" && mine_str !== "0") {
			return res.status(400).json({
				message: "Parâmetro mine inválido. Utilize true ou false.",
				errorAt: "mine",
			});
		}
	}

	// Filtro por responsável (aceita fk_user_id ou responsible_id; também aceita "unassigned"/"null")
	const raw_responsible = req.query.fk_user_id ?? req.query.responsible_id;
	if (raw_responsible !== undefined && raw_responsible !== "") {
		const str = String(raw_responsible).trim().toLowerCase();
		if (str === "null" || str === "unassigned" || str === "none") {
			filters.fk_user_id = "UNASSIGNED";
		} else {
			const num = Number(str);
			if (!Number.isInteger(num) || num <= 0) {
				return res.status(400).json({
					message:
						"Filtro de responsável (fk_user_id) deve ser um número inteiro positivo ou 'unassigned'.",
					errorAt: "fk_user_id",
				});
			}
			filters.fk_user_id = num;
		}
	}

	// Filtro por projeto (aceita fk_project_id ou project_id)
	const raw_project = req.query.fk_project_id ?? req.query.project_id;
	if (raw_project !== undefined && raw_project !== "") {
		const num = Number(raw_project);
		if (!Number.isInteger(num) || num <= 0) {
			return res.status(400).json({
				message:
					"Filtro de projeto (fk_project_id) deve ser um número inteiro positivo.",
				errorAt: "fk_project_id",
			});
		}
		filters.fk_project_id = num;
	}

	// Busca textual em título e descrição (aceita q ou search)
	const raw_q = req.query.q ?? req.query.search;
	if (typeof raw_q === "string" && raw_q.trim().length > 0) {
		filters.q = raw_q.trim();
	}

	// Ordenação por priority, creation_date, due_date ou status
	const raw_sort_by = req.query.sort_by ?? req.query.order_by;
	if (raw_sort_by !== undefined && raw_sort_by !== "") {
		const sort_str = String(raw_sort_by).trim().toLowerCase();
		if (!(VALID_SORT_FIELDS as readonly string[]).includes(sort_str)) {
			return res.status(400).json({
				message: `Critério de ordenação inválido: '${sort_str}'. Valores aceitos: ${VALID_SORT_FIELDS.join(", ")}.`,
				errorAt: "sort_by",
			});
		}
		filters.sort_by = sort_str as TaskSortField;
	}

	// Direção da ordenação (ASC ou DESC)
	const raw_sort_order = req.query.sort_order ?? req.query.order;
	if (raw_sort_order !== undefined && raw_sort_order !== "") {
		const order_str = String(raw_sort_order).trim().toUpperCase();
		if (order_str !== "ASC" && order_str !== "DESC") {
			return res.status(400).json({
				message: "Direção de ordenação inválida. Valores aceitos: ASC ou DESC.",
				errorAt: "sort_order",
			});
		}
		filters.sort_order = order_str as SortOrder;
	}

	res.locals.task_filters = filters;

	return next();
};

// O============================================================================================O

// Valida parâmetros opcionais do endpoint de métricas do Dashboard (GET /tasks/dashboard)
const dashboard_query = (req: Request, res: Response, next: NextFunction) => {
	let project_id: number | undefined;
	const raw_project = req.query.project_id ?? req.query.fk_project_id;

	if (raw_project !== undefined && raw_project !== "") {
		const parsed = Number(raw_project);
		if (!Number.isInteger(parsed) || parsed <= 0) {
			return res.status(400).json({
				message:
					"Parâmetro project_id inválido. Deve ser um número inteiro positivo.",
				errorAt: "project_id",
			});
		}
		project_id = parsed;
	}

	let upcoming_days = 7;
	if (req.query.days !== undefined && req.query.days !== "") {
		const parsed_days = Number(req.query.days);
		if (
			!Number.isInteger(parsed_days) ||
			parsed_days < 1 ||
			parsed_days > 365
		) {
			return res.status(400).json({
				message: "Parâmetro days inválido. Informe um inteiro entre 1 e 365.",
				errorAt: "days",
			});
		}
		upcoming_days = parsed_days;
	}

	res.locals.dashboard_params = {
		project_id,
		upcoming_days,
	};

	return next();
};

// O============================================================================================O

export default {
	task_id_param,
	create_task_body,
	update_task_body,
	update_status_body,
	comment_body,
	list_tasks_query,
	dashboard_query,
};

// O============================================================================================O
