// ─── Configuração da API ──────────────────────────────────────────────────────
const API = "http://localhost:3001/api";

// ─── Dados locais de exibição ─────────────────────────────────────────────────
const categoryClass = {
  Organico: "organic",
  Reciclavel: "recyclable",
  Entulho: "construction",
  Perigoso: "hazardous",
};

let selectedReportId = null;
let sensors = [];
let reports = [];

// ─── Elementos do DOM ─────────────────────────────────────────────────────────
const cityMap       = document.querySelector("#cityMap");
const reportList    = document.querySelector("#reportList");
const filterSelect  = document.querySelector("#filterSelect");
const statusFilter  = document.querySelector("#statusFilter");
const searchInput   = document.querySelector("#searchInput");
const reportForm    = document.querySelector("#reportForm");
const sensorGrid    = document.querySelector("#sensorGrid");
const reportDialog  = document.querySelector("#reportDialog");
const detailDialog  = document.querySelector("#detailDialog");
const detailBody    = document.querySelector("#detailBody");
const severityInput = reportForm.elements.severity;
const severityOutput = document.querySelector("#severityOutput");

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(timestamp));
}

// ─── Chamadas à API ───────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro ${res.status}`);
  }
  return res.json();
}

async function loadReports() {
  reports = await apiFetch("/reports");
}

async function loadSensors() {
  sensors = await apiFetch("/sensors");
}

async function createReport(data) {
  const report = await apiFetch("/reports", {
    method: "POST",
    body: JSON.stringify(data),
  });
  reports = [report, ...reports];
  return report;
}

async function patchReport(id, patch) {
  const updated = await apiFetch(`/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  reports = reports.map((r) => (r._id === id || r.id === id ? updated : r));
}

async function deleteReport(id) {
  await apiFetch(`/reports/${id}`, { method: "DELETE" });
  reports = reports.filter((r) => r._id !== id && r.id !== id);
  if (selectedReportId === id) selectedReportId = null;
}

async function seedAll() {
  await apiFetch("/reports/seed", { method: "POST" });
  await apiFetch("/sensors/seed", { method: "POST" });
  await loadReports();
  await loadSensors();
}

async function simulateSensors() {
  sensors = await apiFetch("/sensors/simulate", { method: "POST" });
}

// ─── Filtros locais ────────────────────────────────────────────────────────────
function getFilteredReports() {
  const priorityFilter = filterSelect.value;
  const currentStatus  = statusFilter.value;
  const query = searchInput.value.trim().toLowerCase();

  return reports.filter((report) => {
    const priority = report.priority || getPriority(report.severity, report.category);
    const text = `${report.location} ${report.district} ${report.category} ${report.description}`.toLowerCase();
    return (
      (priorityFilter === "all" || priority === priorityFilter) &&
      (currentStatus  === "all" || report.status === currentStatus) &&
      (!query || text.includes(query))
    );
  });
}

// ─── Renderização ─────────────────────────────────────────────────────────────
function renderMetrics() {
  const activeReports = reports.filter((r) => r.status !== "Resolvido");
  const iotAlerts  = sensors.filter((s) => s.fill >= 80 || !s.online).length;
  const highRisk   = activeReports.filter((r) => (r.priority || getPriority(r.severity, r.category)) === "Alta").length;
  const avgTime    = Math.round(
    activeReports.reduce((sum, r) => {
      const p = r.priority || getPriority(r.severity, r.category);
      return sum + parseInt(getEta(p, r.status), 10);
    }, 0) / Math.max(activeReports.length, 1),
  );
  const resolved = reports.filter((r) => r.status === "Resolvido").length;
  const impact   = Math.max(28, Math.min(98, 54 + resolved * 10 - highRisk * 6 - iotAlerts * 3));

  document.querySelector("#openCount").textContent   = activeReports.length;
  document.querySelector("#avgTime").textContent     = `${avgTime}h`;
  document.querySelector("#iotAlerts").textContent   = iotAlerts;
  document.querySelector("#impactScore").textContent = `${impact}%`;
}

function reportId(report) {
  return report._id || report.id;
}

function renderMap() {
  cityMap.innerHTML = "";
  const route = document.createElement("div");
  route.className = "route";
  route.style.cssText = "left:18%;top:71%;width:68%;transform:rotate(-23deg)";
  cityMap.append(route);

  getFilteredReports().forEach((report) => {
    const id       = reportId(report);
    const priority = report.priority || getPriority(report.severity, report.category);
    const pin      = document.createElement("button");
    pin.type        = "button";
    pin.className   = `map-pin ${categoryClass[report.category]}${selectedReportId === id ? " selected" : ""}${report.status === "Resolvido" ? " resolved" : ""}`;
    pin.style.left  = `${report.x}%`;
    pin.style.top   = `${report.y}%`;
    pin.title       = `${report.location} - ${priority}`;
    pin.setAttribute("aria-label", `Selecionar ${report.location}`);
    pin.innerHTML   = "<span></span>";
    pin.addEventListener("click", () => selectReport(id, true));

    const label = document.createElement("button");
    label.type      = "button";
    label.className = "map-label";
    label.style.left = `${report.x}%`;
    label.style.top  = `${report.y}%`;
    label.textContent = report.status === "Resolvido" ? "OK" : priority;
    label.addEventListener("click", () => selectReport(id, true));

    cityMap.append(pin, label);
  });
}

function renderReports() {
  const filtered = getFilteredReports();
  reportList.innerHTML = "";

  if (!filtered.length) {
    reportList.innerHTML = '<p class="empty-state">Nenhuma notificacao encontrada.</p>';
    return;
  }

  filtered
    .sort((a, b) => {
      const w = { "Em triagem": 3, "Equipe enviada": 2, Resolvido: 1 };
      return w[b.status] - w[a.status] || b.severity - a.severity;
    })
    .forEach((report) => {
      const id       = reportId(report);
      const priority = report.priority || getPriority(report.severity, report.category);
      const card     = document.createElement("article");
      card.className = `report-card${selectedReportId === id ? " selected" : ""}`;
      card.id        = `report-${id}`;
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
          <span>Atualizado ${formatTime(report.updatedAt || report.createdAt)}</span>
        </div>
        <div class="card-actions">
          <button type="button" data-action="details"  data-id="${id}">Detalhes</button>
          <button type="button" data-action="dispatch" data-id="${id}" ${report.status !== "Em triagem" ? "disabled" : ""}>Enviar equipe</button>
          <button type="button" data-action="resolve"  data-id="${id}" ${report.status === "Resolvido"  ? "disabled" : ""}>Resolver</button>
          <button type="button" data-action="remove"   data-id="${id}">Remover</button>
        </div>
      `;
      card.addEventListener("click", (e) => {
        if (!e.target.closest("button")) selectReport(id, false);
      });
      reportList.append(card);
    });
}

