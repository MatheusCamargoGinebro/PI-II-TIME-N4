// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    middlewares.ts -> Arquivo responsável pelas validações de parâmetros e corpo das requisições do módulo de projetos;
*/

// O============================================================================================O

import { Request, Response, NextFunction } from "express";

// O============================================================================================O

// Valida o parâmetro project_id da URL como inteiro positivo
const project_id_param = (req: Request, res: Response, next: NextFunction) => {
	const raw_id = req.params.project_id;
	const parsed = Number(raw_id);

	if (!raw_id || !Number.isInteger(parsed) || parsed <= 0) {
		return res.status(400).json({
			message:
				"ID do projeto não fornecido ou inválido nos parâmetros da requisição.",
			errorAt: "project_id",
		});
	}

	res.locals.project_id = parsed;

	return next();
};

// O============================================================================================O

// Valida o parâmetro user_id da URL como inteiro positivo
const user_id = (req: Request, res: Response, next: NextFunction) => {
	const raw_id = req.params.user_id;
	const parsed = Number(raw_id);

	if (!raw_id || !Number.isInteger(parsed) || parsed <= 0) {
		return res.status(400).json({
			message:
				"ID do usuário não fornecido ou inválido nos parâmetros da requisição.",
			errorAt: "user_id",
		});
	}

	res.locals.project_user_id = parsed;

	return next();
};

// O============================================================================================O

// Valida o título do projeto informado no corpo da requisição
const project_title = (req: Request, res: Response, next: NextFunction) => {
	const { project_title } = req.body;

	if (!project_title || typeof project_title !== "string") {
		return res.status(400).json({
			message: "Título do projeto não fornecido ou inválido.",
			errorAt: "project_title",
		});
	}

	const trimmed = project_title.trim();

	if (trimmed.length === 0) {
		return res.status(400).json({
			message: "O título do projeto não pode estar em branco.",
			errorAt: "project_title",
		});
	}

	if (trimmed.length > 256) {
		return res.status(400).json({
			message: "O título do projeto deve ter no máximo 256 caracteres.",
			errorAt: "project_title",
		});
	}

	req.body.project_title = trimmed;

	return next();
};

// O============================================================================================O

// Valida o ID do usuário a ser vinculado ao projeto no corpo da requisição
const member_user_id = (req: Request, res: Response, next: NextFunction) => {
	const raw_id = req.body.user_id;
	const parsed = Number(raw_id);

	if (
		raw_id === undefined ||
		raw_id === null ||
		raw_id === "" ||
		!Number.isInteger(parsed) ||
		parsed <= 0
	) {
		return res.status(400).json({
			message: "ID do usuário a vincular deve ser um número inteiro positivo.",
			errorAt: "user_id",
		});
	}

	req.body.user_id = parsed;

	return next();
};

// O============================================================================================O

export default {
	project_id_param,
	user_id,
	project_title,
	member_user_id,
};

// O============================================================================================O
