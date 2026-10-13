/* 
    Autor: Matheus Camargo Ginebro
    router.ts -> Arquivo responsável por definir as rotas da API;
*/

import express, { Request, Response } from "express";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
	res.status(200).json({ message: "API is running." });
});

export default router;
