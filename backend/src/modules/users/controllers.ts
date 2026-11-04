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

	/* -------------------------------------------------- */

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

	/* -------------------------------------------------- */

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

const register_user = async (req: Request, res: Response) => {
	/* -------------------------------------------------- */

	const { user_email, user_password, user_name } = req.body;

	/* -------------------------------------------------- */

	const test_email = await user_models.get_user_by_email(user_email);

	if (test_email) {
		return res.status(409).json({
			message: "O e-mail de usuário já está sendo utilizado.",
			errorAt: "user_email",
		});
	}

	/* -------------------------------------------------- */

	const test_name = await user_models.get_user_by_name(user_name);

	if (test_name) {
		return res.status(409).json({
			message: "O nome de usuário já está sendo utilizado.",
			errorAt: "user_name",
		});
	}

	/* -------------------------------------------------- */

	// Validando a senha
	if (user_password.length < 8) {
		return res.status(400).json({
			message: "A senha deve ter no mínimo 8 caracteres.",
			errorAt: "user_password",
		});
	}

	if (!/[A-Z]/.test(user_password)) {
		return res.status(400).json({
			message: "A senha deve conter pelo menos uma letra maiúscula.",
			errorAt: "user_password",
		});
	}

	if (!/[a-z]/.test(user_password)) {
		return res.status(400).json({
			message: "A senha deve conter pelo menos uma letra minúscula.",
			errorAt: "user_password",
		});
	}

	if (!/[0-9]/.test(user_password)) {
		return res.status(400).json({
			message: "A senha deve conter pelo menos um número.",
			errorAt: "user_password",
		});
	}

	if (!/[!@#$%^&*(),.?":{}|<>]/.test(user_password)) {
		return res.status(400).json({
			message: "A senha deve conter pelo menos um caractere especial.",
			errorAt: "user_password",
		});
	}

	/* -------------------------------------------------- */

	const hashed_password = await bcrypt.hash(user_password, 12);

	const new_user = await user_models.register_user(
		user_name,
		user_email,
		hashed_password,
	);

	return res.status(201).json({
		message: "Usuário registrado com sucesso.",
		user: new_user,
	});
};

const get_user = async (__req: Request, res: Response) => {
	/* -------------------------------------------------- */

	const user_id = await res.locals.user.id;

	/* -------------------------------------------------- */

	const user = await user_models.get_user_by_id(user_id);

	if (!user) {
		return res.status(404).json({
			message: "Usuário não encontrado.",
		});
	}

	/* -------------------------------------------------- */

	return res.status(200).json({
		message: "Usuário encontrado com sucesso.",
		user: user,
	});
};

// O============================================================================================O

export default { login_user, register_user, get_user };
