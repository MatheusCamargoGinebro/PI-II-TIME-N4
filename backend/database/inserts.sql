/* 
INSERT automático do banco de dados para testes.
ARQUIVO GERADO POR IA, APENAS PARA VALIDAÇÕES!!!!
 */
-- =====================================================================
-- TABELA AUXILIAR DE NÚMEROS (temporária, some ao fechar a conexão)
-- =====================================================================
CREATE TEMPORARY TABLE
    numbers (n INT PRIMARY KEY);

INSERT INTO
    numbers (n)
WITH RECURSIVE
    seq AS (
        SELECT
            1 AS n
        UNION ALL
        SELECT
            n + 1
        FROM
            seq
        WHERE
            n < 100
    )
SELECT
    n
FROM
    seq;

-- =====================================================================
-- USUÁRIOS
-- =====================================================================
-- 8 usuários fixos (IDs 1 a 8), fáceis de usar em testes manuais
INSERT INTO
    user(
        name,
        email,
        password,
        profile_pic,
        authority_level
    )
VALUES
    (
        'Ana Souza',
        'ana.souza@taskops.com',
        REPEAT ('A', 60),
        NULL,
        'Administrador'
    ),
    (
        'Bruno Lima',
        'bruno.lima@taskops.com',
        REPEAT ('A', 60),
        NULL,
        'Lider de projeto'
    ),
    (
        'Carla Mendes',
        'carla.mendes@taskops.com',
        REPEAT ('A', 60),
        NULL,
        'Lider de projeto'
    ),
    (
        'Diego Ferreira',
        'diego.ferreira@taskops.com',
        REPEAT ('A', 60),
        NULL,
        'Membro de projeto'
    ),
    (
        'Elisa Rocha',
        'elisa.rocha@taskops.com',
        REPEAT ('A', 60),
        NULL,
        'Membro de projeto'
    ),
    (
        'Felipe Alves',
        'felipe.alves@taskops.com',
        REPEAT ('A', 60),
        NULL,
        'Membro de projeto'
    ),
    (
        'Gabriela Costa',
        'gabriela.costa@taskops.com',
        REPEAT ('A', 60),
        NULL,
        'Membro de projeto'
    ),
    (
        'Henrique Martins',
        'henrique.martins@taskops.com',
        REPEAT ('A', 60),
        NULL,
        'Membro de projeto'
    );

-- +42 usuários gerados (IDs 9 a 50): 4 líderes e 38 membros
INSERT INTO
    user(
        name,
        email,
        password,
        profile_pic,
        authority_level
    )
SELECT
    CONCAT(
        ELT(
            1 + MOD(n * 7, 20),
            'Ana',
            'Bruno',
            'Carla',
            'Diego',
            'Elisa',
            'Felipe',
            'Gabriela',
            'Henrique',
            'Isabela',
            'João',
            'Karina',
            'Lucas',
            'Mariana',
            'Nicolas',
            'Olívia',
            'Pedro',
            'Quésia',
            'Rafael',
            'Sofia',
            'Thiago'
        ),
        ' ',
        ELT(
            1 + MOD(n * 11 + FLOOR(n / 20) * 3, 20),
            'Silva',
            'Santos',
            'Oliveira',
            'Pereira',
            'Rodrigues',
            'Almeida',
            'Nascimento',
            'Carvalho',
            'Gomes',
            'Ribeiro',
            'Barbosa',
            'Moreira',
            'Cardoso',
            'Teixeira',
            'Araújo',
            'Dias',
            'Castro',
            'Pinto',
            'Correia',
            'Batista'
        )
    ),
    CONCAT('usuario', LPAD(n + 8, 3, '0'), '@taskops.com'),
REPEAT ('A', 60),
NULL,
IF(n <= 4, 'Lider de projeto', 'Membro de projeto')
FROM
    numbers
WHERE
    n <= 42;

-- =====================================================================
-- PROJETOS
-- =====================================================================
INSERT INTO
    project (TITLE)
VALUES
    ('Redesign do Website Institucional'),
    ('Aplicativo Mobile de Vendas'),
    ('Migração para Nuvem'),
    ('Sistema de Recursos Humanos');

-- +11 projetos gerados (IDs 5 a 15)
INSERT INTO
    project (TITLE)
