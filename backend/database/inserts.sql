USE TaskOps;

-- ==========================================
-- 1. USUÁRIOS (12 registros)
-- Senha: 60 caracteres A
-- ==========================================
/* 
Hash da senha "PassW0rd@123" -> "$2a$12$C7JSoS2S5/dpM/Hf3m.p3O8jHtQZjutGT6ypkbTvwzwfFJnhhRCRy"
 */
INSERT INTO
    `user` (
        user_id,
        name,
        email,
        password,
        profile_pic,
        authority_level
    )
VALUES
    (
        1,
        'Carlos Henrique',
        'carlos@taskops.com',
        '$2a$12$C7JSoS2S5/dpM/Hf3m.p3O8jHtQZjutGT6ypkbTvwzwfFJnhhRCRy',
        NULL,
        'Administrador'
    ),
    (
        2,
        'Mariana Oliveira',
        'mariana@taskops.com',
        '$2a$12$C7JSoS2S5/dpM/Hf3m.p3O8jHtQZjutGT6ypkbTvwzwfFJnhhRCRy',
        NULL,
        'Lider de projeto'
    ),
    (
        3,
        'Rafael Santos',
        'rafael@taskops.com',
        '$2a$12$C7JSoS2S5/dpM/Hf3m.p3O8jHtQZjutGT6ypkbTvwzwfFJnhhRCRy',
        NULL,
        'Lider de projeto'
    ),
    (
        4,
        'Ana Beatriz',
        'ana@taskops.com',
        '$2a$12$C7JSoS2S5/dpM/Hf3m.p3O8jHtQZjutGT6ypkbTvwzwfFJnhhRCRy',
        NULL,
        'Lider de projeto'
    ),
    (
        5,
        'Lucas Ferreira',
        'lucas@taskops.com',
        '$2a$12$C7JSoS2S5/dpM/Hf3m.p3O8jHtQZjutGT6ypkbTvwzwfFJnhhRCRy',
        NULL,
        'Lider de projeto'
    ),
    (
        6,
        'Juliana Costa',
        'juliana@taskops.com',
        '$2a$12$C7JSoS2S5/dpM/Hf3m.p3O8jHtQZjutGT6ypkbTvwzwfFJnhhRCRy',
        NULL,
        'Lider de projeto'
    ),
    (
        7,
        'Pedro Almeida',
        'pedro@taskops.com',
        '$2a$12$C7JSoS2S5/dpM/Hf3m.p3O8jHtQZjutGT6ypkbTvwzwfFJnhhRCRy',
        NULL,
        'Membro de projeto'
    ),
    (
        8,
        'Gabriela Souza',
        'gabriela@taskops.com',
        '$2a$12$C7JSoS2S5/dpM/Hf3m.p3O8jHtQZjutGT6ypkbTvwzwfFJnhhRCRy',
        NULL,
        'Membro de projeto'
    ),
    (
        9,
        'Felipe Rodrigues',
        'felipe@taskops.com',
        '$2a$12$C7JSoS2S5/dpM/Hf3m.p3O8jHtQZjutGT6ypkbTvwzwfFJnhhRCRy',
        NULL,
        'Membro de projeto'
    ),
    (
        10,
        'Beatriz Lima',
        'beatriz@taskops.com',
        '$2a$12$C7JSoS2S5/dpM/Hf3m.p3O8jHtQZjutGT6ypkbTvwzwfFJnhhRCRy',
        NULL,
        'Membro de projeto'
    ),
    (
        11,
        'Thiago Martins',
        'thiago@taskops.com',
        '$2a$12$C7JSoS2S5/dpM/Hf3m.p3O8jHtQZjutGT6ypkbTvwzwfFJnhhRCRy',
        NULL,
        'Membro de projeto'
    ),
    (
        12,
        'Camila Ribeiro',
        'camila@taskops.com',
        '$2a$12$C7JSoS2S5/dpM/Hf3m.p3O8jHtQZjutGT6ypkbTvwzwfFJnhhRCRy',
        NULL,
        'Membro de projeto'
    );

-- ==========================================
-- 2. PROJETOS (5 registros)
-- ==========================================
INSERT INTO
    project (project_id, TITLE)
VALUES
    (1, 'TaskOps - Sistema de Gerenciamento'),
    (2, 'Desenvolvimento de Aplicativo Mobile'),
    (3, 'Portal Institucional'),
    (4, 'Sistema de Controle de Estoque'),
    (5, 'Infraestrutura e Segurança');

