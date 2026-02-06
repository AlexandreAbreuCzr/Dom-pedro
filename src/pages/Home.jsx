import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer.jsx";
import { Header } from "../components/Header.jsx";
import { SideNav } from "../components/SideNav.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../lib/auth.jsx";
import { config, formatCurrency, getServices, normalizeService, getReviews, createReview } from "../lib/api.js";

const assetBase = import.meta.env.BASE_URL;

const fallbackServices = [
  { id: 1, name: "Corte Masculino", description: "Corte moderno ou clássico.", price: 45 },
  { id: 2, name: "Barba", description: "Modelagem com toalha quente.", price: 25 },
  { id: 3, name: "Sobrancelha", description: "Design e alinhamento.", price: 15 },
  { id: 4, name: "Pigmentação", description: "Preenchimento e definição.", price: 35 },
  { id: 5, name: "Platinado", description: "Descoloração e tonalização.", price: 120 },
  { id: 6, name: "Relaxamento", description: "Redução de volume e frizz.", price: 80 }
];

const iconRules = [
  { match: /barba/i, icon: `${assetBase}assets/icons/beard.svg` },
  { match: /sobrancelha/i, icon: `${assetBase}assets/icons/brow.svg` },
  { match: /pigment|color|platin|tinta|tonal/i, icon: `${assetBase}assets/icons/color.svg` },
  { match: /relax|progress|alis/i, icon: `${assetBase}assets/icons/clipper.svg` },
  { match: /corte|cabelo/i, icon: `${assetBase}assets/icons/scissors.svg` }
];

const resolveIcon = (name = "", imageUrl) => {
  if (imageUrl) {
    const base = config?.baseUrl?.replace(/\/$/, "") || "";
    return imageUrl.startsWith("http") ? imageUrl : `${base}${imageUrl}`;
  }
  const rule = iconRules.find((item) => item.match.test(name));
  return rule ? rule.icon : `${assetBase}assets/icons/clipper.svg`;
};

const useScrollSpy = () => {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll("section, header"));
    const links = document.querySelectorAll(".nav-links a, .side-nav a");

    const getHeaderOffset = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue("--header-height");
      const value = parseFloat(raw);
      return Number.isFinite(value) ? value : 0;
    };

    const handleScroll = () => {
      const offset = getHeaderOffset() + 20;
      let current = "home";
      sections.forEach((sec) => {
        if (!sec.id) return;
        if (window.scrollY + offset >= sec.offsetTop) current = sec.id;
      });
      links.forEach((link) => {
        const href = link.getAttribute("href");
        const isActive = href === `#${current}` || href === `/#${current}`;
        link.classList.toggle("active", isActive);
      });
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
};

