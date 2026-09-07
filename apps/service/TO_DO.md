# TO DO

- [x] Tarefa que lista as maiores variações (altas >= 5% e baixas <= -5%) comparando o valor atual (`currentClosePrice`) com o mês passado (`lastMonthClosePrice`), rodando via cron em dias úteis pela manhã (`NotifyAssetVariationsCron`) e disparando webhook do n8n para envio de e-mail.