-- ==========================================
-- 3. USUÁRIOS DOS PROJETOS (25 registros)
-- fk_creator_id = usuário responsável por adicionar
-- ==========================================
INSERT INTO
    project_user (fk_project_id, fk_user_id, fk_creator_id)
VALUES
    -- Projeto 1
    (1, 2, 1),
    (1, 7, 2),
    (1, 8, 2),
    (1, 9, 2),
    (1, 10, 2),
    -- Projeto 2
    (2, 3, 1),
    (2, 7, 3),
    (2, 8, 3),
    (2, 11, 3),
    (2, 12, 3),
    -- Projeto 3
    (3, 4, 1),
    (3, 9, 4),
    (3, 10, 4),
    (3, 11, 4),
    (3, 12, 4),
    -- Projeto 4
    (4, 5, 1),
    (4, 7, 5),
    (4, 8, 5),
    (4, 10, 5),
    (4, 12, 5),
    -- Projeto 5
    (5, 6, 1),
    (5, 8, 6),
    (5, 9, 6),
    (5, 11, 6),
    (5, 12, 6);

-- ==========================================
-- 4. TAREFAS (25 registros)
-- ==========================================
INSERT INTO
    task (
        task_id,
        title,
        description,
        priority,
        status,
        creation_date,
        due_date,
        fk_project_id,
        fk_user_id
    )