const Home = () => {
  useScrollSpy();
  const { token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [statusMessage, setStatusMessage] = useState("Carregando serviços da API...");
  const [reviews, setReviews] = useState([]);

  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  const recalcCarousel = () => {
    if (!viewportRef.current || !trackRef.current) return;
    const cards = trackRef.current.querySelectorAll(".service-card");
    if (!cards.length) return;
    const cardRect = cards[0].getBoundingClientRect();
    const gapValue = parseFloat(getComputedStyle(trackRef.current).gap) || 0;
    const step = cardRect.width + gapValue;
    const width = viewportRef.current.clientWidth;
    const cardsPerPage = Math.max(1, Math.floor((width + gapValue) / step));
    const pages = Math.ceil(cards.length / cardsPerPage);
    setViewportWidth(width);
    setPageCount(pages);
    setCurrentPage((prev) => Math.min(prev, pages - 1));
  };

  useEffect(() => {
    const handleResize = () => recalcCarousel();
    window.addEventListener("resize", handleResize);
    recalcCarousel();
    return () => window.removeEventListener("resize", handleResize);
  }, [services]);

  useEffect(() => {
    const load = async () => {
      setStatusMessage("Carregando serviços da API...");
      try {
        const data = await getServices();
        const list = Array.isArray(data) ? data : data?.content || data?.servicos || [];
        const normalized = list
          .map(normalizeService)
          .filter((item) => item.name && item.status !== false);
        if (!normalized.length) throw new Error("Lista vazia");
        setServices(normalized);
        setStatusMessage(`${normalized.length} serviços disponíveis.`);
      } catch (error) {
        setServices(fallbackServices);
        setStatusMessage("Não foi possível conectar com a API. Exibindo serviços padrão.");
        toast({
          variant: "warning",
          message: "API indisponível no momento. Usando serviços padrão."
        });
      }
    };
    load();
  }, [toast]);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const data = await getReviews();
        const list = Array.isArray(data) ? data : data?.content || [];
        setReviews(list);
      } catch (error) {
        setReviews([]);
      }
    };
    loadReviews();
  }, []);

  const serviceList = useMemo(() => {
    return services.length ? services : fallbackServices;
  }, [services]);

  const handleProtected = (event, target) => {
    if (token) return;
    event.preventDefault();
    toast({ variant: "warning", message: "Faça login para agendar." });
    navigate(`/login?redirect=${encodeURIComponent(target)}`);
  };

  const starsFor = (rating) => {
    const value = Math.max(1, Math.min(5, Number(rating) || 0));
    const filled = "★".repeat(value);
    const empty = "☆".repeat(5 - value);
    return filled + empty;
  };

  const handleReviewSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.querySelector("#review-name")?.value.trim();
    const rating = form.querySelector("#review-rating")?.value;
    const message = form.querySelector("#review-message")?.value.trim();

    if (!name || !rating || !message) {
      toast({ variant: "warning", message: "Preencha nome, nota e comentário." });
      return;
    }

    const review = { nome: name, nota: Number(rating), comentario: message };
    createReview(review)
      .then((saved) => {
        const payload = saved || { ...review, dataDeCriacao: new Date().toISOString() };
        setReviews((prev) => [payload, ...prev]);
        form.reset();
        toast({ variant: "success", message: "avaliação enviada." });
      })
      .catch(() => {
        toast({ variant: "error", message: "Não foi possível salvar sua avaliação." });
      });
  };

  return (
    <>
      <SideNav />
      <Header id="home" highlight="Agendar" />
      <main className="container">
        <section className="section-header" id="services" data-reveal>
          <h2>Nossos Serviços</h2>
          <p>Profissionalismo, estilo e tradição.</p>
        </section>

        <section className="services-wrap" data-reveal="delay-1">
          <div className="services-viewport" ref={viewportRef}>
            <div
              className="services"
              ref={trackRef}
              style={{
                transform: `translateX(-${currentPage * viewportWidth}px)`
              }}
            >
              {serviceList.map((service) => (
                <article key={service.id} className="service-card">
                  <div className="service-thumb">
                    <img src={resolveIcon(service.name, service.imageUrl)} alt={service.name} />
                  </div>
                  <div className="service-info">
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                    <div className="service-footer">
                      <strong>{formatCurrency(service.price)}</strong>
                      <a
                        className="service-cta"
                        href="/agendamento"
                        onClick={(event) => handleProtected(event, "/agendamento")}
                      >
                        Agendar
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="services-dots" aria-hidden="true">
            {Array.from({ length: pageCount }).map((_, index) => (
              <button
                key={`dot-${index}`}
                type="button"
                className={`dot ${index === currentPage ? "active" : ""}`}
                aria-label={`Página ${index + 1}`}
                onClick={() => setCurrentPage(index)}
              />
            ))}
          </div>
          <p className="services-helper">{statusMessage}</p>
        </section>

        <section className="about" id="about">
          <div className="about-card" data-reveal>
            <h2>Sobre a Barbearia</h2>
            <p>
              Tradição, modernidade e atendimento de qualidade em um ambiente elegante,
              confortável e pensado para você.
            </p>
            <p className="muted">
              Da recepção ao acabamento final, cada detalhe é cuidado para entregar a sua
              melhor versão.
            </p>
          </div>
          <div className="about-card highlight" data-reveal="delay-1">
            <h3>Experiência Premium</h3>
            <ul className="about-list">
              <li>Profissionais especializados e consultoria de estilo.</li>
              <li>Produtos premium com tratamento para couro e barba.</li>
              <li>Agendamento rápido, com horários sob medida.</li>
            </ul>
            <a className="text-link" href="/agendamento" onClick={(event) => handleProtected(event, "/agendamento")}>
              Quero agendar
            </a>
          </div>
        </section>

        <section className="info" id="info">
          <div className="section-header" data-reveal>
            <h2>Informações</h2>
            <p>Detalhes essenciais para sua visita.</p>
          </div>

          <div className="info-grid">
            <article className="info-card" data-reveal="delay-1">
              <div className="info-title">
                <img src={`${assetBase}assets/icons/map-pin.svg`} alt="" aria-hidden="true" />
                <h3>Localização</h3>
              </div>
              <p>R. Manoel Lopes de Oliveira</p>
              <p>Centro, Cândido - PR, 85140-000</p>
            </article>

            <article className="info-card" data-reveal="delay-2">
              <div className="info-title">
                <img src={`${assetBase}assets/icons/clock.svg`} alt="" aria-hidden="true" />
                <h3>Horário</h3>
              </div>
              <p>Seg a Sex: 09h às 20h</p>
              <p>Sáb: 09h às 19h</p>
              <p>Dom: Fechado</p>
            </article>

            <article className="info-card" data-reveal="delay-3">
              <div className="info-title">
                <img src={`${assetBase}assets/icons/phone.svg`} alt="" aria-hidden="true" />
                <h3>Contato</h3>
              </div>
              <p>(42) 99960-1678</p>
              <p>@dompedrobarbershop</p>
            </article>
          </div>
        </section>

        <section className="reviews" id="reviews">
          <div className="section-header" data-reveal>
            <h2>Avaliações</h2>
            <p>O que nossos clientes dizem.</p>
          </div>

          <div className="reviews-grid" data-reviews-list>
            <article className="review-card" data-reveal="delay-1">
              <div className="review-header">
                <span className="review-name">Carlos M.</span>
                <span className="review-stars">★★★★★</span>
              </div>
              <p>Corte impecável, ambiente sofisticado e atendimento impecável.</p>
            </article>
            <article className="review-card" data-reveal="delay-2">
              <div className="review-header">
                <span className="review-name">Felipe S.</span>
                <span className="review-stars">★★★★★</span>
              </div>
              <p>Equipe extremamente profissional. O agendamento é simples e rápido.</p>
            </article>
            <article className="review-card" data-reveal="delay-3">
              <div className="review-header">
                <span className="review-name">João P.</span>
                <span className="review-stars">★★★★☆</span>
              </div>
              <p>Ótimo custo-benefício e excelente consultoria de estilo.</p>
            </article>
            {reviews.map((review, index) => (
              <article className="review-card" key={`${review.nome || review.name}-${index}`}>
                  <div className="review-header">
                    <span className="review-name">{review.nome || review.name}</span>
                    <span className="review-stars">
                      {starsFor(review.nota ?? review.rating)}
                    </span>
                  </div>
                <p>{review.comentario || review.message}</p>
              </article>
            ))}
          </div>

          <div className="panel review-form" data-reveal="delay-4">
            <div className="panel-header">
              <h3>Deixe sua avaliação</h3>
              <p className="muted">Compartilhe como foi sua experiência.</p>
            </div>
            <div className="panel-body">
              <form className="panel-form" onSubmit={handleReviewSubmit}>
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="review-name">Nome</label>
                    <input id="review-name" type="text" placeholder="Seu nome" required />
                  </div>
                  <div className="form-field">
                    <label htmlFor="review-rating">Nota</label>
                    <select id="review-rating" required>
                      <option value="5">5</option>
                      <option value="4">4</option>
                      <option value="3">3</option>
                      <option value="2">2</option>
                      <option value="1">1</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="review-message">Comentário</label>
                    <input
                      id="review-message"
                      type="text"
                      placeholder="O que achou do atendimento?"
                      required
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="primary-action" type="submit">
                    Enviar avaliação
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        <section className="booking" id="booking" data-reveal>
          <h2>Agendamento</h2>
          <p>Escolha o melhor dia, horário e finalize em poucos cliques.</p>
          <a
            className="booking-button"
            href="/agendamento"
            onClick={(event) => handleProtected(event, "/agendamento")}
          >
            Agendar
          </a>
          <span className="booking-note">Disponível para clientes logados com a API Barberia.</span>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Home;



