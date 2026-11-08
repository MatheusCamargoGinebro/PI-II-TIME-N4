// O============================================================================================O

/* 
    Autor: Matheus Camargo Ginebro
    controllers.ts -> Arquivo responsável pela lógica de controle da API;
*/

// O============================================================================================O

import { Request, Response } from "express";
import models from "./models";

// O============================================================================================O

const get_user_projects = async (__req: Request, res: Response) => {
	/* -------------------------------------------------- */

	const user_id = await res.locals.user_id;

	/* -------------------------------------------------- */

	const projects = await models.get_projects_by_user_id(user_id);

	if (projects === null) {
		return res.status(404).json({
			message: "Nenhum projeto encontrado para o usuário.",
		});
	}

	/* -------------------------------------------------- */

	return res.status(200).json({
		message: "Projetos encontrados com sucesso.",
		projects,
	});
};

// O============================================================================================O

const get_project = async (__req: Request, res: Response) => {
	/* -------------------------------------------------- */

	const user_id = await res.locals.user_id;
	const project_id = res.locals.project_id;

	/* -------------------------------------------------- */

	const user_project = await models.get_user_project(user_id, project_id);

	if (user_project === null) {
		return res.status(404).json({
			message: "O usuário não tem acesso ao projeto.",
		});
	}

	/* -------------------------------------------------- */

	return res.status(200).json({
		message: "Informações da tarefa obtidas com sucesso.",
		user_project,
	});
};

// O============================================================================================O

const get_project_tasks = async (__req: Request, res: Response) => {
	/* -------------------------------------------------- */

	const user_id = await res.locals.user_id;
	const project_id = res.locals.project_id;

	/* -------------------------------------------------- */

	const user_project = await models.get_user_project(user_id, project_id);

	if (user_project === null) {
		return res.status(404).json({
			message: "O usuário não tem acesso ao projeto.",
		});
	}

	/* -------------------------------------------------- */

	const task_list = await models.get_project_task_list(project_id);

	if (task_list === null) {
		return res.status(404).json({
			message: "Não foram encontradas tarefas para o projeto",
		});
	}

	/* -------------------------------------------------- */

	return res.status(200).json({
		message: "Lista de tarefas do projeto obtida com sucesso",
		task_list,
	});
};

export default { get_user_projects, get_project, get_project_tasks };