VALUES
    -- Projeto 1
    (
        1,
        'Criar estrutura do banco de dados',
        'Desenvolver o modelo relacional e implementar as tabelas principais.',
        'ALTA',
        'CONCLUIDA',
        DATE_SUB(NOW(), INTERVAL 20 DAY),
        DATE_SUB(NOW(), INTERVAL 10 DAY),
        1,
        7
    ),
    (
        2,
        'Implementar autenticação',
        'Criar sistema de login, registro e validação de usuários.',
        'CRITICA',
        'EM ANDAMENTO',
        DATE_SUB(NOW(), INTERVAL 12 DAY),
        DATE_ADD(NOW(), INTERVAL 3 DAY),
        1,
        8
    ),
    (
        3,
        'Desenvolver gerenciamento de projetos',
        'Implementar operações de criação, edição e exclusão de projetos.',
        'ALTA',
        'EM REVISAO',
        DATE_SUB(NOW(), INTERVAL 8 DAY),
        DATE_ADD(NOW(), INTERVAL 2 DAY),
        1,
        9
    ),
    (
        4,
        'Criar sistema de notificações',
        'Implementar notificações para eventos importantes do sistema.',
        'MEDIA',
        'ABERTA',
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        DATE_ADD(NOW(), INTERVAL 12 DAY),
        1,
        10
    ),
    (
        5,
        'Corrigir falha no cadastro',
        'Investigar e corrigir erro encontrado durante o cadastro de usuários.',
        'CRITICA',
        'CANCELADA',
        DATE_SUB(NOW(), INTERVAL 15 DAY),
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        1,
        7
    ),
    -- Projeto 2
    (
        6,
        'Criar telas de autenticação',
        'Desenvolver as telas de login e registro do aplicativo.',
        'ALTA',
        'CONCLUIDA',
        DATE_SUB(NOW(), INTERVAL 25 DAY),
        DATE_SUB(NOW(), INTERVAL 15 DAY),
        2,
        7
    ),
    (
        7,
        'Implementar navegação',
        'Configurar navegação entre as telas principais.',
        'MEDIA',
        'EM ANDAMENTO',
        DATE_SUB(NOW(), INTERVAL 10 DAY),
        DATE_ADD(NOW(), INTERVAL 5 DAY),
        2,
        8
    ),
    (
        8,
        'Integrar API',
        'Conectar o aplicativo mobile aos endpoints do backend.',
        'CRITICA',
        'ABERTA',
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        DATE_ADD(NOW(), INTERVAL 15 DAY),
        2,
        11
    ),
    (
        9,
        'Implementar armazenamento local',
        'Configurar armazenamento de informações no dispositivo.',
        'MEDIA',
        'EM REVISAO',
        DATE_SUB(NOW(), INTERVAL 7 DAY),
        DATE_ADD(NOW(), INTERVAL 1 DAY),
        2,
        12
    ),
    (
        10,
        'Realizar testes de interface',
        'Executar testes de usabilidade e corrigir inconsistências visuais.',
        'BAIXA',
        'ABERTA',
        NOW(),
        DATE_ADD(NOW(), INTERVAL 20 DAY),
        2,
        8
    ),
    -- Projeto 3
    (
        11,
        'Criar layout da página inicial',
        'Desenvolver a estrutura visual da página inicial do portal.',
        'ALTA',
        'CONCLUIDA',
        DATE_SUB(NOW(), INTERVAL 30 DAY),
        DATE_SUB(NOW(), INTERVAL 20 DAY),
        3,
        9
    ),
    (
        12,
        'Desenvolver painel administrativo',
        'Criar painel para gerenciamento de conteúdo institucional.',
        'CRITICA',
        'EM ANDAMENTO',
        DATE_SUB(NOW(), INTERVAL 9 DAY),
        DATE_ADD(NOW(), INTERVAL 8 DAY),
        3,
        10
    ),
    (
        13,
        'Otimizar responsividade',
        'Adaptar as páginas para dispositivos móveis e tablets.',
        'MEDIA',
        'EM REVISAO',
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        DATE_ADD(NOW(), INTERVAL 2 DAY),
        3,
        11
    ),
    (
        14,
        'Configurar domínio',
        'Realizar configuração do domínio e hospedagem do portal.',
        'BAIXA',
        'ABERTA',
        DATE_SUB(NOW(), INTERVAL 1 DAY),
        DATE_ADD(NOW(), INTERVAL 25 DAY),
        3,
        12
    ),
    (
        15,
        'Implementar formulário de contato',
        'Criar formulário com validação e envio de mensagens.',
        'MEDIA',
        'CANCELADA',
        DATE_SUB(NOW(), INTERVAL 18 DAY),
        DATE_SUB(NOW(), INTERVAL 8 DAY),
        3,
        9
    ),
    -- Projeto 4
    (
        16,
        'Modelar produtos e categorias',
        'Definir estrutura de produtos, categorias e relacionamentos.',
        'ALTA',
        'CONCLUIDA',
        DATE_SUB(NOW(), INTERVAL 22 DAY),
        DATE_SUB(NOW(), INTERVAL 12 DAY),
        4,
        7
    ),
    (
        17,
        'Implementar entrada de produtos',
        'Criar funcionalidade para registrar novas entradas no estoque.',
        'CRITICA',
        'EM ANDAMENTO',
        DATE_SUB(NOW(), INTERVAL 11 DAY),
        DATE_ADD(NOW(), INTERVAL 4 DAY),
        4,
        8
    ),
    (
        18,
        'Implementar saída de produtos',
        'Desenvolver funcionalidade para registrar retiradas de produtos.',
        'ALTA',
        'ABERTA',
        DATE_SUB(NOW(), INTERVAL 4 DAY),
        DATE_ADD(NOW(), INTERVAL 10 DAY),
        4,
        10
    ),
    (
        19,
        'Criar relatório de estoque',
        'Desenvolver relatórios com quantidades e movimentações.',
        'MEDIA',
        'EM REVISAO',
        DATE_SUB(NOW(), INTERVAL 6 DAY),
        DATE_ADD(NOW(), INTERVAL 3 DAY),
        4,
        12
    ),
    (
        20,
        'Corrigir cálculo de quantidade',
        'Corrigir inconsistência no cálculo de produtos disponíveis.',
        'CRITICA',
        'CONCLUIDA',
        DATE_SUB(NOW(), INTERVAL 14 DAY),
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        4,
        7
    ),
    -- Projeto 5
    (
        21,
        'Atualizar servidores',
        'Atualizar os sistemas operacionais dos servidores.',
        'ALTA',
        'EM ANDAMENTO',
        DATE_SUB(NOW(), INTERVAL 13 DAY),
        DATE_ADD(NOW(), INTERVAL 7 DAY),
        5,
        8
    ),
    (
        22,
        'Configurar firewall',
        'Implementar regras de segurança para o ambiente de rede.',
        'CRITICA',
        'EM REVISAO',
        DATE_SUB(NOW(), INTERVAL 8 DAY),
        DATE_ADD(NOW(), INTERVAL 2 DAY),
        5,
        9
    ),
    (
        23,
        'Realizar auditoria de acessos',
        'Verificar permissões e acessos dos usuários aos sistemas.',
        'MEDIA',
        'ABERTA',
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        DATE_ADD(NOW(), INTERVAL 18 DAY),
        5,
        11
    ),
    (
        24,
        'Implementar backup automático',
        'Configurar rotinas automatizadas de backup dos servidores.',
        'ALTA',
        'CONCLUIDA',
        DATE_SUB(NOW(), INTERVAL 28 DAY),
        DATE_SUB(NOW(), INTERVAL 14 DAY),
        5,
        12
    ),
    (
        25,
        'Documentar infraestrutura',
        'Documentar equipamentos, servidores e configurações de rede.',
        'BAIXA',
        'ABERTA',
        NOW(),
        DATE_ADD(NOW(), INTERVAL 30 DAY),
        5,
        11
    );

