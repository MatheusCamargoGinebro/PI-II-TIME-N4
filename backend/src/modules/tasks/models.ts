
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
        return [];
    }
};

// O============================================================================================O

const create_task = async (
    title: string,
    description: string,
    priority: string,
    status: string,
    due_date: string,
    project_id: number,
    responsible_id: number,
    creator_id: number
) => {
    const query = `
        INSERT INTO task (
            title,
            description,
            priority,
            status,
            due_date,
            fk_project_id,
            fk_user_id,
            fk_creator_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const [result] = await connection.execute(query, [
        title,
        description,
        priority,
        status,
        due_date,
        project_id,
        responsible_id,
        creator_id
    ]);

    return result;
};

// O============================================================================================O

const get_project_members = async (
    project_id: number,
    user_id: number
) => {
    const query = `
        SELECT
            u.user_id,
            u.name
        FROM project_user pu
        INNER JOIN user u
            ON u.user_id = pu.fk_user_id
        WHERE
            pu.fk_project_id = ?
            AND EXISTS (
                SELECT 1
                FROM project_user pu2
                WHERE
                    pu2.fk_project_id = pu.fk_project_id
                    AND pu2.fk_user_id = ?
            )
        ORDER BY u.name;
    `;

    const [result] = await connection.execute(query, [
        project_id,
        user_id
    ]);

    return result;
};

// O============================================================================================O

export default {
    get_tasks_by_user_id,
    create_task,
    get_project_members,
};

// O============================================================================================O
