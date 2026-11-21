// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    rules.ts -> Arquivo responsável pelas regras de negócio, máquina de estados, normalização de enums e RBAC de demandas;
*/

// O============================================================================================O

import { AuthorityLevel } from "../users/models";

export const VALID_TASK_TYPES = [
	"TAREFA",
	"DEFEITO",
	"MELHORIA",
	"DOCUMENTACAO",
] as const;

export const VALID_TASK_PRIORITIES = [
	"BAIXA",
	"MEDIA",
	"ALTA",
	"CRITICA",
] as const;

export const VALID_TASK_STATUSES = [
	"ABERTA",
	"EM ANDAMENTO",
	"EM REVISAO",
	"CONCLUIDA",
	"CANCELADA",
] as const;

export const VALID_SORT_FIELDS = [
	"priority",
	"creation_date",
	"due_date",
	"status",
] as const;

export type TaskType = (typeof VALID_TASK_TYPES)[number];
export type TaskPriority = (typeof VALID_TASK_PRIORITIES)[number];
export type TaskStatus = (typeof VALID_TASK_STATUSES)[number];
export type TaskSortField = (typeof VALID_SORT_FIELDS)[number];
export type SortOrder = "ASC" | "DESC";

// O============================================================================================O

// Remove acentos, espaços extras e converte para maiúsculas para normalizar enums recebidos
const normalize_token = (value: unknown): string | null => {
	if (typeof value !== "string") {
		return null;
	}

	const cleaned = value
		.trim()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/\s+/g, " ")
		.toUpperCase();

	return cleaned.length > 0 ? cleaned : null;
};

export const normalize_task_type = (value: unknown): TaskType | null => {
	const token = normalize_token(value);
	if (!token) return null;
	return (VALID_TASK_TYPES as readonly string[]).includes(token)
		? (token as TaskType)
		: null;
};

export const normalize_task_priority = (
	value: unknown,
): TaskPriority | null => {
	const token = normalize_token(value);
	if (!token) return null;
	return (VALID_TASK_PRIORITIES as readonly string[]).includes(token)
		? (token as TaskPriority)
		: null;
};

export const normalize_task_status = (value: unknown): TaskStatus | null => {
	const token = normalize_token(value);
	if (!token) return null;
	return (VALID_TASK_STATUSES as readonly string[]).includes(token)
		? (token as TaskStatus)
		: null;
};

// O============================================================================================O

// Mapa de transições permitidas no ciclo de vida da demanda (Seção 2.2.4 do Documento de Visão)
const ALLOWED_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
	ABERTA: ["EM ANDAMENTO", "CANCELADA"],
	"EM ANDAMENTO": ["EM REVISAO", "CANCELADA"],
	"EM REVISAO": ["CONCLUIDA", "EM ANDAMENTO", "CANCELADA"],
	CONCLUIDA: [],
	CANCELADA: [],
};

// Transições exclusivas permitidas ao Membro da Equipe nas demandas atribuídas a ele
const MEMBER_ALLOWED_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
	ABERTA: ["EM ANDAMENTO"],
	"EM ANDAMENTO": ["EM REVISAO"],
	"EM REVISAO": [],
	CONCLUIDA: [],
	CANCELADA: [],
};

export interface TransitionValidationResult {
	allowed: boolean;
	status_code: number;
	message?: string;
}

/**
 * Valida se uma transição de status respeita a máquina de estados (Seção 2.2.4)
 * e as permissões do perfil do usuário (Seção 2.1).
 */
export const validate_status_transition = (params: {
	current_status: TaskStatus;
	next_status: TaskStatus;
	authority_level: AuthorityLevel;
	user_id: number;
	task_responsible_id: number | null;
}): TransitionValidationResult => {
	const {
		current_status,
		next_status,
		authority_level,
		user_id,
		task_responsible_id,
	} = params;

	if (current_status === next_status) {
		return {
			allowed: false,
			status_code: 400,
			message: `A demanda já se encontra no status '${current_status}'.`,
		};
	}

	// Demandas concluídas não podem ser canceladas nem reabertas
	if (current_status === "CONCLUIDA") {
		return {
			allowed: false,
			status_code: 400,
			message:
				next_status === "CANCELADA"
					? "Não é permitido cancelar uma demanda já concluída."
					: "Não é permitido alterar o status de uma demanda já concluída.",
		};
	}

	// Demandas canceladas são finais
	if (current_status === "CANCELADA") {
		return {
			allowed: false,
			status_code: 400,
			message: "Não é permitido alterar o status de uma demanda já cancelada.",
		};
	}

	// Mensagens específicas para transições explicitamente proibidas no escopo
	if (current_status === "EM ANDAMENTO" && next_status === "CONCLUIDA") {
		return {
			allowed: false,
			status_code: 400,
			message:
				"Uma demanda não pode ser concluída diretamente a partir de EM ANDAMENTO. Ela deve passar primeiro por EM REVISAO.",
		};
	}

	if (current_status === "EM ANDAMENTO" && next_status === "ABERTA") {
		return {
			allowed: false,
			status_code: 400,
			message:
				"Não é permitido retornar uma demanda do status EM ANDAMENTO para ABERTA.",
		};
	}

	// Validação geral da máquina de estados
	if (!ALLOWED_TRANSITIONS[current_status].includes(next_status)) {
		return {
			allowed: false,
			status_code: 400,
			message: `Transição de status inválida: não é permitido alterar de '${current_status}' para '${next_status}'.`,
		};
	}

	// Validação de permissões por perfil (RBAC)
	if (authority_level === "Membro da equipe") {
		if (task_responsible_id !== user_id) {
			return {
				allowed: false,
				status_code: 403,
				message:
					"Acesso negado. Membros da equipe só podem alterar o status de demandas atribuídas a eles.",
			};
		}

		if (!MEMBER_ALLOWED_TRANSITIONS[current_status].includes(next_status)) {
			return {
				allowed: false,
				status_code: 403,
				message:
					"Acesso negado. Membros da equipe podem realizar apenas as transições de ABERTA para EM ANDAMENTO e de EM ANDAMENTO para EM REVISAO.",
			};
		}
	}

	return {
		allowed: true,
		status_code: 200,
	};
};

