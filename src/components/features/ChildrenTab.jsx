import React from "react";
import { C } from "../../app/palette";
import { Btn, Inp, Modal, Pill, Sel } from "../ui/atoms";
import { suffixPlural } from "../../app/i18n";

export function ChildrenTab({ children, setChildren, supportWorkers, groups, t, emptyStateMessage }) {
  const [modal, setModal] = React.useState(null);
  const [form, setForm] = React.useState({
    nom: "",
    age: "",
    ratioMax: "2",
    incompatiblesEnfants: [],
    incompatiblesAccos: [],
  });

  const groupeDeEnfant = (id) => groups.find((group) => group.enfantIds.includes(id));

  const openAdd = () => {
    setForm({ nom: "", age: "", ratioMax: "2", incompatiblesEnfants: [], incompatiblesAccos: [] });
    setModal("add");
  };

  const openEdit = (enfant) => {
    setForm({ ...enfant, age: String(enfant.age), ratioMax: String(enfant.ratioMax) });
    setModal(enfant);
  };

  const save = () => {
    if (!form.nom || !form.age) {
      return;
    }

    const entry = {
      ...form,
      age: Number.parseInt(form.age, 10),
      ratioMax: Number.parseInt(form.ratioMax, 10),
      id: modal === "add" ? `e${Date.now()}` : modal.id,
    };

    setChildren((prev) => (modal === "add"
      ? [...prev, entry]
      : prev.map((item) => (item.id === entry.id ? entry : item))));
    setModal(null);
  };

  const toggle = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 800 }}>{t("children.title")}</h2>
        <Btn onClick={openAdd}>{t("children.add")}</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
        {children.length === 0 && emptyStateMessage ? (
          <div
            style={{
              gridColumn: "1 / -1",
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 16,
              color: C.muted,
            }}
          >
            {emptyStateMessage}
          </div>
        ) : null}

        {children.map((enfant) => {
          const group = groupeDeEnfant(enfant.id);
          return (
            <div key={enfant.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 15 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 700, color: C.text }}>{enfant.nom}</div>
                  <div style={{ color: C.muted, fontSize: 12 }}>{`${enfant.age} ${t("common.years")} - 1:${enfant.ratioMax}`}</div>
                </div>
              </div>

              {group
                ? <div style={{ fontSize: 11, color: C.accent, marginBottom: 4 }}>{t("children.inGroup", { groupName: group.nom })}</div>
                : <div style={{ fontSize: 11, color: C.yellow, marginBottom: 4 }}>{t("children.notPlaced")}</div>}

              {enfant.incompatiblesEnfants.length > 0 ? (
                <div style={{ fontSize: 11, color: C.yellow, marginBottom: 3 }}>
                  {`X ${enfant.incompatiblesEnfants
                    .map((id) => children.find((entry) => entry.id === id))
                    .filter(Boolean)
                    .map((entry) => entry.nom)
                    .join(", ")}`}
                </div>
              ) : null}

              {enfant.incompatiblesAccos.length > 0 ? (
                <div style={{ fontSize: 11, color: C.red, marginBottom: 3 }}>
                  {`- ${enfant.incompatiblesAccos
                    .map((id) => supportWorkers.find((entry) => entry.id === id))
                    .filter(Boolean)
                    .map((entry) => entry.nom)
                    .join(", ")}`}
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <Btn small variant="ghost" onClick={() => openEdit(enfant)}>{t("common.edit")}</Btn>
                <Btn small variant="danger" onClick={() => setChildren((prev) => prev.filter((entry) => entry.id !== enfant.id))}>
                  {t("common.delete")}
                </Btn>
              </div>
            </div>
          );
        })}
      </div>

      {modal ? (
        <Modal title={modal === "add" ? t("children.addTitle") : t("children.edit", { name: modal.nom })} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>{t("children.name")}</label>
              <Inp
                value={form.nom}
                onChange={(value) => setForm((prev) => ({ ...prev, nom: value }))}
                placeholder={t("children.namePlaceholder")}
              />
            </div>

            <div>
              <label style={labelStyle}>{t("children.age")}</label>
              <Inp
                type="number"
                value={form.age}
                onChange={(value) => setForm((prev) => ({ ...prev, age: value }))}
                placeholder="8"
              />
            </div>

            <div>
              <label style={labelStyle}>{t("children.ratio")}</label>
              <Sel
                value={form.ratioMax}
                onChange={(value) => setForm((prev) => ({ ...prev, ratioMax: value }))}
                options={Array.from({ length: 9 }, (_, index) => index + 1).map((ratio) => ({
                  value: String(ratio),
                  label: t("children.ratioLabel", { count: ratio, suffix: suffixPlural(ratio) }),
                }))}
              />
            </div>

            <div>
              <label style={labelStyle}>{t("children.incompatChildren")}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {children
                  .filter((entry) => entry.id !== (modal === "add" ? null : modal.id))
                  .map((entry) => (
                    <Pill
                      key={entry.id}
                      active={form.incompatiblesEnfants.includes(entry.id)}
                      color={C.yellow}
                      onClick={() => toggle("incompatiblesEnfants", entry.id)}
                    >
                      {entry.nom}
                    </Pill>
                  ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>{t("children.incompatAccos")}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {supportWorkers.map((entry) => (
                  <Pill
                    key={entry.id}
                    active={form.incompatiblesAccos.includes(entry.id)}
                    color={C.red}
                    onClick={() => toggle("incompatiblesAccos", entry.id)}
                  >
                    {entry.nom}
                  </Pill>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>{t("common.cancel")}</Btn>
              <Btn onClick={save} disabled={!form.nom || !form.age}>{t("common.save")}</Btn>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

const labelStyle = {
  color: C.muted,
  fontSize: 11,
  display: "block",
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};
