// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    controllers.ts -> Arquivo responsável pela lógica de controle do módulo de projetos e membros;
*/

// O============================================================================================O

import { Request, Response } from "express";
import models from "./models";
import user_models, { PublicUser } from "../users/models";

// O============================================================================================O

// Verifica se o usuário autenticado tem acesso ao projeto (Administrador acessa todos os projetos)
const resolve_project_access = async (user: PublicUser, project_id: number) => {
	if (user.authority_level === "Administrador") {
		return models.get_project_by_id(project_id);
	}

	return models.get_user_project(user.user_id, project_id);
};

// O============================================================================================O

// Lista os projetos visíveis para o usuário autenticado (todos para Administrador, vinculados para demais perfis)
const get_user_projects = async (__req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;

	const projects =
		user.authority_level === "Administrador"
			? await models.get_all_projects()
			: await models.get_projects_by_user_id(user.user_id);

	return res.status(200).json({
		message: "Projetos encontrados com sucesso.",
		projects,
	});
};

// O============================================================================================O

// Obtém os detalhes e totalizadores de um projeto específico
const get_project = async (__req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const project_id = res.locals.project_id as number;

	const user_project = await resolve_project_access(user, project_id);

	if (user_project === null) {
		return res.status(404).json({
			message: "Projeto não encontrado ou o usuário não tem acesso ao projeto.",
		});
	}

	return res.status(200).json({
		message: "Informações do projeto obtidas com sucesso.",
		user_project,
	});
};

// O============================================================================================O

// Lista todas as demandas de um projeto específico (incluindo demandas sem responsável)
const get_project_tasks = async (__req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const project_id = res.locals.project_id as number;

	const user_project = await resolve_project_access(user, project_id);

	if (user_project === null) {
		return res.status(404).json({
			message: "Projeto não encontrado ou o usuário não tem acesso ao projeto.",
		});
	}

	const task_list = await models.get_project_task_list(project_id);

	return res.status(200).json({
		message: "Lista de tarefas do projeto obtida com sucesso.",
		task_list,
	});
};

// O============================================================================================O

// Lista todos os membros vinculados a um projeto específico
const get_project_members = async (__req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const project_id = res.locals.project_id as number;

	const user_project = await resolve_project_access(user, project_id);

	if (user_project === null) {
		return res.status(404).json({
			message: "Projeto não encontrado ou o usuário não tem acesso ao projeto.",
		});
	}

	const users_list = await models.get_users_project(project_id);

	return res.status(200).json({
		message: "Usuários encontrados com sucesso.",
		users_list,
	});
};

// O============================================================================================O

// Obtém os detalhes e demandas de um membro específico dentro de um projeto
const get_project_member_details = async (__req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const project_id = res.locals.project_id as number;
	const project_user_id = res.locals.project_user_id as number;

	const target_user_info = await user_models.get_user_by_id(project_user_id);

	if (target_user_info === null) {
		return res.status(404).json({
			message: "O usuário não foi encontrado.",
		});
	}

	const user_project = await resolve_project_access(user, project_id);

	if (user_project === null) {
		return res.status(404).json({
			message: "Projeto não encontrado ou o usuário não tem acesso ao projeto.",
		});
	}

	const target_user_project = await models.get_user_project(
		project_user_id,
		project_id,
	);

	if (target_user_project === null) {
		return res.status(404).json({
			message: "O usuário alvo não está vinculado ao projeto.",
		});
	}

	const target_task_list = await models.get_member_details(
		project_user_id,
		project_id,
	);

	return res.status(200).json({
		message: "Informações de usuário encontradas com sucesso.",
		data: {
			user_info: target_user_info,
			task_list: target_task_list,
			user_project: target_user_project,
		},
	});
};

// O============================================================================================O

// Cadastra um novo projeto (ação exclusiva do Administrador)
const register_new_project = async (req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const new_project_title = req.body.project_title as string;

	if (user.authority_level !== "Administrador") {
		return res.status(403).json({
			message:
				"Acesso negado. Apenas administradores podem registrar um novo projeto.",
		});
	}

	const created_project = await models.register_project(
		user.user_id,
		new_project_title,
	);

	return res.status(201).json({
		message: "Projeto criado com sucesso.",
		project_id: created_project.project_id,
		project: created_project,
	});
};

// O============================================================================================O

// Vincula um usuário existente a um projeto (permitido para Administrador e Líder de projeto vinculado)
const add_project_member = async (req: Request, res: Response) => {
	const user = res.locals.user as PublicUser;
	const project_id = res.locals.project_id as number;
	const target_user_id = req.body.user_id as number;

	if (user.authority_level === "Membro da equipe") {
		return res.status(403).json({
			message:
				"Acesso negado. Membros da equipe não podem modificar integrantes do projeto.",
		});
	}

	const project_access = await resolve_project_access(user, project_id);

	if (project_access === null) {
		return res.status(404).json({
			message: "Projeto não encontrado ou o usuário não tem acesso ao projeto.",
		});
	}

	const target_user = await user_models.get_user_by_id(target_user_id);

	if (target_user === null) {
		return res.status(404).json({
			message: "Usuário informado não encontrado.",
			errorAt: "user_id",
		});
	}

	const already_linked = await models.is_user_in_project(
		target_user_id,
		project_id,
	);

	if (already_linked) {
		return res.status(409).json({
			message: "O usuário já está vinculado a este projeto.",
			errorAt: "user_id",
		});
	}

	const link = await models.add_user_to_project(project_id, target_user_id);

	return res.status(201).json({
		message: "Usuário vinculado ao projeto com sucesso.",
		member: {
			...link,
			user: target_user,
		},
	});
};

// O============================================================================================O

export default {
	get_user_projects,
	get_project,
	get_project_tasks,
	get_project_members,
	get_project_member_details,
	register_new_project,
	add_project_member,
};

// O============================================================================================O
