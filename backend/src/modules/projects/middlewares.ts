// O============================================================================================O

/* 
    Autor: Matheus Camargo Ginebro
    middlewares.ts -> Arquivo responsável por definir as validações iniciais dos valores passados na requisição;
*/

// O============================================================================================O

import { Request, Response, NextFunction } from "express";

// O============================================================================================O

const project_id_param = (req: Request, res: Response, next: NextFunction) => {
	const project_id = req.params.project_id;

	if (!project_id) {
		return res.status(400).json({
			message: "ID do projeto não fornecido nos parâmetros da requisição.",
			errorAt: "project_id",
		});
	}

	res.locals.project_id = Number(project_id);

	return next();
};

// O============================================================================================O

const user_id = (req: Request, res: Response, next: NextFunction) => {
	const user_id = req.params.user_id;

	if (!user_id) {
		return res.status(400).json({
			message: "ID do projeto não fornecido nos parâmetros da requisição.",
			errorAt: "project_user_id_param",
		});
	}

	res.locals.project_user_id = Number(user_id);

	return next();
};

// O============================================================================================O

export default { project_id_param, user_id };

// O============================================================================================O
