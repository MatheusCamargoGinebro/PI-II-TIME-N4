-- =====================================================================
-- TaskOps - Schema corrigido + carga de dados para testes
-- Requer MySQL 8.0+ (usa CTE recursiva e hints de otimizador)
-- Volume final aproximado:
--   user ~50 | project 15 | project_user ~125 | task ~500
--   comment ~700 | access_request ~35 | history ~300
-- =====================================================================
DROP DATABASE IF EXISTS TaskOps;

CREATE DATABASE IF NOT EXISTS TaskOps DEFAULT CHARACTER SET utf8mb4;

USE TaskOps;

SET NAMES utf8mb4;

-- =====================================================================
-- SCHEMA
-- =====================================================================
CREATE TABLE IF NOT EXISTS
    user(
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(256) NOT NULL,
        email VARCHAR(256) NOT NULL UNIQUE,
        password CHAR(60) NOT NULL,
        profile_pic LONGTEXT,
        authority_level ENUM(
            'Administrador',
            'Lider de projeto',
            'Membro de projeto'
        )
    );

CREATE TABLE IF NOT EXISTS
    project (
        project_id INT AUTO_INCREMENT PRIMARY KEY,
        TITLE VARCHAR(256) NOT NULL
    );

CREATE TABLE IF NOT EXISTS
    project_user (
        fk_project_id INT NOT NULL,
        fk_user_id INT NOT NULL,
        PRIMARY KEY (fk_project_id, fk_user_id),
        FOREIGN KEY (fk_project_id) REFERENCES project (project_id) ON DELETE CASCADE,
        FOREIGN KEY (fk_user_id) REFERENCES user(user_id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS
    task (
        task_id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(256) NOT NULL,
        description TEXT NOT NULL,
        priority ENUM('BAIXA', 'MEDIA', 'ALTA', 'CRITICA'),
        creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date TIMESTAMP NOT NULL,
        fk_project_id INT NOT NULL,
        fk_user_id INT NOT NULL,
        FOREIGN KEY (fk_project_id) REFERENCES project (project_id) ON DELETE CASCADE,
        FOREIGN KEY (fk_user_id) REFERENCES user(user_id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS
    comment (
        comment_id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fk_task_id INT NOT NULL,
        fk_user_id INT NOT NULL,
        FOREIGN KEY (fk_task_id) REFERENCES task (task_id) ON DELETE CASCADE,
        FOREIGN KEY (fk_user_id) REFERENCES user(user_id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS
    access_request (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fk_project_id INT NOT NULL,
        fk_user_id INT NOT NULL,
        FOREIGN KEY (fk_project_id) REFERENCES project (project_id) ON DELETE CASCADE,
        FOREIGN KEY (fk_user_id) REFERENCES user(user_id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS
    history (
        history_id INT AUTO_INCREMENT PRIMARY KEY,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        old_value TEXT NOT NULL,
        new_value TEXT NOT NULL,
        field_name VARCHAR(256) NOT NULL,
        fk_task_id INT NOT NULL,
        fk_user_id INT NOT NULL,
        FOREIGN KEY (fk_task_id) REFERENCES task (task_id) ON DELETE CASCADE,
        FOREIGN KEY (fk_user_id) REFERENCES user(user_id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS
    mail_code_validation (
        mail_code_id INT AUTO_INCREMENT PRIMARY KEY,
        code CHAR(5) NOT NULL,
        status ENUM('PENDING', 'USED') NOT NULL DEFAULT 'PENDING',
        creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expiration_date TIMESTAMP NOT NULL,
        reason ENUM('REGISTER', 'RESET_PASSWORD', 'CHANGE_EMAIL') NOT NULL
    );