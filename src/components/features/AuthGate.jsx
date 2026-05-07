import React from "react";
import { C } from "../../app/palette";
import { Btn, Inp } from "../ui/atoms";

export function AuthGate({ t, pending, error, notice, onSignIn }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [localError, setLocalError] = React.useState("");

  React.useEffect(() => {
    setLocalError("");
  }, [email, password]);

  const submit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setLocalError(t("auth.errorRequired"));
      return;
    }

    if (password.length < 6) {
      setLocalError(t("auth.errorPasswordLength"));
      return;
    }

    await onSignIn(email.trim(), password);
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 460,
        margin: "34px auto 0",
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 22,
      }}
    >
      <h2 style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 800 }}>{t("auth.title")}</h2>
      <p style={{ margin: "8px 0 18px", color: C.muted, fontSize: 13 }}>{t("auth.subtitle")}</p>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={labelStyle}>{t("auth.email")}</label>
          <Inp value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
        </div>

        <div>
          <label style={labelStyle}>{t("auth.password")}</label>
          <Inp value={password} onChange={setPassword} type="password" placeholder="******" />
        </div>

        {notice ? (
          <div
            style={{
              color: C.green,
              background: `${C.green}12`,
              border: `1px solid ${C.green}33`,
              borderRadius: 8,
              fontSize: 12,
              padding: "8px 10px",
            }}
          >
            {notice}
          </div>
        ) : null}

        {localError || error ? (
          <div
            style={{
              color: C.red,
              background: `${C.red}12`,
              border: `1px solid ${C.red}33`,
              borderRadius: 8,
              fontSize: 12,
              padding: "8px 10px",
            }}
          >
            {localError || error}
          </div>
        ) : null}

        <div style={{ marginTop: 4 }}>
          <Btn type="submit" disabled={pending}>
            {pending ? t("auth.signingIn") : t("auth.signIn")}
          </Btn>
        </div>
      </form>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 6,
  color: C.muted,
  fontSize: 12,
  fontWeight: 600,
};
