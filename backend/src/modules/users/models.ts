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

export default { get_user_by_email };
