const STORAGE_KEY = "ecoflux-reports-v2";
const SENSOR_KEY = "ecoflux-sensors-v2";

const demoReports = [
  {
    id: "r-001",
    location: "Marginal Tiete, acesso a Ponte das Bandeiras",
    district: "Centro",
    category: "Entulho",
    description: "Montes de restos de obra bloqueando parte da calcada.",
    severity: 5,
    status: "Em triagem",
    x: 58,
    y: 38,
    createdAt: Date.now() - 1000 * 60 * 50,
    updatedAt: Date.now() - 1000 * 60 * 50,
  },
  {
    id: "r-002",
    location: "Vila Leopoldina, proximo ao ecoponto",
    district: "Vila Leopoldina",
    category: "Reciclavel",
    description: "Sacos com plastico e papel espalhados fora do horario de coleta.",
    severity: 2,
    status: "Equipe enviada",
    x: 32,
    y: 56,
    createdAt: Date.now() - 1000 * 60 * 140,
    updatedAt: Date.now() - 1000 * 60 * 70,
  },
  {
    id: "r-003",
    location: "Parque Novo Mundo, beira de corrego",
    district: "Parque Novo Mundo",
    category: "Perigoso",
    description: "Galoes sem identificacao e odor forte junto ao curso d'agua.",
    severity: 5,
    status: "Em triagem",
    x: 76,
    y: 64,
    createdAt: Date.now() - 1000 * 60 * 280,
    updatedAt: Date.now() - 1000 * 60 * 280,
  },
  {
    id: "r-004",
    location: "Santana, pracinha da Rua Voluntarios",
    district: "Santana",
    category: "Organico",
    description: "Restos de feira acumulados com presenca de insetos.",
    severity: 3,
    status: "Resolvido",
    x: 48,
    y: 22,
    createdAt: Date.now() - 1000 * 60 * 335,
    updatedAt: Date.now() - 1000 * 60 * 30,
  },
];

const demoSensors = [
  { id: "s-01", name: "Ecoponto Centro", area: "Centro expandido", fill: 74, battery: 88, online: true },
  { id: "s-02", name: "Lixeira IoT 18", area: "Corredor escolar", fill: 91, battery: 52, online: true },
  { id: "s-03", name: "Coletor Seletivo 04", area: "Vila Leopoldina", fill: 47, battery: 79, online: true },
  { id: "s-04", name: "Ponto Verde Norte", area: "Santana", fill: 63, battery: 34, online: false },
];

const categoryClass = {
  Organico: "organic",
  Reciclavel: "recyclable",
  Entulho: "construction",
  Perigoso: "hazardous",
};

let selectedReportId = null;
let sensors = load(SENSOR_KEY, demoSensors);