function renderSensors() {
  sensorGrid.innerHTML = "";
  sensors.forEach((sensor) => {
    const alert = sensor.fill >= 80 || !sensor.online;
    const card  = document.createElement("article");
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
  renderMetrics();
  renderMap();
  renderReports();
  renderSensors();
  document.querySelector("#mapStatus").textContent = `${getFilteredReports().length} pontos visiveis`;
}

// ─── Ações ────────────────────────────────────────────────────────────────────
function selectReport(id, syncFilters) {
  selectedReportId = id;
  if (syncFilters) {
    filterSelect.value = "all";
    statusFilter.value = "all";
    searchInput.value  = "";
  }
  renderAll();
  document.querySelector(`#report-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function showDetails(id) {
  const report = reports.find((r) => reportId(r) === id);
  if (!report) return;
  const priority = report.priority || getPriority(report.severity, report.category);
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

// ─── Eventos ──────────────────────────────────────────────────────────────────
reportForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(reportForm);
  try {
    const report = await createReport({
      location:    fd.get("location").trim(),
      district:    fd.get("district"),
      category:    fd.get("category"),
      description: fd.get("description").trim(),
      severity:    Number(fd.get("severity")),
    });
    selectedReportId = reportId(report);
    reportForm.reset();
    updateSeverityPreview();
    renderAll();
    if (typeof reportDialog.showModal === "function") reportDialog.showModal();
  } catch (err) {
    alert(`Erro ao enviar notificação: ${err.message}`);
  }
});

reportList.addEventListener("click", async (e) => {
  const button = e.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  selectedReportId = id;

  try {
    if (action === "details")  showDetails(id);
    if (action === "dispatch") { await patchReport(id, { status: "Equipe enviada" }); renderAll(); }
    if (action === "resolve")  { await patchReport(id, { status: "Resolvido" });      renderAll(); }
    if (action === "remove")   { await deleteReport(id);                              renderAll(); }
  } catch (err) {
    alert(`Erro: ${err.message}`);
  }
});

[filterSelect, statusFilter, searchInput].forEach((ctrl) => {
  ctrl.addEventListener("input", () => { selectedReportId = null; renderAll(); });
});

[severityInput, reportForm.elements.category].forEach((ctrl) => {
  ctrl.addEventListener("input", updateSeverityPreview);
});

document.querySelector("#simulateBtn").addEventListener("click", async () => {
  try {
    await simulateSensors();
    renderAll();
  } catch (err) {
    alert(`Erro ao simular: ${err.message}`);
  }
});

document.querySelector("#seedDataBtn").addEventListener("click", async () => {
  try {
    await seedAll();
    selectedReportId = null;
    filterSelect.value = "all";
    statusFilter.value = "all";
    searchInput.value  = "";
    renderAll();
  } catch (err) {
    alert(`Erro ao recarregar demo: ${err.message}`);
  }
});

document.querySelector("#exportBtn").addEventListener("click", () => {
  const payload = { exportedAt: new Date().toISOString(), reports, sensors };
  const blob    = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url     = URL.createObjectURL(blob);
  const link    = document.createElement("a");
  link.href     = url;
  link.download = "ecoflux-city-relatorio.json";
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelector("#openReportBtn").addEventListener("click", () => {
  document.querySelector("#notificar").scrollIntoView({ behavior: "smooth", block: "start" });
  reportForm.elements.location.focus();
});

document.querySelector("#closeDialogBtn").addEventListener("click",  () => reportDialog.close());
document.querySelector("#closeDetailBtn").addEventListener("click",  () => detailDialog.close());

// ─── Inicialização ────────────────────────────────────────────────────────────
async function init() {
  updateSeverityPreview();
  try {
    await Promise.all([loadReports(), loadSensors()]);
  } catch {
    // Se a API não responder, seed automático na primeira visita
    try {
      await seedAll();
    } catch {
      // silencia — backend pode estar offline
    }
  }
  renderAll();
}

init();