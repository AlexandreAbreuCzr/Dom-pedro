(() => {
  if (!window.BarberiaApi) return;

  const usersList = document.querySelector("[data-users-list]");
  const usersEmpty = document.querySelector("[data-users-empty]");
  const searchInput = document.querySelector("[data-user-search]");
  const roleFilter = document.querySelector("[data-user-role-filter]");
  const statusFilter = document.querySelector("[data-user-status-filter]");
  const filterBtn = document.querySelector("[data-user-filter]");

  const calendarRoot = document.querySelector("[data-admin-calendar]");
  const calendarDaysEl = calendarRoot?.querySelector("[data-calendar-days]");
  const calendarTitleEl = calendarRoot?.querySelector("[data-calendar-title]");
  const calendarPrevBtn = calendarRoot?.querySelector("[data-calendar-prev]");
  const calendarNextBtn = calendarRoot?.querySelector("[data-calendar-next]");
  const calendarEventsEl = document.querySelector("[data-calendar-events]");
  const calendarEmptyEl = document.querySelector("[data-calendar-empty]");
  const calendarBarberFilter = document.querySelector("[data-admin-calendar-barber]");
  const calendarStatusFilter = document.querySelector("[data-admin-calendar-status]");
  const calendarFilterBtn = document.querySelector("[data-admin-calendar-filter]");

  const serviceForm = document.querySelector("[data-service-form]");
  const serviceIdInput = document.querySelector("[data-service-id]");
  const serviceName = document.querySelector("#service-name");
  const servicePrice = document.querySelector("#service-price");
  const serviceDuration = document.querySelector("#service-duration");
  const serviceStatus = document.querySelector("#service-status");
  const serviceImage = document.querySelector("#service-image");
  const serviceSubmit = document.querySelector("[data-service-submit]");
  const serviceCancel = document.querySelector("[data-service-cancel]");
  const servicesList = document.querySelector("[data-services-list]");
  const servicesEmpty = document.querySelector("[data-services-empty]");

  const commissionsList = document.querySelector("[data-commissions-list]");
  const commissionsEmpty = document.querySelector("[data-commissions-empty]");
  const commissionStart = document.querySelector("[data-commission-start]");
  const commissionEnd = document.querySelector("[data-commission-end]");
  const commissionFilterBtn = document.querySelector("[data-commission-filter]");
  const commissionRateInput = document.querySelector("[data-commission-rate]");
  const commissionApplyAll = document.querySelector("[data-commission-apply-all]");
  const commissionRateSaveBtn = document.querySelector("[data-commission-rate-save]");

  const cashList = document.querySelector("[data-cash-list]");
  const cashEmpty = document.querySelector("[data-cash-empty]");
  const cashStart = document.querySelector("[data-cash-start]");
  const cashEnd = document.querySelector("[data-cash-end]");
  const cashType = document.querySelector("[data-cash-type]");
  const cashFilterBtn = document.querySelector("[data-cash-filter]");
  const cashForm = document.querySelector("[data-cash-form]");
  const cashSummary = document.querySelector("[data-cash-summary]");
  const cashTipoInput = document.querySelector("#cash-tipo");
  const cashDescricaoInput = document.querySelector("#cash-descricao");
  const cashValorInput = document.querySelector("#cash-valor");
  const cashBarbeiroInput = document.querySelector("#cash-barbeiro");

  const state = {
    services: [],
    barbers: [],
    calendarMonth: null,
    calendarSelectedDate: null,
    calendarAppointments: []
  };

  const requireAdmin = async () => {
    const token = window.BarberiaApi.getToken();
    if (!token) {
      window.location.href = "login.html?redirect=admin.html";
      return false;
    }
    try {
      const user = await window.BarberiaApi.getMe();
      window.BarberiaApi.setUser(user);
      if (user?.role !== "ADMIN") {
        window.location.href = "index.html";
        return false;
      }
      return true;
    } catch (error) {
      window.location.href = "login.html?redirect=admin.html";
      return false;
    }
  };

  const showEmpty = (el, show) => {
    if (!el) return;
    el.hidden = !show;
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
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

  const formatMonthTitle = (value) =>
    value.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const renderUsers = (users) => {
    if (!usersList) return;
    usersList.innerHTML = "";
    if (!users?.length) {
      showEmpty(usersEmpty, true);
      return;
    }
    showEmpty(usersEmpty, false);

    const fragment = document.createDocumentFragment();
    users.forEach((user) => {
      const card = document.createElement("article");
      card.className = "row-card";

      const main = document.createElement("div");
      main.className = "row-main";
      main.innerHTML = `
        <strong>${user.name}</strong>
        <span>@${user.username}</span>
        <span>${user.email}</span>
      `;

      const meta = document.createElement("div");
      meta.className = "row-meta";
      meta.innerHTML = `
        <span class="tag">${user.role}</span>
        <span class="tag ${user.status ? "tag--success" : "tag--danger"}">
          ${user.status ? "Ativo" : "Inativo"}
        </span>
      `;

      const actions = document.createElement("div");
      actions.className = "row-actions";

      const roleSelect = document.createElement("select");
      roleSelect.innerHTML = `
        <option value="ADMIN">ADMIN</option>
        <option value="BARBEIRO">BARBEIRO</option>
        <option value="USER">USER</option>
      `;
      roleSelect.value = user.role;
      roleSelect.addEventListener("change", async () => {
        try {
          await window.BarberiaApi.updateUserRole(user.username, roleSelect.value);
          window.BarberiaUI?.toast?.({
            variant: "success",
            message: "Role atualizada."
          });
        } catch (error) {
          window.BarberiaUI?.toast?.({
            variant: "error",
            message: window.BarberiaApi.getErrorMessage(error)
          });
          roleSelect.value = user.role;
        }
      });

      const statusBtn = document.createElement("button");
      statusBtn.type = "button";
      statusBtn.className = "ghost-action";
      statusBtn.textContent = user.status ? "Desativar" : "Ativar";
      statusBtn.addEventListener("click", async () => {
        try {
          await window.BarberiaApi.updateUserStatus(user.username, !user.status);
          user.status = !user.status;
          statusBtn.textContent = user.status ? "Desativar" : "Ativar";
          meta.innerHTML = `
            <span class="tag">${user.role}</span>
            <span class="tag ${user.status ? "tag--success" : "tag--danger"}">
              ${user.status ? "Ativo" : "Inativo"}
            </span>
          `;
        } catch (error) {
          window.BarberiaUI?.toast?.({
            variant: "error",
            message: window.BarberiaApi.getErrorMessage(error)
          });
        }
      });

      actions.append(roleSelect, statusBtn);
      card.append(main, meta, actions);
      fragment.appendChild(card);
    });

    usersList.appendChild(fragment);
  };

  const loadUsers = async () => {
    try {
      const filters = {};
      if (searchInput?.value) filters.name = searchInput.value.trim();
      if (roleFilter?.value) filters.userRole = roleFilter.value;
      if (statusFilter?.value) filters.status = statusFilter.value;
      const users = await window.BarberiaApi.getUsersAdmin(filters);
      renderUsers(users);
    } catch (error) {
      showEmpty(usersEmpty, true);
      window.BarberiaUI?.toast?.({
        variant: "error",
        message: window.BarberiaApi.getErrorMessage(error)
      });
    }
  };

  const renderCalendarBarberFilter = (barbers) => {
    if (!calendarBarberFilter) return;
    calendarBarberFilter.innerHTML = "";
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "Todos os barbeiros";
    calendarBarberFilter.appendChild(allOption);

    barbers.forEach((barber) => {
      const option = document.createElement("option");
      option.value = barber.username;
      option.textContent = barber.name ? `${barber.name} (${barber.username})` : barber.username;
      calendarBarberFilter.appendChild(option);
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
    renderCalendarBarberFilter(state.barbers);
  };

  const getBarberDisplayName = (username) => {
    const barber = state.barbers.find((item) => item.username === username);
    if (!barber) return username || "-";
    return barber.name ? `${barber.name} (${barber.username})` : barber.username;
  };

  const resetServiceForm = () => {
    serviceIdInput.value = "";
    serviceForm.reset();
    serviceSubmit.textContent = "Salvar serviço";
    serviceCancel.hidden = true;
    if (serviceImage) serviceImage.value = "";
  };

  const fillServiceForm = (service) => {
    serviceIdInput.value = service.id;
    serviceName.value = service.name || "";
    servicePrice.value = service.price != null ? service.price : "";
    serviceDuration.value = service.duration != null ? service.duration : "";
    serviceStatus.value = service.status === false ? "false" : "true";
    serviceSubmit.textContent = "Salvar alterações";
    serviceCancel.hidden = false;
  };

  const getServiceName = (serviceId) => {
    const service = state.services.find((item) => String(item.id) === String(serviceId));
    return service?.name || (serviceId ? `Servico #${serviceId}` : "Servico");
  };

  const renderServices = (services) => {
    if (!servicesList) return;
    servicesList.innerHTML = "";
    if (!services?.length) {
      showEmpty(servicesEmpty, true);
      return;
    }
    showEmpty(servicesEmpty, false);

    const fragment = document.createDocumentFragment();
    services.forEach((service) => {
      const card = document.createElement("article");
      card.className = "row-card";

      const main = document.createElement("div");
      main.className = "row-main";
      main.innerHTML = `
        <strong>${service.name}</strong>
        <span>${window.BarberiaApi.formatCurrency(service.price)}</span>
        <span>Duração: ${service.duration} min</span>
      `;

      const meta = document.createElement("div");
      meta.className = "row-meta";
      meta.innerHTML = `
        <span class="tag ${service.status === false ? "tag--danger" : "tag--success"}">
          ${service.status === false ? "Inativo" : "Ativo"}
        </span>
      `;

      const actions = document.createElement("div");
      actions.className = "row-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "ghost-action";
      editBtn.textContent = "Editar";
      editBtn.addEventListener("click", () => fillServiceForm(service));

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "danger-action";
      deleteBtn.textContent = "Excluir";
      deleteBtn.addEventListener("click", async () => {
        if (!confirm(`Excluir serviço "${service.name}"?`)) return;
        try {
          await window.BarberiaApi.deleteService(service.id);
          window.BarberiaUI?.toast?.({
            variant: "success",
            message: "Servico removido. Se havia agendamentos, ele foi desativado."
          });
          loadServices();
        } catch (error) {
          window.BarberiaUI?.toast?.({
            variant: "error",
            message: window.BarberiaApi.getErrorMessage(error)
          });
        }
      });

      actions.append(editBtn, deleteBtn);
      card.append(main, meta, actions);
      fragment.appendChild(card);
    });
    servicesList.appendChild(fragment);
  };

  const loadServices = async () => {
    try {
      const data = await window.BarberiaApi.getServices();
      const list = Array.isArray(data) ? data : data?.content || data?.servicos || [];
      state.services = list
        .map(window.BarberiaApi.normalizeService)
        .filter((service) => service.status !== false)
        .map((service) => ({
          ...service,
          duration: service.duracaoEmMinutos || 0
        }));
      renderServices(state.services);
      renderCalendarEvents();
    } catch (error) {
      showEmpty(servicesEmpty, true);
      renderCalendarEvents();
      window.BarberiaUI?.toast?.({
        variant: "error",
        message: window.BarberiaApi.getErrorMessage(error)
      });
    }
  };

  const renderCalendar = () => {
    if (!calendarRoot || !calendarDaysEl || !calendarTitleEl || !state.calendarMonth) return;

    const eventsByDate = state.calendarAppointments.reduce((acc, item) => {
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
    const items = state.calendarAppointments
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
      const statusTagClass =
        appointment.status === "AGENDADO"
          ? "tag--success"
          : appointment.status === "CANCELADO"
            ? "tag--danger"
            : "";

      const card = document.createElement("article");
      card.className = "calendar-event";
      card.innerHTML = `
        <strong>${window.BarberiaApi.formatTime(appointment.time)} - ${getServiceName(appointment.serviceId)}</strong>
        <span>Barbeiro: ${getBarberDisplayName(appointment.barbeiroUsername)}</span>
        <span>Cliente: ${appointment.clienteUsername || "-"}</span>
        <span class="tag ${statusTagClass}">${appointment.status || "-"}</span>
      `;
      fragment.appendChild(card);
    });
    calendarEventsEl.appendChild(fragment);
  };

  const loadCalendarAppointments = async () => {
    if (!state.calendarMonth || !window.BarberiaApi.getAppointments) return;

    const filters = {
      dataInicio: formatDateIso(startOfMonth(state.calendarMonth)),
      dataFim: formatDateIso(endOfMonth(state.calendarMonth))
    };
    if (calendarBarberFilter?.value) filters.barbeiroUserName = calendarBarberFilter.value;
    if (calendarStatusFilter?.value) filters.status = calendarStatusFilter.value;

    try {
      const data = await window.BarberiaApi.getAppointments(filters);
      const list = Array.isArray(data) ? data : data?.content || data?.agendamentos || [];
      state.calendarAppointments = list.map(window.BarberiaApi.normalizeAppointment);

      const monthStartDate = startOfMonth(state.calendarMonth);
      const monthEndDate = endOfMonth(state.calendarMonth);
      const selectedDate = parseDate(state.calendarSelectedDate);
      const firstEventDate = state.calendarAppointments[0]?.date
        ? String(state.calendarAppointments[0].date).slice(0, 10)
        : null;
      if (
        !selectedDate ||
        selectedDate < monthStartDate ||
        selectedDate > monthEndDate
      ) {
        state.calendarSelectedDate = firstEventDate || formatDateIso(monthStartDate);
      }

      renderCalendar();
      renderCalendarEvents();
    } catch (error) {
      state.calendarAppointments = [];
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
    await loadCalendarAppointments();
  };

  if (filterBtn) filterBtn.addEventListener("click", loadUsers);
  if (calendarFilterBtn) calendarFilterBtn.addEventListener("click", loadCalendarAppointments);
  if (calendarBarberFilter) {
    calendarBarberFilter.addEventListener("change", loadCalendarAppointments);
  }
  if (calendarStatusFilter) {
    calendarStatusFilter.addEventListener("change", loadCalendarAppointments);
  }
  calendarPrevBtn?.addEventListener("click", () => changeCalendarMonth(-1));
  calendarNextBtn?.addEventListener("click", () => changeCalendarMonth(1));

  if (serviceForm) {
    serviceForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = serviceName.value.trim();
      const price = Number(servicePrice.value.replace(",", "."));
      const duration = Number(serviceDuration.value);
      const status = serviceStatus.value === "true";

      if (!name || !price || !duration) {
        window.BarberiaUI?.toast?.({
          variant: "warning",
          message: "Preencha nome, preço e duração."
        });
        return;
      }

      try {
        const file = serviceImage?.files?.[0];
        if (serviceIdInput.value) {
          await window.BarberiaApi.updateService(serviceIdInput.value, {
            name,
            price,
            duracaoEmMinutos: duration,
            status
          });
          if (file) {
            await window.BarberiaApi.updateServiceImage(serviceIdInput.value, file);
          }
          window.BarberiaUI?.toast?.({ variant: "success", message: "Serviço atualizado." });
        } else {
          if (file) {
            await window.BarberiaApi.createServiceWithImage(
              { name, price, duracaoEmMinutos: duration },
              file
            );
          } else {
            await window.BarberiaApi.createService({
              name,
              price,
              duracaoEmMinutos: duration
            });
          }
          window.BarberiaUI?.toast?.({ variant: "success", message: "Serviço criado." });
        }
        resetServiceForm();
        loadServices();
      } catch (error) {
        window.BarberiaUI?.toast?.({
          variant: "error",
          message: window.BarberiaApi.getErrorMessage(error)
        });
      }
    });
  }

  if (serviceCancel) {
    serviceCancel.addEventListener("click", () => resetServiceForm());
  }

  const renderCommissions = (items) => {
    if (!commissionsList) return;
    commissionsList.innerHTML = "";
    if (!items?.length) {
      showEmpty(commissionsEmpty, true);
      return;
    }
    showEmpty(commissionsEmpty, false);

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "row-card";

      const main = document.createElement("div");
      main.className = "row-main";
      main.innerHTML = `
        <strong>${item.barbeiroNome || item.barbeiroUsername}</strong>
        <span>@${item.barbeiroUsername || "-"}</span>
        <span>${item.servicoNome || "-"}</span>
      `;

      const meta = document.createElement("div");
      meta.className = "row-meta";
      meta.innerHTML = `
        <span class="tag">${window.BarberiaApi.formatCurrency(item.valor)}</span>
        <span class="tag">${item.percentual}%</span>
        <span class="tag">${formatDateTime(item.dataDeCriacao)}</span>
      `;

      const actions = document.createElement("div");
      actions.className = "row-actions";

      const percentInput = document.createElement("input");
      percentInput.type = "number";
      percentInput.min = "0";
      percentInput.max = "100";
      percentInput.step = "0.01";
      percentInput.value = item.percentual ?? "";
      percentInput.title = "Percentual da comissão";

      const updateBtn = document.createElement("button");
      updateBtn.type = "button";
      updateBtn.className = "ghost-action";
      updateBtn.textContent = "Atualizar taxa";
      updateBtn.addEventListener("click", async () => {
        const percentual = Number(String(percentInput.value).replace(",", "."));
        if (!Number.isFinite(percentual)) {
          window.BarberiaUI?.toast?.({
            variant: "warning",
            message: "Informe um percentual válido."
          });
          return;
        }
        try {
          await window.BarberiaApi.updateCommission(item.id, { percentual });
          window.BarberiaUI?.toast?.({ variant: "success", message: "Taxa atualizada." });
          loadCommissions();
          loadCash();
        } catch (error) {
          window.BarberiaUI?.toast?.({
            variant: "error",
            message: window.BarberiaApi.getErrorMessage(error)
          });
        }
      });

      actions.append(percentInput, updateBtn);

      card.append(main, meta, actions);
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

  if (commissionFilterBtn) commissionFilterBtn.addEventListener("click", loadCommissions);

  const loadCommissionRate = async () => {
    if (!commissionRateInput || !window.BarberiaApi.getCommissionRate) return;
    try {
      const data = await window.BarberiaApi.getCommissionRate();
      if (data?.percentual != null) {
        commissionRateInput.value = data.percentual;
      }
    } catch (error) {
      window.BarberiaUI?.toast?.({
        variant: "error",
        message: window.BarberiaApi.getErrorMessage(error)
      });
    }
  };

  if (commissionRateSaveBtn) {
    commissionRateSaveBtn.addEventListener("click", async () => {
      const percentual = Number(String(commissionRateInput?.value || "").replace(",", "."));
      if (!Number.isFinite(percentual)) {
        window.BarberiaUI?.toast?.({
          variant: "warning",
          message: "Informe um percentual válido."
        });
        return;
      }
      try {
        await window.BarberiaApi.updateCommissionRate({
          percentual,
          aplicarEmTodas: Boolean(commissionApplyAll?.checked)
        });
        window.BarberiaUI?.toast?.({ variant: "success", message: "Taxa global atualizada." });
        loadCommissions();
        loadCash();
      } catch (error) {
        window.BarberiaUI?.toast?.({
          variant: "error",
          message: window.BarberiaApi.getErrorMessage(error)
        });
      }
    });
  }

  const renderCashSummary = (items) => {
    if (!cashSummary) return;
    const entrada = items
      .filter((item) => item.tipo === "ENTRADA")
      .reduce((sum, item) => sum + Number(item.valor || 0), 0);
    const saida = items
      .filter((item) => item.tipo === "SAIDA")
      .reduce((sum, item) => sum + Number(item.valor || 0), 0);
    const saldo = entrada - saida;
    cashSummary.innerHTML = `
      <div class="summary-card">
        <span>Entradas</span>
        <strong>${window.BarberiaApi.formatCurrency(entrada)}</strong>
      </div>
      <div class="summary-card">
        <span>Saidas</span>
        <strong>${window.BarberiaApi.formatCurrency(saida)}</strong>
      </div>
      <div class="summary-card">
        <span>Saldo</span>
        <strong>${window.BarberiaApi.formatCurrency(saldo)}</strong>
      </div>
    `;
  };

  const renderCash = (items) => {
    if (!cashList) return;
    cashList.innerHTML = "";
    if (!items?.length) {
      showEmpty(cashEmpty, true);
      renderCashSummary([]);
      return;
    }
    showEmpty(cashEmpty, false);
    renderCashSummary(items);

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "row-card";

      const main = document.createElement("div");
      main.className = "row-main";
      main.innerHTML = `
        <strong>${item.descricao}</strong>
        <span>${item.barbeiroUsername ? "@" + item.barbeiroUsername : "Sem barbeiro"}</span>
        <span>${item.agendamentoId ? "Agendamento " + item.agendamentoId : "Lancamento manual"}</span>
      `;

      const meta = document.createElement("div");
      meta.className = "row-meta";
      const splitInfo = [];
      if (item.valorBarbeiro != null) {
        splitInfo.push(`Barbeiro: ${window.BarberiaApi.formatCurrency(item.valorBarbeiro)}`);
      }
      if (item.valorBarbearia != null) {
        splitInfo.push(`Barbearia: ${window.BarberiaApi.formatCurrency(item.valorBarbearia)}`);
      }
      if (item.percentualComissao != null) {
        splitInfo.push(`Taxa: ${item.percentualComissao}%`);
      }
      meta.innerHTML = `
        <span class="tag ${item.tipo === "ENTRADA" ? "tag--success" : "tag--danger"}">${item.tipo}</span>
        <span class="tag">${window.BarberiaApi.formatCurrency(item.valor)}</span>
        ${splitInfo.length ? `<span class="tag">${splitInfo.join(" • ")}</span>` : ""}
        <span class="tag">${formatDateTime(item.dataDeCriacao)}</span>
      `;

      card.append(main, meta);
      fragment.appendChild(card);
    });
    cashList.appendChild(fragment);
  };

  const loadCash = async () => {
    try {
      const filters = {};
      if (cashType?.value) filters.tipo = cashType.value;
      if (cashStart?.value) filters.inicio = cashStart.value;
      if (cashEnd?.value) filters.fim = cashEnd.value;
      const items = await window.BarberiaApi.getCash(filters);
      renderCash(items);
    } catch (error) {
      showEmpty(cashEmpty, true);
      window.BarberiaUI?.toast?.({
        variant: "error",
        message: window.BarberiaApi.getErrorMessage(error)
      });
    }
  };

  if (cashFilterBtn) cashFilterBtn.addEventListener("click", loadCash);

  if (cashForm) {
    cashForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const tipo = cashTipoInput?.value;
      const descricao = cashDescricaoInput?.value?.trim();
      const valor = Number(cashValorInput?.value?.replace(",", "."));
      const barbeiroUsername = cashBarbeiroInput?.value?.trim();

      if (!tipo || !descricao || !valor) {
        window.BarberiaUI?.toast?.({
          variant: "warning",
          message: "Preencha tipo, descricao e valor."
        });
        return;
      }

      try {
        await window.BarberiaApi.createCashEntry({
          tipo,
          descricao,
          valor,
          barbeiroUsername: barbeiroUsername || null
        });
        cashForm.reset();
        loadCash();
      } catch (error) {
        window.BarberiaUI?.toast?.({
          variant: "error",
          message: window.BarberiaApi.getErrorMessage(error)
        });
      }
    });
  }

  const init = async () => {
    const ok = await requireAdmin();
    if (!ok) return;

    state.calendarMonth = startOfMonth(new Date());
    state.calendarSelectedDate = formatDateIso(new Date());

    await Promise.all([
      loadUsers(),
      loadServices(),
      loadCommissions(),
      loadCommissionRate(),
      loadCash(),
      loadBarbers()
    ]);
    await loadCalendarAppointments();
  };

  init();
})();
