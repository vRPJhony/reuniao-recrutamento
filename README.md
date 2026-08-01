# Reunião Staff Atlas — MongoDB + Vercel

Projeto completo com:

- Next.js;
- MongoDB;
- Painel administrativo protegido por senha;
- Conteúdo compartilhado entre computador e smartphone;
- Adicionar, editar, ordenar e apagar seções;
- Criar, testar, ocultar e apagar alertas;
- Exportar e importar JSON;
- Restaurar conteúdo padrão;
- Layout responsivo para smartphone, tablet e computador.

## 1. Criar o banco no MongoDB Atlas

1. Crie um cluster no MongoDB Atlas.
2. Em **Database Access**, crie um usuário e senha.
3. Em **Network Access**, adicione `0.0.0.0/0`.
4. Copie a string de conexão do tipo `mongodb+srv://`.

## 2. Configurar na Vercel

Crie estas variáveis em **Settings > Environment Variables**:

```env
MONGODB_URI=mongodb+srv://USUARIO:SENHA@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=atlas_staff
ADMIN_PASSWORD=SUA_SENHA_DO_PAINEL
AUTH_SECRET=UMA_CHAVE_GRANDE_COM_PELO_MENOS_16_CARACTERES
```

## 3. Publicar

1. Extraia o ZIP.
2. Envie os arquivos para um repositório no GitHub.
3. Na Vercel, clique em **Add New > Project**.
4. Importe o repositório.
5. Adicione as variáveis de ambiente.
6. Clique em **Deploy**.

## Coleção criada automaticamente

Na primeira abertura, o sistema cria:

- Banco: valor definido em `MONGODB_DB`;
- Coleção: `site_content`;
- Documento principal: `{ key: "main" }`.

## Segurança

- A senha do painel não fica exposta no navegador.
- A autenticação usa cookie HTTP-only assinado.
- Todas as alterações administrativas exigem sessão autenticada.


## Correção de importações

Esta versão inclui `jsconfig.json` e também usa importações relativas nas rotas da API,
evitando o erro `Module not found: Can't resolve '@/lib/...'` durante o build na Vercel.
