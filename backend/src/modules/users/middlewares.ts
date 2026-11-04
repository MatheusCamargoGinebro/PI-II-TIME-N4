// O============================================================================================O

/* 
    Autor: Matheus Camargo Ginebro
    middlewares.ts -> Arquivo responsável por definir as validações iniciais dos valores passados na requisição;
*/

// O============================================================================================O

import { Request, Response, NextFunction } from "express";

/* import JWT from "jsonwebtoken"; */

// O============================================================================================O

const user_email = (req: Request, res: Response, next: NextFunction) => {
	const { user_email } = req.body;

	if (!user_email) {
		return res.status(400).json({
			message: "Email não fornecido no corpo da requisição.",
			errorAt: "user_email",
		});
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user_email)) {
		return res.status(400).json({
			message: "Email fornecido não é válido.",
			errorAt: "user_email",
		});
	}

	return next();
};

// O============================================================================================O

const user_password = (req: Request, res: Response, next: NextFunction) => {
	const { user_password } = req.body;

	if (!user_password) {
		return res.status(400).json({
			message: "Senha não fornecida no corpo da requisição.",
			errorAt: "user_password",
		});
	}

	return next();
};

// O============================================================================================O

export default { user_email, user_password };

// O============================================================================================O
