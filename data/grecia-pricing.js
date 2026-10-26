/**
 * Canonical Grécia storefront pricing (Wise cotação 26/10/2026).
 * Applied over Platform API / CMS until group_trips is updated.
 */
export const GRECIA_LOCKED_PRICING = {
  priceFrom: "32899.00",
  currency: "BRL",
  priceEur: "5119",
  quoteDate: "2026-10-26",
  priceNote:
    "por pessoa · à vista, ou entrada + até 10x no cartão, com juros. O valor em real acompanha a cotação do dia.",
  investmentOptions: [
    {
      key: "duplo",
      title: "Quarto duplo",
      description: "por pessoa, dividindo com outro viajante do grupo",
      price: "32899.00",
      priceNote: "à vista, ou entrada + até 10x no cartão, com juros",
    },
    {
      key: "individual",
      title: "Quarto individual",
      description: "por pessoa, com quarto só seu em toda a viagem",
      price: null,
      priceNote:
        "Valor por pessoa no WhatsApp. Cotação fechada para o grupo, com parcelamento.",
    },
  ],
  ctaWhatsappMessage:
    "Olá! Quero saber mais sobre o Grupo Grécia 2027 da WallTravel (Atenas, Mykonos, Santorini e Corfu · R$ 32.899,00 por pessoa · grupo de 10).",
};

export function applyGreciaLockedPricing(group) {
  if (!group?.slug || String(group.slug).toLowerCase() !== "grecia") return group;
  return {
    ...group,
    ...GRECIA_LOCKED_PRICING,
  };
}