-- ==========================================
-- 5. COMENTÁRIOS (20 registros)
-- ==========================================
INSERT INTO
    `comment` (
        comment_id,
        content,
        creation_date,
        fk_task_id,
        fk_user_id
    )
VALUES
    (
        1,
        'A estrutura inicial do banco foi implementada com sucesso.',
        DATE_SUB(NOW(), INTERVAL 19 DAY),
        1,
        2
    ),
    (
        2,
        'Precisamos revisar os relacionamentos antes de finalizar.',
        DATE_SUB(NOW(), INTERVAL 18 DAY),
        1,
        7
    ),
    (
        3,
        'O sistema de autenticação já está com a primeira versão funcional.',
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        2,
        8
    ),
    (
        4,
        'Encontrei um problema na validação de e-mail.',
        DATE_SUB(NOW(), INTERVAL 4 DAY),
        2,
        2
    ),
    (
        5,
        'Implementação enviada para revisão.',
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        3,
        9
    ),
    (
        6,
        'A navegação principal está funcionando corretamente.',
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        7,
        8
    ),
    (
        7,
        'A integração depende da finalização de alguns endpoints.',
        DATE_SUB(NOW(), INTERVAL 1 DAY),
        8,
        11
    ),
    (
        8,
        'As telas de autenticação foram aprovadas.',
        DATE_SUB(NOW(), INTERVAL 14 DAY),
        6,
        3
    ),
    (
        9,
        'Precisamos ajustar o espaçamento em dispositivos menores.',
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        13,
        4
    ),
    (
        10,
        'O painel administrativo já possui estrutura inicial.',
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        12,
        10
    ),
    (
        11,
        'Layout aprovado pela equipe.',
        DATE_SUB(NOW(), INTERVAL 20 DAY),
        11,
        4
    ),
    (
        12,
        'A modelagem das categorias está concluída.',
        DATE_SUB(NOW(), INTERVAL 15 DAY),
        16,
        5
    ),
    (
        13,
        'A entrada de produtos precisa validar quantidades negativas.',
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        17,
        7
    ),
    (
        14,
        'O relatório está aguardando validação dos dados.',
        DATE_SUB(NOW(), INTERVAL 1 DAY),
        19,
        12
    ),
    (
        15,
        'Correção aplicada e testada.',
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        20,
        5
    ),
    (
        16,
        'A atualização dos servidores começou.',
        DATE_SUB(NOW(), INTERVAL 4 DAY),
        21,
        6
    ),
    (
        17,
        'As regras de firewall estão sendo revisadas.',
        DATE_SUB(NOW(), INTERVAL 1 DAY),
        22,
        9
    ),
    (
        18,
        'Identificamos algumas permissões desnecessárias.',
        NOW(),
        23,
        11
    ),
    (
        19,
        'O backup automático está funcionando.',
        DATE_SUB(NOW(), INTERVAL 12 DAY),
        24,
        12
    ),
    (
        20,
        'Vou iniciar a documentação da infraestrutura.',
        NOW(),
        25,
        6
    );

-- ==========================================
-- 6. SOLICITAÇÕES DE ACESSO (8 registros)
-- ==========================================
INSERT INTO
    access_request (
        request_id,
        creation_date,
        status,
        fk_project_id,
        fk_user_id
    )
VALUES
    (
        1,
        DATE_SUB(NOW(), INTERVAL 10 DAY),
        'APPROVED',
        1,
        11
    ),
    (
        2,
        DATE_SUB(NOW(), INTERVAL 8 DAY),
        'PENDING',
        1,
        12
    ),
    (
        3,
        DATE_SUB(NOW(), INTERVAL 7 DAY),
        'REJECTED',
        2,
        9
    ),
    (
        4,
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        'APPROVED',
        3,
        7
    ),
    (
        5,
        DATE_SUB(NOW(), INTERVAL 4 DAY),
        'PENDING',
        3,
        8
    ),
    (
        6,
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        'REJECTED',
        4,
        11
    ),
    (
        7,
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        'PENDING',
        5,
        7
    ),
    (8, NOW(), 'APPROVED', 5, 10);

