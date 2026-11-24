/*
    Autor: 
    taskRepository.js -> Repositório de requisições HTTP para o módulo de demandas, comentários, histórico e dashboard.
*/

import { config } from "../config.js";
import { getAuthHeaders } from "./authRepository.js";

const buildQueryString = (params = {}) => {
	const query = new URLSearchParams();
	for (const [key, val] of Object.entries(params)) {
		if (val !== undefined && val !== null && val !== "") {
			if (Array.isArray(val)) {
				query.append(key, val.join(","));
			} else {
				query.append(key, String(val));
			}
		}
	}
	const str = query.toString();
	return str ? `?${str}` : "";
};

export const getDashboard = async (params = {}) => {
	try {
		const qs = buildQueryString(params);
		const response = await fetch(`${config.apiUrl}/tasks/dashboard${qs}`, {
			method: "GET",
			headers: getAuthHeaders(),
		});
		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				success: false,
				message: data.message || "Erro ao obter métricas do dashboard.",
			};
		}

		return {
			success: true,
			dashboard: data.dashboard,
			message: data.message,
		};
	} catch {
		return {
			success: false,
			message: "Erro ao conectar ao servidor ao obter dashboard.",
		};
	}
};

export const getOverview = async (filters = {}) => {
	try {
		const qs = buildQueryString(filters);
		const response = await fetch(`${config.apiUrl}/tasks/overview${qs}`, {
			method: "GET",
			headers: getAuthHeaders(),
		});
		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				success: false,
				message: data.message || "Erro ao carregar visão geral de demandas.",
			};
		}

		return {
			success: true,
			total: data.total || 0,
			tasks: data.tasks || [],
			message: data.message,
		};
	} catch {
		return {
			success: false,
			message: "Erro ao conectar ao servidor ao obter visão geral de demandas.",
		};
	}
};

export const listTasks = async (filters = {}) => {
	try {
		const qs = buildQueryString(filters);
		const response = await fetch(`${config.apiUrl}/tasks${qs}`, {
			method: "GET",
			headers: getAuthHeaders(),
		});
		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				success: false,
				message: data.message || "Erro ao listar demandas.",
			};
		}

		return {
			success: true,
			total: data.total || 0,
			tasks: data.tasks || [],
			message: data.message,
		};
	} catch {
		return {
			success: false,
			message: "Erro ao conectar ao servidor ao listar demandas.",
		};
	}
};

export const getTaskDetails = async (taskId) => {
	try {
		const response = await fetch(`${config.apiUrl}/tasks/${taskId}`, {
			method: "GET",
			headers: getAuthHeaders(),
		});
		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				success: false,
				message: data.message || "Demanda não encontrada.",
			};
		}

		return {
			success: true,
			task: data.task,
			message: data.message,
		};
	} catch {
		return {
			success: false,
			message: "Erro ao conectar ao servidor ao obter detalhes da demanda.",
		};
	}
};

export const createTask = async (taskData) => {
	try {
		const response = await fetch(`${config.apiUrl}/tasks`, {
			method: "POST",
			headers: getAuthHeaders(),
			body: JSON.stringify(taskData),
		});
		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				success: false,
				message: data.message || "Erro ao cadastrar demanda.",
				errorAt: data.errorAt,
			};
		}

		return {
			success: true,
			task: data.task,
			message: data.message || "Demanda cadastrada com sucesso.",
		};
	} catch {
		return {
			success: false,
			message: "Erro ao conectar ao servidor ao criar demanda.",
		};
	}
};

export const updateTask = async (taskId, taskData) => {
	try {
		const response = await fetch(`${config.apiUrl}/tasks/${taskId}`, {
			method: "PATCH",
			headers: getAuthHeaders(),
			body: JSON.stringify(taskData),
		});
		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				success: false,
				message: data.message || "Erro ao atualizar demanda.",
				errorAt: data.errorAt,
			};
		}

		return {
			success: true,
			task: data.task,
			message: data.message || "Demanda atualizada com sucesso.",
		};
	} catch {
		return {
			success: false,
			message: "Erro ao conectar ao servidor ao atualizar demanda.",
		};
	}
};

export const updateTaskStatus = async (taskId, status, dueDate = undefined) => {
	try {
		const body = { status };
		if (dueDate !== undefined) {
			body.due_date = dueDate;
		}

		const response = await fetch(`${config.apiUrl}/tasks/${taskId}/status`, {
			method: "PATCH",
			headers: getAuthHeaders(),
			body: JSON.stringify(body),
		});
		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				success: false,
				message: data.message || "Erro ao alterar status da demanda.",
				errorAt: data.errorAt,
			};
		}

		return {
			success: true,
			task: data.task,
			message: data.message || "Status alterado com sucesso.",
		};
	} catch {
		return {
			success: false,
			message: "Erro ao conectar ao servidor ao alterar status.",
		};
	}
};

export const cancelTask = async (taskId) => {
	try {
		const response = await fetch(`${config.apiUrl}/tasks/${taskId}/cancel`, {
			method: "PATCH",
			headers: getAuthHeaders(),
		});
		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				success: false,
				message: data.message || "Erro ao cancelar demanda.",
			};
		}

		return {
			success: true,
			task: data.task,
			message: data.message || "Demanda cancelada com sucesso.",
		};
	} catch {
		return {
			success: false,
			message: "Erro ao conectar ao servidor ao cancelar demanda.",
		};
	}
};

export const getTaskComments = async (taskId) => {
	try {
		const response = await fetch(`${config.apiUrl}/tasks/${taskId}/comments`, {
			method: "GET",
			headers: getAuthHeaders(),
		});
		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				success: false,
				message: data.message || "Erro ao obter comentários da demanda.",
			};
		}

		return {
			success: true,
			comments: data.comments || [],
			message: data.message,
		};
	} catch {
		return {
			success: false,
			message: "Erro ao conectar ao servidor ao obter comentários.",
		};
	}
};

export const createTaskComment = async (taskId, content) => {
	try {
		const response = await fetch(`${config.apiUrl}/tasks/${taskId}/comments`, {
			method: "POST",
			headers: getAuthHeaders(),
			body: JSON.stringify({ content }),
		});
		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				success: false,
				message: data.message || "Erro ao adicionar comentário.",
				errorAt: data.errorAt,
			};
		}

		return {
			success: true,
			comment: data.comment,
			message: data.message || "Comentário adicionado com sucesso.",
		};
	} catch {
		return {
			success: false,
			message: "Erro ao conectar ao servidor ao adicionar comentário.",
		};
	}
};

export const getTaskHistory = async (taskId) => {
	try {
		const response = await fetch(`${config.apiUrl}/tasks/${taskId}/history`, {
			method: "GET",
			headers: getAuthHeaders(),
		});
		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				success: false,
				message: data.message || "Erro ao obter histórico da demanda.",
			};
		}

		return {
			success: true,
			history: data.history || [],
			message: data.message,
		};
	} catch {
		return {
			success: false,
			message: "Erro ao conectar ao servidor ao obter histórico.",
		};
	}
};
