# Regras de produção e aprovação de demandas

Documenta como demandas concluídas × aprovadas são contadas. **Conclusão e
aprovação são etapas separadas.** Uma demanda concluída NÃO conta como aprovada.

## Estados

- **Execução** (campo `demandas.status`, o Kanban): `backlog` (pendente),
  `andamento`, `revisao`, `concluido`.
- **Aprovação** (campo `demandas.approval_status`): `nao_enviada`, `aguardando`,
  `aprovada`, `alteracoes_solicitadas`, `rejeitada`, `cancelada`.

## Rodadas (`current_approval_round`)

- "Marcar como concluída" incrementa a rodada e cria um registro `PENDING` em
  `demand_approvals`. A 1ª conclusão é a rodada 1.
- "Solicitar alterações" devolve a execução para `andamento` e mantém a rodada.
  Ao concluir de novo, entra na próxima rodada (2, 3, ...).
- O histórico de todas as rodadas é preservado em `demand_approvals` — nada é
  apagado.

## Contagem

- **Concluída:** conta **uma vez por rodada de execução** (o registro `PENDING`
  daquela rodada). Reabrir e reconcluir gera uma nova rodada — não duplica a
  rodada anterior.
- **Aprovada:** conta **somente** quando `approval_status = 'aprovada'` (existe um
  registro `APPROVED` válido, não revogado, na rodada atual).
- **Duas aprovações na mesma rodada** (ex.: cliente + Samuel): a demanda continua
  contando como **uma única** demanda aprovada. As duas fontes aparecem no
  histórico e podem aparecer na *distribuição por origem*, o que é distribuição de
  aprovações — não total de demandas únicas.
- **Aprovação cancelada** (`REVOKED`): sai do total atual de aprovadas
  (`approval_status` volta para `aguardando`); o registro permanece no histórico
  com `revogado_por`/`motivo_revogacao`.
- **Reabertura após aprovada:** a aprovação anterior não é apagada nem contada
  para a nova rodada; nova rodada começa do zero.

## Origem da aprovação (`approval_source`)

- `INTERNAL_ADMIN` — decisão de Samuel/Luan (ou quem tiver `demandas.approve`).
- `EMPLOYEE_REPORTED_CLIENT_APPROVAL` — funcionário registrou que o **cliente**
  aprovou. O **aprovador é o cliente**; o funcionário é apenas quem **registrou**
  (`reported_by_user_id`). Nunca tratar o funcionário como aprovador.
- `CLIENT_PORTAL` — reservado para aprovação direta do cliente por link/portal
  (arquitetura preparada; ainda não implementado).

## Fórmulas (para o ranking futuro)

```
taxa de aprovação        = demandas aprovadas / demandas enviadas para aprovação
conclusões por hora      = demandas concluídas / horas trabalhadas
aprovações por hora      = demandas aprovadas / horas trabalhadas
```

Tratar divisão por zero (retornar 0 quando o denominador é 0). Não misturar
horas e produção em um número único sem explicar a fórmula.

## Datas para filtros

- Demandas concluídas: filtrar por `completed_at`.
- Demandas aprovadas: filtrar por `approved_at`.
- Nunca usar apenas a data de criação (`criado_em`) para desempenho.

## Limitações da 1ª versão

- `responsavel` é texto livre; a posse (`complete_own`) casa por username/primeiro
  nome. Vínculo demanda↔usuário forte é item da base da Etapa 4 (não implementada).
- Ranking, horas trabalhadas (ponto) e times dependem da base da Etapa 4 e ainda
  não existem — as fórmulas acima ficam documentadas para quando existirem.
