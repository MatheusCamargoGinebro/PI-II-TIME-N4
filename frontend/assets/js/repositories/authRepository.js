import { config } from '../config.js';

export const getAuthToken = () => {
    return localStorage.getItem("token");
};

export const getAuthHeaders = (extraHeaders = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...extraHeaders
    };
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const login = async (user_email, user_password) => {
    try {
        const response = await fetch(`${config.apiUrl}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_email, user_password })
        });

        let data = {};
        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            return {
                success: false,
                message: data.message || 'E-mail ou senha inválidos.'
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
                message: data.message || 'Login realizado com sucesso.'
            };
        }

        return {
            success: false,
            message: data.message || 'Resposta inválida do servidor ao fazer login.'
        };
    } catch (err) {
        return {
            success: false,
            message: 'Erro ao conectar ao servidor. Verifique se o backend está em execução.'
        };
    }
};

export const register = async (user_name, user_email, user_password) => {
    try {
        const response = await fetch(`${config.apiUrl}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_name, user_email, user_password })
        });

        let data = {};
        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            return {
                success: false,
                message: data.message || 'Erro ao realizar cadastro.',
                errorAt: data.errorAt
            };
        }

        return {
            success: true,
            user: data.user ?? null,
            message: data.message || 'Usuário registrado com sucesso.'
        };
    } catch (err) {
        return {
            success: false,
            message: 'Erro ao conectar ao servidor. Verifique se o backend está em execução.'
        };
    }
};

export const getCurrentUser = async () => {
    try {
        const response = await fetch(`${config.apiUrl}/users`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        let data = {};
        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            return {
                success: false,
                message: data.message || 'Não foi possível obter dados do usuário.'
            };
        }

        if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
        }

        return {
            success: true,
            user: data.user
        };
    } catch (err) {
        return {
            success: false,
            message: 'Erro ao conectar ao servidor.'
        };
    }
};

export const listUsers = async () => {
    try {
        const response = await fetch(`${config.apiUrl}/users/list`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        let data = {};
        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            return {
                success: false,
                message: data.message || 'Não foi possível listar os usuários.'
            };
        }

        return {
            success: true,
            users: data.users || []
        };
    } catch (err) {
        return {
            success: false,
            message: 'Erro ao conectar ao servidor.'
        };
    }
};

export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    const isInsidePages = window.location.pathname.includes("/pages/");
    if (window.location.pathname.includes("/pages/user/login")) {
        window.location.reload();
    } else if (isInsidePages) {
        window.location.href = window.location.pathname.includes("/user/") ? "./login.html" : "../user/login/login.html";
    } else {
        window.location.href = "./pages/user/login/login.html";
    }
};

export const requireAuth = (redirectToLogin = true) => {
    const token = getAuthToken();
    if (!token && redirectToLogin) {
        const isInsidePages = window.location.pathname.includes("/pages/");
        const target = isInsidePages
            ? (window.location.pathname.includes("/user/") ? "./login.html" : "../user/login/login.html")
            : "./pages/user/login/login.html";
        window.location.href = target;
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

export const isAdmin = () => {
    const user = getUser();
    return user?.authority_level === "Administrador";
};

export const applyRoleRestrictions = (user = null) => {
    const currentUser = user || getUser();
    const admin = currentUser?.authority_level === "Administrador";
    const teamMember = currentUser?.authority_level === "Membro da equipe";

    // 1. Ocultar opções destinadas exclusivamente ao Administrador
    if (!admin) {
        // Botão "Criar Projeto" na lista de projetos
        const createProjectBtns = document.querySelectorAll(".projects-header button, [data-admin-only], .admin-only");
        createProjectBtns.forEach(btn => {
            btn.style.setProperty("display", "none", "important");
        });

        // Ícones de menu/configurações em cards de projetos e colunas/métricas
        const settingsIcons = document.querySelectorAll(
            ".project-card-menu, .card-icon i[data-lucide='settings'], .card-icon [data-lucide='settings']"
        );
        settingsIcons.forEach(icon => {
            const container = icon.closest(".project-card-menu, .card-icon");
            if (container) {
                container.style.setProperty("display", "none", "important");
            }
        });
    }

    // 2. Ocultar opções restritas para Membro da equipe (não pode criar demandas nem adicionar membros)
    if (teamMember) {
        // Botão "Adicionar Tarefa"
        const addTaskBtns = document.querySelectorAll("a[href*='register_demand']");
        addTaskBtns.forEach(btn => {
            btn.style.setProperty("display", "none", "important");
        });

        // Botão "Adicionar Membro" em project_members
        const addMemberBtns = document.querySelectorAll(".project-members-header button");
        addMemberBtns.forEach(btn => {
            btn.style.setProperty("display", "none", "important");
        });
    }
};

export const initUserProfile = async () => {
    let user = null;
    const stored = localStorage.getItem("user");
    if (stored) {
        try {
            user = JSON.parse(stored);
        } catch {
            user = null;
        }
    }

    if (!user && getAuthToken()) {
        const res = await getCurrentUser();
        if (res.success) {
            user = res.user;
        }
    }

    if (user) {
        const nameElements = document.querySelectorAll(".user-profile-name");
        nameElements.forEach(el => {
            el.textContent = user.name || "Usuário";
        });

        const emailElements = document.querySelectorAll(".user-profile-email");
        emailElements.forEach(el => {
            el.textContent = user.email || "";
        });

        const avatarElements = document.querySelectorAll(".user-profile-avatar");
        avatarElements.forEach(el => {
            if (user.profile_pic) {
                el.src = user.profile_pic;
            }
        });

        const welcomeElements = document.querySelectorAll(".dashboard-header h2");
        welcomeElements.forEach(el => {
            el.textContent = `Seja Bem-vindo, ${user.name ? user.name.split(" ")[0] : "Usuário"}.`;
        });

        // Aplica restrições de visibilidade por perfil
        applyRoleRestrictions(user);
    } else {
        applyRoleRestrictions(null);
    }

    // Attach logout to user-profile container if clicked
    const userProfiles = document.querySelectorAll(".user-profile");
    userProfiles.forEach(profile => {
        profile.style.cursor = "pointer";
        profile.title = "Clique para sair (logout)";
        profile.addEventListener("click", () => {
            if (confirm("Deseja encerrar a sessão?")) {
                logout();
            }
        });
    });
};
