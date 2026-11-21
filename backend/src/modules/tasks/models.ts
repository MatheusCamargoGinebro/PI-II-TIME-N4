// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    models.ts -> Arquivo responsável pela comunicação do módulo de demandas, comentários, histórico e dashboard com o banco de dados MySQL;
*/

// O============================================================================================O

import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import connection from "../../services/connection";
import {
	SortOrder,
	TaskPriority,
	TaskSortField,
	TaskStatus,
	TaskType,
	format_history_summary,
} from "./rules";

export interface TaskWithRelations extends RowDataPacket {
	task_id: number;
	title: string;
	description: string;
	type: TaskType;
	priority: TaskPriority;
	status: TaskStatus;
	creation_date: Date | string;
	updated_at: Date | string;
	due_date: Date | string | null;
	fk_project_id: number;
	fk_user_id: number | null;
	fk_creator_id: number;
	project_id: number;
	project_title: string;
	creator_id: number;
	creator_name: string;
	creator_email: string;
	creator_profile_pic: string | null;
	responsible_id: number | null;
	responsible_name: string | null;
	responsible_email: string | null;
	responsible_profile_pic: string | null;
}

export interface TaskListFilters {
	statuses?: TaskStatus[];
	priorities?: TaskPriority[];
	types?: TaskType[];
	fk_user_id?: number | "UNASSIGNED";
	fk_project_id?: number;
	mine?: boolean;
	q?: string;
	sort_by?: TaskSortField;
	sort_order?: SortOrder;
}

export interface CreateTaskInput {
	title: string;
	description: string;
	type: TaskType;
	priority: TaskPriority;
	due_date: string | null;
	fk_project_id: number;
	fk_user_id: number | null;
	fk_creator_id: number;
}

export interface UpdateTaskInput {
	title?: string;
	description?: string;
	type?: TaskType;
	priority?: TaskPriority;
	status?: TaskStatus;
	due_date?: string | null;
	fk_user_id?: number | null;
}

export interface HistoryInsertEntry {
	field_name: string;
	old_value: string | null;
	new_value: string;
	fk_task_id: number;
	fk_user_id: number;
}

// Seleção base reutilizável para retornar demandas com dados do projeto, criador e responsável (LEFT JOIN)
const BASE_TASK_SELECT = `
	SELECT
		t.task_id,
		t.title,
		t.description,
		t.type,
		t.priority,
		t.status,
		t.creation_date,
		t.updated_at,
		t.due_date,
		t.fk_project_id,
		t.fk_user_id,
		t.fk_creator_id,
		p.project_id,
		p.title AS project_title,
		u_creator.user_id AS creator_id,
		u_creator.name AS creator_name,
		u_creator.email AS creator_email,
		u_creator.profile_pic AS creator_profile_pic,
		u_responsible.user_id AS responsible_id,
		u_responsible.name AS responsible_name,
		u_responsible.email AS responsible_email,
		u_responsible.profile_pic AS responsible_profile_pic
	FROM task t
	INNER JOIN project p
		ON p.project_id = t.fk_project_id
	INNER JOIN user u_creator
		ON u_creator.user_id = t.fk_creator_id
	LEFT JOIN user u_responsible
		ON u_responsible.user_id = t.fk_user_id
`;

// O============================================================================================O

