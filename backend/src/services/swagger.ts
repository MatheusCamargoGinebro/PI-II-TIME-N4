// O============================================================================================O

/*
    Autor: Matheus Camargo Ginebro
    swagger.ts -> Arquivo responsável pela especificação OpenAPI 3.0 e pela página HTML interativa de documentação da API na rota raiz;
*/

// O============================================================================================O

// Exemplos reutilizáveis de objetos JSON para documentação e testes
const example_user = {
	user_id: 1,
	name: "Carlos Henrique",
	email: "carlos@taskops.com",
	profile_pic: null,
	authority_level: "Administrador",
};

const example_task = {
	task_id: 5,
	title: "Corrigir erro de permissões",
	description: "Corrigir acesso indevido a funcionalidades administrativas.",
	type: "DEFEITO",
	priority: "CRITICA",
	status: "ABERTA",
	creation_date: "2026-10-15T14:00:00.000Z",
	updated_at: "2026-10-15T14:00:00.000Z",
	due_date: "2026-11-06T21:00:00.000Z",
	fk_project_id: 1,
	fk_user_id: 3,
	fk_creator_id: 2,
	project_id: 1,
	project_title: "TaskOps - Plataforma de Gestão",
	creator_id: 2,
	creator_name: "Mariana Oliveira",
	creator_email: "mariana@taskops.com",
	creator_profile_pic: null,
	responsible_id: 3,
	responsible_name: "Rafael Santos",
	responsible_email: "rafael@taskops.com",
	responsible_profile_pic: null,
};

const example_comment = {
	comment_id: 1,
	content: "Iniciei a investigação das permissões administrativas.",
	creation_date: "2026-10-16T13:00:00.000Z",
	fk_task_id: 5,
	fk_user_id: 7,
	author_name: "Pedro Almeida",
	author_email: "pedro@taskops.com",
	author_profile_pic: null,
	author_authority_level: "Membro da equipe",
};

const example_history_item = {
	history_id: 13,
	date: "2026-10-16T13:00:00.000Z",
	field_name: "priority",
	old_value: "MEDIA",
	new_value: "CRITICA",
	fk_task_id: 5,
	fk_user_id: 2,
	actor_name: "Mariana Oliveira",
	actor_email: "mariana@taskops.com",
	actor_profile_pic: null,
	actor_authority_level: "Lider de projeto",
	summary:
		"Mariana Oliveira alterou a prioridade da demanda de Média para Crítica.",
};

// Auxiliar para padronizar respostas JSON na especificação OpenAPI
const json_response = (
	description: string,
	example: Record<string, unknown>,
) => ({
	description,
	content: {
		"application/json": {
			schema: { type: "object" },
			example,
		},
	},
});

const auth_security = [{ AccessTokenHeader: [] }, { BearerAuth: [] }];

// O============================================================================================O

