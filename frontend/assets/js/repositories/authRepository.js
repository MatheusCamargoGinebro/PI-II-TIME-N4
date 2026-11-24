/*
    Autor: 
    authRepository.js -> Repositório de autenticação, gerenciamento de sessão JWT, perfil do usuário e restrições por nível de acesso (RBAC).
*/

import { config } from "../config.js";
import { showConfirmModal } from "../components/modal.js";

// Calcula o prefixo relativo até a raiz da pasta frontend/ independentemente da profundidade da página
export const getFrontendRoot = () => {
	const path = window.location.pathname.replace(/\\/g, "/");
	const pagesIndex = path.indexOf("/pages/");
	if (pagesIndex === -1) return "./";

	const afterPages = path.slice(pagesIndex + 1); // ex.: "pages/demand/demand_details/demand_details.html"
	const depth = afterPages.split("/").length - 1; // número de pastas até frontend/
	return "../".repeat(depth);
};

export const getAuthToken = () => localStorage.getItem("token");

export const getAuthHeaders = (extraHeaders = {}) => {
	const headers = {
		"Content-Type": "application/json",
		...extraHeaders,
	};
	const token = getAuthToken();
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}
	return headers;
};

export const login = async (user_email, user_password) => {
	try {
		const response = await fetch(`${config.apiUrl}/users/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ user_email, user_password }),
		});

		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				success: false,
				message: data.message || "E-mail ou senha inválidos.",
			};
		}

		if (data.token) {
			localStorage.setItem("token", data.token);
			if (data.user) {
				localStorage.setItem("user", JSON.stringify(data.user));
			}
			return {
				success: true,
				user: data.user ?? null,
				token: data.token,
				message: data.message || "Login realizado com sucesso.",
			};
		}

		return {
			success: false,
			message: data.message || "Resposta inválida do servidor ao fazer login.",
		};
	} catch {
		return {
			success: false,
			message:
				"Erro ao conectar ao servidor. Verifique se o backend está em execução.",
		};
	}
};

export const register = async (user_name, user_email, user_password) => {
	try {
		const response = await fetch(`${config.apiUrl}/users/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ user_name, user_email, user_password }),
		});

		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				success: false,
				message: data.message || "Erro ao realizar cadastro.",
				errorAt: data.errorAt,
			};
		}

		return {
			success: true,
			user: data.user ?? null,
			message: data.message || "Usuário registrado com sucesso.",
		};
	} catch {
		return {
			success: false,
			message:
				"Erro ao conectar ao servidor. Verifique se o backend está em execução.",
		};
	}
};

export const getCurrentUser = async () => {
	try {
		const response = await fetch(`${config.apiUrl}/users`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		const data = await response.json().catch(() => ({}));

		if (response.status === 401) {
			logout();
			return { success: false, message: "Sessão expirada." };
		}

		if (!response.ok) {
			return {
				success: false,
				message: data.message || "Não foi possível obter dados do usuário.",
			};
		}

		if (data.user) {
			localStorage.setItem("user", JSON.stringify(data.user));
		}

		return {
			success: true,
			user: data.user,
		};
	} catch {
		return {
			success: false,
			message: "Erro ao conectar ao servidor.",
		};
	}
};

export const listUsers = async () => {
	try {
		const response = await fetch(`${config.apiUrl}/users/list`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				success: false,
				status: response.status,
				message: data.message || "Não foi possível listar os usuários.",
			};
		}

		return {
			success: true,
			users: data.users || [],
		};
	} catch {
		return {
			success: false,
			message: "Erro ao conectar ao servidor.",
		};
	}
};

export const logout = () => {
	localStorage.removeItem("token");
	localStorage.removeItem("user");

	const loginUrl = `${getFrontendRoot()}pages/user/login/login.html`;
	if (window.location.pathname.includes("/pages/user/login/")) {
		window.location.reload();
	} else {
		window.location.href = loginUrl;
	}
};

export const requireAuth = (redirectToLogin = true) => {
	const token = getAuthToken();
	if (!token && redirectToLogin) {
		window.location.href = `${getFrontendRoot()}pages/user/login/login.html`;
		return null;
	}
	return token;
};

export const getUser = () => {
	const stored = localStorage.getItem("user");
	if (!stored) return null;
	try {
		return JSON.parse(stored);
	} catch {
		return null;
	}
};

export const isAdmin = () => getUser()?.authority_level === "Administrador";
export const isTeamMember = () =>
	getUser()?.authority_level === "Membro da equipe";
export const canManageDemands = () => {
	const level = getUser()?.authority_level;
	return level === "Administrador" || level === "Lider de projeto";
};

// Aplica regras de visibilidade de botões conforme o perfil do usuário autenticado (Seção 2.1)
export const applyRoleRestrictions = (user = null) => {
	const currentUser = user || getUser();
	const admin = currentUser?.authority_level === "Administrador";
	const teamMember = currentUser?.authority_level === "Membro da equipe";

	// Ações exclusivas do Administrador (ex.: criar projeto)
	if (!admin) {
		document
			.querySelectorAll("[data-admin-only], .admin-only")
			.forEach((el) => {
				el.style.setProperty("display", "none", "important");
			});
	}

	// Ações bloqueadas para Membro da equipe (criar demanda, adicionar membro, cancelar demanda)
	if (teamMember) {
		document
			.querySelectorAll("a[href*='register_demand'], [data-manager-only]")
			.forEach((el) => {
				el.style.setProperty("display", "none", "important");
			});
	}
};

// Preenche nome, e-mail, foto do usuário no header e vincula confirmação de logout
export const initUserProfile = async () => {
	let user = getUser();

	// Atualiza os dados do usuário autenticado pela API para evitar informações desatualizadas
	if (getAuthToken()) {
		const res = await getCurrentUser();
		if (res.success && res.user) {
			user = res.user;
		}
	}

	if (user) {
		document.querySelectorAll(".user-profile-name").forEach((el) => {
			el.textContent = user.name || "Usuário";
		});

		document.querySelectorAll(".user-profile-email").forEach((el) => {
			el.textContent = user.email || "";
		});

		document.querySelectorAll(".user-profile-avatar").forEach((el) => {
			if (user.profile_pic) {
				el.src = user.profile_pic;
			}
		});

		document.querySelectorAll(".dashboard-header h2").forEach((el) => {
			const firstName = user.name ? user.name.split(" ")[0] : "Usuário";
			el.textContent = `Seja Bem-vindo, ${firstName}.`;
		});

		applyRoleRestrictions(user);
	} else {
		applyRoleRestrictions(null);
	}

	// Vincula ação de logout apenas uma vez por elemento .user-profile
	document.querySelectorAll(".user-profile").forEach((profile) => {
		if (profile.dataset.logoutBound === "true") return;
		profile.dataset.logoutBound = "true";

		const handleLogout = async () => {
			const confirmed = await showConfirmModal(
				"Deseja realmente sair da sua conta?",
				"Confirmação de Logout",
				{ confirmText: "Sair", cancelText: "Cancelar" },
			);
			if (confirmed) {
				logout();
			}
		};

		profile.addEventListener("click", handleLogout);
		profile.addEventListener("keydown", (event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				handleLogout();
			}
		});
	});

	return user;
};