// Lista tarefas associadas ao usuário (visão geral), suportando filtro opcional por status e usando LEFT JOIN
const get_tasks_by_user_id = async (
	user_id: number,
	is_admin: boolean,
	filters: TaskListFilters = {},
): Promise<TaskWithRelations[]> => {
	const conditions: string[] = [];
	const params: Array<string | number> = [];

	if (!is_admin) {
		params.push(user_id);
		conditions.push("(t.fk_user_id = ? OR t.fk_creator_id = ?)");
		params.push(user_id, user_id);
	}

	if (filters.statuses && filters.statuses.length > 0) {
		const placeholders = filters.statuses.map(() => "?").join(", ");
		conditions.push(`t.status IN (${placeholders})`);
		params.push(...filters.statuses);
	}

	if (filters.priorities && filters.priorities.length > 0) {
		const placeholders = filters.priorities.map(() => "?").join(", ");
		conditions.push(`t.priority IN (${placeholders})`);
		params.push(...filters.priorities);
	}

	if (filters.types && filters.types.length > 0) {
		const placeholders = filters.types.map(() => "?").join(", ");
		conditions.push(`t.type IN (${placeholders})`);
		params.push(...filters.types);
	}

	if (filters.q && filters.q.length > 0) {
		conditions.push("(t.title LIKE ? OR t.description LIKE ?)");
		const like_pattern = `%${filters.q}%`;
		params.push(like_pattern, like_pattern);
	}

	const join_sql = is_admin
		? ""
		: "\n\tINNER JOIN project_user pu ON pu.fk_project_id = t.fk_project_id AND pu.fk_user_id = ?";
	const where_sql =
		conditions.length > 0 ? `\n\tWHERE ${conditions.join(" AND ")}` : "";

	const query = `${BASE_TASK_SELECT}${join_sql}${where_sql}\n\tORDER BY t.creation_date DESC;`;
	const [result] = await connection.execute<TaskWithRelations[]>(query, params);

	return Array.isArray(result) ? result : [];
};

// O============================================================================================O

// Lista demandas com filtros combinados, busca textual e ordenação respeitando o escopo do perfil
const list_tasks = async (
	user_id: number,
	is_admin: boolean,
	filters: TaskListFilters,
): Promise<TaskWithRelations[]> => {
	const joins: string[] = [];
	const conditions: string[] = [];
	const params: Array<string | number> = [];

	// Não administradores enxergam apenas demandas de projetos aos quais estão vinculados
	if (!is_admin) {
		joins.push(
			"INNER JOIN project_user pu ON pu.fk_project_id = t.fk_project_id AND pu.fk_user_id = ?",
		);
		params.push(user_id);
	}

	if (filters.statuses && filters.statuses.length > 0) {
		const placeholders = filters.statuses.map(() => "?").join(", ");
		conditions.push(`t.status IN (${placeholders})`);
		params.push(...filters.statuses);
	}

	if (filters.priorities && filters.priorities.length > 0) {
		const placeholders = filters.priorities.map(() => "?").join(", ");
		conditions.push(`t.priority IN (${placeholders})`);
		params.push(...filters.priorities);
	}

	if (filters.types && filters.types.length > 0) {
		const placeholders = filters.types.map(() => "?").join(", ");
		conditions.push(`t.type IN (${placeholders})`);
		params.push(...filters.types);
	}

	if (filters.mine) {
		conditions.push("t.fk_user_id = ?");
		params.push(user_id);
	} else if (filters.fk_user_id === "UNASSIGNED") {
		conditions.push("t.fk_user_id IS NULL");
	} else if (typeof filters.fk_user_id === "number") {
		conditions.push("t.fk_user_id = ?");
		params.push(filters.fk_user_id);
	}

	if (typeof filters.fk_project_id === "number") {
		conditions.push("t.fk_project_id = ?");
		params.push(filters.fk_project_id);
	}

	if (filters.q && filters.q.length > 0) {
		conditions.push("(t.title LIKE ? OR t.description LIKE ?)");
		const like_pattern = `%${filters.q}%`;
		params.push(like_pattern, like_pattern);
	}

	const sort_by = filters.sort_by || "creation_date";
	const sort_order: SortOrder = filters.sort_order || "DESC";

	// Ordenação controlada exclusivamente por whitelist para evitar SQL injection
	let order_clause = `t.creation_date ${sort_order}`;
	switch (sort_by) {
		case "priority":
			order_clause = `FIELD(t.priority, 'BAIXA', 'MEDIA', 'ALTA', 'CRITICA') ${sort_order}, t.creation_date DESC`;
			break;
		case "due_date":
			order_clause = `t.due_date IS NULL ASC, t.due_date ${sort_order}, t.creation_date DESC`;
			break;
		case "status":
			order_clause = `FIELD(t.status, 'ABERTA', 'EM ANDAMENTO', 'EM REVISAO', 'CONCLUIDA', 'CANCELADA') ${sort_order}, t.creation_date DESC`;
			break;
		case "creation_date":
		default:
			order_clause = `t.creation_date ${sort_order}`;
			break;
	}

	const join_sql = joins.length > 0 ? `\n\t${joins.join("\n\t")}` : "";
	const where_sql =
		conditions.length > 0 ? `\n\tWHERE ${conditions.join(" AND ")}` : "";

	const query = `${BASE_TASK_SELECT}${join_sql}${where_sql}\n\tORDER BY ${order_clause};`;

	const [result] = await connection.execute<TaskWithRelations[]>(query, params);

	return Array.isArray(result) ? result : [];
};

