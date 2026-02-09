(() => {
  if (!window.BarberiaApi) return;

  const appointmentsList = document.querySelector("[data-appointments-list]");
  const appointmentsEmpty = document.querySelector("[data-appointments-empty]");
  const appointmentStatus = document.querySelector("[data-appointment-status]");
  const appointmentDate = document.querySelector("[data-appointment-date]");
  const appointmentBarber = document.querySelector("[data-appointment-barber]");
  const appointmentFilterBtn = document.querySelector("[data-appointment-filter]");
  const appointmentClearBtn = document.querySelector("[data-appointment-clear]");

  const calendarRoot = document.querySelector("[data-barber-calendar]");
  const calendarDaysEl = calendarRoot?.querySelector("[data-calendar-days]");
  const calendarTitleEl = calendarRoot?.querySelector("[data-calendar-title]");
  const calendarPrevBtn = calendarRoot?.querySelector("[data-calendar-prev]");
  const calendarNextBtn = calendarRoot?.querySelector("[data-calendar-next]");
  const calendarEventsEl = document.querySelector("[data-calendar-events]");
  const calendarEmptyEl = document.querySelector("[data-calendar-empty]");

  const indisponibilidadeForm = document.querySelector("[data-indisponibilidade-form]");
  const indisponibilidadeTipo = document.querySelector("#indisponibilidade-tipo");
  const indisponibilidadeInicio = document.querySelector("#indisponibilidade-inicio");
  const indisponibilidadeFim = document.querySelector("#indisponibilidade-fim");
  const indisponibilidadesList = document.querySelector("[data-indisponibilidades-list]");
  const indisponibilidadesEmpty = document.querySelector("[data-indisponibilidades-empty]");

  const commissionsList = document.querySelector("[data-commissions-list]");
  const commissionsEmpty = document.querySelector("[data-commissions-empty]");
  const commissionStart = document.querySelector("[data-commission-start]");
  const commissionEnd = document.querySelector("[data-commission-end]");
  const commissionFilterBtn = document.querySelector("[data-commission-filter]");
  const commissionSummary = document.querySelector("[data-commission-summary]");

  const state = {
    user: null,
    services: [],
    barbers: [],
    calendarMonth: null,
    calendarSelectedDate: null,
    calendarEvents: []
  };

  const requireBarber = async () => {
    const token = window.BarberiaApi.getToken();
    if (!token) {
      window.location.href = "login.html?redirect=barbeiro.html";
      return false;
    }
    try {
      const user = await window.BarberiaApi.getMe();
      window.BarberiaApi.setUser(user);
      state.user = user;
      if (user?.role !== "BARBEIRO" && user?.role !== "ADMIN") {
        window.location.href = "index.html";
        return false;
      }
      return true;
    } catch (error) {
      window.location.href = "login.html?redirect=barbeiro.html";
      return false;
    }
  };

  const showEmpty = (el, show) => {
    if (!el) return;
    el.hidden = !show;
  };

  const formatDateIso = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDate = (value) => {
    if (!value) return null;
    const [year, month, day] = String(value).split("-").map(Number);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    return new Date(year, month - 1, day);
  };

  const startOfMonth = (value) => {
    const date = new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const endOfMonth = (value) => {
    const date = new Date(value);
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  };

  const formatMonthTitle = (value) =>
    value.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const canConclude = (appointment) => {
    if (!appointment?.date || !appointment?.time) return false;
    const time = window.BarberiaApi.formatTime(appointment.time || "");
    if (!time) return false;
    const target = new Date(`${appointment.date}T${time}`);
    if (Number.isNaN(target.getTime())) return false;
    const minAllowed = new Date(target.getTime() + 10 * 60 * 1000);
    return new Date() >= minAllowed;
  };

  const getServiceName = (serviceId) => {
    const service = state.services.find((item) => String(item.id) === String(serviceId));
    return service?.name || (serviceId ? `Servico #${serviceId}` : "Servico");
  };

  const getBarberDisplayName = (username) => {
    const barber = state.barbers.find((item) => item.username === username);
    if (!barber) return username || "-";
    return barber.name ? `${barber.name} (${barber.username})` : barber.username;
  };

  const loadServices = async () => {
    try {
      const data = await window.BarberiaApi.getServices();
      const list = Array.isArray(data) ? data : data?.content || data?.servicos || [];
      state.services = list.map(window.BarberiaApi.normalizeService);
    } catch (error) {
      state.services = [];
    }
  };

  const renderBarberFilter = (barbers) => {
    if (!appointmentBarber) return;
    appointmentBarber.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Profissional";
    appointmentBarber.appendChild(placeholder);

    barbers.forEach((barber) => {
      const option = document.createElement("option");
      option.value = barber.username;
      option.textContent = barber.name ? `${barber.name} (${barber.username})` : barber.username;
      appointmentBarber.appendChild(option);
    });
  };

  const loadBarbers = async () => {
    try {
      const data = await window.BarberiaApi.getBarbers();
      const list = Array.isArray(data) ? data : data?.content || data?.usuarios || [];
      state.barbers = list
        .map(window.BarberiaApi.normalizeBarber)
        .filter((barber) => barber.username);
    } catch (error) {
      state.barbers = [];
    }
    renderBarberFilter(state.barbers);
  };

  const loadAppointments = async () => {
    try {
      const baseFilters = {};
      if (appointmentStatus?.value) baseFilters.status = appointmentStatus.value;
      if (appointmentDate?.value) baseFilters.data = appointmentDate.value;

      if (!window.BarberiaApi.getAppointments) {
        const data = await window.BarberiaApi.getMyAppointments();
        const list = Array.isArray(data) ? data : data?.content || data?.agendamentos || [];
        renderAppointments(list.map(window.BarberiaApi.normalizeAppointment));
        return;
      }

      let list = [];
      if (state.user?.role === "ADMIN") {
        const filters = { ...baseFilters };
        if (appointmentBarber?.value) filters.barbeiroUserName = appointmentBarber.value;
        const data = await window.BarberiaApi.getAppointments(filters);
        list = Array.isArray(data) ? data : data?.content || data?.agendamentos || [];
      } else {
        const mineFilters = { ...baseFilters, barbeiroUserName: state.user?.username };
        const requests = [window.BarberiaApi.getAppointments(mineFilters)];
        if (!appointmentStatus?.value || appointmentStatus.value === "REQUISITADO") {
          const openFilters = { ...baseFilters, semBarbeiro: true };
          requests.push(window.BarberiaApi.getAppointments(openFilters));
        }
        const results = await Promise.all(requests);
        const merged = [];
        const seen = new Set();
        results.forEach((data) => {
          const items = Array.isArray(data) ? data : data?.content || data?.agendamentos || [];
          items.forEach((item) => {
            const key = item?.id ?? JSON.stringify(item);
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(item);
          });
        });
        list = merged;
      }

      const appointments = list.map(window.BarberiaApi.normalizeAppointment);
      renderAppointments(appointments);
    } catch (error) {
      showEmpty(appointmentsEmpty, true);
      window.BarberiaUI?.toast?.({
        variant: "error",
        message: window.BarberiaApi.getErrorMessage(error)
      });
    }
  };

  const renderAppointments = (appointments) => {
    if (!appointmentsList) return;
    appointmentsList.innerHTML = "";
    if (!appointments?.length) {
      showEmpty(appointmentsEmpty, true);
      return;
    }
    showEmpty(appointmentsEmpty, false);

    const fragment = document.createDocumentFragment();
    appointments.forEach((appointment) => {
      const card = document.createElement("article");
      card.className = "row-card";

      const main = document.createElement("div");
      main.className = "row-main";
      main.innerHTML = `
        <strong>${getServiceName(appointment.serviceId)}</strong>
        <span>${window.BarberiaApi.formatDateBr(appointment.date)} as ${appointment.time}</span>
        <span>Barbeiro: ${appointment.barbeiroUsername || "-"}</span>
        <span>Cliente: ${appointment.clienteUsername || "-"}</span>
      `;

      const meta = document.createElement("div");
      meta.className = "row-meta";
      meta.innerHTML = `
        <span class="tag">${appointment.status}</span>
      `;

      const actions = document.createElement("div");
      actions.className = "row-actions";

      if (appointment.status === "REQUISITADO") {
        const acceptBtn = document.createElement("button");
        acceptBtn.type = "button";
        acceptBtn.className = "primary-action";
        acceptBtn.textContent = "Aceitar";
        acceptBtn.addEventListener("click", async () => {
          try {
            await window.BarberiaApi.acceptAppointment(appointment.id);
            await refreshAfterAppointmentMutation();
          } catch (error) {
            window.BarberiaUI?.toast?.({
              variant: "error",
              message: window.BarberiaApi.getErrorMessage(error)
            });
          }
        });
        actions.appendChild(acceptBtn);
      }

      if (appointment.status === "AGENDADO" && canConclude(appointment)) {
        const concludeBtn = document.createElement("button");
        concludeBtn.type = "button";
        concludeBtn.className = "primary-action";
        concludeBtn.textContent = "Concluir";
        concludeBtn.addEventListener("click", async () => {
          try {
            await window.BarberiaApi.concludeAppointment(appointment.id);
            await refreshAfterAppointmentMutation();
          } catch (error) {
            window.BarberiaUI?.toast?.({
              variant: "error",
              message: window.BarberiaApi.getErrorMessage(error)
            });
          }
        });
        actions.appendChild(concludeBtn);
      }

      if (appointment.status === "AGENDADO" || appointment.status === "REQUISITADO") {
        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "danger-action";
        cancelBtn.textContent = "Cancelar";
        cancelBtn.addEventListener("click", async () => {
          try {
            await window.BarberiaApi.cancelAppointment(appointment.id);
            await refreshAfterAppointmentMutation();
          } catch (error) {
            window.BarberiaUI?.toast?.({
              variant: "error",
              message: window.BarberiaApi.getErrorMessage(error)
            });
          }
        });
        actions.appendChild(cancelBtn);
      }

      card.append(main, meta, actions);
      fragment.appendChild(card);
    });
    appointmentsList.appendChild(fragment);
  };

  const renderCalendar = () => {
    if (!calendarRoot || !calendarDaysEl || !calendarTitleEl || !state.calendarMonth) return;

    const eventsByDate = state.calendarEvents.reduce((acc, item) => {
      if (!item?.date) return acc;
      const key = String(item.date).slice(0, 10);
      if (!acc.has(key)) acc.set(key, []);
      acc.get(key).push(item);
      return acc;
    }, new Map());

    calendarTitleEl.textContent = formatMonthTitle(state.calendarMonth);
    calendarDaysEl.innerHTML = "";

    const monthStart = startOfMonth(state.calendarMonth);
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - monthStart.getDay());
    const todayIso = formatDateIso(new Date());

    for (let i = 0; i < 42; i += 1) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      const iso = formatDateIso(date);

      const dayBtn = document.createElement("button");
      dayBtn.type = "button";
      dayBtn.className = "calendar-day";
      dayBtn.textContent = String(date.getDate());

      if (date.getMonth() !== state.calendarMonth.getMonth()) dayBtn.classList.add("is-muted");
      if (iso === todayIso) dayBtn.classList.add("is-today");
      if (eventsByDate.has(iso)) dayBtn.classList.add("has-events");
      if (state.calendarSelectedDate === iso) dayBtn.classList.add("is-selected");

      dayBtn.addEventListener("click", () => {
        state.calendarSelectedDate = iso;
        renderCalendar();
        renderCalendarEvents();
      });

      calendarDaysEl.appendChild(dayBtn);
    }
  };

  const renderCalendarEvents = () => {
    if (!calendarEventsEl) return;

    const selectedDate = state.calendarSelectedDate;
    const items = state.calendarEvents
      .filter((item) => String(item.date).slice(0, 10) === selectedDate)
      .sort((a, b) => String(a.time).localeCompare(String(b.time)));

    calendarEventsEl.innerHTML = "";

    if (!items.length) {
      showEmpty(calendarEmptyEl, true);
      return;
    }

    showEmpty(calendarEmptyEl, false);

    const fragment = document.createDocumentFragment();
    items.forEach((appointment) => {
      const card = document.createElement("article");
      card.className = "calendar-event";
      card.innerHTML = `
        <strong>${window.BarberiaApi.formatTime(appointment.time)} - ${getServiceName(appointment.serviceId)}</strong>
        <span>Cliente: ${appointment.clienteUsername || "-"}</span>
        <span>Barbeiro: ${getBarberDisplayName(appointment.barbeiroUsername)}</span>
      `;
      fragment.appendChild(card);
    });
    calendarEventsEl.appendChild(fragment);
  };

  const loadCalendarAcceptedAppointments = async () => {
    if (!state.calendarMonth || !window.BarberiaApi.getAppointments) return;

    const monthStart = formatDateIso(startOfMonth(state.calendarMonth));
    const monthEnd = formatDateIso(endOfMonth(state.calendarMonth));
    const filters = {
      status: "AGENDADO",
      dataInicio: monthStart,
      dataFim: monthEnd
    };

    if (state.user?.role === "ADMIN") {
      if (appointmentBarber?.value) filters.barbeiroUserName = appointmentBarber.value;
    } else {
      filters.barbeiroUserName = state.user?.username;
    }

    try {
      const data = await window.BarberiaApi.getAppointments(filters);
      const list = Array.isArray(data) ? data : data?.content || data?.agendamentos || [];
      state.calendarEvents = list.map(window.BarberiaApi.normalizeAppointment);

      const todayIso = formatDateIso(new Date());
      const firstEventDate = state.calendarEvents[0]?.date ? String(state.calendarEvents[0].date).slice(0, 10) : null;
      if (!state.calendarSelectedDate) {
        state.calendarSelectedDate = firstEventDate || todayIso;
      }
      const selectedDate = parseDate(state.calendarSelectedDate);
      if (
        !selectedDate ||
        selectedDate.getMonth() !== state.calendarMonth.getMonth() ||
        selectedDate.getFullYear() !== state.calendarMonth.getFullYear()
      ) {
        state.calendarSelectedDate = firstEventDate || formatDateIso(startOfMonth(state.calendarMonth));
      }

      renderCalendar();
      renderCalendarEvents();
    } catch (error) {
      state.calendarEvents = [];
      renderCalendar();
      renderCalendarEvents();
      window.BarberiaUI?.toast?.({
        variant: "error",
        message: window.BarberiaApi.getErrorMessage(error)
      });
    }
  };

  const changeCalendarMonth = async (direction) => {
    state.calendarMonth = new Date(
      state.calendarMonth.getFullYear(),
      state.calendarMonth.getMonth() + direction,
      1
    );
    state.calendarSelectedDate = formatDateIso(startOfMonth(state.calendarMonth));
    await loadCalendarAcceptedAppointments();
  };

  const renderIndisponibilidades = (items) => {
    if (!indisponibilidadesList) return;
    indisponibilidadesList.innerHTML = "";
    if (!items?.length) {
      showEmpty(indisponibilidadesEmpty, true);
      return;
    }
    showEmpty(indisponibilidadesEmpty, false);

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "row-card";

      const main = document.createElement("div");
      main.className = "row-main";
      main.innerHTML = `
        <strong>${item.tipo}</strong>
        <span>${new Date(item.inicio).toLocaleString("pt-BR")}</span>
        <span>${new Date(item.fim).toLocaleString("pt-BR")}</span>
      `;

      const actions = document.createElement("div");
      actions.className = "row-actions";
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "danger-action";
      deleteBtn.textContent = "Remover";
      deleteBtn.addEventListener("click", async () => {
        try {
          await window.BarberiaApi.deleteIndisponibilidade(item.id);
          await loadIndisponibilidades();
          await loadCalendarAcceptedAppointments();
        } catch (error) {
          window.BarberiaUI?.toast?.({
            variant: "error",
            message: window.BarberiaApi.getErrorMessage(error)
          });
        }
      });
      actions.appendChild(deleteBtn);

      card.append(main, actions);
      fragment.appendChild(card);
    });

    indisponibilidadesList.appendChild(fragment);
  };

  const loadIndisponibilidades = async () => {
    try {
      const data = await window.BarberiaApi.getIndisponibilidades({
        barbeiroUsername: state.user?.username
      });
      const list = Array.isArray(data) ? data : data?.content || data?.indisponibilidades || [];
      renderIndisponibilidades(list);
    } catch (error) {
      showEmpty(indisponibilidadesEmpty, true);
      window.BarberiaUI?.toast?.({
        variant: "error",
        message: window.BarberiaApi.getErrorMessage(error)
      });
    }
  };

  if (indisponibilidadeForm) {
    indisponibilidadeForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const tipo = indisponibilidadeTipo.value;
      const inicio = indisponibilidadeInicio.value;
      const fim = indisponibilidadeFim.value;

      if (!tipo || !inicio || !fim) {
        window.BarberiaUI?.toast?.({
          variant: "warning",
          message: "Preencha todos os campos."
        });
        return;
      }

      try {
        await window.BarberiaApi.createIndisponibilidade({
          barbeiroUsername: state.user?.username,
          tipo,
          inicio,
          fim
        });
        indisponibilidadeForm.reset();
        await loadIndisponibilidades();
        await loadCalendarAcceptedAppointments();
      } catch (error) {
        window.BarberiaUI?.toast?.({
          variant: "error",
          message: window.BarberiaApi.getErrorMessage(error)
        });
      }
    });
  }

  const renderCommissionSummary = (items) => {
    if (!commissionSummary) return;
    const total = items.reduce((sum, item) => sum + Number(item.valor || 0), 0);
    commissionSummary.innerHTML = `
      <div class="summary-card">
        <span>Total</span>
        <strong>${window.BarberiaApi.formatCurrency(total)}</strong>
      </div>
    `;
  };

  const renderCommissions = (items) => {
    if (!commissionsList) return;
    commissionsList.innerHTML = "";
    if (!items?.length) {
      showEmpty(commissionsEmpty, true);
      renderCommissionSummary([]);
      return;
    }
    showEmpty(commissionsEmpty, false);
    renderCommissionSummary(items);

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "row-card";

      const main = document.createElement("div");
      main.className = "row-main";
      main.innerHTML = `
        <strong>${item.servicoNome || "-"}</strong>
        <span>${item.percentual}%</span>
        <span>${formatDateTime(item.dataDeCriacao)}</span>
      `;

      const meta = document.createElement("div");
      meta.className = "row-meta";
      meta.innerHTML = `
        <span class="tag">${window.BarberiaApi.formatCurrency(item.valor)}</span>
      `;

      card.append(main, meta);
      fragment.appendChild(card);
    });
    commissionsList.appendChild(fragment);
  };

  const loadCommissions = async () => {
    try {
      const filters = {};
      if (commissionStart?.value) filters.inicio = commissionStart.value;
      if (commissionEnd?.value) filters.fim = commissionEnd.value;
      const items = await window.BarberiaApi.getCommissions(filters);
      renderCommissions(items);
    } catch (error) {
      showEmpty(commissionsEmpty, true);
      window.BarberiaUI?.toast?.({
        variant: "error",
        message: window.BarberiaApi.getErrorMessage(error)
      });
    }
  };

  const refreshAfterAppointmentMutation = async () => {
    await Promise.all([loadAppointments(), loadCalendarAcceptedAppointments()]);
  };

  if (commissionFilterBtn) commissionFilterBtn.addEventListener("click", loadCommissions);
  if (appointmentFilterBtn) appointmentFilterBtn.addEventListener("click", loadAppointments);
  if (appointmentClearBtn) {
    appointmentClearBtn.addEventListener("click", () => {
      if (appointmentStatus) appointmentStatus.value = "";
      if (appointmentDate) appointmentDate.value = "";
      if (appointmentBarber) appointmentBarber.value = "";
      loadAppointments();
    });
  }

  calendarPrevBtn?.addEventListener("click", () => changeCalendarMonth(-1));
  calendarNextBtn?.addEventListener("click", () => changeCalendarMonth(1));
  appointmentBarber?.addEventListener("change", () => {
    if (state.user?.role === "ADMIN") loadCalendarAcceptedAppointments();
  });

  const init = async () => {
    const ok = await requireBarber();
    if (!ok) return;

    state.calendarMonth = startOfMonth(new Date());
    state.calendarSelectedDate = formatDateIso(new Date());

    await loadServices();
    if (state.user?.role === "ADMIN") {
      await loadBarbers();
      if (appointmentBarber) appointmentBarber.disabled = false;
    } else if (appointmentBarber) {
      appointmentBarber.innerHTML = "";
      const option = document.createElement("option");
      option.value = state.user?.username || "";
      option.textContent = state.user?.name
        ? `${state.user.name} (${state.user.username})`
        : state.user?.username || "Profissional";
      appointmentBarber.appendChild(option);
      appointmentBarber.value = state.user?.username || "";
      appointmentBarber.disabled = true;
    }

    await Promise.all([loadAppointments(), loadCommissions(), loadIndisponibilidades()]);
    await loadCalendarAcceptedAppointments();
  };

  init();
})();
