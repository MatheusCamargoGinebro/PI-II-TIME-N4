// O============================================================================================O

/* 
    Autor: Matheus Camargo Ginebro
    controllers.ts -> Arquivo responsável pela lógica de controle da API;
*/

// O============================================================================================O

import { Request, Response } from "express";
import models from "./models";

// O============================================================================================O

const get_user_projects = async (req: Request, res: Response) => {
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

export default { get_user_projects };