// O============================================================================================O

// Busca os detalhes completos de uma demanda pelo ID
const get_task_by_id = async (
	task_id: number,
): Promise<TaskWithRelations | null> => {
	const query = `${BASE_TASK_SELECT}\n\tWHERE t.task_id = ? LIMIT 1;`;
	const [result] = await connection.execute<TaskWithRelations[]>(query, [
		task_id,
	]);

	if (Array.isArray(result) && result.length > 0) {
		return result[0];
	}

	return null;
};

// O============================================================================================O

// Cadastra uma nova demanda sempre com status inicial forçado para 'ABERTA'
const create_task = async (input: CreateTaskInput): Promise<number> => {
	const query = `
		INSERT INTO task (
			title,
			description,
			type,
			priority,
			status,
			due_date,
			fk_project_id,
			fk_user_id,
			fk_creator_id
		)
		VALUES (?, ?, ?, ?, 'ABERTA', ?, ?, ?, ?);
	`;

	const [result] = await connection.execute<ResultSetHeader>(query, [
		input.title,
		input.description,
		input.type,
		input.priority,
		input.due_date,
		input.fk_project_id,
		input.fk_user_id,
		input.fk_creator_id,
	]);

	return result.insertId;
};

// O============================================================================================O

// Atualiza campos informados de uma demanda e atualiza explicitamente o timestamp updated_at
const update_task = async (
	task_id: number,
	fields: UpdateTaskInput,
): Promise<boolean> => {
	const assignments: string[] = [];
	const params: Array<string | number | null> = [];

	if (fields.title !== undefined) {
		assignments.push("title = ?");
		params.push(fields.title);
	}

	if (fields.description !== undefined) {
		assignments.push("description = ?");
		params.push(fields.description);
	}

	if (fields.type !== undefined) {
		assignments.push("type = ?");
		params.push(fields.type);
	}

	if (fields.priority !== undefined) {
		assignments.push("priority = ?");
		params.push(fields.priority);
	}

	if (fields.status !== undefined) {
		assignments.push("status = ?");
		params.push(fields.status);
	}

	if (fields.due_date !== undefined) {
		assignments.push("due_date = ?");
		params.push(fields.due_date);
	}

	if (fields.fk_user_id !== undefined) {
		assignments.push("fk_user_id = ?");
		params.push(fields.fk_user_id);
	}

	if (assignments.length === 0) {
		return false;
	}

	assignments.push("updated_at = CURRENT_TIMESTAMP");
	params.push(task_id);

	const query = `UPDATE task SET ${assignments.join(", ")} WHERE task_id = ?;`;
	const [result] = await connection.execute<ResultSetHeader>(query, params);

	return result.affectedRows > 0;
};

// O============================================================================================O

