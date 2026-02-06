import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer.jsx";
import { Header } from "../components/Header.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../lib/auth.jsx";
import {
  cancelAppointment,
  createAppointment,
  formatCurrency,
  formatDateBr,
  formatTime,
  getBarbers,
  getErrorMessage,
  getMyAppointments,
  getServices,
  normalizeAppointment,
  normalizeBarber,
  normalizeService,
  updateAppointment
} from "../lib/api.js";

const fallbackServices = [
  { id: 1, name: "Corte Masculino", description: "Corte moderno ou clássico.", price: 45 },
  { id: 2, name: "Barba", description: "Modelagem com toalha quente.", price: 25 },
  { id: 3, name: "Sobrancelha", description: "Design e alinhamento.", price: 15 }
];

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const isSunday = (dateStr) => {
  const date = parseDate(dateStr);
  return date ? date.getDay() === 0 : false;
};

const isDateAllowed = (dateStr, timeStr) => {
  if (!dateStr) return false;
  if (isSunday(dateStr)) return false;
  const date = parseDate(dateStr);
  if (!date) return false;

  if (!timeStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }

  const [hours, minutes] = timeStr.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return false;
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
  const minAllowed = new Date();
  minAllowed.setMinutes(minAllowed.getMinutes() + 15);
  return target >= minAllowed;
};

