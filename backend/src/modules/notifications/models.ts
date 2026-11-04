// O============================================================================================O

/* 
    Autor: Matheus Camargo Ginebro
    models.ts -> Arquivo responsável por se comunicar com o banco de dados;
*/

// O============================================================================================O

import connection from "../../services/connection";

// O============================================================================================O

const get_notifications_by_user_id = async (user_id: number) => {
	const query = "SELECT * FROM notification WHERE fk_user_id = ?";
	const [result] = await connection.execute(query, [user_id]);

	if (Array.isArray(result) && result.length > 0) {
		return result[0];
	} else {
		return null;
	}
};

// O============================================================================================O

export default { get_notifications_by_user_id };

// O============================================================================================O
