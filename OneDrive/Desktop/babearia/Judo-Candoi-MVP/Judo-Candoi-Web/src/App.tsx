import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { createExperimentalClassLead, getSiteContent, resolveSiteAssetUrl } from "./api/siteApi";
import { AnimatedCounter } from "./components/AnimatedCounter";
import { SectionTitle } from "./components/SectionTitle";
import { athleteMediaPool } from "./data/athletePhotoPool";
import { fallbackSiteContent } from "./data/fallbackContent";
import type { ExperimentalClassLeadRequestDTO, SiteContentResponseDTO } from "./types/site";
import "./styles.css";

type ApiStatus = "loading" | "online" | "offline";
type SubmitStatus = "idle" | "submitting" | "success" | "error";

interface LeadFormState {
  name: string;
  age: string;
  phone: string;
  objective: string;
}

const initialLeadForm: LeadFormState = {
  name: "",
  age: "",
  phone: "",
  objective: ""
};

const HERO_SLIDES = [
  "/images/site/hero-slide-01.jpg",
  "/images/site/hero-slide-02.jpg",
  "/images/site/hero-slide-03.jpg",
  "/images/site/hero-slide-04.jpg",
  "/images/site/hero-slide-05.jpg"
];
const PRIDE_HIGHLIGHT_IMAGES = [
  "/images/site/hero-slide-01.jpg",
  "/images/site/hero-slide-02.jpg",
  "/images/site/hero-slide-03.jpg",
  "/images/site/treino-forte-16x9.jpg",
  "/images/site/treinos-eventos-campeonatos-4x3.jpg"
];
const HERO_ROTATION_INTERVAL_MS = 5000;
const ATHLETE_ROTATION_INTERVAL_MS = 5200;
const ATHLETE_FRAME_SIZE = 6;

