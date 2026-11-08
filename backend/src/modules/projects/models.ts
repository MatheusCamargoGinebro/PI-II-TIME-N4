// O============================================================================================O

/* 
    Autor: Matheus Camargo Ginebro
    models.ts -> Arquivo responsável por se comunicar com o banco de dados;
*/

// O============================================================================================O

import connection from "../../services/connection";

// O============================================================================================O

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
            p.title;
    `;

	const [result] = await connection.execute(query, [user_id]);

	if (Array.isArray(result) && result.length > 0) {
		return result;
	} else {
		return null;
	}
};

export default { get_projects_by_user_id };

// O============================================================================================O
