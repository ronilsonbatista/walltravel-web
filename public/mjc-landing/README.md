# MJC Personalizados — landing de campanha

Página única para gerar orçamento no WhatsApp. Estática, sem build.

## Prévia

Os depoimentos são ilustrativos (nomes, empresas e fotos de apoio). A página vai com `noindex` até entrarem falas e retratos reais.

WhatsApp de atendimento: (11) 91149-5825. Cada botão manda a origem (`hero`, `nav`, `dock`, `jeito`, `projetos`, `faixa`, `depoimentos`, `campanhas`, `rh`, `eventos`, `contato`) e dispara `mjc_whatsapp_click` no `dataLayer`, pronto para o GTM.

## Publicar

Neste repositório a página entra em `public/mjc-landing/` e abre em `/mjc-landing/`. O catch-all da WallTravel não reescreve esse prefixo.

Fora daqui, a pasta é um site estático (sem build):

```bash
npx vercel deploy --prod --yes
```
