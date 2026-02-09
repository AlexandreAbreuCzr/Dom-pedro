(() => {
  if (!window.BarberiaApi) return;

  const form = document.querySelector("[data-booking-form]");
  if (!form) return;

  const serviceSelect = form.querySelector("#servico");
  const dateInput = form.querySelector("#data");
  const timeInput = form.querySelector("#horario");
  const barberSelect = form.querySelector("#barbeiro");
  const submitBtn = form.querySelector("[data-submit]");
  const cancelEditBtn = form.querySelector("[data-cancel-edit]");
  const noteEl = document.querySelector("[data-booking-note]");
  const serviceDurationEl = document.querySelector("[data-service-duration]");
  const calendarNoteEl = document.querySelector("[data-calendar-note]");
  const availableTimesEl = document.querySelector("[data-available-times]");
  const timeNoteEl = document.querySelector("[data-time-note]");

  const calendarRoot = document.querySelector("[data-booking-calendar]");
  const calendarDaysEl = calendarRoot?.querySelector("[data-calendar-days]");
  const calendarTitleEl = calendarRoot?.querySelector("[data-calendar-title]");
  const calendarPrevBtn = calendarRoot?.querySelector("[data-calendar-prev]");
  const calendarNextBtn = calendarRoot?.querySelector("[data-calendar-next]");

  const appointmentsList = document.querySelector("[data-appointments-list]");
  const appointmentsEmpty = document.querySelector("[data-appointments-empty]");

  const token = window.BarberiaApi.getToken();
  const isLogged = Boolean(token);

  const state = {
    services: [],
    barbers: [],
    user: null,
    editingId: null,
    editingSnapshot: null,
    monthCursor: null,
    availabilityMode: "none",
    availabilityByDate: new Map(),
    loadingAvailability: false,
    availabilityRequestId: 0
  };

  const setNote = (message) => {
    if (noteEl) noteEl.textContent = message;
  };

  const setCalendarNote = (message) => {
    if (calendarNoteEl) calendarNoteEl.textContent = message;
  };

  const setTimeNote = (message) => {
    if (timeNoteEl) timeNoteEl.textContent = message;
  };

  const updateNote = () => {
    const parts = [];
    if (state.services.length) parts.push(`${state.services.length} servicos disponiveis`);
    if (state.barbers.length) parts.push(`${state.barbers.length} profissionais disponiveis`);
    setNote(parts.length ? `${parts.join(" | ")}.` : "Selecione servico e horario.");
  };

  const formatDateIso = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
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

  const formatMonthTitle = (value) =>
    value.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const formatTime = (value) => window.BarberiaApi.formatTime(String(value || ""));

  const updateServiceDuration = () => {
    if (!serviceDurationEl) return;
    const selectedId = serviceSelect?.value;
    if (!selectedId) {
      serviceDurationEl.textContent = "";
      return;
    }
    const found = state.services.find((service) => String(service.id) === String(selectedId));
    const durationValue = Number(found?.duracaoEmMinutos ?? found?.duration);
    serviceDurationEl.textContent =
      Number.isFinite(durationValue) && durationValue > 0
        ? `Duracao media: ${durationValue} min`
        : "";
  };

  const clearAppointmentList = () => {
    if (appointmentsList) appointmentsList.innerHTML = "";
  };

  const showEmptyAppointments = (message) => {
    if (!appointmentsEmpty) return;
    appointmentsEmpty.textContent = message;
    appointmentsEmpty.hidden = false;
  };

  const hideEmptyAppointments = () => {
    if (!appointmentsEmpty) return;
    appointmentsEmpty.hidden = true;
  };

  const isSunday = (dateStr) => {
    const date = parseDate(dateStr);
    return date ? date.getDay() === 0 : false;
  };

  const isDateInPast = (dateStr) => {
    const date = parseDate(dateStr);
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
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

    const target = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
      0,
      0
    );

    const minAllowed = new Date();
    minAllowed.setMinutes(minAllowed.getMinutes() + 15);

    return target >= minAllowed;
  };

  const renderServicesOptions = (services) => {
    if (!serviceSelect) return;
    serviceSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Selecione um servico";
    serviceSelect.appendChild(placeholder);

    services.forEach((service) => {
      const option = document.createElement("option");
      option.value = service.id;
      option.textContent = `${service.name} • ${window.BarberiaApi.formatCurrency(service.price)}`;
      serviceSelect.appendChild(option);
    });
  };

  const renderBarbersOptions = (barbers) => {
    if (!barberSelect) return;
    barberSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Sem preferencia";
    barberSelect.appendChild(placeholder);

    barbers.forEach((barber) => {
      const option = document.createElement("option");
      option.value = barber.username;
      option.textContent = barber.name ? `${barber.name} (${barber.username})` : barber.username;
      barberSelect.appendChild(option);
    });
  };

  const getServiceName = (serviceId) => {
    const found = state.services.find((service) => String(service.id) === String(serviceId));
    return found?.name || (serviceId ? `Servico #${serviceId}` : "Servico");
  };

  const getSelectedServiceDuration = () => {
    const found = state.services.find((service) => String(service.id) === String(serviceSelect?.value));
    const duration = Number(found?.duracaoEmMinutos ?? found?.duration);
    return Number.isFinite(duration) && duration > 0 ? duration : 30;
  };

  const createShiftSlots = (date, shiftStartHour, shiftEndHour, durationInMinutes, minDateTime) => {
    const slots = [];
    let cursor = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      shiftStartHour,
      0,
      0,
      0
    );

    while (true) {
      const end = new Date(cursor.getTime() + durationInMinutes * 60 * 1000);
      const shiftEnd = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        shiftEndHour,
        0,
        0,
        0
      );

      if (end > shiftEnd) break;
      if (cursor >= minDateTime) {
        slots.push(`${String(cursor.getHours()).padStart(2, "0")}:${String(cursor.getMinutes()).padStart(2, "0")}`);
      }
      cursor = new Date(cursor.getTime() + 15 * 60 * 1000);
    }

    return slots;
  };

  const buildGenericAvailabilityForMonth = () => {
    const durationInMinutes = getSelectedServiceDuration();
    const todayLimit = new Date();
    todayLimit.setMinutes(todayLimit.getMinutes() + 15);

    const start = startOfMonth(state.monthCursor);
    const end = endOfMonth(state.monthCursor);
    const map = new Map();

    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const date = new Date(cursor);
      const iso = formatDateIso(date);

      if (date.getDay() === 0) {
        map.set(iso, []);
        continue;
      }

      const morning = createShiftSlots(date, 9, 12, durationInMinutes, todayLimit);
      const afternoon = createShiftSlots(date, 13, 20, durationInMinutes, todayLimit);
      map.set(iso, [...morning, ...afternoon]);
    }

    return map;
  };

  const parseAvailabilityDays = (data) => {
    const list = Array.isArray(data?.dias) ? data.dias : [];
    const map = new Map();

    list.forEach((day) => {
      const date = day?.data ? String(day.data).slice(0, 10) : "";
      if (!date) return;
      const slots = Array.isArray(day.horariosDisponiveis)
        ? day.horariosDisponiveis.map((item) => formatTime(item))
        : [];
      map.set(date, slots.filter(Boolean));
    });

    return map;
  };

  const selectedDateFitsMonth = () => {
    if (!dateInput?.value) return false;
    const selected = parseDate(dateInput.value);
    if (!selected) return false;
    return (
      selected.getFullYear() === state.monthCursor.getFullYear() &&
      selected.getMonth() === state.monthCursor.getMonth()
    );
  };

  const setMonthByDateInput = () => {
    const selected = parseDate(dateInput?.value);
    if (selected) {
      state.monthCursor = startOfMonth(selected);
      return;
    }
    state.monthCursor = startOfMonth(new Date());
  };

  const renderCalendar = () => {
    if (!calendarDaysEl || !calendarTitleEl || !state.monthCursor) return;

    calendarTitleEl.textContent = formatMonthTitle(state.monthCursor);
    calendarDaysEl.innerHTML = "";

    const monthStart = startOfMonth(state.monthCursor);
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - monthStart.getDay());

    const todayIso = formatDateIso(new Date());

    for (let i = 0; i < 42; i += 1) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      const iso = formatDateIso(date);
      const slots = state.availabilityByDate.get(iso) || [];
      const inCurrentMonth = date.getMonth() === state.monthCursor.getMonth();
      const isPast = isDateInPast(iso);
      const sunday = date.getDay() === 0;

      const dayBtn = document.createElement("button");
      dayBtn.type = "button";
      dayBtn.className = "calendar-day";
      dayBtn.textContent = String(date.getDate());

      if (!inCurrentMonth) dayBtn.classList.add("is-muted");
      if (iso === todayIso) dayBtn.classList.add("is-today");
      if (slots.length) dayBtn.classList.add("is-available");
      if (dateInput?.value === iso) dayBtn.classList.add("is-selected");

      const canPick = inCurrentMonth && !isPast && !sunday;
      if (!canPick) {
        dayBtn.classList.add("is-disabled");
        dayBtn.disabled = true;
      } else {
        dayBtn.addEventListener("click", () => {
          dateInput.value = iso;
          renderCalendar();
          renderTimeSlots();
        });
      }

      calendarDaysEl.appendChild(dayBtn);
    }
  };

  const renderTimeSlots = () => {
    if (!availableTimesEl) return;
    availableTimesEl.innerHTML = "";

    const selectedDate = dateInput?.value;
    if (!selectedDate) {
      setTimeNote("Selecione um dia para visualizar os horarios.");
      return;
    }

    const slots = state.availabilityByDate.get(selectedDate) || [];
    const currentSelected = formatTime(timeInput?.value);

    if (!slots.length) {
      if (state.loadingAvailability) {
        setTimeNote("Carregando horarios...");
      } else {
        setTimeNote("Sem horarios livres para esse dia.");
      }
      return;
    }

    const fragment = document.createDocumentFragment();
    slots.forEach((slot) => {
      const slotBtn = document.createElement("button");
      slotBtn.type = "button";
      slotBtn.className = "time-slot";
      slotBtn.textContent = slot;
      if (currentSelected === slot) slotBtn.classList.add("is-active");
      slotBtn.addEventListener("click", () => {
        timeInput.value = slot;
        renderTimeSlots();
      });
      fragment.appendChild(slotBtn);
    });

    availableTimesEl.appendChild(fragment);
    setTimeNote(`${slots.length} horarios livres para o dia selecionado.`);
  };

  const loadAvailabilityForCurrentMonth = async () => {
    if (!state.monthCursor) setMonthByDateInput();

    const selectedServiceId = Number(serviceSelect?.value);
    if (!Number.isFinite(selectedServiceId)) {
      state.availabilityMode = "none";
      state.availabilityByDate = new Map();
      setCalendarNote("Selecione um servico para carregar o calendario.");
      renderCalendar();
      renderTimeSlots();
      return;
    }

    state.loadingAvailability = true;
    const requestId = state.availabilityRequestId + 1;
    state.availabilityRequestId = requestId;

    const monthStart = startOfMonth(state.monthCursor);
    const monthEnd = endOfMonth(state.monthCursor);
    const inicio = formatDateIso(monthStart);
    const fim = formatDateIso(monthEnd);
    const selectedBarber = barberSelect?.value?.trim();

    try {
      if (selectedBarber && window.BarberiaApi.getBarberAvailability) {
        const response = await window.BarberiaApi.getBarberAvailability({
          barbeiroUserName: selectedBarber,
          servicoId: selectedServiceId,
          inicio,
          fim
        });
        if (requestId !== state.availabilityRequestId) return;
        state.availabilityMode = "barber";
        state.availabilityByDate = parseAvailabilityDays(response);
        setCalendarNote("Disponibilidade em tempo real do barbeiro selecionado.");
      } else {
        if (requestId !== state.availabilityRequestId) return;
        state.availabilityMode = "generic";
        state.availabilityByDate = buildGenericAvailabilityForMonth();
        setCalendarNote("Disponibilidade estimada sem barbeiro definido.");
      }
    } catch (error) {
      if (requestId !== state.availabilityRequestId) return;
      state.availabilityMode = "generic";
      state.availabilityByDate = buildGenericAvailabilityForMonth();
      setCalendarNote("Sem acesso ao calendario do barbeiro. Exibindo horarios estimados.");
      window.BarberiaUI?.toast?.({
        variant: "warning",
        message: window.BarberiaApi.getErrorMessage(error)
      });
    } finally {
      if (requestId !== state.availabilityRequestId) return;
      state.loadingAvailability = false;

      if (!selectedDateFitsMonth() && !state.editingId) {
        dateInput.value = "";
        timeInput.value = "";
      }

      renderCalendar();
      renderTimeSlots();
    }
  };

  const fillForm = (appointment) => {
    if (!appointment) return;
    state.editingId = appointment.id;
    state.editingSnapshot = {
      date: appointment.date,
      time: formatTime(appointment.time || "")
    };

    serviceSelect.value = appointment.serviceId ? String(appointment.serviceId) : "";
    dateInput.value = appointment.date;
    if (barberSelect) barberSelect.value = appointment.barbeiroUsername || "";
    timeInput.value = formatTime(appointment.time || "");

    setMonthByDateInput();
    updateServiceDuration();
    if (serviceSelect) serviceSelect.disabled = true;
    if (barberSelect) barberSelect.disabled = true;
    cancelEditBtn.hidden = false;
    submitBtn.textContent = "Salvar alteracoes";
    loadAvailabilityForCurrentMonth();
  };

  const resetForm = () => {
    state.editingId = null;
    state.editingSnapshot = null;
    form.reset();
    setMonthByDateInput();
    cancelEditBtn.hidden = true;
    submitBtn.textContent = "Confirmar agendamento";
    if (serviceSelect) serviceSelect.disabled = false;
    if (barberSelect) barberSelect.disabled = false;
    updateServiceDuration();
    renderCalendar();
    renderTimeSlots();
  };

  const renderAppointments = (appointments) => {
    clearAppointmentList();

    if (!appointments?.length) {
      showEmptyAppointments("Voce ainda nao possui agendamentos.");
      return;
    }

    hideEmptyAppointments();

    const fragment = document.createDocumentFragment();
    appointments.forEach((appointment) => {
      const card = document.createElement("article");
      card.className = "appointment-card";

      const meta = document.createElement("div");
      meta.className = "appointment-meta";
      meta.innerHTML = `
        <h4>${getServiceName(appointment.serviceId)}</h4>
        <span>${window.BarberiaApi.formatDateBr(appointment.date)} as ${appointment.time}</span>
        <span>Profissional: ${appointment.barbeiroUsername || "-"}</span>
        <span>Status: ${appointment.status}</span>
      `;

      const actions = document.createElement("div");
      actions.className = "appointment-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "ghost-action";
      editBtn.textContent = "Remarcar";
      editBtn.addEventListener("click", () => fillForm(appointment));

      const cancelBtnAllowed = ["REQUISITADO", "AGENDADO"].includes(appointment.status);
      actions.appendChild(editBtn);
      if (cancelBtnAllowed) {
        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "danger-action";
        cancelBtn.textContent = "Cancelar";
        cancelBtn.addEventListener("click", () => handleCancel(appointment));
        actions.appendChild(cancelBtn);
      }
      card.append(meta, actions);
      fragment.appendChild(card);
    });

    appointmentsList.appendChild(fragment);
  };

  const loadServices = async () => {
    try {
      const data = await window.BarberiaApi.getServices();
      const list = Array.isArray(data) ? data : data?.content || data?.servicos || [];
      state.services = list
        .map(window.BarberiaApi.normalizeService)
        .filter((item) => item.name && item.status !== false);

      if (!state.services.length) {
        throw new Error("Lista vazia");
      }

      renderServicesOptions(state.services);
      updateNote();
    } catch (error) {
      const fallback = [
        { id: 1, name: "Corte Masculino", description: "Corte moderno ou classico.", price: 45, duracaoEmMinutos: 40 },
        { id: 2, name: "Barba", description: "Modelagem com toalha quente.", price: 25, duracaoEmMinutos: 30 },
        { id: 3, name: "Sobrancelha", description: "Design e alinhamento.", price: 15, duracaoEmMinutos: 20 }
      ];
      state.services = fallback;
      renderServicesOptions(fallback);
      updateNote();
    }
  };

  const loadCurrentUser = async () => {
    if (!isLogged) return;
    let user = window.BarberiaApi.getUser();
    if (!user) {
      try {
        user = await window.BarberiaApi.getMe();
        if (user) window.BarberiaApi.setUser(user);
      } catch (error) {
        user = null;
      }
    }
    state.user = user;
  };

  const loadBarbers = async () => {
    const fallback = Array.isArray(window.BARBERIA_BARBERS) ? window.BARBERIA_BARBERS : [];
    try {
      if (!window.BarberiaApi.getBarbers) throw new Error("Sem endpoint de barbeiros");
      const data = await window.BarberiaApi.getBarbers();
      const list = Array.isArray(data) ? data : data?.content || data?.usuarios || [];
      state.barbers = list
        .map(window.BarberiaApi.normalizeBarber)
        .filter((barber) => barber.username);
      if (!state.barbers.length && fallback.length) {
        state.barbers = fallback
          .map(window.BarberiaApi.normalizeBarber)
          .filter((barber) => barber.username);
      }
    } catch (error) {
      state.barbers = fallback
        .map(window.BarberiaApi.normalizeBarber)
        .filter((barber) => barber.username);
    }
    renderBarbersOptions(state.barbers);
    updateNote();
  };

  const loadAppointments = async () => {
    if (!isLogged) {
      showEmptyAppointments("Faca login para visualizar seus agendamentos.");
      return;
    }

    try {
      const data = await window.BarberiaApi.getMyAppointments();
      const list = Array.isArray(data) ? data : data?.content || data?.agendamentos || [];
      const appointments = list.map(window.BarberiaApi.normalizeAppointment);
      renderAppointments(appointments);
    } catch (error) {
      showEmptyAppointments("Nao foi possivel carregar seus agendamentos.");
    }
  };

  const handleCancel = async (appointment) => {
    if (!appointment?.id) return;
    try {
      window.BarberiaUI?.setButtonLoading(submitBtn, true, "Processando...");
      await window.BarberiaApi.cancelAppointment(appointment.id);
      window.BarberiaUI?.toast?.({ variant: "success", message: "Agendamento cancelado." });
      resetForm();
      loadAppointments();
      loadAvailabilityForCurrentMonth();
    } catch (error) {
      window.BarberiaUI?.toast?.({
        variant: "error",
        message: window.BarberiaApi.getErrorMessage(error)
      });
    } finally {
      window.BarberiaUI?.setButtonLoading(submitBtn, false);
    }
  };

  const isSelectedSlotAvailable = (date, time) => {
    const slots = state.availabilityByDate.get(date) || [];
    return slots.includes(formatTime(time));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isLogged) {
      window.BarberiaUI?.toast?.({
        variant: "warning",
        message: "Faca login para finalizar o agendamento."
      });
      window.location.href = "login.html?redirect=agendamento.html";
      return;
    }

    const clienteUsername = state.user?.username;
    const barbeiroUsername = barberSelect?.value.trim() || null;
    const servicoId = serviceSelect.value ? Number(serviceSelect.value) : "";
    const payload = {
      clienteUsername,
      barbeiroUsername,
      servicoId,
      data: dateInput.value,
      hora: formatTime(timeInput.value)
    };

    if (!payload.clienteUsername) {
      window.BarberiaUI?.toast?.({
        variant: "warning",
        message: "Faca login novamente para confirmar seu usuario."
      });
      return;
    }

    if (!payload.servicoId || !payload.data || !payload.hora) {
      window.BarberiaUI?.toast?.({
        variant: "warning",
        message: "Preencha servico, data e horario."
      });
      return;
    }

    if (!isDateAllowed(payload.data, payload.hora)) {
      window.BarberiaUI?.toast?.({
        variant: "warning",
        message: "Escolha uma data valida com pelo menos 15 minutos de antecedencia."
      });
      return;
    }

    const sameAsCurrentEdit =
      state.editingSnapshot &&
      state.editingSnapshot.date === payload.data &&
      state.editingSnapshot.time === payload.hora;

    if (!sameAsCurrentEdit && !isSelectedSlotAvailable(payload.data, payload.hora)) {
      window.BarberiaUI?.toast?.({
        variant: "warning",
        message: "Horario fora da disponibilidade do calendario. Escolha um slot destacado."
      });
      return;
    }

    try {
      window.BarberiaUI?.setButtonLoading(submitBtn, true, "Salvando...");

      if (state.editingId) {
        await window.BarberiaApi.updateAppointment(state.editingId, {
          data: payload.data,
          hora: payload.hora
        });
        window.BarberiaUI?.toast?.({ variant: "success", message: "Agendamento atualizado." });
      } else {
        await window.BarberiaApi.createAppointment(payload);
        window.BarberiaUI?.toast?.({ variant: "success", message: "Agendamento confirmado." });
      }

      resetForm();
      loadAppointments();
      loadAvailabilityForCurrentMonth();
    } catch (error) {
      window.BarberiaUI?.toast?.({
        variant: "error",
        message: window.BarberiaApi.getErrorMessage(error)
      });
    } finally {
      window.BarberiaUI?.setButtonLoading(submitBtn, false);
    }
  };

  const changeMonth = (direction) => {
    if (!state.monthCursor) setMonthByDateInput();
    state.monthCursor = new Date(
      state.monthCursor.getFullYear(),
      state.monthCursor.getMonth() + direction,
      1
    );
    loadAvailabilityForCurrentMonth();
  };

  const onDateInputChange = () => {
    const selectedDate = parseDate(dateInput.value);
    if (!selectedDate) {
      renderCalendar();
      renderTimeSlots();
      return;
    }

    const monthChanged =
      selectedDate.getFullYear() !== state.monthCursor.getFullYear() ||
      selectedDate.getMonth() !== state.monthCursor.getMonth();

    if (monthChanged) {
      state.monthCursor = startOfMonth(selectedDate);
      loadAvailabilityForCurrentMonth();
      return;
    }

    renderCalendar();
    renderTimeSlots();
  };

  if (!isLogged) {
    window.location.href = "login.html?redirect=agendamento.html";
    return;
  }

  if (dateInput) dateInput.min = formatDateIso(new Date());
  setMonthByDateInput();

  serviceSelect.addEventListener("change", () => {
    updateServiceDuration();
    loadAvailabilityForCurrentMonth();
  });

  barberSelect.addEventListener("change", () => {
    loadAvailabilityForCurrentMonth();
  });

  dateInput.addEventListener("change", onDateInputChange);
  timeInput.addEventListener("change", renderTimeSlots);
  cancelEditBtn.addEventListener("click", resetForm);
  form.addEventListener("submit", handleSubmit);
  calendarPrevBtn?.addEventListener("click", () => changeMonth(-1));
  calendarNextBtn?.addEventListener("click", () => changeMonth(1));

  const init = async () => {
    updateServiceDuration();
    await loadCurrentUser();
    await Promise.all([loadServices(), loadBarbers()]);
    renderCalendar();
    await loadAvailabilityForCurrentMonth();
    await loadAppointments();
  };

  init();
})();
