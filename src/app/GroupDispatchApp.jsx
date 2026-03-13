import React from "react";
import { C } from "./palette";
import { createTranslator, suffixPlural } from "./i18n";
import { validerGroupe } from "../domain/validation";
import { groupsDataService } from "../services/groupsDataService";
import { authService } from "../services/authService";
import { getSupabaseInitError } from "../services/supabaseClient";
import { LanguageSwitch, Btn } from "../components/ui/atoms";
import { AuthGate } from "../components/features/AuthGate";
import { DashboardTab } from "../components/features/DashboardTab";
import { GroupsTab } from "../components/features/GroupsTab";
import { ChildrenTab } from "../components/features/ChildrenTab";
import { SupportWorkersTab } from "../components/features/SupportWorkersTab";
import { resetSubgroupCounter } from "../domain/assignment";

const AUTH_STATUS = {
  loading: "loading",
  authenticated: "authenticated",
  unauthenticated: "unauthenticated",
};

export default function GroupDispatchApp() {
  const [lang, setLang] = React.useState("en");
  const [tab, setTab] = React.useState("dashboard");

  const [children, setChildren] = React.useState([]);
  const [supportWorkers, setSupportWorkers] = React.useState([]);
  const [groups, setGroups] = React.useState([]);

  const [isLoaded, setIsLoaded] = React.useState(false);
  const [dataError, setDataError] = React.useState("");

  const authEnabled = authService.isEnabled();
  const [authStatus, setAuthStatus] = React.useState(
    authEnabled ? AUTH_STATUS.loading : AUTH_STATUS.authenticated,
  );
  const [session, setSession] = React.useState(null);
  const [authPending, setAuthPending] = React.useState(false);
  const [authError, setAuthError] = React.useState("");
  const [authNotice, setAuthNotice] = React.useState("");

  const t = React.useMemo(() => createTranslator(lang), [lang]);

  const isAuthenticated = !authEnabled || authStatus === AUTH_STATUS.authenticated;
  const authUserId = session && session.user ? session.user.id : null;
  const supabaseInitError = getSupabaseInitError();
  const getErrorMessage = React.useCallback(
    (error) => (error && error.message ? error.message : String(error)),
    [],
  );

  React.useEffect(() => {
    if (!authEnabled) {
      return undefined;
    }

    let active = true;

    const applySession = (nextSession) => {
      setSession(nextSession);
      setAuthStatus(nextSession ? AUTH_STATUS.authenticated : AUTH_STATUS.unauthenticated);

      if (nextSession) {
        setAuthError("");
      }

      if (!nextSession) {
        setIsLoaded(false);
        setDataError("");
        setChildren([]);
        setSupportWorkers([]);
        setGroups([]);
        resetSubgroupCounter();
      }
    };

    const bootstrap = async () => {
      try {
        const { session: initialSession } = await authService.getSession();
        if (!active) {
          return;
        }
        applySession(initialSession);
      } catch (error) {
        if (!active) {
          return;
        }
        setAuthError(error && error.message ? error.message : String(error));
        setAuthStatus(AUTH_STATUS.unauthenticated);
      }
    };

    bootstrap();

    const unsubscribe = authService.onAuthStateChange((nextSession) => {
      if (!active) {
        return;
      }
      applySession(nextSession);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [authEnabled]);

  React.useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let active = true;

    setIsLoaded(false);
    setDataError("");

    groupsDataService.loadInitialState()
      .then((state) => {
        if (!active) {
          return;
        }

        setChildren(state.children);
        setSupportWorkers(state.supportWorkers);
        setGroups(state.groups);
        resetSubgroupCounter(state.groups);
        setIsLoaded(true);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setChildren([]);
        setSupportWorkers([]);
        setGroups([]);
        setIsLoaded(true);
        setDataError(getErrorMessage(error));
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, authUserId, getErrorMessage]);

  React.useEffect(() => {
    if (!isLoaded || !isAuthenticated) {
      return;
    }

    let active = true;

    groupsDataService.saveState({ children, supportWorkers, groups }).catch((error) => {
      if (!active) {
        return;
      }
      setDataError(getErrorMessage(error));
    });

    return () => {
      active = false;
    };
  }, [isLoaded, isAuthenticated, children, supportWorkers, groups, getErrorMessage]);

  const conflictsCount = React.useMemo(
    () => groups.flatMap((group) => validerGroupe(group, children, supportWorkers, t)).length,
    [groups, children, supportWorkers, t],
  );

  const tabs = React.useMemo(() => [
    { id: "dashboard", label: t("tab.dashboard") },
    { id: "groups", label: t("tab.groups") },
    { id: "children", label: t("tab.children") },
    { id: "supportWorkers", label: t("tab.supportWorkers") },
  ], [t]);

  const isEmptyState = children.length === 0 && supportWorkers.length === 0 && groups.length === 0;
  const contentMaxWidth = tab === "groups" ? 1720 : 1200;

  const loadDemoData = async () => {
    setDataError("");
    const state = await groupsDataService.loadDemoState();
    setChildren(state.children);
    setSupportWorkers(state.supportWorkers);
    setGroups(state.groups);
    resetSubgroupCounter(state.groups);
  };

  const resetGroupsData = () => {
    setDataError("");
    setGroups([]);
    resetSubgroupCounter();
  };

  const signIn = async (email, password) => {
    setAuthError("");
    setAuthNotice("");
    setAuthPending(true);

    try {
      await authService.signInWithPassword(email, password);
    } catch (error) {
      setAuthError(error && error.message ? error.message : String(error));
    } finally {
      setAuthPending(false);
    }
  };

  const signUp = async (email, password) => {
    setAuthError("");
    setAuthNotice("");
    setAuthPending(true);

    try {
      const data = await authService.signUp(email, password);
      if (!data || !data.session) {
        setAuthNotice(t("auth.signUpCheckInbox"));
      }
    } catch (error) {
      setAuthError(error && error.message ? error.message : String(error));
    } finally {
      setAuthPending(false);
    }
  };

  const signOut = async () => {
    setAuthError("");
    setAuthNotice("");

    try {
      await authService.signOut();
    } catch (error) {
      setAuthError(error && error.message ? error.message : String(error));
    }
  };

  const authEmail = session && session.user ? session.user.email : "";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif", color: C.text }}>
      <div
        style={{
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 52,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
            }}
          >
            o
          </div>
          <span style={{ fontWeight: 800, fontSize: 14 }}>{t("app.title")}</span>
          <span style={{ color: C.faint, fontSize: 11 }}>{t("app.poc")}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LanguageSwitch lang={lang} setLang={setLang} t={t} />

          {isAuthenticated ? (
            <>
              {!authEnabled ? (
                <Btn small variant="ghost" onClick={loadDemoData}>{t("app.loadDemoData")}</Btn>
              ) : null}
              {conflictsCount > 0 ? (
                <div
                  style={{
                    background: `${C.red}18`,
                    border: `1px solid ${C.red}33`,
                    color: C.red,
                    borderRadius: 7,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {t("app.conflictsBadge", { count: conflictsCount, suffix: suffixPlural(conflictsCount) })}
                </div>
              ) : null}
            </>
          ) : null}

          {authEnabled && isAuthenticated ? (
            <>
              <span style={{ color: C.muted, fontSize: 11 }}>{t("app.connectedAs", { email: authEmail || "-" })}</span>
              <Btn small variant="ghost" onClick={signOut}>{t("app.logout")}</Btn>
            </>
          ) : null}
        </div>
      </div>

      {isAuthenticated ? (
        <div style={{ display: "flex", padding: "0 24px", borderBottom: `1px solid ${C.border}`, background: C.surface }}>
          {tabs.map((tabEntry) => (
            <button
              key={tabEntry.id}
              type="button"
              onClick={() => setTab(tabEntry.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: tab === tabEntry.id ? C.accent : C.muted,
                fontWeight: tab === tabEntry.id ? 700 : 400,
                fontSize: 13,
                padding: "10px 16px",
                borderBottom: `2px solid ${tab === tabEntry.id ? C.accent : "transparent"}`,
                fontFamily: "inherit",
                transition: "all 0.12s",
              }}
            >
              {tabEntry.label}
            </button>
          ))}
        </div>
      ) : null}

      <div style={{ padding: 24, maxWidth: isAuthenticated ? contentMaxWidth : 680, width: "100%", margin: "0 auto" }}>
        {supabaseInitError ? (
          <div
            style={{
              background: `${C.red}12`,
              border: `1px solid ${C.red}33`,
              borderRadius: 12,
              padding: 12,
              color: C.red,
              fontSize: 12,
              marginBottom: 14,
            }}
          >
            {`Supabase init failed: ${supabaseInitError.message}`}
          </div>
        ) : null}

        {authEnabled && authStatus === AUTH_STATUS.loading ? (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 18,
              color: C.muted,
            }}
          >
            {t("auth.loading")}
          </div>
        ) : null}

        {authEnabled && authStatus === AUTH_STATUS.unauthenticated ? (
          <AuthGate
            t={t}
            pending={authPending}
            error={authError}
            notice={authNotice}
            onSignIn={signIn}
            onSignUp={signUp}
          />
        ) : null}

        {isAuthenticated && !isLoaded ? (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 18,
              color: C.muted,
            }}
          >
            {t("app.loadingData")}
          </div>
        ) : null}

        {isAuthenticated && isLoaded ? (
          <>
            {dataError ? (
              <div
                style={{
                  background: `${C.red}12`,
                  border: `1px solid ${C.red}33`,
                  borderRadius: 12,
                  padding: 12,
                  color: C.red,
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                {dataError}
              </div>
            ) : null}

            {tab === "dashboard" ? (
              <DashboardTab
                groups={groups}
                children={children}
                supportWorkers={supportWorkers}
                t={t}
                emptyStateMessage={isEmptyState ? t("app.emptyState") : ""}
              />
            ) : null}
            {tab === "groups" ? (
              <GroupsTab
                groups={groups}
                setGroups={setGroups}
                children={children}
                supportWorkers={supportWorkers}
                t={t}
                emptyStateMessage={isEmptyState ? t("app.emptyState") : ""}
                onResetGroups={resetGroupsData}
                draftScopeKey={authUserId || "anon"}
              />
            ) : null}
            {tab === "children" ? (
              <ChildrenTab
                children={children}
                setChildren={setChildren}
                supportWorkers={supportWorkers}
                groups={groups}
                t={t}
                emptyStateMessage={isEmptyState ? t("app.emptyState") : ""}
              />
            ) : null}
            {tab === "supportWorkers" ? (
              <SupportWorkersTab
                supportWorkers={supportWorkers}
                setSupportWorkers={setSupportWorkers}
                groups={groups}
                t={t}
                emptyStateMessage={isEmptyState ? t("app.emptyState") : ""}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
