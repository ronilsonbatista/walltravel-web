/**
 * Fixture planejamentos Japão (saída SP / Rio) for local/Vercel preview pages.
 * Mirrors PDF pricing + live CMS baseline (itinerary/media/includes).
 */

const SHARED = {
  destination: "Japão",
  duration: "13 noites / 15 dias",
  type: "classico",
  categorySlug: "asia",
  priceUnit: "PER_PERSON",
  currency: "BRL",
  dateMode: "FIXED",
  hasFixedDates: true,
  fixedStartDate: "2027-03-02",
  fixedEndDate: "2027-03-16",
  departureScope: "ORIGINS",
  image:
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=80",
  gallery: [
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1528360983277-13fad0d45d6b?auto=format&fit=crop&w=1600&q=80",
  ],
  included: [
    "Passagem aérea internacional ida e volta",
    "13 noites de hospedagem",
    "5 noites em Tóquio",
    "3 noites em Kyoto",
    "4 noites em Osaka",
    "1 noite em Tóquio (retorno)",
    "Hotéis 4 estrelas com café da manhã",
    "Deslocamento interno (trem)",
    "Planejamento completo da logística",
    "Roteiro personalizado",
    "Curadoria de atividades, passeios e reservas",
    "Assessoria / suporte WallTravel 24h durante a viagem",
  ],
  notIncluded: [
    "Passeios e atividades não especificados",
    "Transfers não especificados",
    "Seguro viagem",
    "Visto, se aplicável",
    "Gastos pessoais",
  ],
  tags: [
    "Japão",
    "Tóquio 6n",
    "Kyoto 3n",
    "Osaka 4n",
    "Ásia",
    "Cultura",
    "Datas fixas",
    "Casais",
  ],
  featured: false,
  ctaLabel: "Planejar minha viagem",
  itinerary: [],
};

export const JAPAO_SP_PREVIEW = {
  ...SHARED,
  id: "japao-essencial-sao-paulo",
  slug: "japao-essencial-sao-paulo",
  name: "Japão Essencial: Tóquio, Kyoto e Osaka · saída de São Paulo",
  shortDescription:
    "Um planejamento de 13 noites por Tóquio, Kyoto e Osaka, com datas fixas em março de 2027 e saída de São Paulo.",
  description:
    "Planejamento de 13 noites e 15 dias pelo Japão essencial. A viagem começa em Tóquio, segue para Kyoto e termina em Osaka, com a logística organizada pela equipe WallTravel. Datas fixas de 02/03/2027 a 16/03/2027. Saída de São Paulo.",
  priceFrom: 18015,
  departureOrigins: ["SP"],
  originPrices: [
    {
      uf: "SP",
      label: "São Paulo",
      priceFrom: 18015,
      paymentNote: null,
    },
  ],
  importantNotes: [
    "PIX: R$ 18.015 por pessoa.",
    "Parcelado: 10x de R$ 2.008,58 (total R$ 20.086).",
  ],
  seoTitle:
    "Japão Essencial · saída de São Paulo | WallTravel",
  seoDescription:
    "Planejamento de 13 noites pelo Japão, com datas fixas em março de 2027. PIX R$ 18.015 ou parcelado em 10x. Saída de São Paulo.",
  ctaWhatsappMessage:
    "Olá! Gostaria de planejar a experiência Japão Essencial (saída de São Paulo) com a WallTravel.",
};

export const JAPAO_RIO_PREVIEW = {
  ...SHARED,
  id: "japao-essencial-rio",
  slug: "japao-essencial-rio",
  name: "Japão Essencial: Tóquio, Kyoto e Osaka · saída do Rio",
  shortDescription:
    "Um planejamento de 13 noites por Tóquio, Kyoto e Osaka, com datas fixas em março de 2027 e saída do Rio de Janeiro.",
  description:
    "Planejamento de 13 noites e 15 dias pelo Japão essencial. A viagem começa em Tóquio, segue para Kyoto e termina em Osaka, com a logística organizada pela equipe WallTravel. Datas fixas de 02/03/2027 a 16/03/2027. Saída do Rio de Janeiro.",
  priceFrom: 19021,
  departureOrigins: ["RJ"],
  originPrices: [
    {
      uf: "RJ",
      label: "Rio de Janeiro",
      priceFrom: 19021,
      paymentNote: null,
    },
  ],
  importantNotes: [
    "PIX: R$ 19.021 por pessoa.",
    "Parcelado: 10x de R$ 2.120,75 (total R$ 21.208).",
  ],
  seoTitle: "Japão Essencial · saída do Rio | WallTravel",
  seoDescription:
    "Planejamento de 13 noites pelo Japão, com datas fixas em março de 2027. PIX R$ 19.021 ou parcelado em 10x. Saída do Rio de Janeiro.",
  ctaWhatsappMessage:
    "Olá! Gostaria de planejar a experiência Japão Essencial (saída do Rio) com a WallTravel.",
};

export const JAPAO_PREVIEW_CATEGORY = {
  slug: "asia",
  name: "Ásia",
};