const Booking = () => {
  const { token, user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState({
    barbeiroUsername: "",
    servicoId: "",
    data: "",
    hora: ""
  });
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("Selecione serviço e horário.");
  const [serviceDuration, setServiceDuration] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login?redirect=/agendamento");
    }
  }, [token, navigate]);

  const updateNote = (servicesCount, barbersCount) => {
    const parts = [];
    if (servicesCount) parts.push(`${servicesCount} serviços disponíveis`);
    if (barbersCount) parts.push(`${barbersCount} profissionais disponíveis`);
    setNote(parts.length ? `${parts.join(" | ")}.` : "Selecione serviço e horário.");
  };

  const updateDuration = (serviceId, serviceList) => {
    if (!serviceId) {
      setServiceDuration("");
      return;
    }
    const found = serviceList.find((service) => String(service.id) === String(serviceId));
    const durationValue = Number(found?.duracaoEmMinutos ?? found?.duration);
    setServiceDuration(
      Number.isFinite(durationValue) && durationValue > 0
        ? `Duração média: ${durationValue} min`
        : ""
    );
  };

  const loadServices = async () => {
    try {
      const data = await getServices();
      const list = Array.isArray(data) ? data : data?.content || data?.servicos || [];
      const normalized = list
        .map(normalizeService)
        .filter((item) => item.name && item.status !== false);
      if (!normalized.length) throw new Error("Lista vazia");
      setServices(normalized);
      updateNote(normalized.length, barbers.length);
    } catch (error) {
      setServices(fallbackServices);
      updateNote(fallbackServices.length, barbers.length);
    }
  };

  const loadBarbers = async () => {
    try {
      const data = await getBarbers();
      const list = Array.isArray(data) ? data : data?.content || data?.usuarios || [];
      const normalized = list
        .map(normalizeBarber)
        .filter((barber) => barber.username);
      setBarbers(normalized);
      updateNote(services.length, normalized.length);
    } catch (error) {
      setBarbers([]);
      updateNote(services.length, 0);
    }
  };

  const loadAppointments = async () => {
    if (!token) return;
    try {
      const data = await getMyAppointments();
      const list = Array.isArray(data) ? data : data?.content || data?.agendamentos || [];
      setAppointments(list.map(normalizeAppointment));
    } catch (error) {
      setAppointments([]);
      toast({ variant: "error", message: "Não foi possível carregar seus agendamentos." });
    }
  };

  useEffect(() => {
    if (!token) return;
    refreshUser();
    loadServices();
    loadBarbers();
    loadAppointments();
  }, [token]);

  useEffect(() => {
    updateDuration(formState.servicoId, services);
  }, [formState.servicoId, services]);

  const handleEdit = (appointment) => {
    setEditingId(appointment.id);
    setFormState({
      barbeiroUsername: appointment.barbeiroUsername || "",
      servicoId: appointment.serviceId ? String(appointment.serviceId) : "",
      data: appointment.date || "",
      hora: formatTime(appointment.time || "")
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormState({ barbeiroUsername: "", servicoId: "", data: "", hora: "" });
  };

  const handleCancel = async (appointment) => {
    if (!appointment?.id) return;
    try {
      setLoading(true);
      await cancelAppointment(appointment.id);
      toast({ variant: "success", message: "Agendamento cancelado." });
      resetForm();
      loadAppointments();
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      toast({ variant: "warning", message: "Faça login para finalizar o agendamento." });
      navigate("/login?redirect=/agendamento");
      return;
    }

    const payload = {
      clienteUsername: user?.username,
      barbeiroUsername: formState.barbeiroUsername || null,
      servicoId: formState.servicoId ? Number(formState.servicoId) : "",
      data: formState.data,
      hora: formState.hora
    };

    if (!payload.clienteUsername) {
      toast({ variant: "warning", message: "Faça login novamente para confirmar seu usuário." });
      return;
    }
    if (!payload.servicoId || !payload.data || !payload.hora) {
      toast({ variant: "warning", message: "Preencha serviço, data e horário." });
      return;
    }
    if (!isDateAllowed(payload.data, payload.hora)) {
      toast({
        variant: "warning",
        message: "Escolha uma data válida com pelo menos 15 minutos de antecedência."
      });
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await updateAppointment(editingId, { data: payload.data, hora: payload.hora });
        toast({ variant: "success", message: "Agendamento atualizado." });
      } else {
        await createAppointment(payload);
        toast({ variant: "success", message: "Agendamento confirmado." });
      }
      resetForm();
      loadAppointments();
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const serviceNameFor = (serviceId) => {
    const found = services.find((service) => String(service.id) === String(serviceId));
    return found?.name || (serviceId ? `Serviço #${serviceId}` : "Serviço");
  };

  const appointmentsEmptyMessage = token
    ? "Você ainda não possui agendamentos."
    : "Faça login para visualizar seus agendamentos.";

  const servicesOptions = useMemo(
    () =>
      services.length
        ? services
        : fallbackServices.map((service) => ({ ...service, name: service.name })),
    [services]
  );

  const navLinks = [
    { label: "Serviços", href: "/#services" },
    { label: "Sobre", href: "/#about" },
    { label: "Informações", href: "/#info" },
    { label: "Avaliações", href: "/#reviews" },
    { label: "Agendar", href: "/agendamento" }
  ];

  return (
    <>
      <Header highlight="Agendar" links={navLinks} />
      <main className="container">
        <section className="booking-hero">
          <div>
            <h2>Agendamento</h2>
            <p>Escolha o serviço, o dia e o melhor horário para você.</p>
          </div>
        </section>

        <section className="booking-page">
          <div className="booking-steps">
            <div className="step-card">
              <span className="step-number">1</span>
              <div>
                <h3>Serviço e profissional</h3>
                <p>Selecione o serviço e o profissional (opcional).</p>
              </div>
            </div>
            <div className="step-card">
              <span className="step-number">2</span>
              <div>
                <h3>Horário</h3>
                <p>Escolha o dia e o horário permitido.</p>
              </div>
            </div>
            <div className="step-card">
              <span className="step-number">3</span>
              <div>
                <h3>Confirmação</h3>
                <p>Finalize e acompanhe seus agendamentos.</p>
              </div>
            </div>
          </div>

          <div className="booking-rules">
            <h3>Regras de agendamento</h3>
            <ul>
              <li>Agendamentos precisam de pelo menos 15 minutos de antecedência.</li>
              <li>Não ? permitido agendar para domingo.</li>
              <li>Horários disponíveis: 09h às 12h e 13h às 20h.</li>
              <li>Datas passadas não são permitidas.</li>
            </ul>
          </div>

          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="barbeiro">Profissional</label>
                <select
                  id="barbeiro"
                  value={formState.barbeiroUsername}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, barbeiroUsername: event.target.value }))
                  }
                  disabled={Boolean(editingId)}
                >
                  <option value="">Sem preferencia</option>
                  {barbers.map((barber) => (
                    <option key={barber.username} value={barber.username}>
                      {barber.name ? `${barber.name} (${barber.username})` : barber.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="Serviço">Serviço</label>
                <select
                  id="Serviço"
                  value={formState.servicoId}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, servicoId: event.target.value }))
                  }
                  disabled={Boolean(editingId)}
                  required
                >
                  <option value="">Selecione um serviço</option>
                  {servicesOptions.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} • {formatCurrency(service.price)}
                    </option>
                  ))}
                </select>
                <span className="form-note">{serviceDuration}</span>
              </div>

              <div className="form-field">
                <label htmlFor="data">Data</label>
                <input
                  id="data"
                  type="date"
                  required
                  value={formState.data}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, data: event.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="horario">Horário</label>
                <input
                  id="horario"
                  type="time"
                  required
                  value={formState.hora}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, hora: event.target.value }))
                  }
                />
                <span className="form-note">Selecione um horário disponível.</span>
              </div>
            </div>

            <div className="form-actions">
              <button className="primary-action" type="submit" disabled={loading}>
                {loading ? "Salvando..." : editingId ? "Salvar alterações" : "Confirmar agendamento"}
              </button>
              <button
                className="ghost-action"
                type="button"
                hidden={!editingId}
                onClick={resetForm}
              >
                Cancelar alteração
              </button>
              <p className="form-note">{note}</p>
            </div>
          </form>

          <section className="appointments">
            <div className="section-header">
              <h2>Meus agendamentos</h2>
              <p>Visualize, cancele ou remarque seus horários.</p>
            </div>
            {appointments.length === 0 ? (
              <div className="appointments-empty">{appointmentsEmptyMessage}</div>
            ) : (
              <div className="appointments-list">
                {appointments.map((appointment) => (
                  <article key={appointment.id} className="appointment-card">
                    <div className="appointment-meta">
                      <h4>{serviceNameFor(appointment.serviceId)}</h4>
                      <span>
                        {formatDateBr(appointment.date)} às {appointment.time}
                      </span>
                      <span>Profissional: {appointment.barbeiroUsername || "-"}</span>
                      <span>Status: {appointment.status}</span>
                    </div>
                    <div className="appointment-actions">
                      <button
                        type="button"
                        className="ghost-action"
                        onClick={() => handleEdit(appointment)}
                      >
                        Remarcar
                      </button>
                      {["REQUISITADO", "AGENDADO"].includes(appointment.status) ? (
                        <button
                          type="button"
                          className="danger-action"
                          onClick={() => handleCancel(appointment)}
                        >
                          Cancelar
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Booking;




