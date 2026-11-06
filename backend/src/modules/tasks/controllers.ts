
import { Request, Response } from "express";
import models from "./models";

// O============================================================================================O

const get_overview = async (__req: Request, res: Response) => {
    const user_id = Number(res.locals.user_id);

    const tasks = await models.get_tasks_by_user_id(user_id);

    if (tasks.length === 0) {
        return res.status(404).json({
            message: "Nenhuma tarefa encontrada para o usuário.",
        });
    }

    return res.status(200).json({
        message: "Tarefas encontradas com sucesso.",
        tasks,
    });
};

// O============================================================================================O

const create = async (req: Request, res: Response) => {
    const {
        title,
        description,
        priority,
        status,
        due_date,
        project_id,
        responsible_id,
    } = req.body;

    const creator_id = Number(res.locals.user_id);

    const priorityMap: Record<string, string> = {
        baixa: "BAIXA",
        media: "MEDIA",
        alta: "ALTA",
    };

    const statusMap: Record<string, string> = {
        pendente: "ABERTA",
        andamento: "EM ANDAMENTO",
        concluido: "CONCLUIDA",
    };

    const formattedPriority = priorityMap[priority];
    const formattedStatus = statusMap[status];

    if (
        typeof title !== "string" ||
        typeof description !== "string" ||
        typeof due_date !== "string" ||
        !formattedPriority ||
        !formattedStatus ||
        !Number.isInteger(Number(project_id)) ||
        Number(project_id) <= 0 ||
        !Number.isInteger(Number(responsible_id)) ||
        Number(responsible_id) <= 0 ||
        !Number.isInteger(creator_id) ||
        creator_id <= 0
    ) {
        return res.status(400).json({
            message: "Dados inválidos ou incompletos para cadastrar a demanda.",
        });
    }

    try {
        const result = await models.create_task(
            title,
            description,
            formattedPriority,
            formattedStatus,
            due_date,
            Number(project_id),
            Number(responsible_id),
            creator_id
        );

        return res.status(201).json({
            message: "Demanda cadastrada com sucesso.",
            result,
        });
    } catch (error) {
        console.error("Erro ao cadastrar demanda:", error);

        return res.status(500).json({
            message: "Erro interno ao cadastrar a demanda.",
        });
    }
};

// O============================================================================================O

const get_project_members = async (req: Request, res: Response) => {
    const project_id = Number(req.params.project_id);
    const user_id = Number(res.locals.user_id);

    if (
        !Number.isInteger(project_id) ||
        project_id <= 0 ||
        !Number.isInteger(user_id) ||
        user_id <= 0
    ) {
        return res.status(400).json({
            message: "ID do projeto ou usuário inválido.",
        });
    }

    try {
        const members = await models.get_project_members(
            project_id,
            user_id
        );

        return res.status(200).json({
            message: "Participantes do projeto encontrados com sucesso.",
            members,
        });
    } catch (error) {
        console.error("Erro ao buscar participantes do projeto:", error);

        return res.status(500).json({
            message: "Erro interno ao buscar participantes do projeto.",
        });
    }
};

// O============================================================================================O

export default {
    get_overview,
    create,
    get_project_members,
};

// O============================================================================================O
