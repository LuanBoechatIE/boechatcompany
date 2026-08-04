-- Segurança: versão de sessão (revogação). Fecha o C4 da auditoria.
--
-- ⚠️ ORDEM DE DEPLOY IMPORTA. Rode este SQL no console do Neon ANTES de
-- publicar o código que lê `sessao_versao`. Se o código subir primeiro, a
-- consulta bate numa coluna que não existe e, com o login fail-closed, ninguém
-- entra. Sequência segura: (1) rodar este SQL, (2) publicar o deploy.
--
-- Efeito no primeiro deploy: todo token emitido ANTES desta mudança não tem o
-- campo de versão e deixa de valer. Todo mundo faz login de novo UMA vez. É
-- esperado, não é erro.
--
-- É idempotente (pode rodar de novo sem quebrar).

-- Versão da sessão do usuário. Vai embutida no token; se este número mudar, o
-- token antigo para de valer. Incrementa em bloqueio, exclusão, troca de senha
-- e troca de login. Nasce em 1 pra bater com o default do código.
alter table usuarios add column if not exists sessao_versao integer not null default 1;
