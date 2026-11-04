// O============================================================================================O

/* 
    Autor: Matheus Camargo Ginebro
    controllers.ts -> Arquivo responsável pela lógica de controle da API;
*/

// O============================================================================================O

import { Request, Response } from "express";
import user_models from "./models";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";

// O============================================================================================O

const login_user = async (req: Request, res: Response) => {
	/* -------------------------------------------------- */

	const { user_email, user_password } = req.body;

	/* -------------------------------------------------- */

	const user = await user_models.get_user_by_email(user_email);

	if (!user) {
		return res.status(404).json({
			message: "Usuário ou senha incorretos.",
		});
	}

	try {
		const password_match = await bcrypt.compare(user_password, user.password);

		if (!password_match) {
			return res.status(404).json({
				message: "Usuário ou senha incorretos.",
			});
		}
	} catch (error) {
		return res.status(500).json({
			message: "Erro ao verificar a senha do usuário.",
			error: error,
		});
	}

	const token = JWT.sign(
		{ user_id: user.user_id, user_email: user.user_email },
		process.env.JWT_SECRET as string,
		{ expiresIn: 86400 }, // 24h
	);

	return res.status(200).json({
		message: "Login realizado com sucesso.",
		token: token,
	});
};

// O============================================================================================O

export default { login_user };
