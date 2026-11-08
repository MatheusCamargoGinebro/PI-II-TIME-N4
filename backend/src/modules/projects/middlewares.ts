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

export default { project_id_param };