// Registra uma ou mais alterações relevantes na tabela history (nunca apagado)
const record_history_entries = async (
	entries: HistoryInsertEntry[],
): Promise<void> => {
	const query = `
		INSERT INTO history (
			old_value,
			new_value,
			field_name,
			fk_task_id,
			fk_user_id
		)
		VALUES (?, ?, ?, ?, ?);
	`;

	for (const entry of entries) {
		await connection.execute<ResultSetHeader>(query, [
			entry.old_value,
			entry.new_value,
			entry.field_name,
			entry.fk_task_id,
			entry.fk_user_id,
		]);
	}
};

// O============================================================================================O

// Lista todo o histórico de alterações de uma demanda com resumo legível em português
const get_task_history = async (task_id: number) => {
	const query = `
		SELECT
			h.history_id,
			h.date,
			h.old_value,
			h.new_value,
			h.field_name,
			h.fk_task_id,
			h.fk_user_id,
			u.name AS actor_name,
			u.email AS actor_email,
			u.profile_pic AS actor_profile_pic,
			u.authority_level AS actor_authority_level,
			u_old.name AS old_responsible_name,
			u_new.name AS new_responsible_name
		FROM history h
		INNER JOIN user u
			ON u.user_id = h.fk_user_id
		LEFT JOIN user u_old
			ON h.field_name = 'fk_user_id'
			AND h.old_value REGEXP '^[0-9]+$'
			AND u_old.user_id = CAST(h.old_value AS UNSIGNED)
		LEFT JOIN user u_new
			ON h.field_name = 'fk_user_id'
			AND h.new_value REGEXP '^[0-9]+$'
			AND u_new.user_id = CAST(h.new_value AS UNSIGNED)
		WHERE h.fk_task_id = ?
		ORDER BY h.date DESC, h.history_id DESC;
	`;

	const [rows] = await connection.execute<RowDataPacket[]>(query, [task_id]);

	if (!Array.isArray(rows)) {
		return [];
	}

	return rows.map((row) => ({
		history_id: row.history_id,
		date: row.date,
		field_name: row.field_name,
		old_value: row.old_value,
		new_value: row.new_value,
		fk_task_id: row.fk_task_id,
		fk_user_id: row.fk_user_id,
		actor_name: row.actor_name,
		actor_email: row.actor_email,
		actor_profile_pic: row.actor_profile_pic,
		actor_authority_level: row.actor_authority_level,
		summary: format_history_summary({
			actor_name: row.actor_name,
			field_name: row.field_name,
			old_value: row.old_value,
			new_value: row.new_value,
			old_responsible_name: row.old_responsible_name,
			new_responsible_name: row.new_responsible_name,
		}),
	}));
};

// O============================================================================================O

// Lista os comentários vinculados a uma demanda em ordem cronológica
const get_task_comments = async (task_id: number) => {
	const query = `
		SELECT
			c.comment_id,
			c.content,
			c.creation_date,
			c.fk_task_id,
			c.fk_user_id,
			u.name AS author_name,
			u.email AS author_email,
			u.profile_pic AS author_profile_pic,
			u.authority_level AS author_authority_level
		FROM comment c
		INNER JOIN user u
			ON u.user_id = c.fk_user_id
		WHERE c.fk_task_id = ?
		ORDER BY c.creation_date ASC, c.comment_id ASC;
	`;

	const [rows] = await connection.execute<RowDataPacket[]>(query, [task_id]);

	return Array.isArray(rows) ? rows : [];
};

// O============================================================================================O

// Cadastra um novo comentário vinculado a uma demanda e ao usuário autenticado
const create_task_comment = async (
	task_id: number,
	user_id: number,
	content: string,
) => {
	const insert_query = `
		INSERT INTO comment (content, fk_task_id, fk_user_id)
		VALUES (?, ?, ?);
	`;

	const [insert_result] = await connection.execute<ResultSetHeader>(
		insert_query,
		[content, task_id, user_id],
	);

	const select_query = `
		SELECT
			c.comment_id,
			c.content,
			c.creation_date,
			c.fk_task_id,
			c.fk_user_id,
			u.name AS author_name,
			u.email AS author_email,
			u.profile_pic AS author_profile_pic,
			u.authority_level AS author_authority_level
		FROM comment c
		INNER JOIN user u
			ON u.user_id = c.fk_user_id
		WHERE c.comment_id = ?
		LIMIT 1;
	`;

	const [rows] = await connection.execute<RowDataPacket[]>(select_query, [
		insert_result.insertId,
	]);

	return Array.isArray(rows) && rows.length > 0
		? rows[0]
		: {
				comment_id: insert_result.insertId,
				content,
				fk_task_id: task_id,
				fk_user_id: user_id,
			};
};

