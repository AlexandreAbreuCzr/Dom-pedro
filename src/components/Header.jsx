ï»¿import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { useToast } from "./ToastProvider";

const assetBase = import.meta.env.BASE_URL;\n\nconst getInitials = (user) => {
  const raw = user?.nome || user?.name || user?.username || user?.email || "";
  const trimmed = raw.trim();
  if (!trimmed) return "DP";

  const normalized = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  const parts = normalized.split(/[.\-_\\s]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const homeLinks = [
  { label: "ServiÃ§os", href: "#services" },
  { label: "Sobre", href: "#about" },
  { label: "InformaÃ§Ãµes", href: "#info" },
  { label: "AvaliaÃ§Ãµes", href: "#reviews" },
  { label: "Agendar", href: "#booking" }
];

export const Header = ({ highlight, links = homeLinks, id }) => {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("has-fixed-header");
    return () => document.body.classList.remove("has-fixed-header");
  }, []);

  const roleLinks = [];
  if (user?.role === "ADMIN") roleLinks.push({ label: "Admin", href: "/admin" });
  if (user?.role === "BARBEIRO" || user?.role === "ADMIN") {
    roleLinks.push({ label: "Barbeiro", href: "/barbeiro" });
  }

  const guardAndNavigate = (event, href, message) => {
    if (token) return;
    event.preventDefault();
    toast({ variant: "warning", message });
    navigate(`/login?redirect=${encodeURIComponent(href)}`);
  };

  const protectedHrefs = ["/agendamento", "/perfil", "/admin", "/barbeiro"];

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

  const renderLink = (link) => {
    const isHighlight = highlight === link.label;
    const isHash = link.href.startsWith("#");
    const classes = isHighlight ? "highlight" : "";
    if (isHash) {
      return (
        <a
          href={link.href}
          className={classes}
          onClick={(event) => {
            scrollToId(event, link.href.slice(1));
            setMenuOpen(false);
          }}
        >
          {link.label}
        </a>
      );
    }
    return (
      <Link
        to={link.href}
        className={classes}
        onClick={(event) => {
          if (protectedHrefs.includes(link.href) && !token) {
            guardAndNavigate(event, link.href, "FaÃ§a login para acessar.");
          }
          setMenuOpen(false);
        }}
      >
        {link.label}
      </Link>
    );
  };

  const profileHref = token ? "/perfil" : "/login";
  const profileLabel = token ? "Perfil" : "Entrar";

  return (
    <header className="header" id={id}>
      <nav className="nav container">
        <div className="brand">
          <h1>Dom Pedro</h1>
          <span>Barber Shop</span>
        </div>

        <ul className={`nav-links ${menuOpen ? "open" : ""}`} id="primary-navigation">
          {links.map((link) => (
            <li key={link.href}>{renderLink(link)}</li>
          ))}
          {roleLinks.map((link) => (
            <li key={link.href}>
              <Link to={link.href} onClick={() => setMenuOpen(false)}>{link.label}</Link>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          <Link
            className={`user-btn ${token ? "has-initial" : ""}`}
            to={profileHref}
            aria-label={profileLabel}
            title={profileLabel}
            data-auth-trigger
          >
            <span className="user-initial" data-auth-initial hidden={!token}>
              {getInitials(user)}
            </span>
            <img src=`${assetBase}assets/icons/user.svg` alt="" hidden={Boolean(token)} />
          </Link>

          <button className="menu-btn" aria-label="Abrir menu" type="button" aria-controls="primary-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((prev) => !prev)}>
            <img src=`${assetBase}assets/icons/menu.svg` alt="" />
          </button>
        </div>
      </nav>
    </header>
  );
};



