/* 
    Autor: Matheus Camargo Ginebro
    server.ts -> Arquivo responsável por configurar a API;
*/

import express, { Request, Response } from "express";

const app = express();
import cors from "cors";
import router from "./router";

app.use(
	cors({
		origin: "*",
	}),
	express.json({ limit: "50mb" }),
	express.urlencoded({ limit: "50mb", extended: true }),
);

app.use((req: Request, res: Response, next) => {
	const methods_requiring_body = ["POST", "PUT", "PATCH"];

	if (
		methods_requiring_body.includes(req.method) &&
		!req.body &&
		req.path !== "/users/logout"
	) {
		return res.status(400).json({ error: "Request body is required." });
	}

	return next();
});

app.use(router);

export default app;
