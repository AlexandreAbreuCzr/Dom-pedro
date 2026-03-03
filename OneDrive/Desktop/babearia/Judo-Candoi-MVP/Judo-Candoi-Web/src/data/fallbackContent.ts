import type { SiteContentResponseDTO } from "../types/site";

export const fallbackSiteContent: SiteContentResponseDTO = {
  brandName: "JUDÔ CANDÓI",
  heroTitle: "Mais que judô. Disciplina para a vida.",
  heroSubtitle:
    "Formamos pessoas, fortalecemos valores e construímos campeões dentro e fora do tatame.",
  impactPhrase:
    "Judô Candói não é só academia. É formação de caráter, disciplina e campeões.",
  callToActionPrimaryLabel: "Agendar aula experimental",
  callToActionPrimaryUrl: "#aula-experimental",
  callToActionSecondaryLabel: "Falar no WhatsApp",
  callToActionSecondaryUrl:
    "https://wa.me/5546999999999?text=Ola%2C%20quero%20agendar%20uma%20aula%20experimental%20no%20Judo%20Candoi.",
  aboutTitle: "Quem somos",
  aboutStory:
    "O Judô Candói nasceu para usar o judô como ferramenta de transformação. Acompanhamos cada aluno de perto, respeitando idade, fase e objetivos.",
  aboutHighlight: "Aqui formamos caráter antes de formar atletas.",
  counters: [
    { label: "alunos ativos", value: "+120" },
    { label: "medalhas", value: "+85" },
    { label: "anos no tatame", value: "+12" }
  ],
  medalStats: {
    competitions: 36,
    fights: 478,
    gold: 21,
    silver: 24,
    bronze: 42
  },
  programs: [
    {
      title: "Judô Infantil",
      ageRange: "4 a 10 anos",
      highlights: [
        "Coordenação motora",
        "Disciplina e respeito",
        "Aulas lúdicas e seguras"
      ],
      ctaText: "Quero matricular meu filho"
    },
    {
      title: "Judô Juvenil",
      ageRange: "11 a 17 anos",
      highlights: [
        "Foco e autocontrole",
        "Confiança e autoestima",
        "Competição saudável"
      ],
      ctaText: "Quero começar agora"
    },
    {
      title: "Judô Adulto",
      ageRange: "Iniciante ou praticante",
      highlights: ["Condicionamento físico", "Defesa pessoal", "Qualidade de vida"],
      ctaText: "Agendar aula experimental"
    }
  ],
  methodology: [
    "Progressão por níveis técnicos",
    "Avaliação contínua de evolução",
    "Preparação física e mental",
    "Treinos adaptados por faixa etária",
    "Competição com propósito"
  ],
  achievements: [
    {
      title: "Participações regionais e estaduais",
      description: "Presença constante em eventos oficiais e amistosos."
    },
    {
      title: "Evolução além do tatame",
      description: "Disciplina, foco e respeito refletindo em casa e na escola."
    },
    {
      title: "Podios e destaque técnico",
      description: "Alunos preparados para competir com consciência e valores."
    }
  ],
  gallery: [
    {
      title: "Treino técnico no tatame",
      imageUrl: "/images/site/aula-correcao-tecnica-3x2.jpg",
      category: "Treinos"
    },
    {
      title: "Campeonato",
      imageUrl: "/images/site/competicao-podio-16x9.jpg",
      category: "Campeonatos"
    },
    { title: "Pódio", imageUrl: "/images/site/tecnica-graduacao-16x10.jpg", category: "Conquistas" },
    { title: "Treino de campo", imageUrl: "/images/site/treino-campo-16x9.jpg", category: "Treinos" }
  ],
  testimonials: [
    {
      quote: "Depois do judô, meu filho ficou mais disciplinado e confiante.",
      author: "Marina S.",
      role: "Mãe de aluno"
    },
    {
      quote: "Aqui não é só esporte, é educação.",
      author: "Carlos A.",
      role: "Pai de atleta"
    },
    {
      quote: "O Judô Candói mudou minha forma de encarar desafios.",
      author: "Lucas M.",
      role: "Aluno adulto"
    }
  ],
  trialTitle: "Aula experimental gratuita",
  trialDescription:
    "Sem compromisso e para todas as idades. Dê o primeiro passo com acompanhamento técnico.",
  schedules: [
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
      level: "Intermediário"
    },
    {
      day: "Terça e Quinta",
      time: "19:30 - 20:30",
      audience: "Adulto",
      level: "Todos os níveis"
    },
    {
      day: "Sexta",
      time: "18:30 - 20:00",
      audience: "Equipe de competição",
      level: "Avançado"
    }
  ],
  blogPosts: [
    {
      title: "Benefícios do judô para crianças",
      slug: "beneficios-judo-criancas",
      excerpt: "Como disciplina, coordenação e respeito aparecem no dia a dia.",
      imageUrl: "/images/site/treino-infantil-ludico-16x10.jpg",
      content:
        "O judô infantil vai muito além da atividade física. A criança aprende a respeitar regras, escutar orientações e conviver em grupo.\n\nNo treino, ela desenvolve coordenação motora, equilíbrio e confiança para lidar com desafios. Com o tempo, esses ganhos aparecem em casa e na escola.\n\nNo Judô Candói, o processo é feito com segurança, progressão por faixa e atenção individual para cada fase da criança."
    },
    {
      title: "Judô x excesso de celular",
      slug: "judo-x-celular",
      excerpt: "Rotina saudável para energia e foco real.",
      content:
        "Muitas famílias sentem dificuldade com tempo excessivo de tela. O judô ajuda criando rotina, gasto de energia e metas reais para os alunos.\n\nQuando o aluno entra no tatame, ele passa a ter compromisso com horário, disciplina e convivência presencial. Isso reduz a dependência do estímulo rápido do celular.\n\nA constância no treino melhora foco, sono e comportamento, construindo hábitos mais saudáveis ao longo do ano."
    },
    {
      title: "Disciplina que reflete na escola",
      slug: "disciplina-na-escola",
      excerpt: "Resultados do tatame dentro da sala de aula.",
      imageUrl: "/images/site/tecnica-graduacao-16x10.jpg",
      content:
        "No judô, o aluno aprende que evolução vem de repetição, paciência e respeito ao processo. Essa mentalidade é transferida para os estudos.\n\nPais e responsáveis relatam melhora na atenção, mais responsabilidade com tarefas e maior autocontrole em situações de frustração.\n\nA disciplina construída no tatame fortalece a autoestima e cria base para desempenho escolar mais estável."
    },
    {
      title: "Como o judô forma líderes",
      slug: "judo-forma-lideres",
      excerpt: "Coragem, respeito e atitude para toda a vida.",
      content:
        "Liderança no judô começa com atitude: chegar no horário, respeitar colegas e manter postura dentro e fora do treino.\n\nOs alunos mais experientes aprendem a apoiar os iniciantes, dar exemplo e agir com responsabilidade. Isso forma jovens mais preparados para desafios da vida.\n\nNo Judô Candói, liderança é construída com valores: disciplina, coragem, humildade e espírito de equipe."
    }
  ],
  sponsors: [
    {
      name: "Parceiro Master",
      description: "Apoio ao desenvolvimento esportivo e social dos alunos.",
      logoUrl: "/images/site/fachada-academia-16x9.jpg",
      websiteUrl: ""
    },
    {
      name: "Apoiador Local",
      description: "Investimento em eventos, campeonatos e formação de base.",
      logoUrl: "/images/site/competicao-podio-16x9.jpg",
      websiteUrl: ""
    }
  ],
  timeline: [
    {
      title: "Primeiro kimono",
      description: "Acolhimento, segurança e fundamentos iniciais."
    },
    {
      title: "Primeiras faixas",
      description: "Metas claras e evolução técnica constante."
    },
    {
      title: "Competição consciente",
      description: "Aprender a ganhar, perder e crescer com propósito."
    },
    {
      title: "Orgulho no pódio",
      description: "Disciplina hoje. Vitória amanhã."
    }
  ],
  prideStudents: [
    {
      name: "Ana Clara",
      achievement: "Destaque em disciplina e espírito de equipe",
      month: "Fevereiro",
      imageUrl: "/images/site/hero-slide-01.jpg"
    },
    {
      name: "Rafael",
      achievement: "Evolução técnica e foco nos estudos",
      month: "Janeiro",
      imageUrl: "/images/site/hero-slide-02.jpg"
    },
    {
      name: "Beatriz",
      achievement: "Superação em competição e autoconfiança",
      month: "Dezembro",
      imageUrl: "/images/site/hero-slide-03.jpg"
    }
  ],
  contact: {
    address: "Avenida Central, 123 - Candói/PR",
    whatsappUrl:
      "https://wa.me/5546999999999?text=Ola%2C%20quero%20agendar%20uma%20aula%20experimental%20no%20Judo%20Candoi.",
    whatsappLabel: "WhatsApp direto",
    instagramHandle: "@judocandoi",
    instagramUrl: "https://instagram.com/judocandoi",
    mapEmbedUrl: "https://www.google.com/maps?q=Candoi%20PR&output=embed"
  },
  finalCallToAction:
    "Seu filho merece mais que um esporte. Merece disciplina, valores e confiança."
};