-- ==========================================
-- 7. NOTIFICAÇÕES (20 registros)
-- ==========================================
INSERT INTO
    notification (
        notification_id,
        type,
        message,
        is_read,
        creation_date,
        fk_user_id,
        fk_project_id,
        fk_task_id
    )
VALUES
    (
        1,
        'PROJECT_INVITE',
        'Você foi adicionado ao projeto TaskOps.',
        FALSE,
        DATE_SUB(NOW(), INTERVAL 10 DAY),
        7,
        1,
        NULL
    ),
    (
        2,
        'TASK_ASSIGNED',
        'Uma nova tarefa foi atribuída a você: Implementar autenticação.',
        FALSE,
        DATE_SUB(NOW(), INTERVAL 12 DAY),
        8,
        1,
        2
    ),
    (
        3,
        'TASK_UPDATED',
        'A tarefa Criar estrutura do banco de dados foi concluída.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 10 DAY),
        2,
        1,
        1
    ),
    (
        4,
        'GENERIC',
        'Bem-vindo ao TaskOps! Seu cadastro foi realizado.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 15 DAY),
        7,
        NULL,
        NULL
    ),
    (
        5,
        'TASK_ASSIGNED',
        'Você recebeu uma nova tarefa: Integrar API.',
        FALSE,
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        11,
        2,
        8
    ),
    (
        6,
        'PROJECT_INVITE',
        'Você foi adicionado ao projeto Desenvolvimento de Aplicativo Mobile.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 9 DAY),
        8,
        2,
        NULL
    ),
    (
        7,
        'TASK_UPDATED',
        'A tarefa Implementar navegação foi atualizada.',
        FALSE,
        DATE_SUB(NOW(), INTERVAL 1 DAY),
        3,
        2,
        7
    ),
    (
        8,
        'TASK_ASSIGNED',
        'Uma tarefa foi atribuída a você: Desenvolver painel administrativo.',
        FALSE,
        DATE_SUB(NOW(), INTERVAL 9 DAY),
        10,
        3,
        12
    ),
    (
        9,
        'TASK_UPDATED',
        'A tarefa Criar layout da página inicial foi concluída.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 20 DAY),
        4,
        3,
        11
    ),
    (
        10,
        'GENERIC',
        'Sua solicitação de acesso ao Portal Institucional foi aprovada.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        7,
        3,
        NULL
    ),
    (
        11,
        'TASK_ASSIGNED',
        'Nova tarefa atribuída: Implementar entrada de produtos.',
        FALSE,
        DATE_SUB(NOW(), INTERVAL 11 DAY),
        8,
        4,
        17
    ),
    (
        12,
        'TASK_UPDATED',
        'A tarefa Corrigir cálculo de quantidade foi concluída.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        5,
        4,
        20
    ),
    (
        13,
        'PROJECT_INVITE',
        'Você foi adicionado ao projeto Sistema de Controle de Estoque.',
        FALSE,
        DATE_SUB(NOW(), INTERVAL 6 DAY),
        12,
        4,
        NULL
    ),
    (
        14,
        'GENERIC',
        'Sua solicitação de acesso ao projeto foi rejeitada.',
        FALSE,
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        11,
        4,
        NULL
    ),
    (
        15,
        'TASK_ASSIGNED',
        'Você recebeu a tarefa Configurar firewall.',
        FALSE,
        DATE_SUB(NOW(), INTERVAL 8 DAY),
        9,
        5,
        22
    ),
    (
        16,
        'TASK_UPDATED',
        'A tarefa Implementar backup automático foi concluída.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 14 DAY),
        6,
        5,
        24
    ),
    (
        17,
        'PROJECT_INVITE',
        'Você foi adicionado ao projeto Infraestrutura e Segurança.',
        TRUE,
        DATE_SUB(NOW(), INTERVAL 7 DAY),
        8,
        5,
        NULL
    ),
    (
        18,
        'TASK_ASSIGNED',
        'Nova tarefa atribuída: Documentar infraestrutura.',
        FALSE,
        NOW(),
        11,
        5,
        25
    ),
    (
        19,
        'GENERIC',
        'Você possui solicitações de acesso aguardando aprovação.',
        FALSE,
        DATE_SUB(NOW(), INTERVAL 1 DAY),
        2,
        1,
        NULL
    ),
    (
        20,
        'TASK_UPDATED',
        'A tarefa Configurar firewall foi enviada para revisão.',
        FALSE,
        NOW(),
        6,
        5,
        22
    );