// Especificação completa OpenAPI 3.0.3 com todas as rotas, parâmetros, opções aceitas, payloads e respostas JSON
export const openapi_spec = {
	openapi: "3.0.3",
	info: {
		title: "TaskOps API — Documentação Completa de Rotas e Testes",
		version: "1.0.0",
		description:
			"API REST do Sistema de Acompanhamento de Demandas de Desenvolvimento (TaskOps — PI-II Time N4). Todas as rotas protegidas exigem o cabeçalho `x-access-token: <JWT>` ou `Authorization: Bearer <JWT>`.",
	},
	servers: [
		{
			url: "/",
			description: "Servidor local atual",
		},
	],
	tags: [
		{ name: "Sistema", description: "Healthcheck e especificação OpenAPI" },
		{
			name: "Usuários",
			description: "Autenticação JWT, cadastro e consulta de usuários",
		},
		{
			name: "Projetos",
			description: "Consulta, criação de projetos e vínculo de membros",
		},
		{
			name: "Demandas",
			description:
				"CRUD, filtros combinados, busca textual, ordenação, ciclo de vida, RBAC, feriados nacionais e dashboard",
		},
		{
			name: "Comentários e Histórico",
			description: "Comentários e histórico automático de alterações",
		},
	],
	components: {
		securitySchemes: {
			AccessTokenHeader: {
				type: "apiKey",
				in: "header",
				name: "x-access-token",
				description: "Token JWT retornado em POST /users/login",
			},
			BearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
				description: "Alternativa: Authorization: Bearer <token>",
			},
		},
	},
	paths: {
		// ------------------------------------------------------------------------------------
		// SISTEMA
		// ------------------------------------------------------------------------------------
		"/health": {
			get: {
				tags: ["Sistema"],
				summary: "Verificar disponibilidade da API",
				description:
					"Rota pública de healthcheck para confirmar que o servidor está ativo.",
				"x-access": "Pública",
				"x-test-url": "/health",
				responses: {
					"200": json_response("API em execução", {
						message: "API is running.",
					}),
				},
			},
		},
		"/openapi.json": {
			get: {
				tags: ["Sistema"],
				summary: "Obter especificação OpenAPI 3.0 em JSON",
				description:
					"Retorna o JSON OpenAPI 3.0.3 completo (pode ser importado diretamente no Insomnia ou Postman).",
				"x-access": "Pública",
				"x-test-url": "/openapi.json",
				responses: {
					"200": json_response("Documento OpenAPI 3.0.3", {
						openapi: "3.0.3",
						info: { title: "TaskOps API", version: "1.0.0" },
					}),
				},
			},
		},

		// ------------------------------------------------------------------------------------
		// USUÁRIOS
		// ------------------------------------------------------------------------------------
		"/users/login": {
			post: {
				tags: ["Usuários"],
				summary: "Realizar login e gerar token JWT",
				description:
					"Autentica o usuário por e-mail e senha (bcrypt) e retorna um token JWT válido por 24 horas junto aos dados públicos do usuário.",
				"x-access": "Pública",
				"x-test-url": "/users/login",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["user_email", "user_password"],
								properties: {
									user_email: {
										type: "string",
										format: "email",
										description: "E-mail cadastrado do usuário",
									},
									user_password: {
										type: "string",
										description: "Senha em texto plano",
									},
								},
							},
							examples: {
								administrador: {
									summary: "Administrador (id 1)",
									value: {
										user_email: "carlos@taskops.com",
										user_password: "PassW0rd@123",
									},
								},
								lider: {
									summary: "Líder de Projeto (id 2)",
									value: {
										user_email: "mariana@taskops.com",
										user_password: "PassW0rd@123",
									},
								},
								membro: {
									summary: "Membro da Equipe (id 7)",
									value: {
										user_email: "pedro@taskops.com",
										user_password: "PassW0rd@123",
									},
								},
							},
						},
					},
				},
				responses: {
					"200": json_response("Login realizado com sucesso", {
						message: "Login realizado com sucesso.",
						token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
						user: example_user,
					}),
					"400": json_response("Campo ausente ou e-mail inválido", {
						message: "Email fornecido não é válido.",
						errorAt: "user_email",
					}),
					"401": json_response("Usuário ou senha incorretos", {
						message: "Usuário ou senha incorretos.",
					}),
				},
			},
		},
		"/users/register": {
			post: {
				tags: ["Usuários"],
				summary: "Cadastrar novo usuário",
				description:
					"Cria um novo usuário com perfil padrão 'Membro da equipe'. A senha deve possuir no mínimo 8 caracteres, 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial.",
				"x-access": "Pública",
				"x-test-url": "/users/register",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["user_name", "user_email", "user_password"],
								properties: {
									user_name: {
										type: "string",
										description: "Nome único do usuário",
									},
									user_email: {
										type: "string",
										format: "email",
										description: "E-mail único válido",
									},
									user_password: {
										type: "string",
										description:
											"Mínimo 8 caracteres, maiúscula, minúscula, número e especial",
									},
								},
							},
							example: {
								user_name: "Novo Integrante",
								user_email: "novo.integrante@taskops.com",
								user_password: "PassW0rd@123",
							},
						},
					},
				},
				responses: {
					"201": json_response("Usuário registrado com sucesso", {
						message: "Usuário registrado com sucesso.",
						user: {
							user_id: 13,
							name: "Novo Integrante",
							email: "novo.integrante@taskops.com",
							profile_pic: null,
							authority_level: "Membro da equipe",
						},
					}),
					"400": json_response("Erro de validação ou senha fraca", {
						message: "A senha deve ter no mínimo 8 caracteres.",
						errorAt: "user_password",
					}),
					"409": json_response("E-mail ou nome já utilizado", {
						message: "O e-mail de usuário já está sendo utilizado.",
						errorAt: "user_email",
					}),
				},
			},
		},
		"/users/": {
			get: {
				tags: ["Usuários"],
				summary: "Obter dados do usuário autenticado",
				description:
					"Retorna os dados públicos do usuário identificado pelo token JWT.",
				"x-access": "Autenticada (todos os perfis)",
				"x-test-url": "/users/",
				security: auth_security,
				responses: {
					"200": json_response("Usuário encontrado", {
						message: "Usuário encontrado com sucesso.",
						user: example_user,
					}),
					"401": json_response("Token ausente, inválido ou expirado", {
						message: "Token não fornecido no cabeçalho da requisição.",
						errorAt: "x-access-token",
					}),
					"404": json_response("Usuário do token não encontrado", {
						message: "Usuário não encontrado.",
						errorAt: "x-access-token",
					}),
				},
			},
		},
		"/users/list": {
			get: {
				tags: ["Usuários"],
				summary: "Listar todos os usuários cadastrados",
				description:
					"Retorna todos os usuários do sistema em ordem alfabética (Seção 2.1.1).",
				"x-access": "Exclusivo Administrador",
				"x-test-url": "/users/list",
				security: auth_security,
				responses: {
					"200": json_response("Usuários listados com sucesso", {
						message: "Usuários listados com sucesso.",
						users: [
							example_user,
							{
								user_id: 2,
								name: "Mariana Oliveira",
								email: "mariana@taskops.com",
								profile_pic: null,
								authority_level: "Lider de projeto",
							},
						],
					}),
					"401": json_response("Não autenticado", {
						message: "Token não fornecido no cabeçalho da requisição.",
						errorAt: "x-access-token",
					}),
					"403": json_response("Sem permissão (Líder ou Membro)", {
						message:
							"Acesso negado. Apenas administradores podem visualizar todos os usuários.",
					}),
				},
			},
		},

		// ------------------------------------------------------------------------------------
		// PROJETOS
		// ------------------------------------------------------------------------------------
		"/projects": {
			get: {
				tags: ["Projetos"],
				summary: "Listar projetos visíveis ao usuário",
				description:
					"Administrador visualiza todos os projetos cadastrados; Líder de Projeto e Membro da Equipe visualizam apenas projetos vinculados em project_user.",
				"x-access": "Autenticada (escopo por perfil)",
				"x-test-url": "/projects",
				security: auth_security,
				responses: {
					"200": json_response("Projetos encontrados", {
						message: "Projetos encontrados com sucesso.",
						projects: [
							{
								project_id: 1,
								title: "TaskOps - Plataforma de Gestão",
								total_tasks: 6,
								completed_tasks: 2,
								total_members: 7,
								progress_percentage: 33.33,
							},
						],
					}),
					"401": json_response("Não autenticado", {
						message: "Token não fornecido no cabeçalho da requisição.",
						errorAt: "x-access-token",
					}),
				},
			},
			post: {
				tags: ["Projetos"],
				summary: "Cadastrar novo projeto",
				description:
					"Cria um novo projeto e vincula automaticamente o administrador criador em project_user.",
				"x-access": "Exclusivo Administrador",
				"x-test-url": "/projects",
				security: auth_security,
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["project_title"],
								properties: {
									project_title: {
										type: "string",
										maxLength: 256,
										description: "Título não vazio (até 256 caracteres)",
									},
								},
							},
							example: {
								project_title: "Projeto Teste API",
							},
						},
					},
				},
				responses: {
					"201": json_response("Projeto criado com sucesso", {
						message: "Projeto criado com sucesso.",
						project_id: 9,
						project: {
							project_id: 9,
							title: "Projeto Teste API",
						},
					}),
					"400": json_response("Título ausente ou em branco", {
						message: "O título do projeto não pode estar em branco.",
						errorAt: "project_title",
					}),
					"403": json_response("Usuário não é Administrador", {
						message:
							"Acesso negado. Apenas administradores podem registrar um novo projeto.",
					}),
				},
			},
		},
		"/projects/{project_id}": {
			get: {
				tags: ["Projetos"],
				summary: "Obter detalhes e contadores de um projeto",
				description:
					"Retorna o título do projeto e a contagem de demandas agrupada por cada um dos 5 status.",
				"x-access": "Administrador (todos) | Líder/Membro (vinculados)",
				"x-test-url": "/projects/1",
				security: auth_security,
				parameters: [
					{
						name: "project_id",
						in: "path",
						required: true,
						description: "ID inteiro positivo do projeto (ex: 1 a 8)",
						schema: { type: "integer", minimum: 1 },
						example: 1,
					},
				],
				responses: {
					"200": json_response("Detalhes do projeto", {
						message: "Informações do projeto obtidas com sucesso.",
						user_project: {
							project_id: 1,
							project_name: "TaskOps - Plataforma de Gestão",
							total_tasks: 6,
							abertas: 2,
							em_andamento: 1,
							em_revisao: 1,
							concluidas: 2,
							canceladas: 0,
						},
					}),
					"400": json_response("ID inválido", {
						message:
							"ID do projeto não fornecido ou inválido nos parâmetros da requisição.",
						errorAt: "project_id",
					}),
					"404": json_response("Projeto não encontrado ou sem acesso", {
						message:
							"Projeto não encontrado ou o usuário não tem acesso ao projeto.",
					}),
				},
			},
		},
		"/projects/{project_id}/tasks": {
			get: {
				tags: ["Projetos"],
				summary: "Listar todas as demandas de um projeto",
				description:
					"Utiliza LEFT JOIN com usuário responsável para retornar inclusive demandas sem responsável (ex.: projeto 4, task 19).",
				"x-access": "Administrador (todos) | Líder/Membro (vinculados)",
				"x-test-url": "/projects/4/tasks",
				security: auth_security,
				parameters: [
					{
						name: "project_id",
						in: "path",
						required: true,
						description: "ID inteiro positivo do projeto",
						schema: { type: "integer", minimum: 1 },
						example: 4,
					},
				],
				responses: {
					"200": json_response("Lista de tarefas do projeto", {
						message: "Lista de tarefas do projeto obtida com sucesso.",
						task_list: [
							{
								task_id: 19,
								task_name: "Otimizar carregamento de imagens",
								title: "Otimizar carregamento de imagens",
								description:
									"Reduzir o tamanho das imagens utilizadas no portal.",
								type: "MELHORIA",
								priority: "BAIXA",
								status: "ABERTA",
								creation_date: "2026-10-15T16:00:00.000Z",
								updated_at: "2026-10-15T16:00:00.000Z",
								due_date: "2026-11-22T21:00:00.000Z",
								fk_project_id: 4,
								fk_user_id: null,
								fk_creator_id: 2,
								user_id: null,
								responsible_user_name: null,
								profile_pic: null,
							},
						],
					}),
					"404": json_response("Projeto não encontrado ou sem acesso", {
						message:
							"Projeto não encontrado ou o usuário não tem acesso ao projeto.",
					}),
				},
			},
		},
		"/projects/{project_id}/members": {
			get: {
				tags: ["Projetos"],
				summary: "Listar membros vinculados ao projeto",
				description:
					"Lista os integrantes vinculados em project_user com total de tarefas atribuídas e concluídas.",
				"x-access": "Administrador (todos) | Líder/Membro (vinculados)",
				"x-test-url": "/projects/1/members",
				security: auth_security,
				parameters: [
					{
						name: "project_id",
						in: "path",
						required: true,
						description: "ID inteiro positivo do projeto",
						schema: { type: "integer", minimum: 1 },
						example: 1,
					},
				],
				responses: {
					"200": json_response("Membros do projeto", {
						message: "Usuários encontrados com sucesso.",
						users_list: [
							{
								member_id: 7,
								member_name: "Pedro Almeida",
								member_email: "pedro@taskops.com",
								access_level: "Membro da equipe",
								profile_pic: null,
								completed_tasks: 0,
								total_tasks: 1,
							},
						],
					}),
					"404": json_response("Projeto não encontrado ou sem acesso", {
						message:
							"Projeto não encontrado ou o usuário não tem acesso ao projeto.",
					}),
				},
			},
			post: {
				tags: ["Projetos"],
				summary: "Vincular um usuário ao projeto",
				description:
					"Adiciona um usuário existente na tabela project_user do projeto especificado.",
				"x-access": "Administrador | Líder de projeto vinculado",
				"x-test-url": "/projects/1/members",
				security: auth_security,
				parameters: [
					{
						name: "project_id",
						in: "path",
						required: true,
						description: "ID do projeto",
						schema: { type: "integer", minimum: 1 },
						example: 1,
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["user_id"],
								properties: {
									user_id: {
										type: "integer",
										minimum: 1,
										description: "ID do usuário existente a vincular (ex: 8)",
									},
								},
							},
							example: { user_id: 8 },
						},
					},
				},
				responses: {
					"201": json_response("Usuário vinculado com sucesso", {
						message: "Usuário vinculado ao projeto com sucesso.",
						member: {
							fk_project_id: 1,
							fk_user_id: 8,
							user: {
								user_id: 8,
								name: "Gabriela Souza",
								email: "gabriela@taskops.com",
								profile_pic: null,
								authority_level: "Membro da equipe",
							},
						},
					}),
					"400": json_response("ID de usuário inválido", {
						message:
							"ID do usuário a vincular deve ser um número inteiro positivo.",
						errorAt: "user_id",
					}),
					"403": json_response("Membro da equipe bloqueado", {
						message:
							"Acesso negado. Membros da equipe não podem modificar integrantes do projeto.",
					}),
					"404": json_response("Projeto ou usuário inexistente", {
						message: "Usuário informado não encontrado.",
						errorAt: "user_id",
					}),
					"409": json_response("Usuário já vinculado", {
						message: "O usuário já está vinculado a este projeto.",
						errorAt: "user_id",
					}),
				},
			},
		},
		"/projects/{project_id}/members/{user_id}": {
			get: {
				tags: ["Projetos"],
				summary: "Obter detalhes e tarefas de um membro no projeto",
				description:
					"Retorna perfil do membro, resumo do projeto e lista de demandas atribuídas a ele naquele projeto.",
				"x-access": "Administrador (todos) | Líder/Membro (vinculados)",
				"x-test-url": "/projects/1/members/7",
				security: auth_security,
				parameters: [
					{
						name: "project_id",
						in: "path",
						required: true,
						description: "ID do projeto",
						schema: { type: "integer", minimum: 1 },
						example: 1,
					},
					{
						name: "user_id",
						in: "path",
						required: true,
						description: "ID do membro",
						schema: { type: "integer", minimum: 1 },
						example: 7,
					},
				],
				responses: {
					"200": json_response("Detalhes do membro", {
						message: "Informações de usuário encontradas com sucesso.",
						data: {
							user_info: {
								user_id: 7,
								name: "Pedro Almeida",
								email: "pedro@taskops.com",
								profile_pic: null,
								authority_level: "Membro da equipe",
							},
							task_list: [
								{
									task_id: 6,
									task_title: "Criar documentação da API",
									type: "DOCUMENTACAO",
									due_date: "2026-11-23T21:00:00.000Z",
									priority: "BAIXA",
									status: "ABERTA",
								},
							],
							user_project: {
								project_id: 1,
								project_name: "TaskOps - Plataforma de Gestão",
								total_tasks: 6,
								abertas: 2,
								em_andamento: 1,
								em_revisao: 1,
								concluidas: 2,
								canceladas: 0,
							},
						},
					}),
					"404": json_response("Usuário não vinculado ou inexistente", {
						message: "O usuário alvo não está vinculado ao projeto.",
					}),
				},
			},
		},

		// ------------------------------------------------------------------------------------
		// DEMANDAS (TASKS)
		// ------------------------------------------------------------------------------------
		"/tasks": {
			get: {
				tags: ["Demandas"],
				summary:
					"Listar demandas com filtros combinados, busca textual e ordenação",
				description:
					"Permite filtrar simultaneamente por qualquer combinação de critérios (inclusive `mine=true` para listar apenas as suas demandas filtradas por status), buscar por texto em título/descrição (`q`) e ordenar por prioridade, criação, prazo ou status.",
				"x-access": "Administrador (todas) | Líder/Membro (projetos vinculados)",
				"x-test-url":
					"/tasks?mine=true&status=ABERTA,EM%20ANDAMENTO&sort_by=priority&sort_order=DESC",
				security: auth_security,
				parameters: [
					{
						name: "mine (alias: only_mine)",
						in: "query",
						required: false,
						description:
							"Filtra apenas demandas atribuídas ao usuário autenticado. Opções: true | false | 1 | 0",
						schema: { type: "boolean" },
						example: true,
					},
					{
						name: "status",
						in: "query",
						required: false,
						description:
							"Um ou múltiplos valores separados por vírgula. Opções: ABERTA | EM ANDAMENTO | EM REVISAO | CONCLUIDA | CANCELADA",
						schema: { type: "string" },
						example: "ABERTA,EM ANDAMENTO",
					},
					{
						name: "priority",
						in: "query",
						required: false,
						description:
							"Um ou múltiplos valores separados por vírgula. Opções: BAIXA | MEDIA | ALTA | CRITICA",
						schema: { type: "string" },
						example: "CRITICA,ALTA",
					},
					{
						name: "type",
						in: "query",
						required: false,
						description:
							"Um ou múltiplos valores separados por vírgula. Opções: TAREFA | DEFEITO | MELHORIA | DOCUMENTACAO",
						schema: { type: "string" },
						example: "DEFEITO",
					},
					{
						name: "fk_user_id (alias: responsible_id)",
						in: "query",
						required: false,
						description:
							"ID numérico do responsável OU 'unassigned' / 'null' / 'none' para demandas sem responsável",
						schema: { type: "string" },
						example: "7",
					},
					{
						name: "fk_project_id (alias: project_id)",
						in: "query",
						required: false,
						description: "ID inteiro positivo do projeto (ex: 1 a 8)",
						schema: { type: "integer", minimum: 1 },
						example: 1,
					},
					{
						name: "q (alias: search)",
						in: "query",
						required: false,
						description:
							"Texto pesquisado (LIKE) no título e na descrição da demanda",
						schema: { type: "string" },
						example: "permissões",
					},
					{
						name: "sort_by (alias: order_by)",
						in: "query",
						required: false,
						description:
							"Critério de ordenação. Opções: priority | creation_date (padrão) | due_date | status",
						schema: {
							type: "string",
							enum: ["priority", "creation_date", "due_date", "status"],
						},
						example: "priority",
					},
					{
						name: "sort_order (alias: order)",
						in: "query",
						required: false,
						description: "Direção da ordenação. Opções: ASC | DESC (padrão)",
						schema: { type: "string", enum: ["ASC", "DESC"] },
						example: "DESC",
					},
				],
				responses: {
					"200": json_response("Demandas listadas com sucesso", {
						message: "Demandas listadas com sucesso.",
						total: 1,
						tasks: [example_task],
					}),
					"400": json_response("Filtro ou ordenação inválida", {
						message:
							"Filtro status inválido: 'PENDENTE'. Valores aceitos: ABERTA, EM ANDAMENTO, EM REVISAO, CONCLUIDA, CANCELADA.",
						errorAt: "status",
					}),
					"403": json_response("Tentativa de filtrar projeto sem vínculo", {
						message:
							"Acesso negado. Você não está vinculado ao projeto informado.",
					}),
				},
			},
			post: {
				tags: ["Demandas"],
				summary: "Registrar nova demanda",
				description:
					"Cria uma nova demanda com status sempre forçado para 'ABERTA' e criador extraído do token JWT. Responsável (`fk_user_id`) e prazo (`due_date`) são opcionais. Ao informar `due_date`, consulta a BrasilAPI e bloqueia feriados nacionais.",
				"x-access": "Administrador | Líder de projeto vinculado",
				"x-test-url": "/tasks",
				security: auth_security,
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: [
									"title",
									"description",
									"type",
									"priority",
									"fk_project_id",
								],
								properties: {
									title: {
										type: "string",
										maxLength: 256,
										description: "Título obrigatório (até 256 caracteres)",
									},
									description: {
										type: "string",
										description: "Descrição detalhada obrigatória",
									},
									type: {
										type: "string",
										enum: ["TAREFA", "DEFEITO", "MELHORIA", "DOCUMENTACAO"],
									},
									priority: {
										type: "string",
										enum: ["BAIXA", "MEDIA", "ALTA", "CRITICA"],
									},
									fk_project_id: {
										type: "integer",
										minimum: 1,
										description: "ID do projeto associado (obrigatório)",
									},
									fk_user_id: {
										type: "integer",
										nullable: true,
										description: "ID do responsável (opcional / null)",
									},
									due_date: {
										type: "string",
										nullable: true,
										description:
											"Prazo YYYY-MM-DD ou ISO 8601 (opcional; bloqueado em feriados nacionais)",
									},
								},
							},
							examples: {
								completa: {
									summary: "1) Completa (dia útil + responsável)",
									value: {
										title: "Implementar exportação CSV",
										description:
											"Permitir exportar a listagem de demandas filtradas em CSV.",
										type: "MELHORIA",
										priority: "ALTA",
										fk_project_id: 1,
										fk_user_id: 7,
										due_date: "2026-12-22",
									},
								},
								sem_responsavel: {
									summary: "2) Sem responsável e sem prazo",
									value: {
										title: "Revisar documentação da API",
										description:
											"Atualizar endpoints e exemplos de requisição no README.",
										type: "DOCUMENTACAO",
										priority: "BAIXA",
										fk_project_id: 1,
									},
								},
								feriado_bloqueado: {
									summary: "3) Erro esperado: feriado nacional (Natal)",
									value: {
										title: "Entrega no Natal",
										description:
											"Deve ser bloqueado com HTTP 400 pela BrasilAPI.",
										type: "TAREFA",
										priority: "MEDIA",
										fk_project_id: 1,
										due_date: "2026-12-25",
									},
								},
							},
						},
					},
				},
				responses: {
					"201": json_response("Demanda criada com sucesso (status ABERTA)", {
						message: "Demanda criada com sucesso.",
						task: {
							...example_task,
							task_id: 41,
							title: "Implementar exportação CSV",
							type: "MELHORIA",
							priority: "ALTA",
							status: "ABERTA",
						},
					}),
					"400": json_response(
						"Erro de validação ou data em feriado nacional",
						{
							message:
								"A data informada para o prazo de finalização (2026-12-25) é um feriado nacional (Natal) e não pode ser utilizada.",
							errorAt: "due_date",
						},
					),
					"403": json_response("Membro da equipe ou projeto não vinculado", {
						message:
							"Acesso negado. Membros da equipe não têm permissão para criar demandas.",
					}),
					"404": json_response("Projeto ou usuário responsável não encontrado", {
						message: "Projeto associado não encontrado.",
						errorAt: "fk_project_id",
					}),
					"503": json_response("API externa de feriados indisponível", {
						message:
							"Não foi possível consultar a API externa de feriados nacionais para validar o prazo de finalização. Tente novamente.",
						errorAt: "due_date",
					}),
				},
			},
		},
		"/tasks/overview": {
			get: {
				tags: ["Demandas"],
				summary: "Visão geral das demandas vinculadas ao usuário",
				description:
					"Lista demandas onde o usuário é responsável ou criador (ou todas para Administrador), aceitando filtros opcionais por status, prioridade, tipo e busca textual.",
				"x-access": "Autenticada (todos os perfis)",
				"x-test-url": "/tasks/overview?status=ABERTA,EM%20ANDAMENTO",
				security: auth_security,
				parameters: [
					{
						name: "status",
						in: "query",
						required: false,
						description:
							"Opções: ABERTA | EM ANDAMENTO | EM REVISAO | CONCLUIDA | CANCELADA (múltiplos por vírgula)",
						schema: { type: "string" },
						example: "ABERTA,EM ANDAMENTO",
					},
					{
						name: "priority",
						in: "query",
						required: false,
						description: "Opções: BAIXA | MEDIA | ALTA | CRITICA",
						schema: { type: "string" },
						example: "ALTA",
					},
					{
						name: "type",
						in: "query",
						required: false,
						description: "Opções: TAREFA | DEFEITO | MELHORIA | DOCUMENTACAO",
						schema: { type: "string" },
						example: "TAREFA",
					},
					{
						name: "q (alias: search)",
						in: "query",
						required: false,
						description: "Busca textual em título e descrição",
						schema: { type: "string" },
						example: "API",
					},
				],
				responses: {
					"200": json_response("Tarefas encontradas", {
						message: "Tarefas encontradas com sucesso.",
						total: 1,
						tasks: [example_task],
					}),
					"400": json_response("Filtro inválido", {
						message:
							"Filtro status inválido: 'XYZ'. Valores aceitos: ABERTA, EM ANDAMENTO, EM REVISAO, CONCLUIDA, CANCELADA.",
						errorAt: "status",
					}),
				},
			},
		},
		"/tasks/dashboard": {
			get: {
				tags: ["Demandas"],
				summary: "Obter métricas consolidadas do Dashboard (Seção 2.4)",
				description:
					"Fornece todos os totalizadores exigidos: total geral, por cada um dos 5 status, por prioridade, por tipo, demandas críticas em aberto, demandas próximas do prazo e demandas atrasadas.",
				"x-access": "Administrador (global) | Líder/Membro (projetos vinculados)",
				"x-test-url": "/tasks/dashboard?project_id=1&days=7",
				security: auth_security,
				parameters: [
					{
						name: "project_id (alias: fk_project_id)",
						in: "query",
						required: false,
						description: "Filtra métricas de um projeto específico (opcional)",
						schema: { type: "integer", minimum: 1 },
						example: 1,
					},
					{
						name: "days",
						in: "query",
						required: false,
						description:
							"Quantidade de dias para 'próximas do prazo' (inteiro de 1 a 365; padrão: 7)",
						schema: { type: "integer", minimum: 1, maximum: 365 },
						example: 7,
					},
				],
				responses: {
					"200": json_response("Métricas do dashboard", {
						message: "Métricas do dashboard obtidas com sucesso.",
						dashboard: {
							total_tasks: 40,
							by_status: {
								ABERTA: 11,
								"EM ANDAMENTO": 8,
								"EM REVISAO": 8,
								CONCLUIDA: 10,
								CANCELADA: 3,
							},
							by_priority: {
								CRITICA: 11,
								ALTA: 15,
								MEDIA: 8,
								BAIXA: 6,
							},
							by_type: {
								TAREFA: 19,
								DEFEITO: 7,
								MELHORIA: 10,
								DOCUMENTACAO: 4,
							},
							critical_open_count: 1,
							critical_open_tasks: [example_task],
							upcoming_deadline_days: 7,
							upcoming_deadline_count: 0,
							upcoming_deadline_tasks: [],
							overdue_count: 0,
							overdue_tasks: [],
						},
					}),
					"400": json_response("Parâmetro inválido", {
						message:
							"Parâmetro days inválido. Informe um inteiro entre 1 e 365.",
						errorAt: "days",
					}),
					"403": json_response("Sem acesso ao projeto informado", {
						message:
							"Projeto não encontrado ou o usuário não tem acesso ao projeto informado.",
					}),
				},
			},
		},
		"/tasks/{task_id}": {
			get: {
				tags: ["Demandas"],
				summary: "Visualizar detalhes completos de uma demanda",
				description:
					"Retorna todos os campos da demanda, projeto associado, criador e responsável (ou null se sem responsável).",
				"x-access": "Administrador (todas) | Líder/Membro (projetos vinculados)",
				"x-test-url": "/tasks/5",
				security: auth_security,
				parameters: [
					{
						name: "task_id",
						in: "path",
						required: true,
						description: "ID inteiro positivo da demanda (ex: 1 a 40)",
						schema: { type: "integer", minimum: 1 },
						example: 5,
					},
				],
				responses: {
					"200": json_response("Detalhes da demanda", {
						message: "Detalhes da demanda obtidos com sucesso.",
						task: example_task,
					}),
					"403": json_response("Usuário não vinculado ao projeto", {
						message:
							"Acesso negado. Você não está vinculado ao projeto desta demanda.",
					}),
					"404": json_response("Demanda não encontrada", {
						message: "Demanda não encontrada.",
					}),
				},
			},
			put: {
				tags: ["Demandas"],
				summary: "Editar demanda (atualiza updated_at e grava histórico)",
				description:
					"Permite alterar título, descrição, tipo, prioridade, status (respeitando a máquina de estados), responsável (ou null para desatribuir) e prazo (validado contra feriados nacionais). Registra automaticamente na tabela `history` cada campo alterado.",
				"x-access": "Administrador | Líder de projeto vinculado",
				"x-test-url": "/tasks/5",
				security: auth_security,
				parameters: [
					{
						name: "task_id",
						in: "path",
						required: true,
						description: "ID da demanda",
						schema: { type: "integer", minimum: 1 },
						example: 5,
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									title: { type: "string", maxLength: 256 },
									description: { type: "string" },
									type: {
										type: "string",
										enum: ["TAREFA", "DEFEITO", "MELHORIA", "DOCUMENTACAO"],
									},
									priority: {
										type: "string",
										enum: ["BAIXA", "MEDIA", "ALTA", "CRITICA"],
									},
									status: {
										type: "string",
										enum: [
											"ABERTA",
											"EM ANDAMENTO",
											"EM REVISAO",
											"CONCLUIDA",
											"CANCELADA",
										],
									},
									fk_user_id: { type: "integer", nullable: true },
									due_date: { type: "string", nullable: true },
								},
							},
							examples: {
								editar_campos: {
									summary: "1) Atualizar título, prioridade, responsável e prazo",
									value: {
										title: "Corrigir erro crítico de permissões",
										priority: "ALTA",
										fk_user_id: 7,
										due_date: "2026-12-23",
									},
								},
								desatribuir: {
									summary: "2) Remover responsável e limpar prazo",
									value: {
										fk_user_id: null,
										due_date: null,
									},
								},
							},
						},
					},
				},
				responses: {
					"200": json_response("Demanda atualizada com sucesso", {
						message: "Demanda atualizada com sucesso.",
						task: {
							...example_task,
							title: "Corrigir erro crítico de permissões",
							priority: "ALTA",
							fk_user_id: 7,
						},
					}),
					"400": json_response(
						"Feriado nacional, transição proibida ou demanda encerrada",
						{
							message:
								"Não é possível editar uma demanda com status 'CONCLUIDA'.",
						},
					),
					"403": json_response("Membro da equipe bloqueado", {
						message:
							"Acesso negado. Membros da equipe não podem editar demandas, alterar prioridade ou modificar responsáveis.",
					}),
					"404": json_response("Demanda ou responsável não encontrado", {
						message: "Demanda não encontrada.",
					}),
				},
			},
			patch: {
				tags: ["Demandas"],
				summary: "Editar demanda parcialmente",
				description:
					"Aceita atualização parcial com exatamente as mesmas validações, checagem de feriados e histórico automático do `PUT /tasks/{task_id}`.",
				"x-access": "Administrador | Líder de projeto vinculado",
				"x-test-url": "/tasks/5",
				security: auth_security,
				parameters: [
					{
						name: "task_id",
						in: "path",
						required: true,
						description: "ID da demanda",
						schema: { type: "integer", minimum: 1 },
						example: 5,
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									priority: {
										type: "string",
										enum: ["BAIXA", "MEDIA", "ALTA", "CRITICA"],
									},
									fk_user_id: { type: "integer", nullable: true },
								},
							},
							example: {
								priority: "CRITICA",
								fk_user_id: 7,
							},
						},
					},
				},
				responses: {
					"200": json_response("Demanda atualizada", {
						message: "Demanda atualizada com sucesso.",
						task: example_task,
					}),
					"400": json_response("Nenhum campo válido informado", {
						message:
							"Informe ao menos um campo válido para atualização da demanda.",
					}),
					"403": json_response("Sem permissão", {
						message:
							"Acesso negado. Membros da equipe não podem editar demandas, alterar prioridade ou modificar responsáveis.",
					}),
				},
			},
			delete: {
				tags: ["Demandas"],
				summary: "Exclusão física bloqueada (Seção 2.2.8)",
				description:
					"A exclusão física de demandas no banco de dados é proibida. Retorna sempre HTTP 405 orientando o uso do cancelamento lógico.",
				"x-access": "Bloqueada para todos os perfis (HTTP 405)",
				"x-test-url": "/tasks/5",
				security: auth_security,
				parameters: [
					{
						name: "task_id",
						in: "path",
						required: true,
						description: "ID da demanda",
						schema: { type: "integer", minimum: 1 },
						example: 5,
					},
				],
				responses: {
					"405": json_response("Exclusão física proibida", {
						message:
							"A exclusão física de demandas não é permitida. Utilize o cancelamento (PATCH /tasks/:task_id/cancel).",
					}),
				},
			},
		},
		"/tasks/{task_id}/status": {
			patch: {
				tags: ["Demandas"],
				summary: "Atualizar status da demanda (ciclo de vida + RBAC)",
				description:
					"Transições permitidas: ABERTA -> EM ANDAMENTO | CANCELADA; EM ANDAMENTO -> EM REVISAO | CANCELADA; EM REVISAO -> CONCLUIDA | EM ANDAMENTO | CANCELADA. Proibidas: EM ANDAMENTO -> CONCLUIDA, EM ANDAMENTO -> ABERTA e alterar/cancelar demanda CONCLUIDA ou CANCELADA. Membro da equipe só pode mover ABERTA -> EM ANDAMENTO e EM ANDAMENTO -> EM REVISAO nas demandas atribuídas a ele.",
				"x-access": "Admin/Líder (fluxo completo) | Membro (atribuídas: iniciar/revisão)",
				"x-test-url": "/tasks/6/status",
				security: auth_security,
				parameters: [
					{
						name: "task_id",
						in: "path",
						required: true,
						description:
							"ID da demanda (ex: task 6 está ABERTA e atribuída ao Membro id 7)",
						schema: { type: "integer", minimum: 1 },
						example: 6,
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["status"],
								properties: {
									status: {
										type: "string",
										enum: [
											"ABERTA",
											"EM ANDAMENTO",
											"EM REVISAO",
											"CONCLUIDA",
											"CANCELADA",
										],
									},
									due_date: {
										type: "string",
										nullable: true,
										description:
											"Opcional (apenas Admin/Líder) para definir prazo ao iniciar a demanda",
									},
								},
							},
							examples: {
								iniciar: {
									summary: "1) ABERTA -> EM ANDAMENTO (Membro atribuído / Líder / Admin)",
									value: { status: "EM ANDAMENTO" },
								},
								enviar_revisao: {
									summary: "2) EM ANDAMENTO -> EM REVISAO (Membro atribuído / Líder / Admin)",
									value: { status: "EM REVISAO" },
								},
								concluir: {
									summary: "3) EM REVISAO -> CONCLUIDA (somente Líder / Admin)",
									value: { status: "CONCLUIDA" },
								},
								retornar_andamento: {
									summary: "4) EM REVISAO -> EM ANDAMENTO (somente Líder / Admin)",
									value: { status: "EM ANDAMENTO" },
								},
							},
						},
					},
				},
				responses: {
					"200": json_response("Status atualizado + registro em history", {
						message: "Status da demanda atualizado com sucesso.",
						task: { ...example_task, task_id: 6, status: "EM ANDAMENTO" },
					}),
					"400": json_response("Transição proibida pela máquina de estados", {
						message:
							"Uma demanda não pode ser concluída diretamente a partir de EM ANDAMENTO. Ela deve passar primeiro por EM REVISAO.",
						errorAt: "status",
					}),
					"403": json_response("Perfil sem permissão para esta transição", {
						message:
							"Acesso negado. Membros da equipe podem realizar apenas as transições de ABERTA para EM ANDAMENTO e de EM ANDAMENTO para EM REVISAO.",
						errorAt: "status",
					}),
					"404": json_response("Demanda não encontrada", {
						message: "Demanda não encontrada.",
					}),
				},
			},
		},
		"/tasks/{task_id}/cancel": {
			patch: {
				tags: ["Demandas"],
				summary: "Cancelar demanda sem exclusão física",
				description:
					"Altera o status para 'CANCELADA' e registra no histórico, preservando todos os dados. Não exige corpo JSON. Bloqueado para demandas já concluídas.",
				"x-access": "Administrador | Líder de projeto vinculado",
				"x-test-url": "/tasks/5/cancel",
				security: auth_security,
				parameters: [
					{
						name: "task_id",
						in: "path",
						required: true,
						description: "ID da demanda (não pode estar CONCLUIDA)",
						schema: { type: "integer", minimum: 1 },
						example: 5,
					},
				],
				responses: {
					"200": json_response("Demanda cancelada com sucesso", {
						message: "Demanda cancelada com sucesso.",
						task: { ...example_task, status: "CANCELADA" },
					}),
					"400": json_response("Demanda já concluída ou já cancelada", {
						message: "Não é permitido cancelar uma demanda já concluída.",
					}),
					"403": json_response("Membro da equipe não pode cancelar", {
						message:
							"Acesso negado. Membros da equipe não têm permissão para cancelar demandas.",
					}),
					"404": json_response("Demanda não encontrada", {
						message: "Demanda não encontrada.",
					}),
				},
			},
		},

		// ------------------------------------------------------------------------------------
		// COMENTÁRIOS E HISTÓRICO
		// ------------------------------------------------------------------------------------
		"/tasks/{task_id}/comments": {
			get: {
				tags: ["Comentários e Histórico"],
				summary: "Listar comentários da demanda",
				description:
					"Retorna todos os comentários vinculados à demanda em ordem cronológica com dados do autor e data/hora.",
				"x-access": "Administrador | Líder/Membro vinculados ao projeto",
				"x-test-url": "/tasks/5/comments",
				security: auth_security,
				parameters: [
					{
						name: "task_id",
						in: "path",
						required: true,
						description: "ID da demanda",
						schema: { type: "integer", minimum: 1 },
						example: 5,
					},
				],
				responses: {
					"200": json_response("Comentários listados", {
						message: "Comentários obtidos com sucesso.",
						comments: [example_comment],
					}),
					"403": json_response("Sem acesso ao projeto", {
						message:
							"Acesso negado. Você não está vinculado ao projeto desta demanda.",
					}),
					"404": json_response("Demanda não encontrada", {
						message: "Demanda não encontrada.",
					}),
				},
			},
			post: {
				tags: ["Comentários e Histórico"],
				summary: "Adicionar comentário a uma demanda",
				description:
					"Registra um novo comentário vinculado à demanda e ao usuário autenticado, gravando data/horário automaticamente.",
				"x-access": "Todos os perfis com acesso ao projeto",
				"x-test-url": "/tasks/5/comments",
				security: auth_security,
				parameters: [
					{
						name: "task_id",
						in: "path",
						required: true,
						description: "ID da demanda",
						schema: { type: "integer", minimum: 1 },
						example: 5,
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["content"],
								properties: {
									content: {
										type: "string",
										description: "Texto do comentário (obrigatório, não vazio)",
									},
								},
							},
							example: {
								content:
									"Iniciei a investigação das permissões administrativas.",
							},
						},
					},
				},
				responses: {
					"201": json_response("Comentário registrado", {
						message: "Comentário registrado com sucesso.",
						comment: example_comment,
					}),
					"400": json_response("Conteúdo vazio", {
						message: "O conteúdo do comentário é obrigatório.",
						errorAt: "content",
					}),
					"403": json_response("Sem acesso ao projeto", {
						message:
							"Acesso negado. Você não está vinculado ao projeto desta demanda.",
					}),
					"404": json_response("Demanda não encontrada", {
						message: "Demanda não encontrada.",
					}),
				},
			},
		},
		"/tasks/{task_id}/history": {
			get: {
				tags: ["Comentários e Histórico"],
				summary:
					"Puxar histórico completo da demanda (modificações + comentários)",
				description:
					"Retorna em uma única chamada a lista de modificações automáticas (`history`, com frase legível em português no campo `summary`) e a lista de comentários (`comments`) da demanda.",
				"x-access": "Todos os perfis com acesso ao projeto",
				"x-test-url": "/tasks/5/history",
				security: auth_security,
				parameters: [
					{
						name: "task_id",
						in: "path",
						required: true,
						description: "ID da demanda",
						schema: { type: "integer", minimum: 1 },
						example: 5,
					},
				],
				responses: {
					"200": json_response(
						"Histórico de alterações e comentários da demanda",
						{
							message: "Histórico da demanda obtido com sucesso.",
							history: [example_history_item],
							comments: [example_comment],
						},
					),
					"403": json_response("Sem acesso ao projeto", {
						message:
							"Acesso negado. Você não está vinculado ao projeto desta demanda.",
					}),
					"404": json_response("Demanda não encontrada", {
						message: "Demanda não encontrada.",
					}),
				},
			},
		},
	},
};