SELECT
    ELT(
        n,
        'Portal do Cliente',
        'Sistema de Estoque',
        'Plataforma de E-learning',
        'Dashboard de BI',
        'API de Integração com Parceiros',
        'Automação de Marketing',
        'Sistema de Help Desk',
        'Reestruturação do ERP',
        'Aplicativo de Entregas',
        'Segurança e Compliance (LGPD)',
        'Chatbot de Atendimento'
    )
FROM
    numbers
WHERE
    n <= 11;

-- =====================================================================
-- MEMBROS DOS PROJETOS
-- =====================================================================
-- Projetos 1 a 4: membros fixos
INSERT INTO
    project_user (fk_project_id, fk_user_id)
VALUES
    (1, 2),
    (1, 4),
    (1, 5),
    (1, 6),
    (2, 3),
    (2, 5),
    (2, 7),
    (2, 8),
    (3, 2),
    (3, 3),
    (3, 6),
    (3, 8),
    (4, 3),
    (4, 4),
    (4, 7);

-- Projetos 5 a 15: ~10 membros cada, distribuídos por regra determinística
INSERT IGNORE INTO
    project_user (fk_project_id, fk_user_id)
SELECT
    p.project_id,
    u.user_id
FROM
    project p
    JOIN user u ON MOD(u.user_id + p.project_id * 3, 5) = 0
WHERE
    p.project_id > 4;

-- =====================================================================
-- TAREFAS
-- =====================================================================
-- 17 tarefas fixas (IDs 1 a 17)
INSERT INTO
    task (
        title,
        description,
        priority,
        creation_date,
        due_date,
        fk_project_id,
        fk_user_id
    )
VALUES
    -- Projeto 1
    (
        'Definir paleta de cores',
        'Escolher paleta alinhada à identidade visual da empresa.',
        'MEDIA',
        '2026-09-01 09:00:00',
        '2026-09-15 18:00:00',
        1,
        4
    ),
    (
        'Criar wireframes da home',
        'Desenvolver wireframes de média fidelidade da página inicial.',
        'ALTA',
        '2026-09-02 10:30:00',
        '2026-09-20 18:00:00',
        1,
        5
    ),
    (
        'Implementar menu responsivo',
        'Codificar o menu de navegação com suporte a mobile.',
        'MEDIA',
        '2026-09-10 14:00:00',
        '2026-10-05 18:00:00',
        1,
        6
    ),
    (
        'Revisar textos institucionais',
        'Revisão ortográfica e de tom de voz de todas as páginas.',
        'BAIXA',
        '2026-09-12 08:45:00',
        '2026-10-20 18:00:00',
        1,
        2
    ),
    (
        'Otimizar imagens do site',
        'Comprimir e converter imagens para WebP.',
        'BAIXA',
        '2026-10-01 11:00:00',
        '2026-11-10 18:00:00',
        1,
        4
    ),
    -- Projeto 2
    (
        'Tela de login do app',
        'Implementar autenticação com e-mail e senha.',
        'ALTA',
        '2026-08-20 09:15:00',
        '2026-09-10 18:00:00',
        2,
        5
    ),
    (
        'Catálogo de produtos',
        'Listagem com filtros e busca de produtos.',
        'ALTA',
        '2026-08-25 13:00:00',
        '2026-10-01 18:00:00',
        2,
        7
    ),
    (
        'Integração com gateway de pagamento',
        'Integrar API de pagamento com cartão e Pix.',
        'CRITICA',
        '2026-09-05 10:00:00',
        '2026-10-30 18:00:00',
        2,
        8
    ),
    (
        'Planejar sprint de lançamento',
        'Definir escopo e cronograma da sprint final.',
        'MEDIA',
        '2026-10-10 15:30:00',
        '2026-11-05 18:00:00',
        2,
        3
    ),
    (
        'Notificações push',
        'Configurar envio de notificações push para pedidos.',
        'MEDIA',
        '2026-10-15 09:00:00',
        '2026-11-25 18:00:00',
        2,
        7
    ),
    -- Projeto 3
    (
        'Mapear infraestrutura atual',
        'Levantar servidores, bancos e dependências on-premise.',
        'ALTA',
        '2026-07-15 08:00:00',
        '2026-08-15 18:00:00',
        3,
        6
    ),
    (
        'Configurar rede e VPC',
        'Criar VPC, sub-redes e regras de segurança na nuvem.',
        'CRITICA',
        '2026-08-18 09:30:00',
        '2026-09-30 18:00:00',
        3,
        8
    ),
    (
        'Migrar banco de dados',
        'Migrar o banco principal com mínimo de downtime.',
        'CRITICA',
        '2026-09-20 10:00:00',
        '2026-11-15 18:00:00',
        3,
        2
    ),
    (
        'Documentar processo de migração',
        'Criar documentação técnica e runbook de rollback.',
        'BAIXA',
        '2026-10-05 14:20:00',
        '2026-12-01 18:00:00',
        3,
        3
    ),
    -- Projeto 4
    (
        'Modelagem do cadastro de funcionários',
        'Definir entidades e relacionamentos do módulo de cadastro.',
        'ALTA',
        '2026-09-08 09:00:00',
        '2026-09-30 18:00:00',
        4,
        4
    ),
    (
        'Tela de folha de ponto',
        'Interface para registro e consulta de ponto.',
        'MEDIA',
        '2026-10-02 11:30:00',
        '2026-11-20 18:00:00',
        4,
        7
    ),
    (
        'Relatório de férias',
        'Gerar relatório de férias vencidas e programadas.',
        'BAIXA',
        '2026-10-20 16:00:00',
        '2026-12-10 18:00:00',
        4,
        3
    );

