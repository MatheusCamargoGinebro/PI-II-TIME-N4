// O============================================================================================O

/* 
    Autor: Matheus Camargo Ginebro
    models.ts -> Arquivo responsável por se comunicar com o banco de dados;
*/

// O============================================================================================O

import connection from "../../services/connection";

// O============================================================================================O

const get_tasks_by_user_id = async (user_id: number) => {
	const query = `
        SELECT t.*, p.project_id,
        p.title AS project_title,
        u_creator.user_id AS creator_id,
        u_creator.name AS creator_name,
        u_creator.email AS creator_email,
        u_creator.profile_pic AS creator_profile_pic,
        u_responsible.user_id AS responsible_id,
        u_responsible.name AS responsible_name,
        u_responsible.email AS responsible_email,
        u_responsible.profile_pic AS responsible_profile_pic

        FROM task t
        INNER JOIN project p
            ON p.project_id = t.fk_project_id
        INNER JOIN user u_creator
            ON u_creator.user_id = t.fk_creator_id
        INNER JOIN user u_responsible
            ON u_responsible.user_id = t.fk_user_id
        WHERE
            t.fk_user_id = ?
            OR t.fk_creator_id = ?
        ORDER BY t.creation_date DESC;`;
	const [result] = await connection.execute(query, [user_id, user_id]);

	if (Array.isArray(result) && result.length > 0) {
		return result;
	} else {
		return null;
	}
};

// O============================================================================================O

export default {
	get_tasks_by_user_id,
};

// O============================================================================================O
