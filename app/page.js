"use client";

import { useEffect, useMemo, useState } from "react";

const emptyContent = {
  hero: { eyebrow: "", title: "", description: "", chips: [] },
  alerts: [],
  sections: []
};

function slugify(value) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `secao-${Date.now()}`
  );
}

function ContentText({ text }) {
  const blocks = String(text || "").split(/\n\s*\n/);

  return blocks.map((block, blockIndex) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const onlyList = lines.length > 0 && lines.every((line) => line.startsWith("•"));

    if (onlyList) {
      return (
        <ul key={blockIndex}>
          {lines.map((line, index) => (
            <li key={index}>{line.replace(/^•\s*/, "")}</li>
          ))}
        </ul>
      );
    }

    const result = [];
    let list = [];

    const flushList = () => {
      if (!list.length) return;
      result.push(
        <ul key={`list-${result.length}`}>
          {list.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
      list = [];
    };

    lines.forEach((line) => {
      if (line.startsWith("•")) {
        list.push(line.replace(/^•\s*/, ""));
      } else {
        flushList();
        result.push(<p key={`p-${result.length}`}>{line}</p>);
      }
    });

    flushList();

    return <div key={blockIndex}>{result}</div>;
  });
}

export default function HomePage() {
  const [content, setContent] = useState(emptyContent);
  const [draft, setDraft] = useState(emptyContent);
  const [loading, setLoading] = useState(true);
  const [adminOpen, setAdminOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("geral");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [sectionForm, setSectionForm] = useState(null);
  const [alertForm, setAlertForm] = useState(null);

  async function loadContent() {
    setLoading(true);
    try {
      const response = await fetch("/api/content", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Falha ao carregar.");

      setContent(data);
      setDraft(structuredClone(data));
    } catch (error) {
      showMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContent();
  }, []);

  function showMessage(text) {
    setMessage(text);
    window.clearTimeout(window.__atlasToast);
    window.__atlasToast = window.setTimeout(() => setMessage(""), 3000);
  }

  async function login(event) {
    event.preventDefault();

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || "Não foi possível entrar.");
      return;
    }

    setAuthenticated(true);
    setPassword("");
    setDraft(structuredClone(content));
    showMessage("Painel administrativo liberado.");
  }

  async function saveAll(nextDraft = draft) {
    setSaving(true);

    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextDraft)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) setAuthenticated(false);
        throw new Error(data.error || "Não foi possível salvar.");
      }

      setContent(structuredClone(nextDraft));
      setDraft(structuredClone(nextDraft));
      showMessage("Alterações salvas no MongoDB.");
    } catch (error) {
      showMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setAdminOpen(false);
    showMessage("Sessão encerrada.");
  }

  async function resetDefault() {
    if (!confirm("Restaurar todo o conteúdo padrão?")) return;

    const response = await fetch("/api/admin/seed", { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || "Não foi possível restaurar.");
      return;
    }

    setContent(data);
    setDraft(structuredClone(data));
    showMessage("Conteúdo padrão restaurado.");
  }

  function saveSection() {
    if (!sectionForm?.title?.trim()) {
      showMessage("Informe o título da seção.");
      return;
    }

    const next = structuredClone(draft);
    const item = {
      ...sectionForm,
      id:
        sectionForm.id ||
        `${slugify(sectionForm.title)}-${String(Date.now()).slice(-5)}`
    };

    const index = next.sections.findIndex((section) => section.id === item.id);

    if (index >= 0) next.sections[index] = item;
    else next.sections.push(item);

    setDraft(next);
    setSectionForm(null);
    saveAll(next);
  }

  function deleteSection(id) {
    if (!confirm("Apagar esta seção?")) return;

    const next = {
      ...structuredClone(draft),
      sections: draft.sections.filter((section) => section.id !== id)
    };

    setDraft(next);
    saveAll(next);
  }

  function moveSection(id, direction) {
    const next = structuredClone(draft);
    const index = next.sections.findIndex((section) => section.id === id);
    const newIndex = index + direction;

    if (index < 0 || newIndex < 0 || newIndex >= next.sections.length) return;

    [next.sections[index], next.sections[newIndex]] = [
      next.sections[newIndex],
      next.sections[index]
    ];

    setDraft(next);
    saveAll(next);
  }

  function saveAlert() {
    if (!alertForm?.title?.trim() || !alertForm?.message?.trim()) {
      showMessage("Preencha o título e a mensagem.");
      return;
    }

    const next = structuredClone(draft);
    const item = {
      ...alertForm,
      id: alertForm.id || `alert-${Date.now()}`
    };

    const index = next.alerts.findIndex((alert) => alert.id === item.id);

    if (index >= 0) next.alerts[index] = item;
    else next.alerts.push(item);

    setDraft(next);
    setAlertForm(null);
    saveAll(next);
  }

  function deleteAlert(id) {
    if (!confirm("Apagar este alerta?")) return;

    const next = {
      ...structuredClone(draft),
      alerts: draft.alerts.filter((alert) => alert.id !== id)
    };

    setDraft(next);
    saveAll(next);
  }

  function toggleAlert(id) {
    const next = structuredClone(draft);
    const target = next.alerts.find((alert) => alert.id === id);

    if (!target) return;
    target.active = !target.active;

    setDraft(next);
    saveAll(next);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(draft, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "reuniao-staff-atlas.json";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  async function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imported = JSON.parse(await file.text());

      if (
        !imported?.hero ||
        !Array.isArray(imported?.sections) ||
        !Array.isArray(imported?.alerts)
      ) {
        throw new Error("Arquivo JSON inválido.");
      }

      setDraft(imported);
      await saveAll(imported);
    } catch (error) {
      showMessage(error.message);
    }

    event.target.value = "";
  }

  const activeAlerts = useMemo(
    () => content.alerts.filter((alert) => alert.active),
    [content.alerts]
  );

  if (loading) {
    return <div className="loading">Carregando reunião...</div>;
  }

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <button
            className="btn icon mobile-menu"
            onClick={() => setMobileMenu((value) => !value)}
            aria-label="Abrir menu"
          >
            ☰
          </button>
          <div className="brand-mark">A</div>
          <div>
            <strong>ATLAS STAFF</strong>
            <small>Reunião de recrutamento</small>
          </div>
        </div>

        <div className="top-actions">
          <button className="btn" onClick={() => window.print()}>
            Imprimir
          </button>
          <button className="btn primary" onClick={() => setAdminOpen(true)}>
            Painel <span className="desktop-label">Administrativo</span>
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
          <h3>Navegação</h3>
          <nav className="nav">
            {content.sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setMobileMenu(false)}
              >
                {section.number}. {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <main>
          <section className="hero">
            <span className="eyebrow">{content.hero.eyebrow}</span>
            <h1>{content.hero.title}</h1>
            <p>{content.hero.description}</p>
            <div className="chips">
              {content.hero.chips.map((chip) => (
                <span className="chip" key={chip}>
                  {chip}
                </span>
              ))}
            </div>
          </section>

          <div className="alerts">
            {activeAlerts.map((alert) => (
              <div className={`alert ${alert.type}`} key={alert.id}>
                <div>
                  <strong>{alert.title}</strong>
                  <p>{alert.message}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="content">
            {content.sections.map((section) => (
              <section className="card" id={section.id} key={section.id}>
                <div className="section-head">
                  <div className="num">{section.number}</div>
                  <div>
                    <h2>{section.title}</h2>
                    <p className="subtitle">{section.subtitle}</p>
                  </div>
                </div>
                <ContentText text={section.content} />
              </section>
            ))}
          </div>
        </main>
      </div>

      {(adminOpen || mobileMenu) && (
        <div
          className="overlay"
          onClick={() => {
            setAdminOpen(false);
            setMobileMenu(false);
          }}
        />
      )}

      <aside className={`admin-drawer ${adminOpen ? "open" : ""}`}>
        <div className="admin-head">
          <div>
            <h2>Painel administrativo</h2>
            <div className="small">Conteúdo salvo diretamente no MongoDB.</div>
          </div>
          <button className="btn icon" onClick={() => setAdminOpen(false)}>
            ✕
          </button>
        </div>

        {!authenticated ? (
          <form className="login-box" onSubmit={login}>
            <h3>Acesso administrativo</h3>
            <p className="small">
              Digite a senha configurada na variável ADMIN_PASSWORD da Vercel.
            </p>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Senha do painel"
              autoComplete="current-password"
            />
            <button className="btn primary" type="submit">
              Entrar
            </button>
          </form>
        ) : (
          <>
            <div className="admin-tabs">
              {["geral", "secoes", "alertas", "dados"].map((item) => (
                <button
                  key={item}
                  className={`btn tab ${tab === item ? "active" : ""}`}
                  onClick={() => setTab(item)}
                >
                  {item === "geral"
                    ? "Geral"
                    : item === "secoes"
                    ? "Seções"
                    : item === "alertas"
                    ? "Alertas/Testes"
                    : "Dados"}
                </button>
              ))}
            </div>

            {tab === "geral" && (
              <div className="form-grid">
                <label>
                  Título principal
                  <input
                    value={draft.hero.title}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        hero: { ...draft.hero, title: event.target.value }
                      })
                    }
                  />
                </label>

                <label>
                  Texto superior
                  <input
                    value={draft.hero.eyebrow}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        hero: { ...draft.hero, eyebrow: event.target.value }
                      })
                    }
                  />
                </label>

                <label>
                  Descrição
                  <textarea
                    value={draft.hero.description}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        hero: { ...draft.hero, description: event.target.value }
                      })
                    }
                  />
                </label>

                <label>
                  Etiquetas, uma por linha
                  <textarea
                    value={draft.hero.chips.join("\n")}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        hero: {
                          ...draft.hero,
                          chips: event.target.value
                            .split("\n")
                            .map((item) => item.trim())
                            .filter(Boolean)
                        }
                      })
                    }
                  />
                </label>

                <button
                  className="btn primary"
                  disabled={saving}
                  onClick={() => saveAll()}
                >
                  {saving ? "Salvando..." : "Salvar informações gerais"}
                </button>
              </div>
            )}

            {tab === "secoes" && (
              <>
                <div className="toolbar">
                  <button
                    className="btn primary"
                    onClick={() =>
                      setSectionForm({
                        id: "",
                        number: String(draft.sections.length + 1),
                        title: "",
                        subtitle: "",
                        content: ""
                      })
                    }
                  >
                    Adicionar seção
                  </button>
                </div>

                {sectionForm && (
                  <div className="form-grid form-box">
                    <label>
                      Número
                      <input
                        value={sectionForm.number}
                        onChange={(event) =>
                          setSectionForm({
                            ...sectionForm,
                            number: event.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Título
                      <input
                        value={sectionForm.title}
                        onChange={(event) =>
                          setSectionForm({
                            ...sectionForm,
                            title: event.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Subtítulo
                      <input
                        value={sectionForm.subtitle}
                        onChange={(event) =>
                          setSectionForm({
                            ...sectionForm,
                            subtitle: event.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Conteúdo
                      <textarea
                        value={sectionForm.content}
                        onChange={(event) =>
                          setSectionForm({
                            ...sectionForm,
                            content: event.target.value
                          })
                        }
                        placeholder="Linhas iniciadas com • viram uma lista."
                      />
                    </label>

                    <div className="toolbar">
                      <button className="btn primary" onClick={saveSection}>
                        Salvar seção
                      </button>
                      <button className="btn" onClick={() => setSectionForm(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <div className="admin-list">
                  {draft.sections.map((section, index) => (
                    <div className="admin-item" key={section.id}>
                      <h4>
                        {section.number}. {section.title}
                      </h4>
                      <p>{section.subtitle}</p>
                      <div className="item-actions">
                        <button
                          className="btn"
                          onClick={() =>
                            setSectionForm(structuredClone(section))
                          }
                        >
                          Editar
                        </button>
                        <button
                          className="btn"
                          disabled={index === 0}
                          onClick={() => moveSection(section.id, -1)}
                        >
                          Subir
                        </button>
                        <button
                          className="btn"
                          disabled={index === draft.sections.length - 1}
                          onClick={() => moveSection(section.id, 1)}
                        >
                          Descer
                        </button>
                        <button
                          className="btn danger"
                          onClick={() => deleteSection(section.id)}
                        >
                          Apagar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "alertas" && (
              <>
                <div className="toolbar">
                  <button
                    className="btn primary"
                    onClick={() =>
                      setAlertForm({
                        id: "",
                        title: "",
                        message: "",
                        type: "info",
                        active: true
                      })
                    }
                  >
                    Adicionar alerta/teste
                  </button>
                </div>

                {alertForm && (
                  <div className="form-grid form-box">
                    <label>
                      Título
                      <input
                        value={alertForm.title}
                        onChange={(event) =>
                          setAlertForm({
                            ...alertForm,
                            title: event.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Mensagem
                      <textarea
                        value={alertForm.message}
                        onChange={(event) =>
                          setAlertForm({
                            ...alertForm,
                            message: event.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Tipo
                      <select
                        value={alertForm.type}
                        onChange={(event) =>
                          setAlertForm({
                            ...alertForm,
                            type: event.target.value
                          })
                        }
                      >
                        <option value="info">Informativo</option>
                        <option value="warning">Atenção</option>
                        <option value="danger">Urgente</option>
                        <option value="success">Sucesso</option>
                      </select>
                    </label>

                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={alertForm.active}
                        onChange={(event) =>
                          setAlertForm({
                            ...alertForm,
                            active: event.target.checked
                          })
                        }
                      />
                      Exibir alerta no site
                    </label>

                    <div className="toolbar">
                      <button className="btn primary" onClick={saveAlert}>
                        Salvar alerta
                      </button>
                      <button
                        className="btn"
                        onClick={() =>
                          showMessage(
                            `${alertForm.title || "Teste"}: ${
                              alertForm.message || "Mensagem de teste"
                            }`
                          )
                        }
                      >
                        Testar alerta
                      </button>
                      <button className="btn" onClick={() => setAlertForm(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <div className="admin-list">
                  {draft.alerts.map((alert) => (
                    <div className="admin-item" key={alert.id}>
                      <h4>{alert.title}</h4>
                      <p>{alert.message}</p>
                      <div className="item-actions">
                        <button
                          className="btn"
                          onClick={() => setAlertForm(structuredClone(alert))}
                        >
                          Editar
                        </button>
                        <button
                          className={alert.active ? "btn warning" : "btn success"}
                          onClick={() => toggleAlert(alert.id)}
                        >
                          {alert.active ? "Ocultar" : "Exibir"}
                        </button>
                        <button
                          className="btn danger"
                          onClick={() => deleteAlert(alert.id)}
                        >
                          Apagar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "dados" && (
              <>
                <p className="small">
                  Os dados ficam compartilhados entre todos os dispositivos por meio
                  do MongoDB.
                </p>

                <div className="toolbar">
                  <button className="btn success" onClick={exportData}>
                    Exportar JSON
                  </button>

                  <label className="btn">
                    Importar JSON
                    <input
                      type="file"
                      accept=".json,application/json"
                      hidden
                      onChange={importData}
                    />
                  </label>

                  <button className="btn danger" onClick={resetDefault}>
                    Restaurar padrão
                  </button>

                  <button className="btn" onClick={logout}>
                    Sair do painel
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </aside>

      {message && <div className="toast show">{message}</div>}
    </>
  );
}
