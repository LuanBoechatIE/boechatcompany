# Modelo de dados (trechos relevantes das últimas etapas)

## usuarios
id, username (unique), nome_completo, email, foto, cargos(jsonb legado),
preferencias(jsonb), senha_hash (scrypt), troca_senha_obrigatoria, status
(ativo|bloqueado), **protected_super_admin**, **deleted_at**, **deleted_by**,
**deletion_reason**, criado_em, ultimo_acesso.

## cargos / user_cargos
cargos: id, nome (unique), cor, ativo, criado_em.
user_cargos: id, usuario_id, cargo_id, **visivel_no_perfil**, **ordem**.
(unique usuario_id+cargo_id)

## roles / permissions / vínculos
roles: id, chave (unique), nome, descricao, sup(bool), ativo.
permissions: id, chave (unique), modulo, acao, label.
role_permissions, user_roles, user_permission_overrides (permitido bool).

## audit_logs (novo)
id, ator, afetado, acao, resultado (ok|bloqueado|erro), detalhe, antes, depois,
criado_em. NUNCA guarda senha/hash/token/segredo.

## demandas (aprovação — etapa anterior)
+ approval_status, completed_at/by, submitted_for_approval_at,
current_approval_round, approved_at, reopened_at.
demand_approvals: histórico/rodadas (PENDING|APPROVED|CHANGES_REQUESTED|
REJECTED|REVOKED), approver_type, approval_source, reported_by_user_id, canal,
nota, decidido_em, revogado_*.