function createSeededRandom(seed: number): () => number {
  let current = seed + 0x6d2b79f5;

  return () => {
    current += 0x6d2b79f5;
    let value = Math.imul(current ^ (current >>> 15), current | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const random = createSeededRandom(seed);
  const cloned = [...items];

  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }

  return cloned;
}

function App() {
  const [content, setContent] = useState<SiteContentResponseDTO>(fallbackSiteContent);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("loading");
  const [leadForm, setLeadForm] = useState<LeadFormState>(initialLeadForm);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [selectedBlogSlug, setSelectedBlogSlug] = useState<string | null>(null);
  const [brokenBlogImages, setBrokenBlogImages] = useState<Record<string, boolean>>({});
  const [athleteRound, setAthleteRound] = useState(0);
  const [athleteSeed] = useState(() => Math.floor(Math.random() * 1000000));

  useEffect(() => {
    let active = true;

    getSiteContent()
      .then((response) => {
        if (!active) {
          return;
        }

        setContent(response);
        setApiStatus("online");
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setApiStatus("offline");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeroSlideIndex((previous) => (previous + 1) % HERO_SLIDES.length);
    }, HERO_ROTATION_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!selectedBlogSlug) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedBlogSlug(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [selectedBlogSlug]);

  const isSubmitting = submitStatus === "submitting";
  const whatsappUrl = content.callToActionSecondaryUrl || content.contact.whatsappUrl;
  const blogPosts = content.blogPosts.length > 0 ? content.blogPosts : fallbackSiteContent.blogPosts;
  const hasRealSponsors = content.sponsors.length > 0;
  const sponsorCards = hasRealSponsors
    ? content.sponsors
    : [
        {
          name: "Espaco de patrocinio #1",
          description: "Sua marca apoiando esporte, educacao e transformacao social pelo judo.",
          logoUrl: "/images/site/fachada-academia-16x9.jpg",
          websiteUrl: whatsappUrl
        },
        {
          name: "Espaco de patrocinio #2",
          description: "Visibilidade para parceiros que acreditam na formacao de criancas e jovens.",
          logoUrl: "/images/site/competicao-podio-16x9.jpg",
          websiteUrl: whatsappUrl
        },
        {
          name: "Espaco de patrocinio #3",
          description: "Associe sua empresa a disciplina, respeito e resultados dentro e fora do tatame.",
          logoUrl: "/images/site/treinos-eventos-campeonatos-4x3.jpg",
          websiteUrl: whatsappUrl
        }
      ];
  const sponsorHighlightCards = sponsorCards.slice(0, 8);
  const heroMedalStats = content.medalStats ?? fallbackSiteContent.medalStats;
  const selectedBlogPost = selectedBlogSlug
    ? blogPosts.find((post) => post.slug === selectedBlogSlug) ?? null
    : null;
  const markBlogImageAsBroken = (slug: string) => {
    setBrokenBlogImages((current) => {
      if (current[slug]) {
        return current;
      }

      return {
        ...current,
        [slug]: true
      };
    });
  };
  const orderedAthleteItems = useMemo(
    () => shuffleWithSeed(athleteMediaPool, athleteSeed),
    [athleteSeed]
  );
  const athleteVisibleItems = useMemo(() => {
    if (orderedAthleteItems.length === 0) {
      return [];
    }

    const frameSize = Math.min(ATHLETE_FRAME_SIZE, orderedAthleteItems.length);

    const startIndex = (athleteRound * frameSize) % orderedAthleteItems.length;
    const rotatedItems = [
      ...orderedAthleteItems.slice(startIndex),
      ...orderedAthleteItems.slice(0, startIndex)
    ];

    return rotatedItems.slice(0, frameSize);
  }, [athleteRound, orderedAthleteItems]);

  useEffect(() => {
    if (orderedAthleteItems.length <= ATHLETE_FRAME_SIZE) {
      return;
    }

    const interval = window.setInterval(() => {
      setAthleteRound((previous) => previous + 1);
    }, ATHLETE_ROTATION_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [orderedAthleteItems.length]);

  function handleNavLinkClick(): void {
    setIsNavOpen(false);
  }

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void {
    const { name, value } = event.target;
    setLeadForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!leadForm.name.trim() || !leadForm.phone.trim() || !leadForm.age.trim()) {
      setSubmitStatus("error");
      setSubmitMessage("Preencha nome, idade e telefone para agendar a aula experimental.");
      return;
    }

    const age = Number.parseInt(leadForm.age, 10);

    if (!Number.isFinite(age)) {
      setSubmitStatus("error");
      setSubmitMessage("Informe uma idade valida.");
      return;
    }

    const payload: ExperimentalClassLeadRequestDTO = {
      name: leadForm.name.trim(),
      age,
      phone: leadForm.phone.trim(),
      objective: leadForm.objective.trim() ? leadForm.objective.trim() : undefined
    };

    try {
      setSubmitStatus("submitting");
      setSubmitMessage("Enviando seu pedido...");

      const response = await createExperimentalClassLead(payload);

      setSubmitStatus("success");
      setSubmitMessage(response.message);
      setLeadForm(initialLeadForm);
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel enviar agora. Tente novamente em instantes."
      );
    }
  }

  return (
    <div className="site-wrapper">
      <header className="hero" id="inicio">
        <div className="hero-background" aria-hidden="true">
          {HERO_SLIDES.map((slide, index) => (
            <img
              key={slide}
              src={slide}
              alt=""
              className={`hero-slide${index === heroSlideIndex ? " active" : ""}`}
            />
          ))}
        </div>
        <div className="hero-overlay" />

        <nav className={`top-nav${isNavOpen ? " nav-open" : ""}`}>
          <a className="brand" href="#inicio" onClick={handleNavLinkClick}>
            {content.brandName}
          </a>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={isNavOpen}
            aria-label="Alternar menu de navegacao"
            onClick={() => setIsNavOpen((previous) => !previous)}
          >
            {isNavOpen ? "Fechar" : "Menu"}
          </button>
          <div className="nav-links">
            <a href="#sobre" onClick={handleNavLinkClick}>Sobre</a>
            <a href="#orgulho-candoi" onClick={handleNavLinkClick}>Atleta destaque</a>
            <a href="#turmas" onClick={handleNavLinkClick}>Turmas</a>
            <a href="#metodologia" onClick={handleNavLinkClick}>Metodologia</a>
            <a href="#atletas" onClick={handleNavLinkClick}>Atletas</a>
            <a href="#blog" onClick={handleNavLinkClick}>Blog</a>
            <a href="#patrocinios" onClick={handleNavLinkClick}>Patrocinios</a>
            <a href="#aula-experimental" onClick={handleNavLinkClick}>Aula gratuita</a>
            <a href="#contato" onClick={handleNavLinkClick}>Contato</a>
          </div>
        </nav>

        {apiStatus !== "online" ? (
          <div className={`api-status ${apiStatus}`}>
            {apiStatus === "loading"
              ? "Carregando dados da API..."
              : "API offline no momento. Mostrando conteudo de demonstracao."}
          </div>
        ) : null}

        <div className="hero-inner">
          <div className="hero-content">
            <p className="impact-pill">{content.impactPhrase}</p>
            <h1>{content.heroTitle}</h1>
            <p className="hero-subtitle">{content.heroSubtitle}</p>

            <div className="hero-buttons">
              <a className="button button-primary" href={content.callToActionPrimaryUrl}>
                {content.callToActionPrimaryLabel}
              </a>
              <a
                className="button button-whatsapp"
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
              >
                {content.callToActionSecondaryLabel}
              </a>
            </div>

            <p className="hero-quote">Disciplina hoje. Vitoria amanha.</p>
            <p className="hero-scroll">Role para conhecer a metodologia</p>

            <div className="hero-indicators" aria-hidden="true">
              {HERO_SLIDES.map((_, index) => (
                <span
                  key={index}
                  className={`hero-indicator${index === heroSlideIndex ? " active" : ""}`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="stats-strip">
        <div className="container">
          <div className="stats-stack">
            <div className="counter-grid">
              {content.counters.map((counter) => (
                <AnimatedCounter key={counter.label} label={counter.label} value={counter.value} />
              ))}
            </div>

            <article className="performance-strip-card">
              <div className="performance-strip-head">
                <p>
                  {heroMedalStats.competitions} competicoes + {heroMedalStats.fights} lutas
                </p>
              </div>
              <div className="performance-medal-list">
                <div className="performance-medal-item">
                  <span>{"\u{1F947}"}</span>
                  <strong>{heroMedalStats.gold}</strong>
                </div>
                <div className="performance-medal-item">
                  <span>{"\u{1F948}"}</span>
                  <strong>{heroMedalStats.silver}</strong>
                </div>
                <div className="performance-medal-item">
                  <span>{"\u{1F949}"}</span>
                  <strong>{heroMedalStats.bronze}</strong>
                </div>
              </div>
            </article>

          </div>
        </div>

        <article className="sponsors-strip-card" id="patrocinadores-topo">
          <div className="sponsors-strip-head">
            <h3>Patrocinadores</h3>
          </div>

          <div className="sponsors-strip-grid">
            {sponsorHighlightCards.map((sponsor, index) => (
              <article
                key={`${sponsor.name}-${sponsor.logoUrl}-${index}`}
                className="sponsors-strip-item"
              >
                <img src={resolveSiteAssetUrl(sponsor.logoUrl)} alt={`Logo ${sponsor.name}`} loading="lazy" />
                <strong>{sponsor.name}</strong>
              </article>
            ))}
          </div>
        </article>
      </section>

      <main>
        {content.prideStudents.length > 0 ? (
          <section className="section section-pride" id="orgulho-candoi">
            <div className="container">
              <SectionTitle
                eyebrow="Orgulho Candoi"
                title="Atleta destaque"
                description="Reconhecimento de evolucao, postura e espirito de equipe."
              />

              <div className="pride-grid">
                {content.prideStudents.map((student, index) => (
                  <article
                    key={`${student.name}-${student.month}`}
                    className={`pride-card${index === 0 ? " featured" : ""}`}
                  >
                    <img
                      src={
                        resolveSiteAssetUrl(student.imageUrl) ||
                        PRIDE_HIGHLIGHT_IMAGES[index % PRIDE_HIGHLIGHT_IMAGES.length]
                      }
                      alt={`Aluno em destaque ${student.name}`}
                      loading="lazy"
                    />
                    <div className="pride-card-body">
                      <h3>{student.name}</h3>
                      <p>{student.achievement}</p>
                      <span>{student.month}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="section section-about" id="sobre">
          <div className="container">
            <SectionTitle
              eyebrow="Autoridade"
              title={content.aboutTitle}
              description="Judo Candoi e formacao esportiva e humana com metodologia clara e acompanhamento proximo."
            />

            <div className="about-grid">
              <figure className="about-photo">
                <img src="/images/site/sensei-com-turma-4x5.jpg" alt="Sensei com alunos da equipe" />
                <figcaption>Treinos com atencao individual e ambiente seguro.</figcaption>
              </figure>

              <div className="about-copy">
                <p>{content.aboutStory}</p>
                <ul>
                  <li>Respeito</li>
                  <li>Disciplina</li>
                  <li>Autoconfianca</li>
                  <li>Perseveranca</li>
                  <li>Familia</li>
                </ul>
                <blockquote>{content.aboutHighlight}</blockquote>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-programs" id="turmas">
          <div className="container">
            <SectionTitle
              eyebrow="Para quem e"
              title="Turmas por faixa etaria"
              description="Treinos planejados para cada fase de desenvolvimento."
            />

            <div className="program-grid">
              {content.programs.map((program) => (
                <article className="program-card" key={program.title}>
                  <header>
                    <h3>{program.title}</h3>
                    <p>{program.ageRange}</p>
                  </header>

                  <ul>
                    {program.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>

                  <a className="button button-outline" href="#aula-experimental">
                    {program.ctaText}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-methodology" id="metodologia">
          <div className="container">
            <SectionTitle
              eyebrow="Diferencial"
              title="Nossa metodologia de treino"
              description="Cada treino tem objetivo, cada aluno recebe acompanhamento."
            />

            <div className="method-grid">
              {content.methodology.map((item, index) => (
                <article key={item} className="method-card">
                  <span className="method-index">{String(index + 1).padStart(2, "0")}</span>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-results" id="conquistas">
          <div className="container">
            <SectionTitle
              eyebrow="Resultados"
              title="Conquistas dentro e fora do tatame"
              description="Medalhas importam, mas a principal vitoria e a evolucao do aluno."
            />

            <div className="results-grid">
              <div className="achievement-list">
                {content.achievements.map((achievement) => (
                  <article key={achievement.title}>
                    <h3>{achievement.title}</h3>
                    <p>{achievement.description}</p>
                  </article>
                ))}
              </div>

              <div className="gallery-showcase">
                <figure className="gallery-feature-card">
                  <img
                    src="/images/site/treino-forte-16x9.jpg"
                    alt="Conquistas tecnicas e evolucao dos alunos no tatame"
                    loading="lazy"
                  />
                </figure>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-timeline" id="linha-do-tempo">
          <div className="container">
            <SectionTitle
              eyebrow="Linha do tempo"
              title="Do primeiro kimono ao podio"
              description="Uma jornada de disciplina continua com proposito claro."
            />

            <div className="timeline-grid">
              {content.timeline.map((step) => (
                <article className="timeline-step" key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>

            <article className="before-after-card">
              <div className="before-after-images">
                <figure className="before-after-image">
                  <img
                    src="/images/site/treino-infantil-ludico-16x10.jpg"
                    alt="Fase inicial da formacao no judo"
                  />
                </figure>

                <figure className="before-after-image">
                  <img
                    src="/images/site/tecnica-graduacao-16x10.jpg"
                    alt="Evolucao tecnica e confianca dos alunos no judo"
                  />
                </figure>
              </div>

              <div className="before-after-copy">
                <h3>Evolucao da jornada</h3>
                <p>
                  Do acolhimento inicial ao desempenho avancado, cada etapa fortalece foco,
                  confianca e disciplina dentro e fora do tatame.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section className="section section-athletes" id="atletas">
          <div className="container">
            <SectionTitle
              eyebrow="Atletas"
              title="Galeria dos Atletas"
              description="Treinos, campeonatos e podios em uma galeria unica, com fotos exibidas por inteiro."
            />

            {athleteVisibleItems.length > 0 ? (
              <div className="athlete-grid">
                {athleteVisibleItems.map((item) => (
                  <article key={`${item.id}-${athleteRound}`} className="athlete-card">
                    <div className="athlete-card-media">
                      <img
                        src={item.imageUrl}
                        alt={`${item.athleteName} em um momento no Judo Candoi`}
                        loading="lazy"
                      />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="gallery-empty">
                Sem fotos de atletas cadastradas ainda.
              </div>
            )}
          </div>
        </section>

        <section className="section section-testimonials" id="depoimentos">
          <div className="container">
            <SectionTitle
              eyebrow="Depoimentos"
              title="Historias reais de transformacao"
              description="Confianca construida com pais, alunos e comunidade."
            />

            <div className="testimonial-grid">
              {content.testimonials.map((testimonial) => (
                <article key={`${testimonial.author}-${testimonial.quote}`} className="testimonial-card">
                  <p>"{testimonial.quote}"</p>
                  <footer>
                    <strong>{testimonial.author}</strong>
                    <span>{testimonial.role}</span>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-trial" id="aula-experimental">
          <div className="container">
            <SectionTitle
              eyebrow="Conversao"
              title={content.trialTitle}
              description={content.trialDescription}
            />

            <div className="trial-grid">
              <form className="trial-form" onSubmit={handleSubmit}>
                <label>
                  Nome
                  <input
                    type="text"
                    name="name"
                    value={leadForm.name}
                    onChange={handleInputChange}
                    placeholder="Nome do aluno"
                    required
                  />
                </label>

                <label>
                  Idade
                  <input
                    type="number"
                    name="age"
                    min={4}
                    max={80}
                    value={leadForm.age}
                    onChange={handleInputChange}
                    placeholder="Ex: 10"
                    required
                  />
                </label>

                <label>
                  Telefone / WhatsApp
                  <input
                    type="tel"
                    name="phone"
                    value={leadForm.phone}
                    onChange={handleInputChange}
                    placeholder="(46) 99999-9999"
                    required
                  />
                </label>

                <label>
                  Objetivo (opcional)
                  <textarea
                    name="objective"
                    rows={3}
                    value={leadForm.objective}
                    onChange={handleInputChange}
                    placeholder="Conte rapidamente o objetivo com o judo"
                  />
                </label>

                <button className="button button-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Agendar aula experimental"}
                </button>

                {submitMessage ? <p className={`form-feedback ${submitStatus}`}>{submitMessage}</p> : null}
              </form>

              <aside className="trial-aside">
                <h3>Prefere atendimento direto?</h3>
                <p>Fale com o time do Judo Candoi e agende pelo WhatsApp em poucos segundos.</p>
                <a className="button button-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer">
                  Ir para WhatsApp
                </a>
              </aside>
            </div>
          </div>
        </section>

        <section className="section section-schedule" id="horarios">
          <div className="container">
            <SectionTitle
              eyebrow="Rotina"
              title="Horarios de treino"
              description="Organizacao por idade e nivel para treino seguro e eficiente."
            />

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Dia</th>
                    <th>Horario</th>
                    <th>Turma</th>
                    <th>Nivel</th>
                  </tr>
                </thead>
                <tbody>
                  {content.schedules.map((item) => (
                    <tr key={`${item.day}-${item.time}-${item.audience}`}>
                      <td>{item.day}</td>
                      <td>{item.time}</td>
                      <td>{item.audience}</td>
                      <td>{item.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="section section-blog" id="blog">
          <div className="container">
            <SectionTitle
              eyebrow="Conteudo"
              title="Blog | Judo para a vida"
              description="Conteudo para pais, alunos e apaixonados por judo."
            />

            <div className="blog-grid">
              {blogPosts.map((post) => (
                <article
                  key={post.slug}
                  className={`blog-card${post.imageUrl && !brokenBlogImages[post.slug] ? "" : " no-image"}`}
                >
                  {post.imageUrl && !brokenBlogImages[post.slug] ? (
                    <img
                      src={resolveSiteAssetUrl(post.imageUrl)}
                      alt={post.title}
                      className="blog-card-image"
                      loading="lazy"
                      onError={() => markBlogImageAsBroken(post.slug)}
                    />
                  ) : null}
                  <div className="blog-card-body">
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    <button
                      className="button button-outline blog-read-button"
                      type="button"
                      onClick={() => setSelectedBlogSlug(post.slug)}
                    >
                      Ler artigo
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-sponsors" id="patrocinios">
          <div className="container">
            <SectionTitle
              eyebrow="Patrocinio"
              title="Patrocinadores"
              description={
                hasRealSponsors
                  ? "Espaco dedicado para parceiros que acreditam no esporte e na formacao de carater."
                  : "Espacos disponiveis para patrocinio. Cadastre os parceiros no painel admin."
              }
            />

            <div className="sponsor-grid">
              {sponsorCards.map((sponsor, index) => (
                <article key={`${sponsor.name}-${sponsor.logoUrl}-${index}`} className="sponsor-card">
                  <img src={resolveSiteAssetUrl(sponsor.logoUrl)} alt={`Logo ${sponsor.name}`} loading="lazy" />
                  <h3>{sponsor.name}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-contact" id="contato">
          <div className="container">
            <SectionTitle
              eyebrow="Conecte-se"
              title="Contato e localizacao"
              description="Acompanhe nosso dia a dia, conquistas e bastidores."
            />

            <div className="contact-grid">
              <article className="contact-card">
                <p>
                  <strong>Endereco:</strong> {content.contact.address}
                </p>
                <a href={content.contact.whatsappUrl} target="_blank" rel="noreferrer">
                  {content.contact.whatsappLabel}
                </a>
                <a href={content.contact.instagramUrl} target="_blank" rel="noreferrer">
                  Instagram {content.contact.instagramHandle}
                </a>
              </article>

              <div className="map-frame">
                <iframe
                  src={content.contact.mapEmbedUrl}
                  title="Mapa da academia"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {selectedBlogPost ? (
        <div className="blog-modal-overlay" role="dialog" aria-modal="true">
          <article className="blog-modal">
            <header className="blog-modal-header">
              <div>
                <span>Artigo</span>
                <h3>{selectedBlogPost.title}</h3>
              </div>
              <button
                className="button button-outline"
                type="button"
                onClick={() => setSelectedBlogSlug(null)}
              >
                Fechar
              </button>
            </header>

            <div className="blog-modal-content">
              {selectedBlogPost.imageUrl && !brokenBlogImages[selectedBlogPost.slug] ? (
                <img
                  src={resolveSiteAssetUrl(selectedBlogPost.imageUrl)}
                  alt={selectedBlogPost.title}
                  className="blog-modal-image"
                  loading="lazy"
                  onError={() => markBlogImageAsBroken(selectedBlogPost.slug)}
                />
              ) : null}
              {(selectedBlogPost.content || selectedBlogPost.excerpt)
                .split(/\n{2,}/)
                .filter((paragraph) => paragraph.trim().length > 0)
                .map((paragraph, index) => (
                  <p key={`${selectedBlogPost.slug}-${index}`}>{paragraph}</p>
                ))}
            </div>
          </article>
        </div>
      ) : null}

      <section className="final-cta">
        <div className="container final-cta-inner">
          <p>{content.finalCallToAction}</p>
          <a className="button button-primary" href="#aula-experimental">
            Agende agora sua aula experimental
          </a>
        </div>
      </section>

      <footer>
        <p>(c) {new Date().getFullYear()} Judo Candoi. Disciplina, respeito e coragem.</p>
        <a href="/?admin=1">Painel admin</a>
      </footer>
    </div>
  );
}

export default App;