-- ==========================================
-- 8. HISTÓRICO DE ALTERAÇÕES (20 registros)
-- ==========================================
INSERT INTO
    history (
        history_id,
        date,
        old_value,
        new_value,
        field_name,
        fk_task_id,
        fk_user_id
    )
VALUES
    (
        1,
        DATE_SUB(NOW(), INTERVAL 10 DAY),
        'ABERTA',
        'EM ANDAMENTO',
        'status',
        1,
        7
    ),
    (
        2,
        DATE_SUB(NOW(), INTERVAL 8 DAY),
        'EM ANDAMENTO',
        'CONCLUIDA',
        'status',
        1,
        2
    ),
    (
        3,
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        'ABERTA',
        'EM ANDAMENTO',
        'status',
        2,
        8
    ),
    (
        4,
        DATE_SUB(NOW(), INTERVAL 4 DAY),
        'MEDIA',
        'CRITICA',
        'priority',
        2,
        2
    ),
    (
        5,
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        'ABERTA',
        'EM REVISAO',
        'status',
        3,
        9
    ),
    (
        6,
        DATE_SUB(NOW(), INTERVAL 14 DAY),
        'ABERTA',
        'EM ANDAMENTO',
        'status',
        6,
        7
    ),
    (
        7,
        DATE_SUB(NOW(), INTERVAL 12 DAY),
        'EM ANDAMENTO',
        'CONCLUIDA',
        'status',
        6,
        3
    ),
    (
        8,
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        'ABERTA',
        'EM ANDAMENTO',
        'status',
        7,
        8
    ),
    (
        9,
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        'MEDIA',
        'ALTA',
        'priority',
        8,
        3
    ),
    (
        10,
        DATE_SUB(NOW(), INTERVAL 20 DAY),
        'ABERTA',
        'EM ANDAMENTO',
        'status',
        11,
        9
    ),
    (
        11,
        DATE_SUB(NOW(), INTERVAL 18 DAY),
        'EM ANDAMENTO',
        'CONCLUIDA',
        'status',
        11,
        4
    ),
    (
        12,
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        'ABERTA',
        'EM ANDAMENTO',
        'status',
        12,
        10
    ),
    (
        13,
        DATE_SUB(NOW(), INTERVAL 15 DAY),
        'ABERTA',
        'EM ANDAMENTO',
        'status',
        16,
        7
    ),
    (
        14,
        DATE_SUB(NOW(), INTERVAL 13 DAY),
        'EM ANDAMENTO',
        'CONCLUIDA',
        'status',
        16,
        5
    ),
    (
        15,
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        'MEDIA',
        'CRITICA',
        'priority',
        17,
        5
    ),
    (
        16,
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        'ABERTA',
        'EM ANDAMENTO',
        'status',
        20,
        7
    ),
    (
        17,
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        'EM ANDAMENTO',
        'CONCLUIDA',
        'status',
        20,
        5
    ),
    (
        18,
        DATE_SUB(NOW(), INTERVAL 4 DAY),
        'ABERTA',
        'EM ANDAMENTO',
        'status',
        21,
        8
    ),
    (
        19,
        DATE_SUB(NOW(), INTERVAL 1 DAY),
        'EM ANDAMENTO',
        'EM REVISAO',
        'status',
        22,
        9
    ),
    (
        20,
        DATE_SUB(NOW(), INTERVAL 14 DAY),
        'ABERTA',
        'EM ANDAMENTO',
        'status',
        24,
        12
    );

-- ==========================================
-- 9. VERIFICAÇÃO DA MASSA DE DADOS
-- ==========================================
SELECT
    'user' AS tabela,
    COUNT(*) AS registros
FROM
    `user`
UNION ALL
SELECT
    'project',
    COUNT(*)
FROM
    project
UNION ALL
SELECT
    'project_user',
    COUNT(*)
FROM
    project_user
UNION ALL
SELECT
    'task',
    COUNT(*)
FROM
    task
UNION ALL
SELECT
    'comment',
    COUNT(*)
FROM
    `comment`
UNION ALL
SELECT
    'access_request',
    COUNT(*)
FROM
    access_request
UNION ALL
SELECT
    'notification',
    COUNT(*)
FROM
    notification
UNION ALL
SELECT
    'history',
    COUNT(*)
FROM
    history;