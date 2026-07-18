# Produto — MotusFit

Especificação funcional do MVP e visão das fases seguintes. Cada feature aqui descrita vira tarefas no [roadmap.md](roadmap.md) e entidades no [domain-model.md](domain-model.md).

## Plataformas

- **Web** (app + páginas públicas)
- **iOS** e **Android** (mesmo app React Native/Expo)

Paridade de funcionalidades entre plataformas no MVP; mobile é o cliente primário de uso diário.

## MVP

### Nutrição

| Feature | Descrição | Critérios de aceite |
|---|---|---|
| Cadastro de alimentos | Usuário cria alimentos com nome, marca (opcional), porção base e macros por porção (kcal, proteína, carboidrato, gordura) | Alimento criado aparece na busca; macros validados (≥ 0; kcal coerente com macros é aviso, não bloqueio) |
| Cadastro de refeições | Diário organizado por dia e tipo de refeição (café, almoço, jantar, lanche); cada entrada referencia um alimento + quantidade | Entrada soma nos totais do dia; editar/remover recalcula |
| Cálculo de macros | Totais do dia: kcal, proteína, carbo, gordura, calculados a partir das entradas | Totais corretos com quantidades fracionárias; arredondamento definido (1 casa decimal g, inteiro kcal) |
| Metas diárias | Usuário define meta de kcal e macros; UI mostra consumido × meta × restante | Metas editáveis; efeito imediato no diário |
| Favoritos | Marcar/desmarcar alimento como favorito; lista de favoritos na busca | Toggle persistido; favoritos ordenados por uso |
| Recentes | Alimentos usados recentemente aparecem primeiro na busca | Últimos 20, mais recente primeiro, sem duplicatas |

### Treino

| Feature | Descrição | Critérios de aceite |
|---|---|---|
| Catálogo de exercícios | Base de exercícios (nome, grupo muscular, equipamento) + exercícios customizados do usuário | Busca por nome e grupo muscular; custom só visível ao dono |
| Rotinas | Agrupamento ordenado de exercícios com prescrição (séries alvo, faixa de reps, descanso) | CRUD completo; reordenação persiste |
| Sessão de treino | Executar rotina (ou treino livre): registrar séries com reps, carga e descanso; concluir sessão | Sessão registra início/fim; séries marcadas como completas; valores da última sessão sugeridos |
| Histórico | Lista de sessões concluídas com resumo (duração, volume, séries) | Ordenado por data; detalhe mostra todas as séries |
| Volume | Volume por sessão e por exercício = Σ(carga × reps) das séries completas | Cálculo correto; exibido no resumo da sessão |
| Gasto calórico estimado | Estimativa por sessão via METs (peso do usuário × MET × duração) | Fórmula documentada; exibida como estimativa |
| Estatísticas semanais | Por semana: nº de sessões, volume total, séries por grupo muscular, kcal estimadas | Semana ISO (seg–dom); agregação correta em fronteiras de semana |

### Transversal (MVP)

- **Conta**: cadastro/login com e-mail+senha, sessão persistente, perfil (nome, peso corporal — usado no gasto calórico).
- **Dashboard**: resumo do dia — kcal consumidas × meta (abatendo estimativa de treino), macros, treino do dia.
- **Unidades**: kg e g no MVP (lb pós-MVP); campo de unidade já modelado.

## Fora do escopo do MVP (mas modelado para não travar depois)

- Gráficos avançados, metas de longo prazo, progresso corporal + fotos.
- IA (sugestão de refeições/treinos), reconhecimento de alimentos por foto.
- Apple Health / Google Health Connect, wearables.
- Comunidade (feed, compartilhamento de rotinas), notificações push.
- Assinatura premium (billing) — o modelo de conta já prevê `plan`.
- Base pública de alimentos (Open Food Facts / TACO) — MVP usa cadastro manual; o modelo de `Food` já separa `source` para importar depois.
- Offline-first completo — ver [architecture.md](architecture.md) para o caminho de evolução.

## Fluxos críticos (devem ser rápidos)

1. **Registrar refeição repetida**: diário → refeição → recentes/favoritos → ajustar quantidade → salvar (≤ 4 toques).
2. **Executar treino**: iniciar rotina → valores pré-preenchidos da última sessão → marcar série feita → timer de descanso → concluir.