-- Tarefas geradas: 4 por membro de projeto (~500), sempre atribuídas a um membro do projeto.
-- Criadas entre jun e out/2026, com prazo de 7 a 66 dias após a criação.
-- O hint NO_MERGE garante que cada RAND() seja avaliado uma única vez por linha.
INSERT INTO
    task (
        title,
        description,
        priority,
        creation_date,
        due_date,
        fk_project_id,
        fk_user_id
    )
SELECT
    /*+ NO_MERGE(src) */
    CONCAT(src.verb, ' ', src.obj),
    CONCAT(
        src.verb,
        ' ',
        src.obj,
        ' conforme o escopo definido para o projeto.'
    ),
    src.priority,
    src.created,
    src.created + INTERVAL src.days_to_due DAY,
    src.fk_project_id,
    src.fk_user_id
FROM
    (
        SELECT
            ELT(
                1 + FLOOR(RAND() * 10),
                'Implementar',
                'Revisar',
                'Testar',
                'Documentar',
                'Refatorar',
                'Planejar',
                'Corrigir',
                'Otimizar',
                'Validar',
                'Configurar'
            ) AS verb,
            ELT(
                1 + FLOOR(RAND() * 10),
                'módulo de autenticação',
                'tela de relatórios',
                'integração com API externa',
                'rotina de backup',
                'fluxo de cadastro',
                'painel de métricas',
                'validação de formulários',
                'pipeline de deploy',
                'cache de consultas',
                'controle de permissões'
            ) AS obj,
            ELT(
                1 + FLOOR(RAND() * 4),
                'BAIXA',
                'MEDIA',
                'ALTA',
                'CRITICA'
            ) AS priority,
            TIMESTAMP('2026-06-01 08:00:00') + INTERVAL FLOOR(RAND() * 150) DAY + INTERVAL FLOOR(RAND() * 36000) SECOND AS created,
            7 + FLOOR(RAND() * 60) AS days_to_due,
            pu.fk_project_id,
            pu.fk_user_id
        FROM
            project_user pu
            JOIN numbers n ON n.n <= 4
    ) AS src;

-- =====================================================================
-- COMENTÁRIOS
-- =====================================================================
-- 15 comentários fixos
INSERT INTO
    comment (content, creation_date, fk_task_id, fk_user_id)
