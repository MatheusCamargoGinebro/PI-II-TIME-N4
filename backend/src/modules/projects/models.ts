// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    models.ts -> Arquivo responsável pela comunicação do módulo de projetos com o banco de dados MySQL;
*/

// O============================================================================================O

import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import connection from "../../services/connection";

// O============================================================================================O

// Lista todos os projetos do sistema com totalizadores (visão do Administrador)
const get_all_projects = async () => {
	const query = `
		SELECT
			p.project_id,
			p.title,
			COUNT(DISTINCT t.task_id) AS total_tasks,
			COUNT(
				DISTINCT CASE
					WHEN t.status = 'CONCLUIDA'
					THEN t.task_id
				END
			) AS completed_tasks,
			COUNT(DISTINCT pu_members.fk_user_id) AS total_members,
			COALESCE(
				ROUND(
					(
						COUNT(
							DISTINCT CASE
								WHEN t.status = 'CONCLUIDA'
								THEN t.task_id
							END
						) * 100.0
					) / NULLIF(COUNT(DISTINCT t.task_id), 0),
					2
				),
				0
			) AS progress_percentage
		FROM project p
		LEFT JOIN task t
			ON t.fk_project_id = p.project_id
		LEFT JOIN project_user pu_members
			ON pu_members.fk_project_id = p.project_id
		GROUP BY
			p.project_id,
			p.title
		ORDER BY p.project_id ASC;
	`;

	const [result] = await connection.execute<RowDataPacket[]>(query);

	return Array.isArray(result) ? result : [];
};

// O============================================================================================O

// Lista os projetos vinculados a um usuário específico com totalizadores
const get_projects_by_user_id = async (user_id: number) => {
	const query = `
		SELECT
			p.project_id,
			p.title,
			COUNT(DISTINCT t.task_id) AS total_tasks,
			COUNT(
				DISTINCT CASE
					WHEN t.status = 'CONCLUIDA'
					THEN t.task_id
				END
			) AS completed_tasks,
			COUNT(DISTINCT pu_members.fk_user_id) AS total_members,
			COALESCE(
				ROUND(
					(
						COUNT(
							DISTINCT CASE
								WHEN t.status = 'CONCLUIDA'
								THEN t.task_id
							END
						) * 100.0
					) / NULLIF(COUNT(DISTINCT t.task_id), 0),
					2
				),
				0
			) AS progress_percentage
		FROM project p
		INNER JOIN project_user pu_filter
			ON pu_filter.fk_project_id = p.project_id
		LEFT JOIN task t
			ON t.fk_project_id = p.project_id
		LEFT JOIN project_user pu_members
			ON pu_members.fk_project_id = p.project_id
		WHERE pu_filter.fk_user_id = ?
		GROUP BY
			p.project_id,
			p.title
		ORDER BY p.project_id ASC;
	`;

	const [result] = await connection.execute<RowDataPacket[]>(query, [user_id]);

	return Array.isArray(result) ? result : [];
};

// O============================================================================================O

// Obtém os detalhes e totalizadores de qualquer projeto pelo ID (visão do Administrador)
const get_project_by_id = async (project_id: number) => {
	const query = `
		SELECT
			p.project_id,
			p.title AS project_name,
			COUNT(t.task_id) AS total_tasks,
			COALESCE(SUM(CASE WHEN t.status = 'ABERTA' THEN 1 ELSE 0 END), 0) AS abertas,
			COALESCE(SUM(CASE WHEN t.status = 'EM ANDAMENTO' THEN 1 ELSE 0 END), 0) AS em_andamento,
			COALESCE(SUM(CASE WHEN t.status = 'EM REVISAO' THEN 1 ELSE 0 END), 0) AS em_revisao,
			COALESCE(SUM(CASE WHEN t.status = 'CONCLUIDA' THEN 1 ELSE 0 END), 0) AS concluidas,
			COALESCE(SUM(CASE WHEN t.status = 'CANCELADA' THEN 1 ELSE 0 END), 0) AS canceladas
		FROM project p
		LEFT JOIN task t
			ON t.fk_project_id = p.project_id
		WHERE p.project_id = ?
		GROUP BY p.project_id, p.title;
	`;

	const [result] = await connection.execute<RowDataPacket[]>(query, [
		project_id,
	]);

	if (Array.isArray(result) && result.length > 0) {
		return result[0];
	}

	return null;
};

// O============================================================================================O

// Obtém os detalhes de um projeto verificando o vínculo do usuário em project_user
const get_user_project = async (user_id: number, project_id: number) => {
	const query = `
		SELECT
			p.project_id,
			p.title AS project_name,
			COUNT(t.task_id) AS total_tasks,
			COALESCE(SUM(CASE WHEN t.status = 'ABERTA' THEN 1 ELSE 0 END), 0) AS abertas,
			COALESCE(SUM(CASE WHEN t.status = 'EM ANDAMENTO' THEN 1 ELSE 0 END), 0) AS em_andamento,
			COALESCE(SUM(CASE WHEN t.status = 'EM REVISAO' THEN 1 ELSE 0 END), 0) AS em_revisao,
			COALESCE(SUM(CASE WHEN t.status = 'CONCLUIDA' THEN 1 ELSE 0 END), 0) AS concluidas,
			COALESCE(SUM(CASE WHEN t.status = 'CANCELADA' THEN 1 ELSE 0 END), 0) AS canceladas
		FROM project_user pu
		INNER JOIN project p
			ON p.project_id = pu.fk_project_id
		LEFT JOIN task t
			ON t.fk_project_id = p.project_id
		WHERE pu.fk_project_id = ?
			AND pu.fk_user_id = ?
		GROUP BY p.project_id, p.title;
	`;

	const [result] = await connection.execute<RowDataPacket[]>(query, [
		project_id,
		user_id,
	]);

	if (Array.isArray(result) && result.length > 0) {
		return result[0];
	}

	return null;
};

