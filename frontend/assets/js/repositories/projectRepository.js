import { config } from '../config.js';
import { getAuthHeaders } from './authRepository.js';

export const getProjects = async () => {
    try {
        const response = await fetch(`${config.apiUrl}/projects`, {
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
                message: data.message || 'Erro ao carregar projetos.'
            };
        }

        return {
            success: true,
            projects: data.projects || [],
            message: data.message
        };
    } catch (err) {
        return {
            success: false,
            message: 'Erro ao conectar ao servidor ao obter projetos.'
        };
    }
};

export const getProject = async (projectId) => {
    try {
        const response = await fetch(`${config.apiUrl}/projects/${projectId}`, {
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
                message: data.message || 'Projeto não encontrado.'
            };
        }

        return {
            success: true,
            project: data.user_project,
            message: data.message
        };
    } catch (err) {
        return {
            success: false,
            message: 'Erro ao conectar ao servidor ao obter detalhes do projeto.'
        };
    }
};

export const getProjectTasks = async (projectId) => {
    try {
        const response = await fetch(`${config.apiUrl}/projects/${projectId}/tasks`, {
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
                message: data.message || 'Erro ao obter tarefas do projeto.'
            };
        }

        return {
            success: true,
            tasks: data.task_list || [],
            message: data.message
        };
    } catch (err) {
        return {
            success: false,
            message: 'Erro ao conectar ao servidor ao obter tarefas do projeto.'
        };
    }
};

export const getProjectMembers = async (projectId) => {
    try {
        const response = await fetch(`${config.apiUrl}/projects/${projectId}/members`, {
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
                message: data.message || 'Erro ao carregar membros do projeto.'
            };
        }

        return {
            success: true,
            members: data.users_list || [],
            message: data.message
        };
    } catch (err) {
        return {
            success: false,
            message: 'Erro ao conectar ao servidor ao obter membros do projeto.'
        };
    }
};

export const getProjectMemberDetails = async (projectId, userId) => {
    try {
        const response = await fetch(`${config.apiUrl}/projects/${projectId}/members/${userId}`, {
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
                message: data.message || 'Erro ao carregar detalhes do membro.'
            };
        }

        return {
            success: true,
            data: data.data,
            message: data.message
        };
    } catch (err) {
        return {
            success: false,
            message: 'Erro ao conectar ao servidor ao obter detalhes do membro.'
        };
    }
};

export const createProject = async (projectTitle) => {
    try {
        const response = await fetch(`${config.apiUrl}/projects`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ project_title: projectTitle })
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
                message: data.message || 'Erro ao criar projeto.'
            };
        }

        return {
            success: true,
            project_id: data.project_id,
            project: data.project,
            message: data.message || 'Projeto criado com sucesso.'
        };
    } catch (err) {
        return {
            success: false,
            message: 'Erro ao conectar ao servidor ao criar projeto.'
        };
    }
};

export const addProjectMember = async (projectId, userId) => {
    try {
        const response = await fetch(`${config.apiUrl}/projects/${projectId}/members`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ user_id: Number(userId) })
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
                message: data.message || 'Erro ao vincular membro ao projeto.',
                errorAt: data.errorAt
            };
        }

        return {
            success: true,
            member: data.member,
            message: data.message || 'Usuário vinculado ao projeto com sucesso.'
        };
    } catch (err) {
        return {
            success: false,
            message: 'Erro ao conectar ao servidor ao adicionar membro.'
        };
    }
};
