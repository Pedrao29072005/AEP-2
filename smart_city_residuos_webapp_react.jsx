import { useState } from "react";

export default function SmartCityApp() {
  const [reports, setReports] = useState([
    {
      id: 1,
      local: "Zona Norte",
      tipo: "Entulho",
      status: "Pendente",
      descricao: "Grande volume de resíduos descartados próximo ao córrego.",
    },
    {
      id: 2,
      local: "Centro",
      tipo: "Reciclável",
      status: "Em análise",
      descricao: "Materiais recicláveis espalhados em praça pública.",
    },
  ]);

  const [formData, setFormData] = useState({
    tipo: "Entulho",
    local: "",
    descricao: "",
  });

  const [selectedReport, setSelectedReport] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();

    if (!formData.local || !formData.descricao) {
      alert("Preencha todos os campos 😅");
      return;
    }

    const newReport = {
      id: Date.now(),
      ...formData,
      status: "Pendente",
    };

    setReports([newReport, ...reports]);

    setFormData({
      tipo: "Entulho",
      local: "",
      descricao: "",
    });

    alert("Denúncia enviada com sucesso 🚀");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white text-slate-800">
      <header className="bg-emerald-700 text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-4xl font-black">
              Smart Waste City
            </h1>
            <p className="text-emerald-100 text-sm md:text-base mt-1">
              Gestão inteligente de resíduos urbanos
            </p>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden bg-white/20 px-4 py-2 rounded-xl"
          >
            ☰
          </button>

          <nav className="hidden md:flex gap-4 font-medium">
            <button className="hover:text-emerald-200 transition">
              Dashboard
            </button>
            <button className="hover:text-emerald-200 transition">
              Mapa
            </button>
            <button className="hover:text-emerald-200 transition">
              Relatórios
            </button>
          </nav>
        </div>

        {menuOpen && (
          <div className="md:hidden px-6 pb-4 flex flex-col gap-3 bg-emerald-800">
            <button>Dashboard</button>
            <button>Mapa</button>
            <button>Relatórios</button>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-10">
        <section className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-black leading-tight">
              Transformando cidades em ambientes mais sustentáveis ♻️
            </h2>

            <p className="text-slate-600 text-lg mt-6 leading-relaxed">
              Plataforma colaborativa onde cidadãos podem registrar descartes irregulares em tempo real, auxiliando a gestão pública e melhorando a limpeza urbana.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <button className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-4 rounded-2xl font-bold shadow-lg transition hover:scale-105">
                Fazer denúncia
              </button>

              <button className="border-2 border-emerald-700 text-emerald-700 px-6 py-4 rounded-2xl font-bold hover:bg-emerald-50 transition">
                Ver mapa
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-100 rounded-3xl p-6">
                <div className="text-4xl font-black text-emerald-700">
                  {reports.length}
                </div>
                <p className="mt-2 font-medium">Ocorrências</p>
              </div>

              <div className="bg-sky-100 rounded-3xl p-6">
                <div className="text-4xl font-black text-sky-700">
                  24h
                </div>
                <p className="mt-2 font-medium">Monitoramento</p>
              </div>

              <div className="bg-orange-100 rounded-3xl p-6 col-span-2">
                <div className="text-2xl font-black text-orange-700">
                  Integração com IoT e Geolocalização
                </div>
                <p className="mt-2 text-slate-600">
                  Sistema preparado para sensores inteligentes e mapas urbanos.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-xl">
            <h2 className="text-3xl font-black mb-6">
              Nova denúncia 📍
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="font-semibold block mb-2">
                  Tipo de resíduo
                </label>

                <select
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo: e.target.value })
                  }
                  className="w-full border-2 border-slate-200 rounded-2xl p-4 outline-none focus:border-emerald-600"
                >
                  <option>Entulho</option>
                  <option>Reciclável</option>
                  <option>Eletrônico</option>
                  <option>Orgânico</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-2">
                  Localização
                </label>

                <input
                  type="text"
                  value={formData.local}
                  onChange={(e) =>
                    setFormData({ ...formData, local: e.target.value })
                  }
                  placeholder="Digite o endereço"
                  className="w-full border-2 border-slate-200 rounded-2xl p-4 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-semibold block mb-2">
                  Descrição
                </label>

                <textarea
                  rows="5"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      descricao: e.target.value,
                    })
                  }
                  placeholder="Descreva o problema encontrado"
                  className="w-full border-2 border-slate-200 rounded-2xl p-4 outline-none focus:border-emerald-600 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-4 rounded-2xl font-bold text-lg transition hover:scale-[1.02]"
              >
                Enviar denúncia 🚀
              </button>
            </form>
          </div>

          <div className="lg:col-span-3 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black">
                Ocorrências recentes
              </h2>

              <button className="bg-white px-5 py-3 rounded-2xl shadow-md font-semibold hover:shadow-xl transition">
                Atualizar
              </button>
            </div>

            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-[2rem] p-6 shadow-lg hover:shadow-2xl transition cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold">
                        {report.tipo}
                      </span>

                      <span className="bg-slate-100 px-4 py-2 rounded-full text-sm font-semibold">
                        {report.status}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black">
                      {report.local}
                    </h3>

                    <p className="text-slate-600 mt-3 leading-relaxed">
                      {report.descricao}
                    </p>
                  </div>

                  <button className="bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold hover:bg-emerald-800 transition">
                    Ver detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-lg w-full rounded-[2rem] p-8 shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-5 right-5 text-2xl"
            >
              ✕
            </button>

            <div className="flex gap-3 mb-5">
              <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-bold text-sm">
                {selectedReport.tipo}
              </span>

              <span className="bg-slate-100 px-4 py-2 rounded-full font-semibold text-sm">
                {selectedReport.status}
              </span>
            </div>

            <h2 className="text-3xl font-black mb-4">
              {selectedReport.local}
            </h2>

            <p className="text-slate-600 leading-relaxed text-lg">
              {selectedReport.descricao}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button className="bg-emerald-700 text-white py-4 rounded-2xl font-bold hover:bg-emerald-800 transition">
                Resolver
              </button>

              <button className="border-2 border-slate-200 py-4 rounded-2xl font-bold hover:bg-slate-50 transition">
                Compartilhar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
