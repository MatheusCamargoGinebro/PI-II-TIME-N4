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

// O============================================================================================O

const get_user_project = async (user_id: number, project_id: number) => {
	const query = `
    SELECT
        p.project_id,
        p.title AS project_name,
        
        COUNT(t.task_id) AS total_tasks,
        
        SUM(CASE WHEN t.status = 'ABERTA' THEN 1 ELSE 0 END) AS abertas,
        SUM(CASE WHEN t.status = 'EM ANDAMENTO' THEN 1 ELSE 0 END) AS em_andamento,
        SUM(CASE WHEN t.status = 'EM REVISAO' THEN 1 ELSE 0 END) AS em_revisao,
        SUM(CASE WHEN t.status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS concluidas,
        SUM(CASE WHEN t.status = 'CANCELADA' THEN 1 ELSE 0 END) AS canceladas

    FROM project_user pu

    INNER JOIN project p
        ON p.project_id = pu.fk_project_id

    LEFT JOIN task t
        ON t.fk_project_id = p.project_id

    WHERE pu.fk_project_id = ?
      AND pu.fk_user_id = ?

    GROUP BY p.project_id, p.title;
`;
	const [result] = await connection.query(query, [project_id, user_id]);

	if (Array.isArray(result) && result.length > 0) {
		return result;
	} else {
		return null;
	}
};
// O============================================================================================O

const get_project_task_list = async (project_id: number) => {
	const query = `
    SELECT
        t.task_id,
        t.title AS task_name,
        t.priority,
        t.status,
        t.creation_date,
        t.due_date,

        u.user_id,
        u.name AS responsible_user_name,
        u.profile_pic

    FROM task t

    INNER JOIN user u
        ON u.user_id = t.fk_user_id

    WHERE t.fk_project_id = ?

    ORDER BY
        t.creation_date DESC;
`;
	const [result] = await connection.execute(query, [project_id]);

	if (Array.isArray(result) && result.length > 0) {
		return result;
	} else {
		return null;
	}
};

// O============================================================================================O

export default {
	get_projects_by_user_id,
	get_user_project,
	get_project_task_list,
};

// O============================================================================================O
