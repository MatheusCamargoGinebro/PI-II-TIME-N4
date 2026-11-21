// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    middlewares.ts -> Arquivo responsável pelas validações de entrada e autenticação JWT do módulo de usuários;
*/

// O============================================================================================O

import { Request, Response, NextFunction } from "express";
import JWT from "jsonwebtoken";
import user_models from "./models";

// O============================================================================================O

// Valida o formato do e-mail enviado no corpo da requisição
const user_email = (req: Request, res: Response, next: NextFunction) => {
	const { user_email } = req.body;

	if (!user_email) {
		return res.status(400).json({
			message: "Email não fornecido no corpo da requisição.",
			errorAt: "user_email",
		});
	}

	if (typeof user_email !== "string") {
		return res.status(400).json({
			message: "Email fornecido não é uma string.",
			errorAt: "user_email",
		});
	}

	const trimmed_email = user_email.trim();

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed_email)) {
		return res.status(400).json({
			message: "Email fornecido não é válido.",
			errorAt: "user_email",
		});
	}

	req.body.user_email = trimmed_email;

	return next();
};

// O============================================================================================O

// Valida a presença e o tipo da senha enviada no corpo da requisição
const user_password = (req: Request, res: Response, next: NextFunction) => {
	const { user_password } = req.body;

	if (!user_password) {
		return res.status(400).json({
			message: "Senha não fornecida no corpo da requisição.",
			errorAt: "user_password",
		});
	}

	if (typeof user_password !== "string") {
		return res.status(400).json({
			message: "Senha fornecida não é uma string.",
			errorAt: "user_password",
		});
	}

	return next();
};

// O============================================================================================O

// Valida a presença e o conteúdo do nome enviado no cadastro de usuário
const user_name = (req: Request, res: Response, next: NextFunction) => {
	const { user_name } = req.body;

	if (!user_name) {
		return res.status(400).json({
			message: "Nome não fornecido no corpo da requisição.",
			errorAt: "user_name",
		});
	}

	if (typeof user_name !== "string" || user_name.trim().length === 0) {
		return res.status(400).json({
			message: "Nome fornecido deve ser uma string não vazia.",
			errorAt: "user_name",
		});
	}

	req.body.user_name = user_name.trim();

	return next();
};

// O============================================================================================O

// Valida o ID numérico de usuário enviado no corpo da requisição
const user_id = (req: Request, res: Response, next: NextFunction) => {
	const { user_id } = req.body;

	if (user_id === undefined || user_id === null) {
		return res.status(400).json({
			message: "ID de usuário não fornecido no corpo da requisição.",
			errorAt: "user_id",
		});
	}

	if (
		typeof user_id !== "number" ||
		!Number.isInteger(user_id) ||
		user_id <= 0
	) {
		return res.status(400).json({
			message: "ID de usuário fornecido deve ser um número inteiro positivo.",
			errorAt: "user_id",
		});
	}

	return next();
};

// O============================================================================================O

// Autentica o usuário via token JWT enviado em x-access-token ou Authorization: Bearer <token>
const user_token = async (req: Request, res: Response, next: NextFunction) => {
	let token = req.headers["x-access-token"] as string | undefined;

	// Permite também o padrão Authorization: Bearer <token>
	if (!token && typeof req.headers.authorization === "string") {
		const parts = req.headers.authorization.split(" ");
		if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
			token = parts[1];
		}
	}

	if (!token) {
		return res.status(401).json({
			message: "Token não fornecido no cabeçalho da requisição.",
			errorAt: "x-access-token",
		});
	}

	if (token.trim().length === 0) {
		return res.status(401).json({
			message: "Token fornecido não é válido.",
			errorAt: "x-access-token",
		});
	}

	try {
		const decoded = JWT.verify(
			token.trim(),
			process.env.JWT_SECRET as string,
		) as {
			user_id: number;
			user_email?: string;
		};

		const user = await user_models.get_user_by_id(decoded.user_id);

		if (!user) {
			return res.status(404).json({
				message: "Usuário não encontrado.",
				errorAt: "x-access-token",
			});
		}

		// Armazena o objeto resolvido do usuário e seu ID para uso nos controllers
		res.locals.user = user;
		res.locals.user_id = user.user_id;

		return next();
	} catch (error) {
		return res.status(401).json({
			message: "Token fornecido é inválido ou expirou.",
			errorAt: "x-access-token",
		});
	}
};

// O============================================================================================O

export default { user_email, user_password, user_name, user_id, user_token };

// O============================================================================================O
