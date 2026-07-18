# Visão — MotusFit

## Propósito

O MotusFit unifica em um único aplicativo as duas disciplinas centrais de quem treina: **alimentação** e **treino de força**. Hoje o usuário típico usa dois apps separados (ex.: Yazio para dieta, Hevy para treino), com dados isolados, duas assinaturas e nenhuma visão integrada de balanço energético real (calorias consumidas × gastas) ou de progresso combinado.

## Declaração de visão

> Ser o único app que a pessoa que treina precisa abrir no dia: registrar refeições, executar o treino e ver, em um só lugar, se está caminhando para a sua meta.

## Problema

1. **Fragmentação** — dieta e treino vivem em apps distintos; o gasto calórico do treino não abate da meta do dia automaticamente.
2. **Fricção de registro** — registrar refeições e séries precisa ser rápido (favoritos, recentes, repetição da última sessão), ou o usuário abandona.
3. **Falta de contexto** — estatísticas de treino sem dados de nutrição (e vice-versa) contam metade da história.

## Público-alvo

- **Primário:** praticantes de musculação/fitness intermediários (1–5 anos de treino) que já registram treino ou dieta em algum app.
- **Secundário:** iniciantes orientados por personal/nutricionista que precisam de registro simples.

## Princípios de produto

1. **Registro em segundos** — cada fluxo de registro (refeição, série) deve ser completável em < 10 segundos no caminho feliz.
2. **Dados do usuário são do usuário** — exportação sempre disponível; nada de lock-in.
3. **Offline não pode travar o treino** — a academia tem sinal ruim; o registro de treino deve funcionar sem rede (meta pós-MVP, mas a arquitetura já nasce preparada).
4. **Integrado por padrão** — todo dado alimenta o dashboard unificado.
5. **Crescer sem reescrever** — arquitetura preparada para wearables, IA, comunidade e premium sem refatorações drásticas.

## Horizonte (resumo — detalhe em [roadmap.md](roadmap.md))

- **MVP:** nutrição básica (refeições, alimentos, macros, metas) + treino básico (rotinas, sessões, histórico, volume, estatísticas semanais) + dashboard simples.
- **v2:** gráficos avançados, progresso corporal, fotos, notificações.
- **v3:** Apple Health / Health Connect, wearables, IA (sugestões, reconhecimento de refeições), comunidade, assinatura premium.

## Métricas norte

- Retenção D7 / D30.
- Registros por usuário ativo por dia (refeições + sessões de treino).
- Tempo mediano para completar um registro.
