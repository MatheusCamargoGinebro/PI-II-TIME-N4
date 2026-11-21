// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    models.ts -> Arquivo responsável pela comunicação do módulo de usuários com o banco de dados MySQL;
*/

// O============================================================================================O

import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import connection from "../../services/connection";

export type AuthorityLevel =
	| "Administrador"
	| "Lider de projeto"
	| "Membro da equipe";

export interface PublicUser {
	user_id: number;
	name: string;
	email: string;
	profile_pic: string | null;
	authority_level: AuthorityLevel;
}

export interface UserRecord extends PublicUser {
	password: string;
}

// O============================================================================================O

// Busca um usuário completo (incluindo hash de senha) pelo e-mail para autenticação e validação
const get_user_by_email = async (
	user_email: string,
): Promise<UserRecord | null> => {
	const query = "SELECT * FROM user WHERE email = ?";
	const [result] = await connection.execute<RowDataPacket[]>(query, [
		user_email,
	]);

	if (Array.isArray(result) && result.length > 0) {
		return result[0] as UserRecord;
	}

	return null;
};

// O============================================================================================O

// Busca um usuário pelo nome para garantir unicidade no cadastro
const get_user_by_name = async (
	user_name: string,
): Promise<UserRecord | null> => {
	const query = "SELECT * FROM user WHERE name = ?";
	const [result] = await connection.execute<RowDataPacket[]>(query, [
		user_name,
	]);

	if (Array.isArray(result) && result.length > 0) {
		return result[0] as UserRecord;
	}

	return null;
};

// O============================================================================================O

// Insere um novo usuário no banco e retorna seus dados públicos com o ID gerado
const register_user = async (
	user_name: string,
	user_email: string,
	user_password: string,
): Promise<PublicUser> => {
	const query = "INSERT INTO user (name, email, password) VALUES (?, ?, ?)";
	const [result] = await connection.execute<ResultSetHeader>(query, [
		user_name,
		user_email,
		user_password,
	]);

	return {
		user_id: result.insertId,
		name: user_name,
		email: user_email,
		profile_pic: null,
		authority_level: "Membro da equipe",
	};
};

// O============================================================================================O

// Busca os dados públicos de um usuário pelo seu identificador único
const get_user_by_id = async (user_id: number): Promise<PublicUser | null> => {
	const query =
		"SELECT user_id, name, email, profile_pic, authority_level FROM user WHERE user_id = ?";
	const [result] = await connection.execute<RowDataPacket[]>(query, [user_id]);

	if (Array.isArray(result) && result.length > 0) {
		return result[0] as PublicUser;
	}

	return null;
};

// O============================================================================================O

// Lista todos os usuários cadastrados no sistema (uso exclusivo do Administrador)
const get_all_users = async (): Promise<PublicUser[]> => {
	const query =
		"SELECT user_id, name, email, profile_pic, authority_level FROM user ORDER BY name ASC";
	const [result] = await connection.execute<RowDataPacket[]>(query);

	return Array.isArray(result) ? (result as PublicUser[]) : [];
};

// O============================================================================================O

export default {
	get_user_by_email,
	get_user_by_name,
	register_user,
	get_user_by_id,
	get_all_users,
};

// O============================================================================================O
