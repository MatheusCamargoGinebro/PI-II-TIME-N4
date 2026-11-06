// O============================================================================================O

/* 
    Autor: Matheus Camargo Ginebro
    controllers.ts -> Arquivo responsável pela lógica de controle da API;
*/

// O============================================================================================O

import { Request, Response } from "express";
import models from "./models";

const get_notifications = async (__req: Request, res: Response) => {
	/* -------------------------------------------------- */

	const user_id = await res.locals.user_id;

	/* -------------------------------------------------- */

	const notifications = await models.get_notifications_by_user_id(user_id);

	if (notifications.length === 0) {
		return res.status(404).json({
			message: "Nenhuma notificação encontrada para o usuário.",
		});
	}

	/* -------------------------------------------------- */

	return res.status(200).json({
		message: "Notificações encontradas com sucesso.",
		notifications,
	});
};

// O============================================================================================O

export default { get_notifications };
