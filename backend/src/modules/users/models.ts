// O============================================================================================O

/* 
    Autor: Matheus Camargo Ginebro
    models.ts -> Arquivo responsável por se comunicar com o banco de dados;
*/

// O============================================================================================O

import connection from "../../services/connection";

const get_user_by_email = async (user_email: string) => {
	const query = "SELECT * FROM user WHERE email = ?";
	const [result] = await connection.execute(query, [user_email]);

	if (Array.isArray(result) && result.length > 0) {
		return result[0];
	} else {
		return null;
	}
};

// O============================================================================================O

const get_user_by_name = async (user_name: string) => {
	const query = "SELECT * FROM user WHERE name = ?";
	const [result] = await connection.execute(query, [user_name]);

	if (Array.isArray(result) && result.length > 0) {
		return result[0];
	} else {
		return null;
	}
};

// O============================================================================================O

const register_user = async (
	user_name: string,
	user_email: string,
	user_password: string,
) => {
	const query = "INSERT INTO user (name, email, password) VALUES (?, ?, ?)";
	const [result] = await connection.execute(query, [
		user_name,
		user_email,
		user_password,
	]);

	if (Array.isArray(result) && result.length > 0) {
		return result[0];
	}
};

// O============================================================================================O

const get_user_by_id = async (user_id: number) => {
	const query =
		"SELECT name, email, profile_pic, authority_level FROM user WHERE user_id = ?";
	const [result] = await connection.execute(query, [user_id]);

	if (Array.isArray(result) && result.length > 0) {
		return result[0];
	} else {
		return null;
	}
};

// O============================================================================================O

export default {
	get_user_by_email,
	get_user_by_name,
	register_user,
	get_user_by_id,
};
