-- Autor: Matheus Camargo Ginebro
-- Script de criação do banco de dados TaskOps (MySQL)
DROP DATABASE IF EXISTS TaskOps;

CREATE DATABASE IF NOT EXISTS TaskOps DEFAULT CHARACTER SET utf8mb4;

USE TaskOps;

-- Tabela de usuários e perfis de acesso
CREATE TABLE IF NOT EXISTS
    user(
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(256) NOT NULL UNIQUE,
        email VARCHAR(256) NOT NULL UNIQUE,
        password CHAR(60) NOT NULL,
        profile_pic LONGTEXT NULL,
        authority_level ENUM(
            'Administrador',
            'Lider de projeto',
            'Membro da equipe'
        ) NOT NULL DEFAULT 'Membro da equipe'
    );

-- Tabela de projetos
CREATE TABLE IF NOT EXISTS
    project (
        project_id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(256) NOT NULL
    );

-- Tabela associativa entre projetos e usuários vinculados
CREATE TABLE IF NOT EXISTS
    project_user (
        fk_project_id INT NOT NULL,
        fk_user_id INT NOT NULL,
        PRIMARY KEY (fk_project_id, fk_user_id),
        FOREIGN KEY (fk_project_id) REFERENCES project (project_id) ON DELETE RESTRICT,
        FOREIGN KEY (fk_user_id) REFERENCES user(user_id) ON DELETE RESTRICT
    );

-- Tabela principal de demandas (tasks)
CREATE TABLE IF NOT EXISTS
    task (
        task_id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(256) NOT NULL,
        description TEXT NOT NULL,
        type ENUM('TAREFA', 'DEFEITO', 'MELHORIA', 'DOCUMENTACAO') NOT NULL,
        priority ENUM('BAIXA', 'MEDIA', 'ALTA', 'CRITICA') NOT NULL,
        status ENUM(
            'ABERTA',
            'EM ANDAMENTO',
            'EM REVISAO',
            'CONCLUIDA',
            'CANCELADA'
        ) NOT NULL DEFAULT 'ABERTA',
        creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        due_date TIMESTAMP NULL DEFAULT NULL,
        fk_project_id INT NOT NULL,
        fk_user_id INT NULL,
        fk_creator_id INT NOT NULL,
        FOREIGN KEY (fk_project_id) REFERENCES project (project_id) ON DELETE RESTRICT,
        FOREIGN KEY (fk_user_id) REFERENCES user(user_id) ON DELETE RESTRICT,
        FOREIGN KEY (fk_creator_id) REFERENCES user(user_id) ON DELETE RESTRICT
    );

-- Tabela de comentários vinculados a demandas e usuários
CREATE TABLE IF NOT EXISTS
    comment (
        comment_id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fk_task_id INT NOT NULL,
        fk_user_id INT NOT NULL,
        FOREIGN KEY (fk_task_id) REFERENCES task (task_id) ON DELETE RESTRICT,
        FOREIGN KEY (fk_user_id) REFERENCES user(user_id) ON DELETE RESTRICT
    );

-- Tabela de histórico de alterações relevantes das demandas
CREATE TABLE IF NOT EXISTS
    history (
        history_id INT AUTO_INCREMENT PRIMARY KEY,
        date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        old_value TEXT NULL,
        new_value TEXT NOT NULL,
        field_name VARCHAR(256) NOT NULL,
        fk_task_id INT NOT NULL,
        fk_user_id INT NOT NULL,
        FOREIGN KEY (fk_task_id) REFERENCES task (task_id) ON DELETE RESTRICT,
        FOREIGN KEY (fk_user_id) REFERENCES user(user_id) ON DELETE RESTRICT
    );