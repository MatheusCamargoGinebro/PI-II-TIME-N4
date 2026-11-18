
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
        due_date,
        project_id,
        responsible_id,
    } = req.body;

    const creator_id = Number(res.locals.user_id);

    const priorityMap: Record<string, string> = {
        baixa: "BAIXA",
        media: "MEDIA",
        alta: "ALTA",
        critica: "CRITICA",
    };

    const formattedPriority =
        typeof priority === "string"
            ? priorityMap[priority.toLowerCase()]
            : undefined;

    const formattedDueDate =
        due_date === undefined || due_date === null || due_date === ""
            ? null
            : due_date;

    const formattedResponsible =
        responsible_id === undefined ||
        responsible_id === null ||
        responsible_id === ""
            ? null
            : Number(responsible_id);

    if (
        typeof title !== "string" ||
        title.trim().length === 0 ||
        typeof description !== "string" ||
        description.trim().length === 0 ||
        !formattedPriority ||
        (formattedDueDate !== null &&
            typeof formattedDueDate !== "string") ||
        !Number.isInteger(Number(project_id)) ||
        Number(project_id) <= 0 ||
        (formattedResponsible !== null &&
            (!Number.isInteger(formattedResponsible) ||
                formattedResponsible <= 0)) ||
        !Number.isInteger(creator_id) ||
        creator_id <= 0
    ) {
        return res.status(400).json({
            message: "Dados inválidos ou incompletos para cadastrar a demanda.",
        });
    }

    try {
        const result = await models.create_task(
            title.trim(),
            description.trim(),
            formattedPriority,
            formattedDueDate,
            Number(project_id),
            formattedResponsible,
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


const update = async (req: Request, res: Response) => {
    const task_id = Number(req.params.task_id);
    const user_id = Number(res.locals.user_id);

    const {
        title,
        description,
        priority,
        due_date,
        responsible_id,
    } = req.body;

    const priorityMap: Record<string, string> = {
        baixa: "BAIXA",
        media: "MEDIA",
        alta: "ALTA",
        critica: "CRITICA",
    };

    const formattedPriority =
        typeof priority === "string"
            ? priorityMap[priority.toLowerCase()]
            : undefined;

    const formattedDueDate =
        due_date === undefined || due_date === null || due_date === ""
            ? null
            : due_date;

    const formattedResponsible =
        responsible_id === undefined ||
        responsible_id === null ||
        responsible_id === ""
            ? null
            : Number(responsible_id);

    if (
        !Number.isInteger(task_id) ||
        task_id <= 0 ||
        !Number.isInteger(user_id) ||
        user_id <= 0 ||
        typeof title !== "string" ||
        title.trim().length === 0 ||
        typeof description !== "string" ||
        description.trim().length === 0 ||
        !formattedPriority ||
        (formattedDueDate !== null &&
            typeof formattedDueDate !== "string") ||
        (formattedResponsible !== null &&
            (!Number.isInteger(formattedResponsible) ||
                formattedResponsible <= 0))
    ) {
        return res.status(400).json({
            message: "Dados inválidos ou incompletos para editar a demanda.",
        });
    }

    try {
        const tasks = await models.get_task_by_id(task_id, user_id);

        if (!Array.isArray(tasks) || tasks.length === 0) {
            return res.status(404).json({
                message: "Demanda não encontrada ou sem permissão para editá-la.",
            });
        }

        const task = tasks[0] as { fk_project_id: number };

        const members = await models.get_project_members(
            task.fk_project_id,
            user_id
        );

        if (
            formattedResponsible !== null &&
            !members.some(
                (member: { user_id: number }) =>
                    Number(member.user_id) === formattedResponsible
            )
        ) {
            return res.status(400).json({
                message: "O responsável selecionado não pertence ao projeto.",
            });
        }

        const result = await models.update_task(
            task_id,
            title.trim(),
            description.trim(),
            formattedPriority,
            formattedDueDate,
            formattedResponsible,
            user_id
        );

        if ("affectedRows" in result && result.affectedRows === 0) {
            return res.status(404).json({
                message: "Nenhuma demanda foi atualizada.",
            });
        }

        return res.status(200).json({
            message: "Demanda atualizada com sucesso.",
            result,
        });
    } catch (error) {
        console.error("Erro ao editar demanda:", error);

        return res.status(500).json({
            message: "Erro interno ao editar a demanda.",
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
    update,
    get_project_members,
};

// O============================================================================================O
