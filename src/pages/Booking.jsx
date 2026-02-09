import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer.jsx";
import { Header } from "../components/Header.jsx";
import { MonthCalendar, calendarUtils } from "../components/MonthCalendar.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { useAuth } from "../lib/auth.jsx";
import {
  cancelAppointment,
  createAppointment,
  formatCurrency,
  formatDateBr,
  formatTime,
  getAppointmentAvailability,
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
  { id: 1, name: "Corte", description: "Corte classico ou moderno.", price: 45 },
  { id: 2, name: "Barba", description: "Modelagem com acabamento.", price: 25 },
  { id: 3, name: "Sobrancelha", description: "Design e alinhamento.", price: 15 }
];

const toMonthRange = (date) => {
  const start = calendarUtils.startOfMonth(date);
  const end = calendarUtils.endOfMonth(date);
  return {
    startDate: calendarUtils.toIso(start),
    endDate: calendarUtils.toIso(end)
  };
};

const normalizeSlots = (slots) =>
  (Array.isArray(slots) ? slots : [])
    .map((slot) => formatTime(String(slot)))
    .filter(Boolean);

const statusClass = (status) => {
  if (status === "AGENDADO") return "tag--success";
  if (status === "CONCLUIDO") return "tag--info";
  if (status === "CANCELADO") return "tag--danger";
  return "";
};