// O============================================================================================O

// Obtém todas as métricas obrigatórias do Dashboard (Seção 2.4) respeitando o escopo do usuário
const get_dashboard_metrics = async (params: {
	user_id: number;
	is_admin: boolean;
	project_id?: number;
	upcoming_days: number;
}) => {
	const { user_id, is_admin, project_id, upcoming_days } = params;

	const scope_join = is_admin
		? ""
		: "INNER JOIN project_user pu ON pu.fk_project_id = t.fk_project_id AND pu.fk_user_id = ?";

	const base_params: number[] = [];
	const base_conditions: string[] = [];

	if (!is_admin) {
		base_params.push(user_id);
	}

	if (project_id !== undefined) {
		base_conditions.push("t.fk_project_id = ?");
		base_params.push(project_id);
	}

	const base_where =
		base_conditions.length > 0 ? `WHERE ${base_conditions.join(" AND ")}` : "";

	// Consulta agregada com todos os totalizadores por status, prioridade e tipo
	const summary_query = `
		SELECT
			COUNT(t.task_id) AS total_tasks,
			COALESCE(SUM(CASE WHEN t.status = 'ABERTA' THEN 1 ELSE 0 END), 0) AS status_aberta,
			COALESCE(SUM(CASE WHEN t.status = 'EM ANDAMENTO' THEN 1 ELSE 0 END), 0) AS status_em_andamento,
			COALESCE(SUM(CASE WHEN t.status = 'EM REVISAO' THEN 1 ELSE 0 END), 0) AS status_em_revisao,
			COALESCE(SUM(CASE WHEN t.status = 'CONCLUIDA' THEN 1 ELSE 0 END), 0) AS status_concluida,
			COALESCE(SUM(CASE WHEN t.status = 'CANCELADA' THEN 1 ELSE 0 END), 0) AS status_cancelada,
			COALESCE(SUM(CASE WHEN t.priority = 'CRITICA' THEN 1 ELSE 0 END), 0) AS priority_critica,
			COALESCE(SUM(CASE WHEN t.priority = 'ALTA' THEN 1 ELSE 0 END), 0) AS priority_alta,
			COALESCE(SUM(CASE WHEN t.priority = 'MEDIA' THEN 1 ELSE 0 END), 0) AS priority_media,
			COALESCE(SUM(CASE WHEN t.priority = 'BAIXA' THEN 1 ELSE 0 END), 0) AS priority_baixa,
			COALESCE(SUM(CASE WHEN t.type = 'TAREFA' THEN 1 ELSE 0 END), 0) AS type_tarefa,
			COALESCE(SUM(CASE WHEN t.type = 'DEFEITO' THEN 1 ELSE 0 END), 0) AS type_defeito,
			COALESCE(SUM(CASE WHEN t.type = 'MELHORIA' THEN 1 ELSE 0 END), 0) AS type_melhoria,
			COALESCE(SUM(CASE WHEN t.type = 'DOCUMENTACAO' THEN 1 ELSE 0 END), 0) AS type_documentacao
		FROM task t
		${scope_join}
		${base_where};
	`;

	const [summary_rows] = await connection.execute<RowDataPacket[]>(
		summary_query,
		base_params,
	);
	const summary = summary_rows[0] || {};

	// Demandas críticas ainda em aberto (não concluídas nem canceladas)
	const critical_conditions = [
		...base_conditions,
		"t.priority = 'CRITICA'",
		"t.status NOT IN ('CONCLUIDA', 'CANCELADA')",
	];
	const critical_query = `
		${BASE_TASK_SELECT}
		${scope_join}
		WHERE ${critical_conditions.join(" AND ")}
		ORDER BY t.due_date IS NULL ASC, t.due_date ASC, t.creation_date DESC;
	`;
	const [critical_open_tasks] = await connection.execute<TaskWithRelations[]>(
		critical_query,
		base_params,
	);

	// Demandas próximas do prazo de finalização (nos próximos N dias, não concluídas/canceladas)
	const upcoming_conditions = [
		...base_conditions,
		"t.status NOT IN ('CONCLUIDA', 'CANCELADA')",
		"t.due_date IS NOT NULL",
		"t.due_date >= NOW()",
		"t.due_date <= DATE_ADD(NOW(), INTERVAL ? DAY)",
	];
	const upcoming_query = `
		${BASE_TASK_SELECT}
		${scope_join}
		WHERE ${upcoming_conditions.join(" AND ")}
		ORDER BY t.due_date ASC;
	`;
	const [upcoming_deadline_tasks] = await connection.execute<
		TaskWithRelations[]
	>(upcoming_query, [...base_params, upcoming_days]);

	// Demandas já atrasadas (prazo vencido e ainda não finalizadas)
	const overdue_conditions = [
		...base_conditions,
		"t.status NOT IN ('CONCLUIDA', 'CANCELADA')",
		"t.due_date IS NOT NULL",
		"t.due_date < NOW()",
	];
	const overdue_query = `
		${BASE_TASK_SELECT}
		${scope_join}
		WHERE ${overdue_conditions.join(" AND ")}
		ORDER BY t.due_date ASC;
	`;
	const [overdue_tasks] = await connection.execute<TaskWithRelations[]>(
		overdue_query,
		base_params,
	);

	return {
		total_tasks: Number(summary.total_tasks || 0),
		by_status: {
			ABERTA: Number(summary.status_aberta || 0),
			"EM ANDAMENTO": Number(summary.status_em_andamento || 0),
			"EM REVISAO": Number(summary.status_em_revisao || 0),
			CONCLUIDA: Number(summary.status_concluida || 0),
			CANCELADA: Number(summary.status_cancelada || 0),
		},
		by_priority: {
			CRITICA: Number(summary.priority_critica || 0),
			ALTA: Number(summary.priority_alta || 0),
			MEDIA: Number(summary.priority_media || 0),
			BAIXA: Number(summary.priority_baixa || 0),
		},
		by_type: {
			TAREFA: Number(summary.type_tarefa || 0),
			DEFEITO: Number(summary.type_defeito || 0),
			MELHORIA: Number(summary.type_melhoria || 0),
			DOCUMENTACAO: Number(summary.type_documentacao || 0),
		},
		critical_open_count: Array.isArray(critical_open_tasks)
			? critical_open_tasks.length
			: 0,
		critical_open_tasks: Array.isArray(critical_open_tasks)
			? critical_open_tasks
			: [],
		upcoming_deadline_days: upcoming_days,
		upcoming_deadline_count: Array.isArray(upcoming_deadline_tasks)
			? upcoming_deadline_tasks.length
			: 0,
		upcoming_deadline_tasks: Array.isArray(upcoming_deadline_tasks)
			? upcoming_deadline_tasks
			: [],
		overdue_count: Array.isArray(overdue_tasks) ? overdue_tasks.length : 0,
		overdue_tasks: Array.isArray(overdue_tasks) ? overdue_tasks : [],
	};
};

// O============================================================================================O

export default {
	get_tasks_by_user_id,
	list_tasks,
	get_task_by_id,
	create_task,
	update_task,
	record_history_entries,
	get_task_history,
	get_task_comments,
	create_task_comment,
	get_dashboard_metrics,
};

// O============================================================================================O
