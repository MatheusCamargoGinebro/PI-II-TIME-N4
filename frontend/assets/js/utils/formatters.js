/*
    Autor: 
    formatters.js -> Funções utilitárias simples para formatação de datas, status, prioridades, tipos, barras de progresso e escape seguro de HTML.
*/

// Escapa caracteres especiais para evitar injeção de HTML ao renderizar dados vindos da API
export function escapeHtml(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

// Formata código visual da demanda (ex.: 1 -> TAR00001)
export function formatTaskCode(taskId) {
	return `TAR${String(taskId ?? 0).padStart(5, "0")}`;
}

// Formata data curta (ex.: 18 Set 2026)
export function formatShortDate(dateStr) {
	if (!dateStr) return "Sem prazo";
	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) return "Sem prazo";

	const meses = [
		"Jan",
		"Fev",
		"Mar",
		"Abr",
		"Mai",
		"Jun",
		"Jul",
		"Ago",
		"Set",
		"Out",
		"Nov",
		"Dez",
	];
	const day = String(date.getDate()).padStart(2, "0");
	return `${day} ${meses[date.getMonth()]} ${date.getFullYear()}`;
}

// Formata data e hora no padrão brasileiro (dd/mm/aaaa hh:mm)
export function formatDateTime(dateStr) {
	if (!dateStr) return "-";
	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) return "-";

	return date.toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

// Converte data vinda do banco para o formato YYYY-MM-DD aceito por <input type="date">
export function toDateInputValue(dateStr) {
	if (!dateStr) return "";
	const match = String(dateStr).match(/^(\d{4}-\d{2}-\d{2})/);
	if (match) return match[1];

	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) return "";
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

// Retorna informações de exibição para cada status do ciclo de vida da demanda
export function getStatusInfo(status) {
	const key = String(status || "").toUpperCase();
	switch (key) {
		case "ABERTA":
			return { key: "ABERTA", label: "Aberta", className: "status-open" };
		case "EM ANDAMENTO":
			return {
				key: "EM ANDAMENTO",
				label: "Em andamento",
				className: "status-progress",
			};
		case "EM REVISAO":
			return {
				key: "EM REVISAO",
				label: "Em revisão",
				className: "status-review",
			};
		case "CONCLUIDA":
			return {
				key: "CONCLUIDA",
				label: "Concluída",
				className: "status-complete",
			};
		case "CANCELADA":
			return { key: "CANCELADA", label: "Cancelada", className: "status-late" };
		default:
			return {
				key: key || "ABERTA",
				label: status || "Aberta",
				className: "status-open",
			};
	}
}

// Retorna informações de exibição para cada prioridade
export function getPriorityInfo(priority) {
	const key = String(priority || "").toUpperCase();
	switch (key) {
		case "CRITICA":
			return {
				key: "CRITICA",
				label: "Crítica",
				dotClass: "badge-pink",
				pillClass: "critica",
				order: 0,
			};
		case "ALTA":
			return {
				key: "ALTA",
				label: "Alta",
				dotClass: "badge-pink",
				pillClass: "alta",
				order: 1,
			};
		case "MEDIA":
			return {
				key: "MEDIA",
				label: "Média",
				dotClass: "badge-blue",
				pillClass: "media",
				order: 2,
			};
		case "BAIXA":
		default:
			return {
				key: "BAIXA",
				label: "Baixa",
				dotClass: "badge-green",
				pillClass: "baixa",
				order: 3,
			};
	}
}

// Retorna rótulo amigável em português para o tipo de demanda
export function getTypeLabel(type) {
	const key = String(type || "").toUpperCase();
	switch (key) {
		case "TAREFA":
			return "Tarefa";
		case "DEFEITO":
			return "Defeito";
		case "MELHORIA":
			return "Melhoria";
		case "DOCUMENTACAO":
			return "Documentação";
		default:
			return type || "Tarefa";
	}
}

// Gera os segmentos de uma barra de progresso proporcional ao percentual
export function renderProgressSegments(
	count,
	total,
	segmentCount = 19,
	accent = false,
) {
	const filled = total > 0 ? Math.round((count / total) * segmentCount) : 0;
	const filledClass = accent
		? "progress-bar-accent-filled"
		: "progress-bar-filled";
	const emptyClass = accent
		? "progress-bar-accent-empty"
		: "progress-bar-empty";

	return Array.from(
		{ length: segmentCount },
		(_, index) =>
			`<div class="progress-bar-segment ${index < filled ? filledClass : emptyClass}"></div>`,
	).join("");
}

// Regras da máquina de estados da demanda (Seção 2.2.4 do Documento de Visão)
export const ALLOWED_TRANSITIONS = {
	ABERTA: ["EM ANDAMENTO", "CANCELADA"],
	"EM ANDAMENTO": ["EM REVISAO", "CANCELADA"],
	"EM REVISAO": ["CONCLUIDA", "EM ANDAMENTO", "CANCELADA"],
	CONCLUIDA: [],
	CANCELADA: [],
};

// Transições permitidas para Membro da equipe nas demandas atribuídas a ele (Seção 2.1.3)
export const MEMBER_ALLOWED_TRANSITIONS = {
	ABERTA: ["EM ANDAMENTO"],
	"EM ANDAMENTO": ["EM REVISAO"],
	"EM REVISAO": [],
	CONCLUIDA: [],
	CANCELADA: [],
};

// Retorna a lista de próximos status permitidos para o usuário autenticado
export function getAllowedNextStatuses(task, user) {
	if (!task || !user) return [];
	const current = String(task.status || "").toUpperCase();

	if (user.authority_level === "Membro da equipe") {
		const responsibleId = task.fk_user_id ?? task.responsible_id;
		if (Number(responsibleId) !== Number(user.user_id)) {
			return [];
		}
		return MEMBER_ALLOWED_TRANSITIONS[current] || [];
	}

	return ALLOWED_TRANSITIONS[current] || [];
}