VALUES
    (
        'Sugiro usar tons de azul e cinza, combina com a logo.',
        '2026-09-03 10:00:00',
        1,
        2
    ),
    (
        'Paleta aprovada pelo marketing.',
        '2026-09-05 16:20:00',
        1,
        4
    ),
    (
        'Wireframes enviados para revisão no Figma.',
        '2026-09-15 17:45:00',
        2,
        5
    ),
    (
        'Precisamos testar o menu no Safari também.',
        '2026-09-25 09:30:00',
        3,
        2
    ),
    (
        'Tela de login finalizada, falta apenas o fluxo de recuperar senha.',
        '2026-09-01 15:00:00',
        6,
        5
    ),
    (
        'Ótimo! Pode abrir uma nova tarefa para a recuperação de senha.',
        '2026-09-02 08:50:00',
        6,
        3
    ),
    (
        'A API do gateway está retornando timeout em homologação.',
        '2026-10-02 11:10:00',
        8,
        8
    ),
    (
        'Já abri chamado com o suporte do gateway.',
        '2026-10-02 14:00:00',
        8,
        3
    ),
    (
        'Catálogo com 80% concluído, falta a paginação.',
        '2026-09-20 18:00:00',
        7,
        7
    ),
    (
        'Inventário concluído, 42 servidores mapeados.',
        '2026-08-10 17:00:00',
        11,
        6
    ),
    (
        'VPC criada, aguardando revisão de segurança.',
        '2026-09-12 10:15:00',
        12,
        8
    ),
    (
        'Janela de migração agendada para o fim de semana de 07/11.',
        '2026-10-28 09:00:00',
        13,
        2
    ),
    (
        'Vamos precisar de backup completo antes da migração.',
        '2026-10-28 09:40:00',
        13,
        3
    ),
    (
        'Diagrama ER anexado na wiki do projeto.',
        '2026-09-18 13:00:00',
        15,
        4
    ),
    (
        'Falta definir regras de banco de horas.',
        '2026-10-10 10:30:00',
        16,
        7
    );

-- Comentários gerados: ~1,35 por tarefa, escritos por um membro aleatório do projeto,
-- sempre depois da criação da tarefa e nunca depois de 03/11/2026.
INSERT INTO
    comment (content, creation_date, fk_task_id, fk_user_id)
SELECT
    /*+ NO_MERGE(src) */
    src.content,
    src.created,
    src.task_id,
    (
        SELECT
            pu.fk_user_id
        FROM
            project_user pu
        WHERE
            pu.fk_project_id = src.fk_project_id
        ORDER BY
            RAND()
        LIMIT
            1
    )
FROM
    (
        SELECT
            ELT(
                1 + FLOOR(RAND() * 10),
                'Iniciei o trabalho nesta tarefa.',
                'Preciso de mais detalhes sobre o escopo.',
                'Alteração enviada para revisão.',
                'Encontrei um bloqueio, vou alinhar com a liderança.',
                'Testes realizados com sucesso em homologação.',
                'Podemos priorizar esta tarefa na próxima sprint?',
                'Documentação atualizada na wiki.',
                'Aguardando retorno do cliente.',
                'Concluído, pode validar quando possível.',
                'Ajustei o prazo conforme combinado na reunião.'
            ) AS content,
            LEAST(
                t.creation_date + INTERVAL(1 + FLOOR(RAND() * 20)) DAY,
                TIMESTAMP('2026-11-03 18:00:00')
            ) AS created,
            t.task_id,
            t.fk_project_id
        FROM
            task t
            JOIN numbers n ON n.n <= 3
        WHERE
            RAND() < 0.45
    ) AS src;

-- =====================================================================
-- SOLICITAÇÕES DE ACESSO
-- =====================================================================
-- 5 solicitações fixas
INSERT INTO
    access_request (creation_date, fk_project_id, fk_user_id)
VALUES
    ('2026-10-25 09:00:00', 1, 7),
    ('2026-10-26 14:30:00', 2, 4),
    ('2026-10-28 11:15:00', 3, 5),
    ('2026-10-30 16:45:00', 4, 6),
    ('2026-11-01 08:20:00', 1, 8);

-- Solicitações geradas: apenas de usuários que ainda NÃO são membros do projeto
-- e que ainda não têm solicitação para ele.
INSERT INTO
    access_request (creation_date, fk_project_id, fk_user_id)
SELECT
    TIMESTAMP('2026-10-01 08:00:00') + INTERVAL MOD(p.project_id * u.user_id * 37, 33) DAY + INTERVAL MOD(u.user_id * 1013, 36000) SECOND,
    p.project_id,
    u.user_id
FROM
    project p
    JOIN user u ON MOD(u.user_id * 7 + p.project_id * 13, 23) = 0
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            project_user pu
        WHERE
            pu.fk_project_id = p.project_id
            AND pu.fk_user_id = u.user_id
    )
    AND NOT EXISTS (
        SELECT
            1
        FROM
            access_request ar
        WHERE
            ar.fk_project_id = p.project_id
            AND ar.fk_user_id = u.user_id
    );