const Booking = () => {
  const { token, user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [selectedBarber, setSelectedBarber] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [monthDate, setMonthDate] = useState(calendarUtils.startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [availabilityMap, setAvailabilityMap] = useState({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState(
    "Selecione profissional e servico para ver disponibilidade."
  );

  const [editingAppointment, setEditingAppointment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const todayIso = calendarUtils.toIso(new Date());

  const loadServices = async () => {
    try {
      const data = await getServices();
      const list = Array.isArray(data) ? data : data?.content || data?.servicos || [];
      const normalized = list
        .map(normalizeService)
        .filter((service) => service.name && service.status !== false);
      setServices(normalized.length ? normalized : fallbackServices);
    } catch (error) {
      setServices(fallbackServices);
    }
  };

  const loadBarbers = async () => {
    try {
      const data = await getBarbers();
      const list = Array.isArray(data) ? data : data?.content || data?.usuarios || [];
      const normalized = list.map(normalizeBarber).filter((barber) => barber.username);
      setBarbers(normalized);
    } catch (error) {
      setBarbers([]);
    }
  };

  const loadAppointments = async () => {
    if (!token) return;
    try {
      const data = await getMyAppointments();
      const list = Array.isArray(data) ? data : data?.content || data?.agendamentos || [];
      const normalized = list.map(normalizeAppointment);
      const currentUsername = user?.username || (await refreshUser())?.username;
      const clientAppointments = currentUsername
        ? normalized.filter((appointment) => appointment.clienteUsername === currentUsername)
        : normalized;
      setAppointments(clientAppointments);
    } catch (error) {
      setAppointments([]);
      toast({ variant: "error", message: "Nao foi possivel carregar seus agendamentos." });
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login?redirect=/agendamento");
      return;
    }

    refreshUser();
    loadServices();
    loadBarbers();
    loadAppointments();
  }, [token]);

  useEffect(() => {
    if (!selectedService && services.length) {
      setSelectedService(String(services[0].id));
    }
  }, [services, selectedService]);

  useEffect(() => {
    if (!selectedBarber && barbers.length) {
      setSelectedBarber(barbers[0].username);
    }
  }, [barbers, selectedBarber]);

  useEffect(() => {
    if (!token || !selectedBarber || !selectedService) {
      setAvailabilityMap({});
      setSelectedDate("");
      setSelectedTime("");
      setAvailabilityMessage("Selecione profissional e servico para ver disponibilidade.");
      return;
    }

    let cancelled = false;

    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      const { startDate, endDate } = toMonthRange(monthDate);

      try {
        const data = await getAppointmentAvailability({
          barberUsername: selectedBarber,
          serviceId: Number(selectedService),
          startDate,
          endDate
        });

        if (cancelled) return;

        const days = Array.isArray(data?.dias) ? data.dias : [];
        const mapped = {};

        days.forEach((day) => {
          const date = day?.data || day?.date;
          if (!date) return;
          const slots = normalizeSlots(day?.horariosDisponiveis || day?.availableTimes);
          const available = Boolean(day?.disponivel) && slots.length > 0;

          mapped[date] = {
            state: available ? "available" : "unavailable",
            count: slots.length,
            label: available ? `${slots.length} horarios` : "sem vagas",
            disabled: !available,
            slots
          };
        });

        setAvailabilityMap(mapped);
        setAvailabilityMessage("Calendario atualizado com disponibilidade real da agenda.");

        setSelectedDate((currentDate) => {
          if (currentDate && mapped[currentDate]?.slots?.length) {
            return currentDate;
          }
          const firstAvailable = Object.entries(mapped).find(([, value]) => value.slots?.length)?.[0];
          return firstAvailable || "";
        });
      } catch (error) {
        if (cancelled) return;
        setAvailabilityMap({});
        setSelectedDate("");
        setSelectedTime("");
        setAvailabilityMessage(getErrorMessage(error));
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    };

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [token, selectedBarber, selectedService, monthDate]);

  useEffect(() => {
    if (!selectedDate) {
      setSelectedTime("");
      return;
    }

    const slots = availabilityMap[selectedDate]?.slots || [];
    setSelectedTime((current) => (slots.includes(current) ? current : slots[0] || ""));
  }, [selectedDate, availabilityMap]);

  const selectedServiceData = useMemo(
    () => services.find((service) => String(service.id) === String(selectedService)),
    [services, selectedService]
  );

  const selectedBarberData = useMemo(
    () => barbers.find((barber) => barber.username === selectedBarber),
    [barbers, selectedBarber]
  );

  const availableSlots = selectedDate ? availabilityMap[selectedDate]?.slots || [] : [];

  const rules = [
    "Horario comercial: 09:00-12:00 e 13:00-20:00.",
    "Intervalos de 15 minutos com base na duracao do servico.",
    "Domingo sem atendimento.",
    "Necessario minimo de 15 minutos de antecedencia.",
    "Bloqueios por indisponibilidade do barbeiro sao respeitados."
  ];

  const resetBookingFlow = () => {
    setEditingAppointment(null);
    setSelectedDate("");
    setSelectedTime("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      toast({ variant: "warning", message: "Faca login para concluir o agendamento." });
      navigate("/login?redirect=/agendamento");
      return;
    }

    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime) {
      toast({ variant: "warning", message: "Selecione barbeiro, servico, dia e horario." });
      return;
    }

    try {
      setSubmitting(true);

      if (editingAppointment?.id) {
        await updateAppointment(editingAppointment.id, {
          data: selectedDate,
          hora: selectedTime
        });
        toast({ variant: "success", message: "Agendamento remarcado com sucesso." });
      } else {
        const me = user?.username ? user : await refreshUser();

        await createAppointment({
          clienteUsername: me?.username,
          barbeiroUsername: selectedBarber,
          servicoId: Number(selectedService),
          data: selectedDate,
          hora: selectedTime
        });

        toast({ variant: "success", message: "Agendamento criado com sucesso." });
      }

      resetBookingFlow();
      loadAppointments();
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!appointmentId) return;

    try {
      setSubmitting(true);
      await cancelAppointment(appointmentId);
      toast({ variant: "success", message: "Agendamento cancelado." });
      if (editingAppointment?.id === appointmentId) resetBookingFlow();
      loadAppointments();
    } catch (error) {
      toast({ variant: "error", message: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = (appointment) => {
    if (!appointment?.id) return;

    if (!appointment.barbeiroUsername || !appointment.serviceId) {
      toast({
        variant: "warning",
        message: "Nao foi possivel abrir remarcacao interativa para este agendamento."
      });
      return;
    }

    setEditingAppointment(appointment);
    setSelectedBarber(appointment.barbeiroUsername);
    setSelectedService(String(appointment.serviceId));

    if (appointment.date) {
      const [year, month, day] = appointment.date.split("-").map(Number);
      if (year && month && day) {
        setMonthDate(new Date(year, month - 1, 1));
        setSelectedDate(appointment.date);
      }
    }

    setSelectedTime(formatTime(appointment.time || ""));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navLinks = [
    { label: "Servicos", href: "/#services" },
    { label: "Sobre", href: "/#about" },
    { label: "Informacoes", href: "/#info" },
    { label: "Avaliacoes", href: "/#reviews" },
    { label: "Agendar", href: "/agendamento" }
  ];

  return (
    <>
      <Header highlight="Agendar" links={navLinks} />
      <main className="container">
        <section className="booking-hero" data-reveal>
          <div>
            <h2>Agendamento Inteligente</h2>
            <p>
              Escolha servico e profissional para ver um calendario com os dias e horarios realmente
              disponiveis.
            </p>
          </div>
          <div className="booking-badge">
            <span className="api-status">
              <span className={`status-dot ${availabilityLoading ? "is-pulsing" : ""}`}></span>
              Disponibilidade em tempo real
            </span>
            <span className="api-base">Atualizacao com base em agendamentos aceitos e indisponibilidades.</span>
          </div>
        </section>

        <section className="booking-page booking-page-v2">
          <div className="panel" data-reveal="delay-1">
            <div className="panel-header">
              <h3>{editingAppointment ? "Remarcar agendamento" : "Novo agendamento"}</h3>
              <p className="muted">Fluxo orientado por disponibilidade real do barbeiro.</p>
            </div>

            <form className="panel-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="barber">Profissional</label>
                  <select
                    id="barber"
                    value={selectedBarber}
                    onChange={(event) => setSelectedBarber(event.target.value)}
                    required
                  >
                    <option value="">Selecione um barbeiro</option>
                    {barbers.map((barber) => (
                      <option key={barber.username} value={barber.username}>
                        {barber.name ? `${barber.name} (${barber.username})` : barber.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="service">Servico</label>
                  <select
                    id="service"
                    value={selectedService}
                    onChange={(event) => setSelectedService(event.target.value)}
                    required
                  >
                    <option value="">Selecione um servico</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {formatCurrency(service.price)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="booking-rules booking-rules--compact">
                <h4>Regras aplicadas automaticamente</h4>
                <ul>
                  {rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>

              <div className="booking-calendar-block">
                <div className="calendar-column">
                  <div className="calendar-caption">
                    <h4>Calendario de datas</h4>
                    <p className="muted">Dias marcados em dourado possuem horarios disponiveis.</p>
                  </div>
                  <MonthCalendar
                    monthDate={monthDate}
                    onMonthChange={setMonthDate}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    dayMeta={availabilityMap}
                    minDate={todayIso}
                    compact
                  />
                </div>

                <div className="slots-column">
                  <div className="calendar-caption">
                    <h4>Horarios do dia</h4>
                    <p className="muted">
                      {selectedDate
                        ? `Selecione um horario para ${formatDateBr(selectedDate)}.`
                        : "Selecione uma data disponivel no calendario."}
                    </p>
                  </div>

                  <div className="time-grid">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`time-slot ${selectedTime === slot ? "is-active" : ""}`}
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>

                  {!availableSlots.length ? (
                    <p className="muted">Sem horarios disponiveis para o dia selecionado.</p>
                  ) : null}
                </div>
              </div>

              <div className="panel-summary">
                <div className="summary-card">
                  <span>Profissional</span>
                  <strong>{selectedBarberData?.name || selectedBarber || "-"}</strong>
                </div>
                <div className="summary-card">
                  <span>Servico</span>
                  <strong>{selectedServiceData?.name || "-"}</strong>
                </div>
                <div className="summary-card">
                  <span>Data e hora</span>
                  <strong>{selectedDate && selectedTime ? `${formatDateBr(selectedDate)} ${selectedTime}` : "-"}</strong>
                </div>
              </div>

              <div className="form-actions">
                <button className="primary-action" type="submit" disabled={submitting || availabilityLoading}>
                  {submitting
                    ? "Salvando..."
                    : editingAppointment
                      ? "Confirmar remarcacao"
                      : "Confirmar agendamento"}
                </button>
                {editingAppointment ? (
                  <button type="button" className="ghost-action" onClick={resetBookingFlow}>
                    Cancelar remarcacao
                  </button>
                ) : null}
              </div>
            </form>

            <p className="form-note">{availabilityMessage}</p>
          </div>

          <section className="panel" data-reveal="delay-2">
            <div className="panel-header">
              <h3>Meus agendamentos</h3>
              <p className="muted">Gerencie seus horarios e acompanhe o status.</p>
            </div>

            {!appointments.length ? (
              <p className="appointments-empty">Voce ainda nao possui agendamentos.</p>
            ) : (
              <div className="appointments-list">
                {appointments.map((appointment) => (
                  <article key={appointment.id} className="appointment-card">
                    <div className="appointment-meta">
                      <h4>{appointment.serviceName || "Servico"}</h4>
                      <span>
                        {formatDateBr(appointment.date)} as {formatTime(appointment.time)}
                      </span>
                      <span>Barbeiro: {appointment.barbeiroUsername || "-"}</span>
                      <span className={`tag ${statusClass(appointment.status)}`}>{appointment.status}</span>
                    </div>

                    <div className="appointment-actions">
                      <button
                        type="button"
                        className="ghost-action"
                        onClick={() => handleReschedule(appointment)}
                      >
                        Remarcar
                      </button>

                      {[
                        "REQUISITADO",
                        "AGENDADO"
                      ].includes(appointment.status) ? (
                        <button
                          type="button"
                          className="danger-action"
                          onClick={() => handleCancelAppointment(appointment.id)}
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
