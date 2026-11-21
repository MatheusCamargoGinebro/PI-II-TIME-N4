// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    holidays.ts -> Serviço responsável por validar prazos de finalização e consultar feriados nacionais via API externa (BrasilAPI);
*/

// O============================================================================================O

export interface NationalHoliday {
	date: string; // Formato YYYY-MM-DD
	name: string;
	type: string;
}

export interface ParsedDueDate {
	year: number;
	date_only: string; // YYYY-MM-DD
	mysql_timestamp: string; // YYYY-MM-DD HH:MM:SS
}

export interface HolidayCheckResult {
	is_holiday: boolean;
	holiday?: NationalHoliday;
}

// Cache em memória por ano para evitar chamadas repetidas desnecessárias à API externa
const holidays_cache = new Map<
	number,
	{ holidays: NationalHoliday[]; fetched_at: number }
>();

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
const REQUEST_TIMEOUT_MS = 5000; // 5 segundos

// O============================================================================================O

/**
 * Faz o parse e valida uma string de data de prazo de finalização sem sofrer deslocamento de fuso horário.
 * Aceita formatos: "YYYY-MM-DD", "YYYY-MM-DD HH:MM:SS" ou ISO 8601 ("YYYY-MM-DDTHH:MM:SS...").
 */
export const parse_due_date = (raw_value: unknown): ParsedDueDate | null => {
	if (typeof raw_value !== "string") {
		return null;
	}

	const trimmed = raw_value.trim();
	const match = trimmed.match(
		/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/,
	);

	if (!match) {
		return null;
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const hours = match[4] !== undefined ? Number(match[4]) : 18;
	const minutes = match[5] !== undefined ? Number(match[5]) : 0;
	const seconds = match[6] !== undefined ? Number(match[6]) : 0;

	// Faixa segura compatível com TIMESTAMP do MySQL (1970-2037)
	if (year < 1970 || year > 2037) {
		return null;
	}

	if (month < 1 || month > 12 || day < 1 || day > 31) {
		return null;
	}

	if (hours > 23 || minutes > 59 || seconds > 59) {
		return null;
	}

	// Verifica se a data realmente existe no calendário (ex.: rejeita 2026-02-30)
	const probe = new Date(Date.UTC(year, month - 1, day));
	if (
		probe.getUTCFullYear() !== year ||
		probe.getUTCMonth() !== month - 1 ||
		probe.getUTCDate() !== day
	) {
		return null;
	}

	const pad = (n: number) => String(n).padStart(2, "0");
	const date_only = `${year}-${pad(month)}-${pad(day)}`;
	const mysql_timestamp = `${date_only} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

	return {
		year,
		date_only,
		mysql_timestamp,
	};
};

// O============================================================================================O

/**
 * Consulta os feriados nacionais brasileiros de um determinado ano usando a BrasilAPI.
 */
export const fetch_national_holidays = async (
	year: number,
): Promise<NationalHoliday[]> => {
	const cached = holidays_cache.get(year);
	if (cached && Date.now() - cached.fetched_at < CACHE_TTL_MS) {
		return cached.holidays;
	}

	const api_base =
		process.env.HOLIDAYS_API_URL || "https://brasilapi.com.br/api/feriados/v1";
	const controller = new AbortController();
	const timeout_id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch(`${api_base}/${year}`, {
			method: "GET",
			headers: { Accept: "application/json" },
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new Error(
				`API de feriados retornou status HTTP ${response.status}.`,
			);
		}

		const data = (await response.json()) as unknown;

		if (!Array.isArray(data)) {
			throw new Error("Formato de resposta inesperado da API de feriados.");
		}

		const holidays: NationalHoliday[] = data
			.filter(
				(item): item is NationalHoliday =>
					typeof item === "object" &&
					item !== null &&
					typeof (item as NationalHoliday).date === "string" &&
					typeof (item as NationalHoliday).name === "string",
			)
			.map((item) => ({
				date: item.date,
				name: item.name,
				type: typeof item.type === "string" ? item.type : "national",
			}));

		holidays_cache.set(year, {
			holidays,
			fetched_at: Date.now(),
		});

		return holidays;
	} finally {
		clearTimeout(timeout_id);
	}
};

// O============================================================================================O

/**
 * Verifica se a data informada corresponde a um feriado nacional brasileiro.
 */
export const check_national_holiday = async (
	parsed_date: ParsedDueDate,
): Promise<HolidayCheckResult> => {
	const holidays = await fetch_national_holidays(parsed_date.year);
	const found = holidays.find((h) => h.date === parsed_date.date_only);

	if (found) {
		return {
			is_holiday: true,
			holiday: found,
		};
	}

	return {
		is_holiday: false,
	};
};

// O============================================================================================O

/**
 * Limpa o cache em memória de feriados (útil para testes automatizados).
 */
export const clear_holidays_cache = (): void => {
	holidays_cache.clear();
};

export default {
	parse_due_date,
	fetch_national_holidays,
	check_national_holiday,
	clear_holidays_cache,
};

// O============================================================================================O
