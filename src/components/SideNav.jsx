const getHeaderOffset = () => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--header-height");
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
};

const scrollToId = (event, id) => {
  event.preventDefault();
  const target = document.getElementById(id);
  if (target) {
    const offset = getHeaderOffset();
    const top = target.getBoundingClientRect().top + window.scrollY - offset - 16;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    window.history.replaceState(null, "", `#${id}`);
    return;
  }
  window.location.hash = `#${id}`;
};

export const SideNav = () => (
  <aside className="side-nav" aria-label="Atalhos de seÃ§Ãµes">
    <a href="#home" aria-label="InÃ­cio" onClick={(event) => scrollToId(event, "home")}></a>
    <a href="#services" aria-label="ServiÃ§os" onClick={(event) => scrollToId(event, "services")}></a>
    <a href="#about" aria-label="Sobre" onClick={(event) => scrollToId(event, "about")}></a>
    <a href="#info" aria-label="InformaÃ§Ãµes" onClick={(event) => scrollToId(event, "info")}></a>
    <a href="#reviews" aria-label="AvaliaÃ§Ãµes" onClick={(event) => scrollToId(event, "reviews")}></a>
    <a href="#booking" aria-label="Agendamento" onClick={(event) => scrollToId(event, "booking")}></a>
  </aside>
);

