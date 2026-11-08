/* 
    Autor: Matheus Camargo Ginebro
    router.ts -> Arquivo responsável por centralizar as rotas da API;
*/

import express, { Request, Response } from "express";
import user_routes from "../modules/users/routes";
import project_routes from "../modules/projects/routes";
import task_routes from "../modules/tasks/routes";
import notifications_routes from "../modules/notifications/routes";

import user_middlewares from "../modules/users/middlewares";

const router = express.Router();

router.get("/", (__req: Request, res: Response) => {
	res.status(200).json({ message: "API is running." });
});

router.use("/users", user_routes);
router.use("/projects", user_middlewares.user_token, project_routes);
router.use("/tasks", user_middlewares.user_token, task_routes);
router.use("/notifications", user_middlewares.user_token, notifications_routes);

export default router;
