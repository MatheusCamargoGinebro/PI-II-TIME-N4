// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    connection.ts -> Arquivo responsável por criar e exportar o pool de conexões com o banco de dados MySQL;
*/

// O============================================================================================O

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Cria o pool de conexões reutilizáveis com o banco de dados MySQL configurado no .env
const connection = mysql.createPool({
	host: process.env.MYSQL_HOST,
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	database: process.env.MYSQL_DATABASE,
	port: Number(process.env.MYSQL_PORT) || 3306,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

export default connection;

// O============================================================================================O
