# 0006 — Mobile com Expo SDK 55 + Expo Router + NativeWind

- Status: aceito
- Data: 2026-07-18

## Contexto

iOS e Android a partir de um único código TypeScript, com pipeline de build/distribuição sustentável para time pequeno e uso diário na academia (aberturas rápidas, futura necessidade offline).

## Decisão

- **Expo SDK 55** (React Native 0.83, **New Architecture** — obrigatória desde o SDK 55) com **Expo Router** (file-based) e **dev builds** (não Expo Go).
- **EAS** Build/Submit/Update para CI de builds nativos, lojas e OTA de JS.
- **NativeWind 4** (Tailwind 3 no nativo) para estilo — mesmo modelo mental do web; migrar para NativeWind 5 (Tailwind 4) quando GA.
- Dados/estado: mesma stack do ADR 0005 (TanStack Query + Zustand + RHF/Zod), com **persistência do cache do Query em MMKV** e mutações otimistas/idempotentes (`clientId`) — resiliência a rede ruim no MVP; offline-first completo (expo-sqlite + Drizzle + sync engine) fica como evolução planejada em [architecture.md](../architecture.md).

## Alternativas consideradas

- **React Native bare** — só se justifica com módulos nativos pesados; perde EAS/upgrades gerenciados.
- **Flutter/KMP** — quebram o requisito de uma stack TS compartilhada.
- **Tamagui** — melhor para design systems universais compilados; curva e complexidade maiores; não compartilharemos UI entre web/nativo, então NativeWind basta.
- **WatermelonDB/PowerSync no MVP** — offline-first completo agora é overengineering; a arquitetura deixa a porta aberta.

## Consequências

- (+) Um app para as duas lojas; OTA para iteração rápida (bytecode diffing do SDK 55 ⇒ updates ~75% menores); ecossistema New Arch resolvido.
- (−) Toda lib nativa adicionada deve ser New-Arch compatível (`npx expo-doctor` no fluxo).
- (−) Upgrade de SDK ~2x/ano é manutenção recorrente e inadiável.