// O============================================================================================O

// Verifica se um usuário específico está vinculado a um projeto
const is_user_in_project = async (
	user_id: number,
	project_id: number,
): Promise<boolean> => {
	const query =
		"SELECT 1 FROM project_user WHERE fk_project_id = ? AND fk_user_id = ? LIMIT 1";
	const [result] = await connection.execute<RowDataPacket[]>(query, [
		project_id,
		user_id,
	]);

	return Array.isArray(result) && result.length > 0;
};

// O============================================================================================O

// Lista todas as demandas de um projeto usando LEFT JOIN para incluir demandas sem responsável
const get_project_task_list = async (project_id: number) => {
	const query = `
		SELECT
			t.task_id,
			t.title AS task_name,
			t.title,
			t.description,
			t.type,
			t.priority,
			t.status,
			t.creation_date,
			t.updated_at,
			t.due_date,
			t.fk_project_id,
			t.fk_user_id,
			t.fk_creator_id,
			u.user_id,
			u.name AS responsible_user_name,
			u.profile_pic
		FROM task t
		LEFT JOIN user u
			ON u.user_id = t.fk_user_id
		WHERE t.fk_project_id = ?
		ORDER BY t.creation_date DESC;
	`;

	const [result] = await connection.execute<RowDataPacket[]>(query, [
		project_id,
	]);

	return Array.isArray(result) ? result : [];
};

// O============================================================================================O

// Lista todos os membros vinculados a um projeto com contagem de tarefas atribuídas e concluídas
const get_users_project = async (project_id: number) => {
	const query = `
		SELECT
			u.user_id AS member_id,
			u.name AS member_name,
			u.email AS member_email,
			u.authority_level AS access_level,
			u.profile_pic,
			COUNT(
				CASE
					WHEN t.status = 'CONCLUIDA' THEN 1
				END
			) AS completed_tasks,
			COUNT(t.task_id) AS total_tasks
		FROM project_user pu
		INNER JOIN user u
			ON u.user_id = pu.fk_user_id
		LEFT JOIN task t
			ON t.fk_user_id = u.user_id
			AND t.fk_project_id = pu.fk_project_id
		WHERE pu.fk_project_id = ?
		GROUP BY
			u.user_id,
			u.name,
			u.email,
			u.authority_level,
			u.profile_pic
		ORDER BY u.name ASC;
	`;

	const [result] = await connection.execute<RowDataPacket[]>(query, [
		project_id,
	]);

	return Array.isArray(result) ? result : [];
};

// O============================================================================================O

// Lista as demandas atribuídas a um membro específico dentro de um projeto
const get_member_details = async (user_id: number, project_id: number) => {
	const query = `
		SELECT
			t.task_id,
			t.title AS task_title,
			t.type,
			t.due_date,
			t.priority,
			t.status
		FROM task t
		WHERE t.fk_user_id = ?
			AND t.fk_project_id = ?
		ORDER BY t.due_date IS NULL ASC, t.due_date ASC;
	`;

	const [result] = await connection.execute<RowDataPacket[]>(query, [
		user_id,
		project_id,
	]);

	return Array.isArray(result) ? result : [];
};

// O============================================================================================O

// Cadastra um novo projeto e vincula o criador na tabela associativa project_user
const register_project = async (user_id: number, project_title: string) => {
	const [projectResult] = await connection.execute<ResultSetHeader>(
		`
		INSERT INTO project (title)
		VALUES (?)
		`,
		[project_title],
	);

	const project_id = projectResult.insertId;

	await connection.execute<ResultSetHeader>(
		`
		INSERT INTO project_user (
			fk_project_id,
			fk_user_id
		)
		VALUES (?, ?)
		`,
		[project_id, user_id],
	);

	return {
		project_id,
		title: project_title,
	};
};

// O============================================================================================O

// Vincula um usuário existente a um projeto na tabela project_user
const add_user_to_project = async (project_id: number, user_id: number) => {
	await connection.execute<ResultSetHeader>(
		`
		INSERT INTO project_user (
			fk_project_id,
			fk_user_id
		)
		VALUES (?, ?)
		`,
		[project_id, user_id],
	);

	return {
		fk_project_id: project_id,
		fk_user_id: user_id,
	};
};

// O============================================================================================O

export default {
	get_all_projects,
	get_projects_by_user_id,
	get_project_by_id,
	get_user_project,
	is_user_in_project,
	get_project_task_list,
	get_users_project,
	get_member_details,
	register_project,
	add_user_to_project,
};

// O============================================================================================O