const cityMap = document.querySelector("#cityMap");
const reportList = document.querySelector("#reportList");
const filterSelect = document.querySelector("#filterSelect");
const statusFilter = document.querySelector("#statusFilter");
const searchInput = document.querySelector("#searchInput");
const reportForm = document.querySelector("#reportForm");
const sensorGrid = document.querySelector("#sensorGrid");
const reportDialog = document.querySelector("#reportDialog");
const detailDialog = document.querySelector("#detailDialog");
const detailBody = document.querySelector("#detailBody");
const severityInput = reportForm.elements.severity;
const severityOutput = document.querySelector("#severityOutput");

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function uniqueId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function load(key, fallback) {
  const saved = localStorage.getItem(key);
  if (!saved) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return clone(fallback);
  }
  try {
    return JSON.parse(saved);
  } catch {
    localStorage.setItem(key, JSON.stringify(fallback));
    return clone(fallback);
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getReports() {
  return load(STORAGE_KEY, demoReports);
}

function setReports(reports) {
  save(STORAGE_KEY, reports);
}

function getPriority(severity, category) {
  if (category === "Perigoso" || severity >= 5) return "Alta";
  if (severity >= 3 || category === "Entulho") return "Media";
  return "Baixa";
}

function getEta(priority, status) {
  if (status === "Resolvido") return "0h";
  if (priority === "Alta") return "4h";
  if (priority === "Media") return "12h";
  return "24h";
}

function statusLabel(status) {
  return status === "Equipe enviada" ? "Equipe enviada" : status;
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getFilteredReports(reports) {
  const priorityFilter = filterSelect.value;
  const currentStatus = statusFilter.value;
  const query = searchInput.value.trim().toLowerCase();

  return reports.filter((report) => {
    const priority = getPriority(report.severity, report.category);
    const text = `${report.location} ${report.district} ${report.category} ${report.description}`.toLowerCase();
    const matchesPriority = priorityFilter === "all" || priority === priorityFilter;
    const matchesStatus = currentStatus === "all" || report.status === currentStatus;
    const matchesQuery = !query || text.includes(query);
    return matchesPriority && matchesStatus && matchesQuery;
  });
}

function renderMetrics(reports) {
  const activeReports = reports.filter((report) => report.status !== "Resolvido");
  const iotAlerts = sensors.filter((sensor) => sensor.fill >= 80 || !sensor.online).length;
  const highRisk = activeReports.filter((report) => getPriority(report.severity, report.category) === "Alta").length;
  const avgTime = Math.round(
    activeReports.reduce((sum, report) => {
      const priority = getPriority(report.severity, report.category);
      return sum + Number.parseInt(getEta(priority, report.status), 10);
    }, 0) / Math.max(activeReports.length, 1),
  );
  const resolved = reports.filter((report) => report.status === "Resolvido").length;
  const impact = Math.max(28, Math.min(98, 54 + resolved * 10 - highRisk * 6 - iotAlerts * 3));

  document.querySelector("#openCount").textContent = activeReports.length;
  document.querySelector("#avgTime").textContent = `${avgTime}h`;
  document.querySelector("#iotAlerts").textContent = iotAlerts;
  document.querySelector("#impactScore").textContent = `${impact}%`;
}

function renderMap(reports) {
  cityMap.innerHTML = "";

  const route = document.createElement("div");
  route.className = "route";
  route.style.left = "18%";
  route.style.top = "71%";
  route.style.width = "68%";
  route.style.transform = "rotate(-23deg)";
  cityMap.append(route);

  reports.forEach((report) => {
    const priority = getPriority(report.severity, report.category);
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = `map-pin ${categoryClass[report.category]}${selectedReportId === report.id ? " selected" : ""}${report.status === "Resolvido" ? " resolved" : ""}`;
    pin.style.left = `${report.x}%`;
    pin.style.top = `${report.y}%`;
    pin.title = `${report.location} - ${priority}`;
    pin.setAttribute("aria-label", `Selecionar ${report.location}`);
    pin.innerHTML = "<span></span>";
    pin.addEventListener("click", () => selectReport(report.id, true));

    const label = document.createElement("button");
    label.type = "button";
    label.className = "map-label";
    label.style.left = `${report.x}%`;
    label.style.top = `${report.y}%`;
    label.textContent = report.status === "Resolvido" ? "OK" : priority;
    label.addEventListener("click", () => selectReport(report.id, true));

    cityMap.append(pin, label);
  });
}

function renderReports(reports) {
  const filtered = getFilteredReports(reports);
  reportList.innerHTML = "";

  if (!filtered.length) {
    reportList.innerHTML = '<p class="empty-state">Nenhuma notificacao encontrada.</p>';
    return;
  }

  filtered
    .sort((a, b) => {
      const statusWeight = { "Em triagem": 3, "Equipe enviada": 2, Resolvido: 1 };
      return statusWeight[b.status] - statusWeight[a.status] || b.severity - a.severity || b.createdAt - a.createdAt;
    })
    .forEach((report) => {
      const priority = getPriority(report.severity, report.category);
      const card = document.createElement("article");
      card.className = `report-card${selectedReportId === report.id ? " selected" : ""}`;
      card.id = `report-${report.id}`;
      card.innerHTML = `
        <header>
          <div>
            <strong>${report.location}</strong>
            <small>${report.district} - ${report.category} - ETA ${getEta(priority, report.status)}</small>
          </div>
          <span class="badge ${priority}">${priority}</span>
        </header>
        <p>${report.description}</p>
        <div class="report-meta">
          <span>${statusLabel(report.status)}</span>
          <span>Severidade ${report.severity}/5</span>
          <span>Atualizado ${formatTime(report.updatedAt)}</span>
        </div>
        <div class="card-actions">
          <button type="button" data-action="details" data-id="${report.id}">Detalhes</button>
          <button type="button" data-action="dispatch" data-id="${report.id}" ${report.status !== "Em triagem" ? "disabled" : ""}>Enviar equipe</button>
          <button type="button" data-action="resolve" data-id="${report.id}" ${report.status === "Resolvido" ? "disabled" : ""}>Resolver</button>
          <button type="button" data-action="remove" data-id="${report.id}">Remover</button>
        </div>
      `;
      card.addEventListener("click", (event) => {
        if (!event.target.closest("button")) selectReport(report.id, false);
      });
      reportList.append(card);
    });
}

function renderSensors() {
  sensorGrid.innerHTML = "";
  sensors.forEach((sensor) => {
    const alert = sensor.fill >= 80 || !sensor.online;
    const card = document.createElement("article");
    card.className = `sensor-card${alert ? " alert" : ""}`;
    card.innerHTML = `
      <div class="sensor-head">
        <div>
          <strong>${sensor.name}</strong>
          <span>${sensor.area}</span>
        </div>
        <span class="sensor-status">${sensor.online ? "Online" : "Offline"}</span>
      </div>
      <meter min="0" max="100" low="45" high="80" optimum="30" value="${sensor.fill}"></meter>
      <div class="sensor-footer">
        <span>${sensor.fill}% cheio</span>
        <span>${sensor.battery}% bateria</span>
      </div>
    `;
    sensorGrid.append(card);
  });
}

function renderAll() {
  const reports = getReports();
  const visibleReports = getFilteredReports(reports);
  renderMetrics(reports);
  renderMap(visibleReports);
  renderReports(reports);
  renderSensors();
  document.querySelector("#mapStatus").textContent = `${visibleReports.length} pontos visiveis`;
}

function updateReport(id, patch) {
  const reports = getReports().map((report) => (
    report.id === id ? { ...report, ...patch, updatedAt: Date.now() } : report
  ));
  setReports(reports);
  renderAll();
}

function removeReport(id) {
  const reports = getReports().filter((report) => report.id !== id);
  setReports(reports);
  if (selectedReportId === id) selectedReportId = null;
  renderAll();
}

function selectReport(id, syncFilters) {
  const report = getReports().find((item) => item.id === id);
  if (!report) return;
  selectedReportId = id;
  if (syncFilters) {
    filterSelect.value = "all";
    statusFilter.value = "all";
    searchInput.value = "";
  }
  renderAll();
  document.querySelector(`#report-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function showDetails(id) {
  const report = getReports().find((item) => item.id === id);
  if (!report) return;
  const priority = getPriority(report.severity, report.category);
  document.querySelector("#detailTitle").textContent = report.location;
  detailBody.innerHTML = `
    <dl class="detail-list">
      <div><dt>Bairro</dt><dd>${report.district}</dd></div>
      <div><dt>Categoria</dt><dd>${report.category}</dd></div>
      <div><dt>Prioridade</dt><dd>${priority}</dd></div>
      <div><dt>Status</dt><dd>${report.status}</dd></div>
      <div><dt>ETA</dt><dd>${getEta(priority, report.status)}</dd></div>
      <div><dt>Criado em</dt><dd>${formatTime(report.createdAt)}</dd></div>
    </dl>
    <p>${report.description}</p>
  `;
  if (typeof detailDialog.showModal === "function") detailDialog.showModal();
}

function updateSeverityPreview() {
  const severity = Number(severityInput.value);
  const category = reportForm.elements.category.value;
  const priority = getPriority(severity, category).toLowerCase();
  severityOutput.textContent = `Severidade ${severity}/5 - prioridade ${priority}`;
}

reportForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(reportForm);
  const reports = getReports();
  const report = {
    id: uniqueId(),
    location: formData.get("location").trim(),
    district: formData.get("district"),
    category: formData.get("category"),
    description: formData.get("description").trim(),
    severity: Number(formData.get("severity")),
    status: "Em triagem",
    x: Math.floor(14 + Math.random() * 72),
    y: Math.floor(16 + Math.random() * 66),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  setReports([report, ...reports]);
  selectedReportId = report.id;
  reportForm.reset();
  updateSeverityPreview();
  renderAll();
  if (typeof reportDialog.showModal === "function") reportDialog.showModal();
});

reportList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  selectedReportId = id;

  if (action === "details") showDetails(id);
  if (action === "dispatch") updateReport(id, { status: "Equipe enviada" });
  if (action === "resolve") updateReport(id, { status: "Resolvido" });
  if (action === "remove") removeReport(id);
});

[filterSelect, statusFilter, searchInput].forEach((control) => {
  control.addEventListener("input", () => {
    selectedReportId = null;
    renderAll();
  });
});

[severityInput, reportForm.elements.category].forEach((control) => {
  control.addEventListener("input", updateSeverityPreview);
});

document.querySelector("#simulateBtn").addEventListener("click", () => {
  sensors = sensors.map((sensor) => ({
    ...sensor,
    fill: Math.max(8, Math.min(99, sensor.fill + Math.floor(Math.random() * 25 - 7))),
    battery: Math.max(5, sensor.battery - Math.floor(Math.random() * 4)),
    online: Math.random() > 0.12,
  }));
  save(SENSOR_KEY, sensors);
  renderAll();
});

document.querySelector("#seedDataBtn").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SENSOR_KEY);
  sensors = clone(demoSensors);
  selectedReportId = null;
  filterSelect.value = "all";
  statusFilter.value = "all";
  searchInput.value = "";
  renderAll();
});

document.querySelector("#exportBtn").addEventListener("click", () => {
  const payload = {
    exportedAt: new Date().toISOString(),
    reports: getReports(),
    sensors,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ecoflux-city-relatorio.json";
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelector("#openReportBtn").addEventListener("click", () => {
  document.querySelector("#notificar").scrollIntoView({ behavior: "smooth", block: "start" });
  reportForm.elements.location.focus();
});

document.querySelector("#closeDialogBtn").addEventListener("click", () => reportDialog.close());
document.querySelector("#closeDetailBtn").addEventListener("click", () => detailDialog.close());

updateSeverityPreview();
renderAll();
