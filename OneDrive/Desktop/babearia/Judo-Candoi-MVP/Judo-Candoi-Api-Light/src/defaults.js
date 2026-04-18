export const DEFAULT_WHATSAPP_MESSAGE = "Ola, quero agendar uma aula experimental no Judo Candoi.";

export function createDefaultSiteSettings(config) {
  return {
    brandName: "JUDO CANDOI",
    heroTitle: "Mais que judo. Disciplina para a vida.",
    heroSubtitle:
      "Formamos pessoas, fortalecemos valores e construimos campeoes dentro e fora do tatame.",
    impactPhrase: "Judo Candoi nao e so academia. E formacao de carater, disciplina e campeoes.",
    callToActionPrimaryLabel: "Agendar aula experimental",
    callToActionPrimaryUrl: "#aula-experimental",
    callToActionSecondaryLabel: "Falar no WhatsApp",
    aboutTitle: "Quem somos",
    aboutStory:
      "O Judo Candoi nasceu com um proposito claro: usar o judo como ferramenta de transformacao. Cada aluno e acompanhado de perto, respeitando idade, ritmo e objetivos.",
    aboutHighlight: "Aqui formamos pessoas antes de atletas.",
    trialTitle: "Aula experimental gratuita",
    trialDescription:
      "Sem compromisso, para todas as idades. Venha conhecer nossa metodologia no tatame.",
    finalCallToAction:
      "Seu filho merece mais que um esporte. Merece disciplina, valores e confianca.",
    counterStudents: "+120",
    counterMedals: "+85",
    counterYears: "+12",
    medalCompetitions: 36,
    medalFights: 478,
    medalGold: 21,
    medalSilver: 24,
    medalBronze: 42,
    whatsappNumber: config.defaultWhatsappNumber,
    instagramHandle: config.defaultInstagramHandle,
    academyAddress: config.defaultAcademyAddress,
    googleMapsEmbed: config.defaultGoogleMapsEmbed
  };
}

export const STATIC_PROGRAMS = [
  {
    title: "Judo Infantil",
    ageRange: "4 a 10 anos",
    highlights: ["Coordenacao motora", "Disciplina e respeito", "Aulas ludicas e seguras"],
    ctaText: "Quero matricular meu filho"
  },
  {
    title: "Judo Juvenil",
    ageRange: "11 a 17 anos",
    highlights: ["Foco e autocontrole", "Confianca e autoestima", "Competicao saudavel"],
    ctaText: "Quero comecar agora"
  },
  {
    title: "Judo Adulto",
    ageRange: "Iniciante ou praticante",
    highlights: ["Condicionamento fisico", "Defesa pessoal", "Qualidade de vida"],
    ctaText: "Agendar aula experimental"
  }
];

export const STATIC_METHODOLOGY = [
  "Progressao por niveis tecnicos",
  "Avaliacao tecnica continua",
  "Preparacao fisica e mental",
  "Treinos adaptados por faixa etaria",
  "Competicao com proposito, nao so medalha"
];

export const STATIC_ACHIEVEMENTS = [
  {
    title: "Participacoes regionais e estaduais",
    description: "Equipe presente em eventos oficiais com constancia"
  },
  {
    title: "Evolucao comportamental",
    description: "Pais relatam mais disciplina e confianca em casa e na escola"
  },
  {
    title: "Podios e destaque tecnico",
    description: "Atletas preparados para competir sem perder a essencia educativa"
  }
];

export const STATIC_GALLERY = [
  {
    title: "Treino tecnico no tatame",
    imageUrl: "/images/site/aula-correcao-tecnica-3x2.jpg",
    category: "Treinos"
  },
  {
    title: "Dia de campeonato",
    imageUrl: "/images/site/competicao-podio-16x9.jpg",
    category: "Campeonatos"
  },
  {
    title: "Equipe no podio",
    imageUrl: "/images/site/tecnica-graduacao-16x10.jpg",
    category: "Conquistas"
  },
  {
    title: "Treino de campo",
    imageUrl: "/images/site/treino-campo-16x9.jpg",
    category: "Treinos"
  }
];

export const STATIC_TESTIMONIALS = [
  {
    quote: "Depois do judo, meu filho ficou mais disciplinado e confiante.",
    author: "Marina S.",
    role: "Mae de aluno infantil"
  },
  {
    quote: "Aqui nao e so esporte, e educacao.",
    author: "Carlos A.",
    role: "Pai de atleta juvenil"
  },
  {
    quote: "O Judo Candoi mudou minha forma de encarar desafios.",
    author: "Lucas M.",
    role: "Aluno adulto"
  }
];

export const STATIC_SCHEDULES = [
  {
    day: "Segunda e Quarta",
    time: "18:00 - 18:50",
    audience: "Infantil",
    level: "Iniciante"
  },
  {
    day: "Segunda e Quarta",
    time: "19:00 - 20:00",
    audience: "Juvenil",
    level: "Intermediario"
  },
  {
    day: "Terca e Quinta",
    time: "19:30 - 20:30",
    audience: "Adulto",
    level: "Iniciante e avancado"
  },
  {
    day: "Sexta",
    time: "18:30 - 20:00",
    audience: "Equipe de competicao",
    level: "Avancado"
  }
];

export const STATIC_TIMELINE = [
  {
    title: "Primeiro kimono",
    description: "Entrada no tatame com acolhimento e fundamentos basicos."
  },
  {
    title: "Primeiras faixas",
    description: "Evolucao tecnica com metas claras e acompanhamento continuo."
  },
  {
    title: "Competicao consciente",
    description: "Experiencia de campeonato com foco em crescimento pessoal."
  },
  {
    title: "Orgulho no podio",
    description: "Resultado da disciplina construida treino apos treino."
  }
];
