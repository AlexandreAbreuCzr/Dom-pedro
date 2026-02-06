import { Link } from "react-router-dom";
import { Footer } from "../components/Footer.jsx";
import { Header } from "../components/Header.jsx";

const NotFound = () => (
  <>
    <Header />
    <main className="container" style={{ padding: "60px 0" }}>
      <section className="panel">
        <h2>PÃ¡gina nÃ£o encontrada</h2>
        <p className="muted">O endereÃ§o informado nÃ£o existe.</p>
        <Link className="primary-action" to="/">
          Voltar para o inÃ­cio
        </Link>
      </section>
    </main>
    <Footer />
  </>
);

export default NotFound;

