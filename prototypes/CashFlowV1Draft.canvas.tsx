import React, { useMemo, useState } from "react";

type ProfileType = "linked" | "manual" | "partial";
type RiskState = "ahead" | "tight" | "short";
type ScreenState = "ready" | "loading" | "error" | "empty";

type CashFlowModel = {
  safeToSpend: number;
  confidence: "High confidence" | "Medium confidence" | "Low confidence";
  asOf: string;
  stale: boolean;
  nextPayday: string;
  committed: Array<{ label: string; amount: number; date: string }>;
  estimatedVariableSpend: number;
  incomeUntilPayday: number;
};

const TOKENS = {
  bgPrimary: "#F6F6F6",
  bgCard: "#FFFFFF",
  bgAccent: "#E1FEFA",
  bgWarning: "#FFFCE9",
  bgNegative: "#FFEBED",
  textPrimary: "#000000",
  textSecondary: "rgba(0,0,0,0.64)",
  textTertiary: "rgba(0,0,0,0.48)",
  border: "rgba(0,0,0,0.08)",
  teal: "#006657",
  yellow: "#B89F00",
  red: "#CE293F",
  tealSolid: "#00E5C4",
};

const MODELS: Record<ProfileType, Record<RiskState, CashFlowModel>> = {
  linked: {
    ahead: {
      safeToSpend: 342,
      confidence: "High confidence",
      asOf: "Today, 11:42 AM",
      stale: false,
      nextPayday: "Apr 14",
      incomeUntilPayday: 0,
      estimatedVariableSpend: 105,
      committed: [
        { label: "Rent", amount: 850, date: "Apr 11" },
        { label: "Phone bill", amount: 78, date: "Apr 12" },
        { label: "Subscriptions", amount: 27, date: "Apr 13" },
      ],
    },
    tight: {
      safeToSpend: 89,
      confidence: "High confidence",
      asOf: "Today, 11:42 AM",
      stale: false,
      nextPayday: "Apr 14",
      incomeUntilPayday: 0,
      estimatedVariableSpend: 94,
      committed: [
        { label: "Rent", amount: 850, date: "Apr 11" },
        { label: "Phone bill", amount: 78, date: "Apr 12" },
        { label: "Subscriptions", amount: 27, date: "Apr 13" },
      ],
    },
    short: {
      safeToSpend: -43,
      confidence: "High confidence",
      asOf: "Today, 11:42 AM",
      stale: false,
      nextPayday: "Apr 14",
      incomeUntilPayday: 0,
      estimatedVariableSpend: 90,
      committed: [
        { label: "Rent", amount: 850, date: "Apr 11" },
        { label: "Phone bill", amount: 78, date: "Apr 12" },
        { label: "Subscriptions", amount: 27, date: "Apr 13" },
      ],
    },
  },
  manual: {
    ahead: {
      safeToSpend: 190,
      confidence: "Low confidence",
      asOf: "Today, 8:10 AM",
      stale: false,
      nextPayday: "Apr 15",
      incomeUntilPayday: 0,
      estimatedVariableSpend: 130,
      committed: [
        { label: "Rent (manual)", amount: 850, date: "Apr 11" },
        { label: "Utilities (manual)", amount: 145, date: "Apr 12" },
      ],
    },
    tight: {
      safeToSpend: 52,
      confidence: "Low confidence",
      asOf: "Today, 8:10 AM",
      stale: false,
      nextPayday: "Apr 15",
      incomeUntilPayday: 0,
      estimatedVariableSpend: 140,
      committed: [
        { label: "Rent (manual)", amount: 850, date: "Apr 11" },
        { label: "Utilities (manual)", amount: 145, date: "Apr 12" },
      ],
    },
    short: {
      safeToSpend: -88,
      confidence: "Low confidence",
      asOf: "Today, 8:10 AM",
      stale: false,
      nextPayday: "Apr 15",
      incomeUntilPayday: 0,
      estimatedVariableSpend: 140,
      committed: [
        { label: "Rent (manual)", amount: 850, date: "Apr 11" },
        { label: "Utilities (manual)", amount: 145, date: "Apr 12" },
      ],
    },
  },
  partial: {
    ahead: {
      safeToSpend: 128,
      confidence: "Medium confidence",
      asOf: "Today, 2:06 AM",
      stale: true,
      nextPayday: "Apr 14",
      incomeUntilPayday: 0,
      estimatedVariableSpend: 120,
      committed: [
        { label: "Rent", amount: 850, date: "Apr 11" },
        { label: "One linked subscription", amount: 11, date: "Apr 12" },
      ],
    },
    tight: {
      safeToSpend: 34,
      confidence: "Medium confidence",
      asOf: "Today, 2:06 AM",
      stale: true,
      nextPayday: "Apr 14",
      incomeUntilPayday: 0,
      estimatedVariableSpend: 120,
      committed: [
        { label: "Rent", amount: 850, date: "Apr 11" },
        { label: "One linked subscription", amount: 11, date: "Apr 12" },
      ],
    },
    short: {
      safeToSpend: -25,
      confidence: "Medium confidence",
      asOf: "Today, 2:06 AM",
      stale: true,
      nextPayday: "Apr 14",
      incomeUntilPayday: 0,
      estimatedVariableSpend: 120,
      committed: [
        { label: "Rent", amount: 850, date: "Apr 11" },
        { label: "One linked subscription", amount: 11, date: "Apr 12" },
      ],
    },
  },
};

