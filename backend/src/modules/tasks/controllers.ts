// O============================================================================================O

/* 
    Autor: Matheus Camargo Ginebro
    controllers.ts -> Arquivo responsável pela lógica de controle da API;
*/

// O============================================================================================O

import { Request, Response } from "express";
import models from "./models";

// O============================================================================================O

const get_overview = async (__req: Request, res: Response) => {
	/* -------------------------------------------------- */

	const user_id = await res.locals.user_id;

	/* -------------------------------------------------- */

	const tasks = await models.get_tasks_by_user_id(user_id);

	if (tasks.length === 0) {
		return res.status(404).json({
			message: "Nenhuma tarefa encontrada para o usuário.",
		});
	}

	/* -------------------------------------------------- */

	return res.status(200).json({
		message: "Tarefas encontradas com sucesso.",
		tasks,
	});
};

export default {
	get_overview,
};
