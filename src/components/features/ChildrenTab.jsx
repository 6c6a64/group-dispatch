import React from "react";
import { C } from "../../app/palette";
import { Btn, Inp, Modal, Pill, Sel } from "../ui/atoms";
import { suffixPlural } from "../../app/i18n";
import { sanitizeGroupsSnapshot } from "../../services/groupSnapshots";
import { buildChildrenCsvTemplate, validateChildrenCsv } from "../../services/csvImport";

export function ChildrenTab({
  children,
  setChildren,
  supportWorkers,
  groups,
  setGroups,
  t,
  emptyStateMessage,
}) {
  const [modal, setModal] = React.useState(null);
  const [form, setForm] = React.useState({
    nom: "",
    age: "",
    ratioMax: "2",
    incompatiblesEnfants: [],
    incompatiblesAccos: [],
  });
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [importPreview, setImportPreview] = React.useState(null);
  const [importFileName, setImportFileName] = React.useState("");
  const [importFeedback, setImportFeedback] = React.useState(null);
  const fileInputRef = React.useRef(null);

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

  const downloadTemplate = () => {
    const content = buildChildrenCsvTemplate();
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "children_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const openImportPicker = () => {
    if (!fileInputRef.current) {
      return;
    }
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    try {
      const csvText = await file.text();
      const preview = validateChildrenCsv(csvText, supportWorkers);
      setImportPreview(preview);
      setImportFileName(file.name);
      setImportModalOpen(true);
      setImportFeedback(null);
    } catch (error) {
      setImportFeedback({
        tone: "error",
        text: t("import.fileReadError", { message: error && error.message ? error.message : String(error) }),
      });
    }
  };

  const applyImport = () => {
    if (!importPreview || importPreview.errors.length > 0) {
      return;
    }

    const confirmed = typeof window === "undefined"
      ? true
      : window.confirm(t("import.replaceConfirm", { entity: t("import.entityChildren") }));

    if (!confirmed) {
      return;
    }

    const importedChildren = importPreview.items;
    const sanitized = sanitizeGroupsSnapshot(groups, importedChildren, supportWorkers);

    setChildren(importedChildren);
    if (typeof setGroups === "function") {
      setGroups(sanitized.groups);
    }

    setImportModalOpen(false);
    setImportPreview(null);
    setImportFeedback(
      sanitized.removedCount > 0
        ? {
          tone: "warning",
          text: t("import.appliedWithCleanup", {
            entity: t("import.entityChildren"),
            count: sanitized.removedCount,
            suffix: suffixPlural(sanitized.removedCount),
          }),
        }
        : {
          tone: "success",
          text: t("import.appliedSuccess", { entity: t("import.entityChildren") }),
        },
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 800 }}>{t("children.title")}</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Btn small variant="ghost" onClick={downloadTemplate}>{t("import.downloadTemplate")}</Btn>
          <Btn small variant="ghost" onClick={openImportPicker}>{t("import.importCsv")}</Btn>
          <Btn onClick={openAdd}>{t("children.add")}</Btn>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: "none" }}
        onChange={handleImportFile}
      />

      {importFeedback ? (
        <div
          style={{
            background: importFeedback.tone === "error"
              ? `${C.red}14`
              : importFeedback.tone === "warning"
                ? `${C.yellow}14`
                : `${C.green}14`,
            border: `1px solid ${importFeedback.tone === "error"
              ? `${C.red}44`
              : importFeedback.tone === "warning"
                ? `${C.yellow}44`
                : `${C.green}44`}`,
            color: importFeedback.tone === "error"
              ? C.red
              : importFeedback.tone === "warning"
                ? C.yellow
                : C.green,
            borderRadius: 8,
            padding: "8px 10px",
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          {importFeedback.text}
        </div>
      ) : null}

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

      {importModalOpen && importPreview ? (
        <Modal
          wide
          title={t("import.previewTitle", { entity: t("import.entityChildren") })}
          onClose={() => setImportModalOpen(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ color: C.muted, fontSize: 12 }}>{importFileName || "-"}</div>
            <div style={{ color: C.yellow, fontSize: 12 }}>{t("import.replaceImpact", { entity: t("import.entityChildren") })}</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={previewMetricStyle}>
                <div style={previewMetricLabelStyle}>{t("import.totalRows")}</div>
                <div style={previewMetricValueStyle}>{importPreview.rowsTotal}</div>
              </div>
              <div style={previewMetricStyle}>
                <div style={previewMetricLabelStyle}>{t("import.validRows")}</div>
                <div style={previewMetricValueStyle}>{importPreview.validCount}</div>
              </div>
              <div style={previewMetricStyle}>
                <div style={previewMetricLabelStyle}>{t("import.errorCount")}</div>
                <div style={previewMetricValueStyle}>{importPreview.errors.length}</div>
              </div>
            </div>

            {importPreview.errors.length > 0 ? (
              <div
                style={{
                  background: `${C.red}10`,
                  border: `1px solid ${C.red}33`,
                  borderRadius: 8,
                  padding: 10,
                  maxHeight: 240,
                  overflowY: "auto",
                }}
              >
                <div style={{ color: C.red, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
                  {t("import.blockingErrors")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {importPreview.errors.map((error, index) => (
                    <div key={index} style={{ color: C.red, fontSize: 12 }}>
                      {`L${error.line} ${error.field ? `[${error.field}] ` : ""}${error.message}`}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color: C.green, fontSize: 12 }}>{t("import.noErrors")}</div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setImportModalOpen(false)}>{t("common.cancel")}</Btn>
              <Btn
                variant={importPreview.errors.length > 0 ? "ghost" : "primary"}
                onClick={applyImport}
                disabled={importPreview.errors.length > 0}
              >
                {t("import.applyImport")}
              </Btn>
            </div>
          </div>
        </Modal>
      ) : null}

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

const previewMetricStyle = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: "7px 10px",
  minWidth: 120,
};

const previewMetricLabelStyle = {
  color: C.muted,
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const previewMetricValueStyle = {
  color: C.text,
  fontSize: 16,
  fontWeight: 800,
  marginTop: 2,
};

const labelStyle = {
  color: C.muted,
  fontSize: 11,
  display: "block",
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};
