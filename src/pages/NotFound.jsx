import { Link } from "react-router-dom";
import { Footer } from "../components/Footer.jsx";
import { Header } from "../components/Header.jsx";

const NotFound = () => (
  <>
    <Header />
    <main className="container" style={{ padding: "60px 0" }}>
      <section className="panel">
        <h2>Página não encontrada</h2>
        <p className="muted">O endereço informado não existe.</p>
        <Link className="primary-action" to="/">
          Voltar para o início
        </Link>
      </section>
    </main>
    <Footer />
  </>
);

export default NotFound;