// O============================================================================================O

/**
 * Gera uma página HTML autossuficiente (sem dependências externas de CDN) exibindo
 * todas as rotas da API, todas as opções de parâmetros, JSONs prontos para teste e
 * respostas esperadas em JSON, com busca, filtro por módulo e cópia em um clique.
 */
export const render_swagger_html = (): string => {
	const safe_spec_json = JSON.stringify(openapi_spec).replace(
		/<\//g,
		"<\\/",
	);

	return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>TaskOps API — Documentação de Rotas e Testes</title>
	<style>
		:root {
			--bg: #0b1120;
			--surface: #111827;
			--surface-2: #1e293b;
			--border: #263248;
			--text: #f1f5f9;
			--muted: #94a3b8;
			--accent: #38bdf8;
			--get: #2563eb;
			--post: #16a34a;
			--put: #d97706;
			--patch: #0d9488;
			--delete: #dc2626;
			--ok: #22c55e;
			--warn: #f59e0b;
			--err: #ef4444;
		}
		* { box-sizing: border-box; }
		body {
			margin: 0;
			background: var(--bg);
			color: var(--text);
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			line-height: 1.5;
		}
		a { color: var(--accent); text-decoration: none; }
		a:hover { text-decoration: underline; }
		.layout {
			display: grid;
			grid-template-columns: 270px 1fr;
			min-height: 100vh;
		}
		@media (max-width: 960px) {
			.layout { grid-template-columns: 1fr; }
			.sidebar { position: static !important; height: auto !important; border-right: none !important; border-bottom: 1px solid var(--border); }
		}
		.sidebar {
			position: sticky;
			top: 0;
			height: 100vh;
			overflow-y: auto;
			background: var(--surface);
			border-right: 1px solid var(--border);
			padding: 20px 16px;
		}
		.brand {
			font-size: 20px;
			font-weight: 700;
			margin: 0 0 4px;
			color: #fff;
		}
		.version-pill {
			display: inline-block;
			font-size: 11px;
			background: #1e3a5f;
			color: var(--accent);
			padding: 2px 8px;
			border-radius: 999px;
			font-weight: 600;
			margin-bottom: 14px;
		}
		.search-input {
			width: 100%;
			padding: 9px 12px;
			border-radius: 8px;
			border: 1px solid var(--border);
			background: var(--bg);
			color: var(--text);
			font-size: 13px;
			margin-bottom: 14px;
		}
		.search-input:focus { outline: 2px solid var(--accent); border-color: transparent; }
		.nav-group { margin-bottom: 16px; }
		.nav-group-title {
			font-size: 11px;
			text-transform: uppercase;
			letter-spacing: 0.08em;
			color: var(--muted);
			margin: 0 0 6px;
			padding-left: 6px;
		}
		.nav-link {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 5px 8px;
			border-radius: 6px;
			font-size: 12px;
			color: #cbd5e1;
			margin-bottom: 2px;
		}
		.nav-link:hover { background: var(--surface-2); text-decoration: none; color: #fff; }
		.mini-badge {
			font-size: 10px;
			font-weight: 700;
			padding: 1px 5px;
			border-radius: 4px;
			color: #fff;
			min-width: 44px;
			text-align: center;
			text-transform: uppercase;
		}
		.main {
			padding: 28px 32px 80px;
			max-width: 1160px;
			width: 100%;
		}
		.hero {
			background: linear-gradient(135deg, #111827 0%, #172554 100%);
			border: 1px solid var(--border);
			border-radius: 14px;
			padding: 24px 26px;
			margin-bottom: 24px;
		}
		.hero h1 { margin: 0 0 8px; font-size: 26px; }
		.hero p { margin: 0 0 14px; color: #cbd5e1; font-size: 14px; }
		.info-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
			gap: 12px;
			margin-top: 14px;
		}
		.info-box {
			background: rgba(15, 23, 42, 0.72);
			border: 1px solid var(--border);
			border-radius: 10px;
			padding: 12px 14px;
			font-size: 13px;
		}
		.info-box strong { display: block; margin-bottom: 6px; color: var(--accent); font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
		.info-box code {
			background: #0f172a;
			padding: 2px 6px;
			border-radius: 4px;
			color: #e2e8f0;
			font-size: 12px;
		}
		.toolbar {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			align-items: center;
			margin-bottom: 20px;
		}
		.btn {
			background: var(--surface-2);
			color: var(--text);
			border: 1px solid var(--border);
			border-radius: 7px;
			padding: 7px 12px;
			font-size: 12px;
			font-weight: 600;
			cursor: pointer;
		}
		.btn:hover { background: #334155; }
		.btn.active { background: var(--accent); color: #0b1120; border-color: var(--accent); }
		.btn-copy {
			background: #1e293b;
			color: #cbd5e1;
			border: 1px solid #334155;
			border-radius: 6px;
			padding: 3px 9px;
			font-size: 11px;
			cursor: pointer;
		}
		.btn-copy:hover { background: #334155; color: #fff; }
		.tag-section { margin-bottom: 34px; }
		.tag-header {
			display: flex;
			align-items: baseline;
			gap: 12px;
			border-bottom: 1px solid var(--border);
			padding-bottom: 8px;
			margin-bottom: 16px;
		}
		.tag-header h2 { margin: 0; font-size: 20px; }
		.tag-header span { color: var(--muted); font-size: 13px; }
		.endpoint {
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: 12px;
			margin-bottom: 16px;
			overflow: hidden;
		}
		.endpoint-head {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 10px;
			padding: 13px 16px;
			background: rgba(30, 41, 59, 0.55);
			cursor: pointer;
			list-style: none;
		}
		.endpoint-head::-webkit-details-marker { display: none; }
		.method {
			font-size: 12px;
			font-weight: 700;
			padding: 4px 10px;
			border-radius: 6px;
			color: #fff;
			min-width: 68px;
			text-align: center;
			text-transform: uppercase;
		}
		.m-get { background: var(--get); }
		.m-post { background: var(--post); }
		.m-put { background: var(--put); }
		.m-patch { background: var(--patch); }
		.m-delete { background: var(--delete); }
		.path {
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			font-size: 14px;
			font-weight: 700;
			color: #fff;
		}
		.summary { color: #cbd5e1; font-size: 13px; flex: 1; min-width: 200px; }
		.access-pill {
			font-size: 11px;
			padding: 3px 9px;
			border-radius: 999px;
			background: #0f172a;
			border: 1px solid var(--border);
			color: #93c5fd;
			white-space: nowrap;
		}
		.endpoint-body {
			padding: 16px 18px 18px;
			border-top: 1px solid var(--border);
		}
		.desc { margin: 0 0 14px; color: #cbd5e1; font-size: 13.5px; }
		.test-url-bar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 10px;
			background: #090f1d;
			border: 1px solid var(--border);
			border-radius: 8px;
			padding: 8px 12px;
			margin-bottom: 16px;
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			font-size: 12.5px;
			color: #7dd3fc;
			overflow-x: auto;
		}
		.section-label {
			font-size: 12px;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.06em;
			color: var(--muted);
			margin: 16px 0 8px;
		}
		table {
			width: 100%;
			border-collapse: collapse;
			font-size: 12.5px;
			margin-bottom: 14px;
			background: #0d1424;
			border-radius: 8px;
			overflow: hidden;
		}
		th, td {
			text-align: left;
			padding: 8px 10px;
			border-bottom: 1px solid var(--border);
			vertical-align: top;
		}
		th { background: #162033; color: #cbd5e1; font-weight: 600; }
		tr:last-child td { border-bottom: none; }
		.req-tag {
			font-size: 10px;
			padding: 1px 6px;
			border-radius: 4px;
			font-weight: 700;
		}
		.req-yes { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
		.req-no { background: rgba(148, 163, 184, 0.16); color: #cbd5e1; }
		.code-block {
			background: #070c17;
			border: 1px solid var(--border);
			border-radius: 8px;
			margin-bottom: 12px;
			overflow: hidden;
		}
		.code-bar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 6px 12px;
			background: #131d31;
			border-bottom: 1px solid var(--border);
			font-size: 12px;
			color: #cbd5e1;
		}
		pre {
			margin: 0;
			padding: 12px 14px;
			overflow-x: auto;
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			font-size: 12.5px;
			color: #e2e8f0;
			line-height: 1.45;
		}
		.status-badge {
			display: inline-block;
			font-weight: 700;
			font-size: 11px;
			padding: 2px 7px;
			border-radius: 5px;
			margin-right: 8px;
		}
		.s-2xx { background: rgba(34, 197, 94, 0.2); color: #86efac; }
		.s-4xx { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
		.s-5xx { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
		.responses-grid {
			display: grid;
			grid-template-columns: 1fr;
			gap: 10px;
		}
		.examples-tabs {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
			margin-bottom: 8px;
		}
		.hidden { display: none !important; }
		.enum-list {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
			margin-top: 6px;
		}
		.enum-chip {
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			font-size: 11px;
			padding: 2px 7px;
			border-radius: 5px;
			background: #172033;
			border: 1px solid #2b3a55;
			color: #e2e8f0;
		}
	</style>
</head>
<body>
	<div class="layout">
		<aside class="sidebar">
			<h1 class="brand">TaskOps API</h1>
			<span class="version-pill">REST • OpenAPI 3.0.3 • v1.0.0</span>
			<input id="searchInput" class="search-input" type="search" placeholder="Filtrar rotas (ex: tasks, status, login)..." />
			<div id="sidebarNav"></div>
		</aside>

		<main class="main">
			<section class="hero">
				<h1>TaskOps API — Todas as Rotas e JSONs de Teste</h1>
				<p>
					Referência completa da API de acompanhamento de demandas. Todos os endpoints abaixo exibem parâmetros aceitos,
					exemplos de requisição em JSON prontos para colar no Insomnia/Postman e todas as respostas esperadas em JSON.
					Especificação OpenAPI bruta: <a href="/openapi.json" target="_blank">/openapi.json</a>.
				</p>
				<div class="info-grid">
					<div class="info-box">
						<strong>Base URL Atual</strong>
						<code id="baseUrlText">http://localhost:3000</code>
						<div style="margin-top:6px;color:#94a3b8;font-size:12px;">
							Header obrigatório nas rotas protegidas:<br />
							<code>x-access-token: &lt;JWT&gt;</code><br />
							ou <code>Authorization: Bearer &lt;JWT&gt;</code>
						</div>
					</div>
					<div class="info-box">
						<strong>Usuários de Teste (senha: PassW0rd@123)</strong>
						<div><strong>Admin (id 1):</strong> <code>carlos@taskops.com</code></div>
						<div><strong>Líder (id 2):</strong> <code>mariana@taskops.com</code></div>
						<div><strong>Membro (id 7):</strong> <code>pedro@taskops.com</code></div>
					</div>
					<div class="info-box">
						<strong>Enums Válidos de Demandas</strong>
						<div style="font-size:12px;color:#cbd5e1;">
							<strong>Tipo:</strong> <code>TAREFA</code> <code>DEFEITO</code> <code>MELHORIA</code> <code>DOCUMENTACAO</code><br />
							<strong>Prioridade:</strong> <code>BAIXA</code> <code>MEDIA</code> <code>ALTA</code> <code>CRITICA</code><br />
							<strong>Status:</strong> <code>ABERTA</code> <code>EM ANDAMENTO</code> <code>EM REVISAO</code> <code>CONCLUIDA</code> <code>CANCELADA</code>
						</div>
					</div>
				</div>
			</section>

			<div class="toolbar">
				<button class="btn active" data-tag="ALL">Todas as rotas</button>
				<span id="tagButtons" style="display:contents;"></span>
				<span style="flex:1;"></span>
				<button class="btn" id="expandAllBtn">Expandir todas</button>
				<button class="btn" id="collapseAllBtn">Recolher todas</button>
			</div>

			<div id="routesContainer"></div>
		</main>
	</div>

	<script id="openapi-spec" type="application/json">${safe_spec_json}</script>
	<script>
		(function () {
			const spec = JSON.parse(document.getElementById("openapi-spec").textContent);
			const origin = window.location.origin || "http://localhost:3000";
			document.getElementById("baseUrlText").textContent = origin;

			const esc = (v) =>
				String(v ?? "")
					.replace(/&/g, "&amp;")
					.replace(/</g, "&lt;")
					.replace(/>/g, "&gt;")
					.replace(/"/g, "&quot;");

			const copyText = async (text, btn) => {
				try {
					await navigator.clipboard.writeText(text);
					const old = btn.textContent;
					btn.textContent = "Copiado!";
					setTimeout(() => (btn.textContent = old), 1200);
				} catch {
					const ta = document.createElement("textarea");
					ta.value = text;
					document.body.appendChild(ta);
					ta.select();
					document.execCommand("copy");
					document.body.removeChild(ta);
					const old = btn.textContent;
					btn.textContent = "Copiado!";
					setTimeout(() => (btn.textContent = old), 1200);
				}
			};

			// Agrupa todas as operações por tag na ordem declarada
			const groups = new Map();
			for (const tag of spec.tags) {
				groups.set(tag.name, { ...tag, items: [] });
			}

			let uid = 0;
			for (const [path, methods] of Object.entries(spec.paths)) {
				for (const [method, op] of Object.entries(methods)) {
					const tagName = (op.tags && op.tags[0]) || "Outros";
					if (!groups.has(tagName)) {
						groups.set(tagName, { name: tagName, description: "", items: [] });
					}
					uid += 1;
					groups.get(tagName).items.push({
						id: "route-" + uid,
						method: method.toLowerCase(),
						path,
						op,
					});
				}
			}

			const sidebarNav = document.getElementById("sidebarNav");
			const tagButtons = document.getElementById("tagButtons");
			const container = document.getElementById("routesContainer");

			let navHtml = "";
			let tagBtnsHtml = "";
			let sectionsHtml = "";
			const copyRegistry = new Map();

			const registerCopy = (value) => {
				const key = "cp-" + copyRegistry.size;
				copyRegistry.set(key, value);
				return key;
			};

			for (const group of groups.values()) {
				tagBtnsHtml += '<button class="btn" data-tag="' + esc(group.name) + '">' + esc(group.name) + ' (' + group.items.length + ')</button>';

				navHtml += '<div class="nav-group"><div class="nav-group-title">' + esc(group.name) + '</div>';
				for (const item of group.items) {
					navHtml += '<a class="nav-link" href="#' + item.id + '">';
					navHtml += '<span class="mini-badge m-' + item.method + '">' + item.method + '</span>';
					navHtml += '<span>' + esc(item.path) + '</span>';
					navHtml += '</a>';
				}
				navHtml += '</div>';

				sectionsHtml += '<section class="tag-section" data-section-tag="' + esc(group.name) + '">';
				sectionsHtml += '<div class="tag-header"><h2>' + esc(group.name) + '</h2><span>' + esc(group.description) + '</span></div>';

				for (const item of group.items) {
					const { id, method, path, op } = item;
					const testPath = op["x-test-url"] || path;
					const fullUrl = origin + testPath;
					const urlCopyKey = registerCopy(fullUrl);
					const accessLabel = op["x-access"] || (op.security ? "Autenticada" : "Pública");
					const searchBlob = (method + " " + path + " " + (op.summary || "") + " " + (op.description || "") + " " + group.name).toLowerCase();

					sectionsHtml += '<details class="endpoint" open id="' + id + '" data-search="' + esc(searchBlob) + '">';
					sectionsHtml += '<summary class="endpoint-head">';
					sectionsHtml += '<span class="method m-' + method + '">' + method.toUpperCase() + '</span>';
					sectionsHtml += '<span class="path">' + esc(path) + '</span>';
					sectionsHtml += '<span class="summary">' + esc(op.summary || "") + '</span>';
					sectionsHtml += '<span class="access-pill">' + esc(accessLabel) + '</span>';
					sectionsHtml += '</summary>';

					sectionsHtml += '<div class="endpoint-body">';
					if (op.description) {
						sectionsHtml += '<p class="desc">' + esc(op.description) + '</p>';
					}

					sectionsHtml += '<div class="test-url-bar"><span><strong>' + method.toUpperCase() + '</strong> ' + esc(fullUrl) + '</span>';
					sectionsHtml += '<button class="btn-copy" data-copy="' + urlCopyKey + '">Copiar URL</button></div>';

					// Headers + Path + Query params table
					const allParams = [];
					if (op.security && op.security.length) {
						allParams.push({
							name: "x-access-token (ou Authorization)",
							in: "header",
							required: true,
							type: "string (JWT)",
							description: "Token obtido em POST /users/login. Aceita 'x-access-token: <JWT>' ou 'Authorization: Bearer <JWT>'.",
							example: "eyJhbGciOiJIUzI1NiIs...",
						});
					}
					if (Array.isArray(op.parameters)) {
						for (const p of op.parameters) {
							const schemaType = p.schema ? (p.schema.enum ? p.schema.type + " (" + p.schema.enum.join(" | ") + ")" : p.schema.type) : "string";
							allParams.push({
								name: p.name,
								in: p.in,
								required: Boolean(p.required),
								type: schemaType,
								description: p.description || "",
								example: p.example !== undefined ? String(p.example) : "",
							});
						}
					}

					if (allParams.length > 0) {
						sectionsHtml += '<div class="section-label">Parâmetros de Entrada (Header / Path / Query)</div>';
						sectionsHtml += '<table><thead><tr><th>Nome</th><th>Local</th><th>Obrigatório</th><th>Tipo / Opções</th><th>Descrição</th><th>Exemplo</th></tr></thead><tbody>';
						for (const p of allParams) {
							sectionsHtml += '<tr>';
							sectionsHtml += '<td><code>' + esc(p.name) + '</code></td>';
							sectionsHtml += '<td><code>' + esc(p.in) + '</code></td>';
							sectionsHtml += '<td><span class="req-tag ' + (p.required ? "req-yes" : "req-no") + '">' + (p.required ? "Sim" : "Opcional") + '</span></td>';
							sectionsHtml += '<td><code>' + esc(p.type) + '</code></td>';
							sectionsHtml += '<td>' + esc(p.description) + '</td>';
							sectionsHtml += '<td><code>' + esc(p.example) + '</code></td>';
							sectionsHtml += '</tr>';
						}
						sectionsHtml += '</tbody></table>';
					}

					// Campos do Body JSON (tabela de schema) + JSON(s) prontos para teste
					const media = op.requestBody && op.requestBody.content && op.requestBody.content["application/json"];
					if (media) {
						const schema = media.schema || {};
						if (schema.properties) {
							const reqFields = new Set(schema.required || []);
							sectionsHtml += '<div class="section-label">Campos do Corpo JSON (Request Body)</div>';
							sectionsHtml += '<table><thead><tr><th>Campo</th><th>Obrigatório</th><th>Tipo / Valores Possíveis</th><th>Descrição</th></tr></thead><tbody>';
							for (const [fieldName, prop] of Object.entries(schema.properties)) {
								let typeDesc = prop.type || "any";
								if (prop.nullable) typeDesc += " | null";
								if (prop.enum) typeDesc += " (" + prop.enum.join(" | ") + ")";
								sectionsHtml += '<tr>';
								sectionsHtml += '<td><code>' + esc(fieldName) + '</code></td>';
								sectionsHtml += '<td><span class="req-tag ' + (reqFields.has(fieldName) ? "req-yes" : "req-no") + '">' + (reqFields.has(fieldName) ? "Sim" : "Opcional") + '</span></td>';
								sectionsHtml += '<td><code>' + esc(typeDesc) + '</code></td>';
								sectionsHtml += '<td>' + esc(prop.description || "") + '</td>';
								sectionsHtml += '</tr>';
							}
							sectionsHtml += '</tbody></table>';
						}

						sectionsHtml += '<div class="section-label">JSON para Teste (Request Body)</div>';
						if (media.examples) {
							for (const [, exObj] of Object.entries(media.examples)) {
								const formatted = JSON.stringify(exObj.value, null, 2);
								const cpKey = registerCopy(formatted);
								sectionsHtml += '<div class="code-block">';
								sectionsHtml += '<div class="code-bar"><span>' + esc(exObj.summary || "Exemplo JSON") + '</span><button class="btn-copy" data-copy="' + cpKey + '">Copiar JSON</button></div>';
								sectionsHtml += '<pre>' + esc(formatted) + '</pre>';
								sectionsHtml += '</div>';
							}
						} else if (media.example) {
							const formatted = JSON.stringify(media.example, null, 2);
							const cpKey = registerCopy(formatted);
							sectionsHtml += '<div class="code-block">';
							sectionsHtml += '<div class="code-bar"><span>application/json</span><button class="btn-copy" data-copy="' + cpKey + '">Copiar JSON</button></div>';
							sectionsHtml += '<pre>' + esc(formatted) + '</pre>';
							sectionsHtml += '</div>';
						}
					}

					// Respostas esperadas em JSON
					if (op.responses) {
						sectionsHtml += '<div class="section-label">Respostas Esperadas (JSON)</div>';
						sectionsHtml += '<div class="responses-grid">';
						for (const [code, resp] of Object.entries(op.responses)) {
							const cls = code.startsWith("2") ? "s-2xx" : code.startsWith("5") ? "s-5xx" : "s-4xx";
							const ex = resp.content && resp.content["application/json"] ? resp.content["application/json"].example : null;
							const formatted = ex ? JSON.stringify(ex, null, 2) : "{}";
							const cpKey = registerCopy(formatted);
							sectionsHtml += '<div class="code-block">';
							sectionsHtml += '<div class="code-bar"><span><span class="status-badge ' + cls + '">HTTP ' + esc(code) + '</span>' + esc(resp.description || "") + '</span>';
							sectionsHtml += '<button class="btn-copy" data-copy="' + cpKey + '">Copiar JSON</button></div>';
							sectionsHtml += '<pre>' + esc(formatted) + '</pre>';
							sectionsHtml += '</div>';
						}
						sectionsHtml += '</div>';
					}

					sectionsHtml += '</div></details>';
				}

				sectionsHtml += '</section>';
			}

			sidebarNav.innerHTML = navHtml;
			tagButtons.innerHTML = tagBtnsHtml;
			container.innerHTML = sectionsHtml;

			// Botões de cópia
			document.addEventListener("click", (e) => {
				const btn = e.target.closest("[data-copy]");
				if (!btn) return;
				const text = copyRegistry.get(btn.getAttribute("data-copy"));
				if (text !== undefined) copyText(text, btn);
			});

			// Filtro por módulo (tag)
			let activeTag = "ALL";
			const applyFilters = () => {
				const term = document.getElementById("searchInput").value.trim().toLowerCase();
				document.querySelectorAll(".tag-section").forEach((sec) => {
					const secTag = sec.getAttribute("data-section-tag");
					const tagMatches = activeTag === "ALL" || secTag === activeTag;
					let visibleCards = 0;
					sec.querySelectorAll(".endpoint").forEach((card) => {
						const textMatches = !term || card.getAttribute("data-search").includes(term);
						const show = tagMatches && textMatches;
						card.classList.toggle("hidden", !show);
						if (show) visibleCards += 1;
					});
					sec.classList.toggle("hidden", visibleCards === 0);
				});
			};

			document.querySelector(".toolbar").addEventListener("click", (e) => {
				const btn = e.target.closest("[data-tag]");
				if (!btn) return;
				activeTag = btn.getAttribute("data-tag");
				document.querySelectorAll(".toolbar [data-tag]").forEach((b) => b.classList.remove("active"));
				btn.classList.add("active");
				applyFilters();
			});

			document.getElementById("searchInput").addEventListener("input", applyFilters);

			document.getElementById("expandAllBtn").addEventListener("click", () => {
				document.querySelectorAll(".endpoint").forEach((d) => (d.open = true));
			});
			document.getElementById("collapseAllBtn").addEventListener("click", () => {
				document.querySelectorAll(".endpoint").forEach((d) => (d.open = false));
			});
		})();
	</script>
</body>
</html>`;
};

// O============================================================================================O

export default {
	openapi_spec,
	render_swagger_html,
};

// O============================================================================================O
