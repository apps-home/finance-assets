# TO DO

- [x] Tarefa que lista as maiores variações (altas >= 5% e baixas <= -5%) comparando o valor atual (`currentClosePrice`) com o mês passado (`lastMonthClosePrice`), rodando via cron em dias úteis pela manhã (`NotifyAssetVariationsCron`) e disparando webhook do n8n para envio de e-mail.
- [ ] Integrar ativos da Wishlist no alerta diário de mercado (`NotifyAssetVariationsCron`):
  - [ ] Adicionar método no `WishlistRepository` (e `PrismaWishlistRepository`) para buscar itens da Wishlist com detalhes do usuário e categoria (`findAllWithUserDetails`).
  - [ ] Estender o `NotifyAssetVariationsUseCase` para avaliar a Wishlist de cada usuário:
    - [ ] Identificar oportunidades com preço-alvo atingido (`targetPrice != null && currentClosePrice <= targetPrice`).
    - [ ] Identificar variações expressivas de preço na Wishlist (altas >= 5% e quedas <= -5%).
  - [ ] Atualizar tipos e payload do webhook `assets/notify` com o bloco `wishlist` (`targetReached`, `gainers`, `losers`).
  - [ ] Ajustar condição de envio do alerta para disparar se houver variações na carteira OU destaques na Wishlist.
  - [ ] Atualizar / adicionar testes unitários para o `NotifyAssetVariationsUseCase` cobrindo os cenários da Wishlist.
  - [ ] Atualizar o template HTML no workflow do n8n para renderizar os blocos da Wishlist.