// O============================================================================================O

// Rótulos amigáveis em português para apresentação do histórico de alterações (Seção 2.2.7)
const STATUS_LABELS: Record<string, string> = {
	ABERTA: "Aberta",
	"EM ANDAMENTO": "Em andamento",
	"EM REVISAO": "Em revisão",
	CONCLUIDA: "Concluída",
	CANCELADA: "Cancelada",
};

const PRIORITY_LABELS: Record<string, string> = {
	BAIXA: "Baixa",
	MEDIA: "Média",
	ALTA: "Alta",
	CRITICA: "Crítica",
};

const TYPE_LABELS: Record<string, string> = {
	TAREFA: "Tarefa",
	DEFEITO: "Defeito",
	MELHORIA: "Melhoria",
	DOCUMENTACAO: "Documentação",
};

export const format_history_summary = (entry: {
	actor_name: string;
	field_name: string;
	old_value: string | null;
	new_value: string;
	old_responsible_name?: string | null;
	new_responsible_name?: string | null;
}): string => {
	const {
		actor_name,
		field_name,
		old_value,
		new_value,
		old_responsible_name,
		new_responsible_name,
	} = entry;

	switch (field_name) {
		case "status": {
			const old_label = old_value
				? STATUS_LABELS[old_value] || old_value
				: "Indefinido";
			const new_label = STATUS_LABELS[new_value] || new_value;
			if (new_value === "CANCELADA") {
				return `${actor_name} cancelou a demanda (status alterado de ${old_label} para ${new_label}).`;
			}
			return `${actor_name} alterou o status da demanda de ${old_label} para ${new_label}.`;
		}
		case "priority": {
			const old_label = old_value
				? PRIORITY_LABELS[old_value] || old_value
				: "Indefinida";
			const new_label = PRIORITY_LABELS[new_value] || new_value;
			return `${actor_name} alterou a prioridade da demanda de ${old_label} para ${new_label}.`;
		}
		case "type": {
			const old_label = old_value
				? TYPE_LABELS[old_value] || old_value
				: "Indefinido";
			const new_label = TYPE_LABELS[new_value] || new_value;
			return `${actor_name} alterou o tipo da demanda de ${old_label} para ${new_label}.`;
		}
		case "fk_user_id": {
			const old_label =
				old_responsible_name ||
				(old_value && old_value !== "SEM RESPONSAVEL"
					? `Usuário #${old_value}`
					: "Sem responsável");
			const new_label =
				new_responsible_name ||
				(new_value && new_value !== "SEM RESPONSAVEL"
					? `Usuário #${new_value}`
					: "Sem responsável");
			return `${actor_name} alterou o responsável da demanda de ${old_label} para ${new_label}.`;
		}
		case "due_date": {
			const old_label =
				old_value && old_value !== "SEM PRAZO" ? old_value : "Sem prazo";
			const new_label =
				new_value && new_value !== "SEM PRAZO" ? new_value : "Sem prazo";
			return `${actor_name} alterou o prazo de finalização da demanda de ${old_label} para ${new_label}.`;
		}
		case "title":
			return `${actor_name} alterou o título da demanda de "${old_value ?? ""}" para "${new_value}".`;
		case "description":
			return `${actor_name} alterou a descrição da demanda.`;
		default:
			return `${actor_name} alterou o campo ${field_name} de "${old_value ?? ""}" para "${new_value}".`;
	}
};

// O============================================================================================O

// Formata um Date ou string de timestamp vindo do MySQL para "YYYY-MM-DD HH:MM:SS"
export const format_mysql_datetime = (
	value: Date | string | null | undefined,
): string | null => {
	if (!value) {
		return null;
	}

	if (typeof value === "string") {
		const trimmed = value.trim();
		const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/);
		if (match) {
			return `${match[1]} ${match[2]}`;
		}
		return trimmed;
	}

	const pad = (n: number) => String(n).padStart(2, "0");
	const year = value.getFullYear();
	const month = pad(value.getMonth() + 1);
	const day = pad(value.getDate());
	const hours = pad(value.getHours());
	const minutes = pad(value.getMinutes());
	const seconds = pad(value.getSeconds());

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// O============================================================================================O

export default {
	VALID_TASK_TYPES,
	VALID_TASK_PRIORITIES,
	VALID_TASK_STATUSES,
	VALID_SORT_FIELDS,
	normalize_task_type,
	normalize_task_priority,
	normalize_task_status,
	validate_status_transition,
	format_history_summary,
	format_mysql_datetime,
};

// O============================================================================================O