function currency(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(value)).toLocaleString()}`;
}

function Chip({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        minHeight: 44,
        padding: "0 14px",
        borderRadius: 999,
        border: `1px solid ${selected ? TOKENS.teal : TOKENS.border}`,
        background: selected ? TOKENS.bgAccent : TOKENS.bgCard,
        color: selected ? TOKENS.teal : TOKENS.textPrimary,
        fontSize: 12,
        lineHeight: "18px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 120ms ease",
      }}
    >
      {label}
    </button>
  );
}

export default function CashFlowV1Draft() {
  const [profile, setProfile] = useState<ProfileType>("linked");
  const [risk, setRisk] = useState<RiskState>("tight");
  const [screenState, setScreenState] = useState<ScreenState>("ready");

  const model = useMemo(() => MODELS[profile][risk], [profile, risk]);
  const committedTotal = model.committed.reduce((sum, row) => sum + row.amount, 0);

  const statusCopy =
    risk === "ahead"
      ? "You are ahead"
      : risk === "tight"
        ? "Budget is tight"
        : "You may come up short";

  const statusColor =
    risk === "ahead" ? TOKENS.teal : risk === "tight" ? TOKENS.yellow : TOKENS.red;

  const statusBg =
    risk === "ahead"
      ? TOKENS.bgAccent
      : risk === "tight"
        ? TOKENS.bgWarning
        : TOKENS.bgNegative;

  const confidenceBg =
    model.confidence === "High confidence"
      ? TOKENS.bgAccent
      : model.confidence === "Medium confidence"
        ? TOKENS.bgWarning
        : TOKENS.bgNegative;

  const confidenceText =
    model.confidence === "High confidence"
      ? TOKENS.teal
      : model.confidence === "Medium confidence"
        ? TOKENS.yellow
        : TOKENS.red;

  const primaryAction =
    risk === "short" ? "See coverage options" : "Plan this week";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: TOKENS.bgPrimary,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: 24,
        fontFamily: "'DM Sans', -apple-system, system-ui, sans-serif",
        color: TOKENS.textPrimary,
      }}
    >
      <div
        style={{
          width: 390,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          background: TOKENS.bgPrimary,
          border: `1px solid ${TOKENS.border}`,
        }}
      >
        <div
          style={{
            height: 54,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span>9:41</span>
          <span>5G 92%</span>
        </div>

        <div style={{ padding: "0 16px 22px 16px", display: "grid", gap: 16 }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                lineHeight: "32px",
                letterSpacing: "-0.6px",
                fontWeight: 600,
              }}
            >
              Cash Flow
            </h1>
            <p
              style={{
                margin: "4px 0 0 0",
                color: TOKENS.textSecondary,
                fontSize: 14,
                lineHeight: "20px",
              }}
            >
              Safe to Spend before your next paycheck
            </p>
          </div>

          <section style={{ display: "grid", gap: 8 }}>
            <p
              style={{
                margin: 0,
                fontSize: 10,
                lineHeight: "16px",
                letterSpacing: "-0.2px",
                color: TOKENS.textTertiary,
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Prototype controls
            </p>
            <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
              <Chip
                selected={profile === "linked"}
                label="Linked account"
                onClick={() => setProfile("linked")}
              />
              <Chip
                selected={profile === "manual"}
                label="Manual input"
                onClick={() => setProfile("manual")}
              />
              <Chip
                selected={profile === "partial"}
                label="Partial data"
                onClick={() => setProfile("partial")}
              />
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
              <Chip selected={risk === "ahead"} label="Ahead" onClick={() => setRisk("ahead")} />
              <Chip selected={risk === "tight"} label="Tight" onClick={() => setRisk("tight")} />
              <Chip selected={risk === "short"} label="Short" onClick={() => setRisk("short")} />
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
              <Chip
                selected={screenState === "ready"}
                label="Ready"
                onClick={() => setScreenState("ready")}
              />
              <Chip
                selected={screenState === "loading"}
                label="Loading"
                onClick={() => setScreenState("loading")}
              />
              <Chip
                selected={screenState === "error"}
                label="Error"
                onClick={() => setScreenState("error")}
              />
              <Chip
                selected={screenState === "empty"}
                label="Empty"
                onClick={() => setScreenState("empty")}
              />
            </div>
          </section>

          {screenState === "loading" && (
            <section style={{ display: "grid", gap: 12 }}>
              {[1, 2, 3, 4].map((row) => (
                <div
                  key={row}
                  style={{
                    height: row === 1 ? 176 : 76,
                    background:
                      "linear-gradient(90deg, #EEEEEE 25%, #F6F6F6 50%, #EEEEEE 75%)",
                    backgroundSize: "200% 100%",
                    borderRadius: 16,
                    animation: "pulse 1.2s ease-in-out infinite",
                  }}
                />
              ))}
            </section>
          )}

          {screenState === "error" && (
            <section
              style={{
                background: TOKENS.bgNegative,
                border: `1px solid ${TOKENS.red}`,
                borderRadius: 16,
                padding: 16,
                display: "grid",
                gap: 10,
              }}
            >
              <p style={{ margin: 0, color: TOKENS.red, fontWeight: 600, fontSize: 16 }}>
                We could not refresh your latest account activity
              </p>
              <p
                style={{
                  margin: 0,
                  color: TOKENS.textSecondary,
                  fontSize: 14,
                  lineHeight: "20px",
                }}
              >
                Your current number may be out of date. Try again now or check linked accounts.
              </p>
              <button
                style={{
                  minHeight: 48,
                  border: "none",
                  borderRadius: 999,
                  background: TOKENS.textPrimary,
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 120ms ease",
                }}
              >
                Retry refresh
              </button>
            </section>
          )}

          {screenState === "empty" && (
            <section
              style={{
                background: TOKENS.bgCard,
                border: `1px solid ${TOKENS.border}`,
                borderRadius: 16,
                padding: 16,
                display: "grid",
                gap: 10,
              }}
            >
              <p style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                Set up Cash Flow to see your Safe to Spend
              </p>
              <p
                style={{
                  margin: 0,
                  color: TOKENS.textSecondary,
                  fontSize: 14,
                  lineHeight: "20px",
                }}
              >
                Add your paycheck and at least one spending account. We will show a clear weekly
                number once setup is complete.
              </p>
              <button
                style={{
                  minHeight: 48,
                  border: "none",
                  borderRadius: 999,
                  background: TOKENS.tealSolid,
                  color: TOKENS.textPrimary,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 120ms ease",
                }}
              >
                Start setup
              </button>
            </section>
          )}

          {screenState === "ready" && (
            <>
              <section
                style={{
                  background: TOKENS.bgCard,
                  border: `1px solid ${TOKENS.border}`,
                  borderRadius: 16,
                  padding: 16,
                  display: "grid",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span
                    style={{
                      background: statusBg,
                      color: statusColor,
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontWeight: 600,
                      fontSize: 12,
                      lineHeight: "18px",
                    }}
                  >
                    {statusCopy}
                  </span>
                  <span
                    style={{
                      background: confidenceBg,
                      color: confidenceText,
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontWeight: 600,
                      fontSize: 12,
                      lineHeight: "18px",
                    }}
                  >
                    {model.confidence}
                  </span>
                </div>

                <div style={{ display: "grid", gap: 2 }}>
                  <p
                    style={{
                      margin: 0,
                      color: TOKENS.textSecondary,
                      fontSize: 12,
                      lineHeight: "18px",
                    }}
                  >
                    Safe to Spend
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 44,
                      lineHeight: "52px",
                      letterSpacing: "-1.2px",
                      fontWeight: 600,
                    }}
                  >
                    {currency(model.safeToSpend)}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      color: TOKENS.textSecondary,
                      fontSize: 12,
                      lineHeight: "18px",
                    }}
                  >
                    As of {model.asOf} · Next paycheck {model.nextPayday}
                  </p>
                </div>

                {model.stale && (
                  <div
                    style={{
                      background: TOKENS.bgWarning,
                      border: `1px solid ${TOKENS.yellow}`,
                      borderRadius: 12,
                      padding: 12,
                      display: "grid",
                      gap: 4,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: TOKENS.yellow,
                        fontWeight: 600,
                        fontSize: 12,
                        lineHeight: "18px",
                      }}
                    >
                      Some linked data is delayed
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: TOKENS.textSecondary,
                        fontSize: 12,
                        lineHeight: "18px",
                      }}
                    >
                      This number may be lower confidence until your accounts refresh.
                    </p>
                  </div>
                )}

                <button
                  style={{
                    minHeight: 48,
                    borderRadius: 999,
                    border: "none",
                    background: TOKENS.textPrimary,
                    color: "#FFFFFF",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "all 120ms ease",
                  }}
                >
                  {primaryAction}
                </button>
              </section>

              <section
                style={{
                  background: TOKENS.bgCard,
                  border: `1px solid ${TOKENS.border}`,
                  borderRadius: 16,
                  padding: 16,
                  display: "grid",
                  gap: 10,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    lineHeight: "24px",
                    letterSpacing: "-0.3px",
                    fontWeight: 600,
                  }}
                >
                  Why this number
                </h2>
                <div style={{ display: "grid", gap: 8 }}>
                  <Row label="Income until payday" value={currency(model.incomeUntilPayday)} />
                  <Row label="Committed obligations" value={currency(-committedTotal)} />
                  <Row
                    label="Estimated variable spend"
                    value={currency(-model.estimatedVariableSpend)}
                    subtle
                  />
                </div>
              </section>

              <section
                style={{
                  background: TOKENS.bgCard,
                  border: `1px solid ${TOKENS.border}`,
                  borderRadius: 16,
                  padding: 16,
                  display: "grid",
                  gap: 10,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    lineHeight: "24px",
                    letterSpacing: "-0.3px",
                    fontWeight: 600,
                  }}
                >
                  Upcoming committed payments
                </h2>
                <div style={{ display: "grid", gap: 8 }}>
                  {model.committed.map((item) => (
                    <div
                      key={`${item.label}-${item.date}`}
                      style={{
                        border: `1px solid ${TOKENS.border}`,
                        borderRadius: 12,
                        padding: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "grid", gap: 2 }}>
                        <span style={{ fontSize: 14, lineHeight: "20px" }}>{item.label}</span>
                        <span
                          style={{ fontSize: 12, lineHeight: "18px", color: TOKENS.textSecondary }}
                        >
                          Due {item.date}
                        </span>
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {currency(-item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section
                style={{
                  background: TOKENS.bgCard,
                  border: `1px solid ${TOKENS.border}`,
                  borderRadius: 16,
                  padding: 16,
                  display: "grid",
                  gap: 8,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    lineHeight: "24px",
                    letterSpacing: "-0.3px",
                    fontWeight: 600,
                  }}
                >
                  Recommended next step
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: "20px",
                    color: TOKENS.textSecondary,
                  }}
                >
                  {risk === "short"
                    ? "You may not make it to payday at your current pace. We can show options to cover this week."
                    : "Your plan can improve with one simple move this week. We will prioritize actions that reduce risk first."}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    lineHeight: "18px",
                    color: TOKENS.textTertiary,
                  }}
                >
                  Why this now: based on your next 7 days of obligations and your latest account
                  activity.
                </p>
              </section>
            </>
          )}
        </div>

        <div
          style={{
            height: 34,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: TOKENS.bgPrimary,
          }}
        >
          <div
            style={{
              width: 134,
              height: 5,
              borderRadius: 999,
              background: "#000000",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  subtle,
}: {
  label: string;
  value: string;
  subtle?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 14,
        lineHeight: "20px",
      }}
    >
      <span style={{ color: subtle ? "rgba(0,0,0,0.64)" : "#000000" }}>{label}</span>
      <span style={{ color: subtle ? "rgba(0,0,0,0.64)" : "#000000", fontWeight: 600 }}>{value}</span>
    </div>
  );
}