-- =====================================================================
-- HISTÓRICO DE ALTERAÇÕES
-- =====================================================================
-- 11 registros fixos
INSERT INTO
    history (
        date,
        old_value,
        new_value,
        field_name,
        fk_task_id,
        fk_user_id
    )
VALUES
    (
        '2026-09-04 10:00:00',
        'BAIXA',
        'MEDIA',
        'priority',
        1,
        2
    ),
    (
        '2026-09-16 09:00:00',
        '2026-09-15 18:00:00',
        '2026-09-20 18:00:00',
        'due_date',
        2,
        5
    ),
    (
        '2026-09-08 12:00:00',
        'MEDIA',
        'ALTA',
        'priority',
        6,
        3
    ),
    (
        '2026-09-30 15:00:00',
        'ALTA',
        'CRITICA',
        'priority',
        8,
        3
    ),
    (
        '2026-10-10 10:00:00',
        '2026-10-15 18:00:00',
        '2026-10-30 18:00:00',
        'due_date',
        8,
        3
    ),
    (
        '2026-10-12 11:30:00',
        'Catálogo',
        'Catálogo de produtos',
        'title',
        7,
        7
    ),
    (
        '2026-08-20 09:00:00',
        'ALTA',
        'CRITICA',
        'priority',
        12,
        3
    ),
    (
        '2026-10-01 14:00:00',
        '2026-10-31 18:00:00',
        '2026-11-15 18:00:00',
        'due_date',
        13,
        2
    ),
    (
        '2026-10-06 10:00:00',
        '2',
        '3',
        'fk_user_id',
        14,
        3
    ),
    (
        '2026-09-25 17:00:00',
        'ALTA',
        'MEDIA',
        'priority',
        16,
        3
    ),
    (
        '2026-10-22 09:30:00',
        '2026-11-30 18:00:00',
        '2026-12-10 18:00:00',
        'due_date',
        17,
        3
    );

-- Histórico gerado a partir das tarefas geradas (IDs > 17).
-- Mudança de prioridade (1 a cada 3 tarefas): o valor antigo é sempre diferente do atual.
INSERT INTO
    history (
        date,
        old_value,
        new_value,
        field_name,
        fk_task_id,
        fk_user_id
    )
SELECT
    t.creation_date + INTERVAL(1 + MOD(t.task_id, 5)) DAY,
    ELT(
        MOD(
            FIELD(t.priority, 'BAIXA', 'MEDIA', 'ALTA', 'CRITICA'),
            4
        ) + 1,
        'BAIXA',
        'MEDIA',
        'ALTA',
        'CRITICA'
    ),
    t.priority,
    'priority',
    t.task_id,
    t.fk_user_id
FROM
    task t
WHERE
    t.task_id > 17
    AND t.priority IS NOT NULL
    AND MOD(t.task_id, 3) = 0;

-- Mudança de prazo (1 a cada 4 tarefas): o prazo antigo era 7 dias antes do atual.
INSERT INTO
    history (
        date,
        old_value,
        new_value,
        field_name,
        fk_task_id,
        fk_user_id
    )
SELECT
    t.creation_date + INTERVAL 2 DAY,
    DATE_FORMAT(t.due_date - INTERVAL 7 DAY, '%Y-%m-%d %H:%i:%s'),
    DATE_FORMAT(t.due_date, '%Y-%m-%d %H:%i:%s'),
    'due_date',
    t.task_id,
    t.fk_user_id
FROM
    task t
WHERE
    t.task_id > 17
    AND MOD(t.task_id, 4) = 0;

-- Mudança de título (1 a cada 11 tarefas).
INSERT INTO
    history (
        date,
        old_value,
        new_value,
        field_name,
        fk_task_id,
        fk_user_id
    )
SELECT
    t.creation_date + INTERVAL 1 DAY,
    CONCAT('[Rascunho] ', t.title),
    t.title,
    'title',
    t.task_id,
    t.fk_user_id
FROM
    task t
WHERE
    t.task_id > 17
    AND MOD(t.task_id, 11) = 0;

-- =====================================================================
-- CONFERÊNCIA RÁPIDA
-- =====================================================================
SELECT
    'user' AS tabela,
    COUNT(*) AS total
FROM
    user
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
    comment
UNION ALL
SELECT
    'access_request',
    COUNT(*)
FROM
    access_request
UNION ALL
SELECT
    'history',
    COUNT(*)
FROM
    history;

DROP TEMPORARY TABLE IF EXISTS numbers;