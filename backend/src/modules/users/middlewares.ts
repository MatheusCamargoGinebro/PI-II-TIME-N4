
import { Request, Response, NextFunction } from "express";

import JWT from "jsonwebtoken";

import user_models from "./models";

// O============================================================================================O

const user_email = (req: Request, res: Response, next: NextFunction) => {
    const { user_email } = req.body;

    if (!user_email) {
        return res.status(400).json({
            message: "Email não fornecido no corpo da requisição.",
            errorAt: "user_email",
        });
    }

    if (typeof user_email !== "string") {
        return res.status(400).json({
            message: "Email fornecido não é uma string.",
            errorAt: "user_email",
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user_email)) {
        return res.status(400).json({
            message: "Email fornecido não é válido.",
            errorAt: "user_email",
        });
    }

    return next();
};

// O============================================================================================O

const user_password = (req: Request, res: Response, next: NextFunction) => {
    const { user_password } = req.body;

    if (!user_password) {
        return res.status(400).json({
            message: "Senha não fornecida no corpo da requisição.",
            errorAt: "user_password",
        });
    }

    if (typeof user_password !== "string") {
        return res.status(400).json({
            message: "Senha fornecida não é uma string.",
            errorAt: "user_password",
        });
    }

    return next();
};

// O============================================================================================O

const user_name = (req: Request, res: Response, next: NextFunction) => {
    const { user_name } = req.body;

    if (!user_name) {
        return res.status(400).json({
            message: "Nome não fornecido no corpo da requisição.",
            errorAt: "user_name",
        });
    }

    if (typeof user_name !== "string") {
        return res.status(400).json({
            message: "Nome fornecido não é uma string.",
            errorAt: "user_name",
        });
    }

    return next();
};

// O============================================================================================O

const user_id = (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({
            message: "ID de usuário não fornecido no corpo da requisição.",
            errorAt: "user_id",
        });
    }

    if (typeof user_id !== "number") {
        return res.status(400).json({
            message: "ID de usuário fornecido não é um número.",
            errorAt: "user_id",
        });
    }

    return next();
};

// O============================================================================================O

const user_token = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers["x-access-token"] as string;

    if (!token) {
        return res.status(401).json({
            message: "Token não fornecido no cabeçalho da requisição.",
            errorAt: "x-access-token",
        });
    }

    if (token.trim().length === 0) {
        return res.status(401).json({
            message: "Token fornecido não é válido.",
            errorAt: "x-access-token",
        });
    }

    let decoded: {
        user_id: number;
        user_email: string;
    };

    try {
        decoded = JWT.verify(
            token,
            process.env.JWT_SECRET as string
        ) as {
            user_id: number;
            user_email: string;
        };
    } catch (error) {
        return res.status(401).json({
            message: "Token fornecido é inválido ou expirou.",
            errorAt: "x-access-token",
            error,
        });
    }

    try {
        const user = await user_models.get_user_by_id(decoded.user_id);

        if (!user) {
            return res.status(404).json({
                message: "Usuário não encontrado.",
                errorAt: "x-access-token",
            });
        }

        res.locals.user = user;
        res.locals.user_id = decoded.user_id;

        return next();
    } catch (error) {
        return res.status(500).json({
            message: "Erro ao consultar o usuário.",
            error,
        });
    }
};

// O============================================================================================O

export default { user_email, user_password, user_name, user_id, user_token };

// O============================================================================================O
