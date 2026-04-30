import { useEffect, useRef, useState } from "react";
import type { FC, ReactNode, CSSProperties } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Minus,
  Plus,
  Signal,
  Wifi,
  Globe,
  Battery,
  Landmark,
  Briefcase,
  Receipt,
  TrendingUp,
  Shield,
  Sprout,
  Lock,
  RotateCw,
  ShoppingCart,
  Utensils,
  Car,
  Wallet,
} from "lucide-react";

// =====================================================================
// MLDS Prototype Token Map (canonical)
// Source: .cursor/rules/MLDS-prototype-tokens.mdc + cashflow-prototype/src/styles/mlds-tokens.css
// Baton Turbo @font-face declarations are loaded globally via main.tsx.
// =====================================================================
const T = {
  // Background
  bgPrimary: "#F6F6F6", // Neutral-100
  bgCard: "#FFFFFF", // Neutral-0
  bgTertiary: "#F6F6F6",

  // Accent backgrounds (MLDS 3.0 canonical)
  bgAccent: "#B2FCF1", // Teal-300 (3.0 has no Teal-100; 300 is the lightest available)
  bgWarning: "#FAF5CC", // Yellow-100
  bgNegative: "#FCCFC5", // Red-100
  bgNeutral: "#EEEEEE", // Neutral-200

  // Text
  textPrimary: "#000000",
  textSecondary: "rgba(0,0,0,0.64)",
  textTertiary: "rgba(0,0,0,0.48)",
  textDisabled: "rgba(0,0,0,0.32)",
  textInverse: "#FFFFFF",

  // Semantic content (text/icon colors on light surfaces)
  accent: "#11937E", // Teal-800 — darkest readable teal in 3.0 ramp
  positive: "#11937E",
  warning: "#736700", // Yellow-800
  negative: "#CE293F", // kept — 3.0 Red-500 (#FF5E57) is too light for text contrast

  // Brand primaries
  tealPrimary: "#00E5C4", // Teal-600
  tealLight: "#B2FCF1",
  red300: "#FABCAF", // Red-300 (3.0)
  yellow500: "#FFDD59", // Yellow-500 (3.0)
  contextualCoral: "#FFA093",
  contextualLightBlue: "#91EBF7", // legacy — not in 3.0 ramp; retained for spending category icons

  // Borders
  border: "rgba(0,0,0,0.08)",
  borderAccent: "#B2FCF1", // Teal-300
  borderNegative: "#FABCAF", // Red-300 (3.0)
  borderWarning: "#F5EB99", // Yellow-300 (3.0)

  // Radii — kept from prior tuning to avoid visual regression in the
  // current build. 3.0 canonical scale is xs:4 sm:8 md:14 lg:20 xl:24
  // 2xl:40 pill:9999. Migrate in a dedicated pass if alignment matters.
  radiusXs: 8,
  radiusSm: 12,
  radiusMd: 16,
  radiusLg: 20,
  radiusFull: 999,
};

const FONT_FAMILY =
  '"Baton Turbo", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

// =====================================================================
// Type definitions
// =====================================================================
type DetectionState = "high" | "partial" | "building" | "low";

type GateState = "default" | "loading" | "error";

type BillsState = "default" | "building";

type PickerState = "default" | "building" | "toast";

// =====================================================================
// Mock Data
// =====================================================================
// Real MLDS bank marks live in /assets/banks/. All three accounts now render
// from self-contained 40px SVG avatars.
const BANK_ACCOUNTS: Array<{
  name: string;
  detail: string;
  balance: number;
  color?: string;
  src?: string;
  iconSrc?: string;
}> = [
  {
    name: "RoarMoney Banking",
    detail: "1234",
    balance: 430,
    src: "/assets/banks/RoarMoney_40.svg",
  },
  {
    name: "Chase Bank",
    detail: "Savings · 4390",
    balance: 430,
    src: "/assets/banks/Chase_40.svg",
  },
  {
    name: "Bank of America",
    detail: "Checking · 8830",
    balance: 1300,
    src: "/assets/banks/BankOfAmerica_40.svg",
  },
];

const PAYCHECK_SOURCES = [
  { name: "Mcdonalds", detail: "bi-weekly · detected", amount: 1200 },
  { name: "Unknown employer", detail: "bi-weekly · detected", amount: 600 },
  { name: "Uber", detail: "bi-weekly · direct deposit", amount: 1200 },
];

const RECURRING_BILLS = [
  { name: "National Grid", amount: 24, due: "Due Oct 14", color: T.contextualCoral },
  { name: "T-Mobile", amount: 40, due: "Due Oct 18", color: "#E20074" },
  { name: "Spotify Premium", amount: 13, due: "Due Oct 22", color: "#1DB954" },
  { name: "Rent", amount: 1200, due: "Due Nov 1", color: T.contextualLightBlue },
];

const RECENT_TRANSACTIONS = [
  { group: "This week", items: [
    { name: "Spotify Premium", amount: 13, date: "Apr 24", color: "#1DB954" },
    { name: "Starbucks", amount: 6.5, date: "Apr 23", color: "#006241" },
    { name: "Mcdonalds", amount: 14.2, date: "Apr 22", color: "#FFC72C" },
  ]},
  { group: "Last week", items: [
    { name: "National Grid", amount: 24, date: "Apr 18", color: T.contextualCoral },
    { name: "Whole Foods", amount: 87.3, date: "Apr 16", color: "#00674B" },
    { name: "Netflix", amount: 17.99, date: "Apr 15", color: "#E50914" },
    { name: "T-Mobile", amount: 40, date: "Apr 14", color: "#E20074" },
  ]},
  { group: "Earlier", items: [
    { name: "Rent", amount: 1200, date: "Apr 1", color: T.contextualLightBlue },
    { name: "Uber", amount: 18.4, date: "Mar 30", color: "#000000" },
  ]},
];

// =====================================================================
// Phone Frame primitives
// =====================================================================
const PhoneFrame: FC<{ children: ReactNode; bg?: string }> = ({
  children,
  bg = T.bgPrimary,
}) => (
  <div
    style={{
      width: 395,
      height: 832,
      background: "#000000",
      borderRadius: 54,
      padding: "10px",
      boxShadow:
        "0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.08) inset",
      position: "relative",
    }}
  >
    {/* Dynamic Island */}
    <div
      style={{
        position: "absolute",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        width: 126,
        height: 36,
        borderRadius: 20,
        background: "#000000",
        zIndex: 10,
      }}
    />
    {/* Screen */}
    <div
      style={{
        width: 375,
        height: 812,
        background: bg,
        borderRadius: 44,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        fontFamily: FONT_FAMILY,
        color: T.textPrimary,
      }}
    >
      {children}
    </div>
  </div>
);

const StatusBar: FC = () => (
  <div
    style={{
      height: 54,
      padding: "16px 32px 0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexShrink: 0,
    }}
  >
    <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>
      9:41
    </span>
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <Signal size={16} fill={T.textPrimary} strokeWidth={0} />
      <Wifi size={16} strokeWidth={2.5} />
      <Globe size={16} strokeWidth={2.5} />
      <Battery size={22} fill={T.textPrimary} strokeWidth={1.5} />
    </div>
  </div>
);

const HomeIndicator: FC<{ bg?: string }> = ({ bg }) => (
  <div
    style={{
      height: 34,
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-end",
      paddingBottom: 8,
      background: bg || "transparent",
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: 134,
        height: 5,
        borderRadius: 3,
        background: T.textPrimary,
      }}
    />
  </div>
);

const NavBar: FC<{
  title?: string;
  showBack?: boolean;
  showHelp?: boolean;
  onBack?: () => void;
}> = ({ title, showBack = true, showHelp = true, onBack }) => (
  <div
    style={{
      height: 56,
      padding: "0 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0,
    }}
  >
    <button
      onClick={onBack}
      style={{
        width: 44,
        height: 44,
        border: 0,
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        cursor: "pointer",
        visibility: showBack ? "visible" : "hidden",
        padding: 0,
      }}
      aria-label="Back"
    >
      <ArrowLeft size={24} color={T.textPrimary} strokeWidth={2} />
    </button>
    {title && (
      <span
        style={{
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </span>
    )}
    <button
      style={{
        width: 44,
        height: 44,
        border: 0,
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        cursor: "pointer",
        visibility: showHelp ? "visible" : "hidden",
        padding: 0,
      }}
      aria-label="Help"
    >
      <HelpCircle size={24} color={T.textPrimary} strokeWidth={2} />
    </button>
  </div>
);

// =====================================================================
// Reusable UI primitives
// =====================================================================
const PrimaryButton: FC<{
  label: string;
  onClick?: () => void;
  loading?: boolean;
  fullWidth?: boolean;
}> = ({ label, onClick, loading, fullWidth = true }) => (
  <button
    onClick={onClick}
    disabled={loading}
    style={{
      width: fullWidth ? "100%" : "auto",
      height: 48,
      borderRadius: T.radiusFull,
      border: 0,
      background: T.tealPrimary,
      color: T.textPrimary,
      fontSize: 16,
      fontWeight: 600,
      letterSpacing: -0.3,
      fontFamily: FONT_FAMILY,
      cursor: loading ? "default" : "pointer",
      opacity: loading ? 0.8 : 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      transition: "opacity 150ms ease",
    }}
  >
    {loading && (
      <RotateCw
        size={16}
        style={{ animation: "v2-spin 1s linear infinite" }}
      />
    )}
    {label}
  </button>
);

const TransparentButton: FC<{
  label: string;
  onClick?: () => void;
}> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: "100%",
      height: 48,
      borderRadius: T.radiusFull,
      border: 0,
      background: "transparent",
      color: T.textPrimary,
      fontSize: 16,
      fontWeight: 600,
      letterSpacing: -0.3,
      fontFamily: FONT_FAMILY,
      cursor: "pointer",
    }}
  >
    {label}
  </button>
);

const ConfidenceChip: FC<{
  variant: "partial" | "building" | "limited";
  label?: string;
}> = ({ variant, label }) => {
  const map = {
    partial: { bg: T.bgAccent, fg: T.accent, text: label || "Partial estimated" },
    building: { bg: T.bgWarning, fg: T.warning, text: label || "Building your view" },
    limited: { bg: T.bgNeutral, fg: T.textSecondary, text: label || "Limited info" },
  } as const;
  const v = map[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        padding: "4px 10px",
        borderRadius: T.radiusFull,
        background: v.bg,
        color: v.fg,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: -0.2,
      }}
    >
      {v.text}
    </span>
  );
};

const RecommendedBadge: FC = () => (
  <span
    style={{
      display: "inline-flex",
      padding: "3px 8px",
      borderRadius: T.radiusFull,
      background: T.bgAccent,
      color: T.accent,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: -0.2,
    }}
  >
    Recommended
  </span>
);

// Outline card primitive — matches MLDS List 3.0 "card-more ways" Figma spec.
// 12px radius, 1px hairline border at rgba(0,0,0,0.15), overflow:hidden so
// inner row dividers don't bleed past rounded corners.
const Card: FC<{
  children: ReactNode;
  pad?: number;
  style?: CSSProperties;
}> = ({ children, pad = 0, style }) => (
  <div
    style={{
      background: T.bgCard,
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.15)",
      overflow: "hidden",
      padding: pad,
      ...style,
    }}
  >
    {children}
  </div>
);

const SectionHeader: FC<{ children: ReactNode; mt?: number }> = ({
  children,
  mt = 24,
}) => (
  <div
    style={{
      fontSize: 14,
      fontWeight: 600,
      color: T.textSecondary,
      letterSpacing: -0.2,
      marginTop: mt,
      marginBottom: 12,
    }}
  >
    {children}
  </div>
);

// Three avatar modes, in priority order:
//   1. `src`     — self-contained logo (e.g., Chase_40.svg has its own circle bg)
//   2. `iconSrc` — icon glyph rendered inside a `color`-tinted circle (e.g., ML
//                  logomark inside a teal circle for RoarMoney)
//   3. `initial` — tinted-initial fallback when no real logo is available
// Per MLDS-prototype-tokens.mdc: prefer real assets in /assets over fallbacks.
const MerchantAvatar: FC<{
  color?: string;
  initial?: string;
  size?: number;
  src?: string;
  iconSrc?: string;
}> = ({ color, initial, size = 36, src, iconSrc }) => {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{
          borderRadius: 999,
          flexShrink: 0,
          display: "block",
        }}
      />
    );
  }

  if (iconSrc) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          background: color || T.bgNeutral,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <img
          src={iconSrc}
          alt=""
          width={Math.round(size * 0.55)}
          height={Math.round(size * 0.55)}
          style={{ display: "block" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: color || T.bgNeutral,
        color: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size === 36 ? 14 : 12,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
};

// =====================================================================
// Splash Illustrations (placeholder using lucide stacks)
// =====================================================================
const SplashIllustration: FC<{ pillar: "see" | "cover" | "grow" }> = ({
  pillar,
}) => {
  const config = {
    see: {
      bg: T.bgWarning,
      ring: T.yellow500,
      icon: <TrendingUp size={56} color={T.textPrimary} strokeWidth={2.25} />,
      accents: [
        { Icon: Receipt, color: T.tealPrimary, top: 20, left: 28 },
        { Icon: Briefcase, color: T.contextualLightBlue, top: 30, right: 24 },
      ],
    },
    cover: {
      bg: T.bgAccent,
      ring: T.tealPrimary,
      icon: <Shield size={56} color={T.textPrimary} strokeWidth={2.25} />,
      accents: [
        { Icon: Receipt, color: T.contextualCoral, top: 24, left: 24 },
        { Icon: Plus, color: T.yellow500, top: 32, right: 28 },
      ],
    },
    grow: {
      bg: T.bgNeutral,
      ring: T.tealPrimary,
      icon: <Sprout size={56} color={T.textPrimary} strokeWidth={2.25} />,
      accents: [
        { Icon: TrendingUp, color: T.tealPrimary, top: 22, left: 26 },
        { Icon: Plus, color: T.yellow500, top: 30, right: 26 },
      ],
    },
  } as const;
  const c = config[pillar];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 240,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
      }}
    >
      <div
        style={{
          width: 168,
          height: 168,
          borderRadius: T.radiusFull,
          background: c.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: T.radiusFull,
            background: T.bgCard,
            border: `3px solid ${c.ring}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {c.icon}
        </div>
      </div>
      {c.accents.map((a, i) => {
        const { Icon, color } = a;
        const pos: CSSProperties = {
          position: "absolute",
          top: a.top,
          ...("left" in a ? { left: a.left } : { right: (a as any).right }),
          width: 44,
          height: 44,
          borderRadius: T.radiusFull,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        };
        return (
          <div key={i} style={pos}>
            <Icon size={20} color={T.textPrimary} strokeWidth={2.5} />
          </div>
        );
      })}
    </div>
  );
};

// =====================================================================
// Screen A0 — Splash Carousel
// =====================================================================
const SPLASH_PAGES = [
  {
    pillar: "see" as const,
    headline: "See your future clearly. Stay ahead.",
    subhead:
      "Cash Flow shows exactly how much you can spend before your next paycheck, after every bill.",
  },
  {
    pillar: "cover" as const,
    headline: "Know when things get tight.",
    subhead:
      "We'll flag a shortfall before it shows up at the register, so you can get ahead of it.",
  },
  {
    pillar: "grow" as const,
    headline: "Turn breathing room into momentum.",
    subhead:
      "When you have surplus, we'll help you put it to work, so every paycheck moves you forward.",
  },
];

const SplashScreen: FC<{
  page: number;
  setPage: (n: number) => void;
  /** True for the 85% of users with a bv-linked account; false for the 15% unlinked path. */
  linked: boolean;
  onContinue: () => void;
}> = ({ page, setPage, linked, onContinue }) => {
  const p = SPLASH_PAGES[page];
  return (
    <PhoneFrame>
      <StatusBar />
      <NavBar showBack={false} showHelp={false} />

      <div
        style={{
          flex: 1,
          padding: "8px 24px 0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <SplashIllustration pillar={p.pillar} />

        <div style={{ marginTop: 36, textAlign: "center" }}>
          <h1
            style={{
              fontSize: 28,
              lineHeight: "36px",
              fontWeight: 600,
              letterSpacing: -1,
              margin: 0,
              padding: "0 8px",
            }}
          >
            {p.headline}
          </h1>
          <p
            style={{
              marginTop: 12,
              fontSize: 15,
              lineHeight: "22px",
              color: T.textSecondary,
              letterSpacing: -0.2,
              padding: "0 4px",
            }}
          >
            {p.subhead}
          </p>
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          {SPLASH_PAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{
                width: i === page ? 24 : 8,
                height: 8,
                borderRadius: 4,
                border: 0,
                background: i === page ? T.textPrimary : T.bgNeutral,
                cursor: "pointer",
                padding: 0,
                transition: "width 150ms ease",
              }}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>

        <PrimaryButton
          label={linked ? "Continue" : "Link your bank"}
          onClick={onContinue}
        />
        {!linked && (
          <div
            style={{
              marginTop: 10,
              textAlign: "center",
              fontSize: 12,
              lineHeight: "16px",
              color: T.textTertiary,
              letterSpacing: -0.2,
              padding: "0 16px",
            }}
          >
            Bank-level encryption · Read-only access · Disconnect anytime
          </div>
        )}
      </div>

      <HomeIndicator />
    </PhoneFrame>
  );
};

// =====================================================================
// Screen A1 — Linking Gate
// =====================================================================
const LinkingGateScreen: FC<{
  state: GateState;
  onLink: () => void;
  onBack: () => void;
}> = ({ state, onLink, onBack }) => (
  <PhoneFrame>
    <StatusBar />
    <NavBar title="Cash Flow" onBack={onBack} />

    <div
      style={{
        flex: 1,
        padding: "8px 24px 0",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          marginTop: 32,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: T.radiusFull,
            background: T.bgAccent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lock size={48} color={T.accent} strokeWidth={2} />
        </div>
      </div>

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <h1
          style={{
            fontSize: 28,
            lineHeight: "36px",
            fontWeight: 600,
            letterSpacing: -1,
            margin: 0,
          }}
        >
          Link your bank to get started
        </h1>
        <p
          style={{
            marginTop: 12,
            fontSize: 15,
            lineHeight: "22px",
            color: T.textSecondary,
            letterSpacing: -0.2,
          }}
        >
          We'll find your paycheck, bills, and safe-to-spend automatically. No
          setup forms.
        </p>
      </div>

      <div style={{ flex: 1 }} />

      {state === "error" && (
        <div
          style={{
            background: T.bgNegative,
            border: `1px solid ${T.borderNegative}`,
            borderRadius: T.radiusSm,
            padding: 12,
            fontSize: 13,
            color: T.negative,
            letterSpacing: -0.2,
            marginBottom: 12,
          }}
        >
          We couldn't connect. Try again?
        </div>
      )}

      <div
        style={{
          fontSize: 12,
          lineHeight: "16px",
          color: T.textTertiary,
          textAlign: "center",
          marginBottom: 16,
          letterSpacing: -0.2,
        }}
      >
        Bank-level encryption. We never store your login.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        <PrimaryButton
          label="Link your bank"
          onClick={onLink}
          loading={state === "loading"}
        />
        <TransparentButton label="Maybe later" />
      </div>
    </div>

    <HomeIndicator />
  </PhoneFrame>
);

// =====================================================================
// Screen A2 — Overview
// =====================================================================

type PillarIconKind = "confirmed" | "indeterminate";
type PillarChevron = "down" | "right" | "none";

const PillarRow: FC<{
  title: string;
  meta: string;
  iconKind: PillarIconKind;
  chevron: PillarChevron;
  onClick?: () => void;
  isLast?: boolean;
}> = ({ title, meta, iconKind, chevron, onClick, isLast }) => {
  // checkCircle (confirmed) and radiobuttonIndeterminate (pending) per
  // MLDS List 3.0 leading-icon spec. Indeterminate is neutral, not red —
  // it signals "still detecting", not error.
  const Icon = (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: 999,
        background: iconKind === "confirmed" ? T.textPrimary : "transparent",
        border:
          iconKind === "confirmed" ? "0" : `1.5px solid rgba(0,0,0,0.48)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {iconKind === "confirmed" ? (
        <Check size={14} color="#FFFFFF" strokeWidth={3} />
      ) : (
        <Minus size={14} color="rgba(0,0,0,0.48)" strokeWidth={2.5} />
      )}
    </div>
  );

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        width: "100%",
        padding: "16px 16px 16px 12px",
        background: "transparent",
        border: 0,
        borderBottom: isLast ? "0" : `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
        fontFamily: FONT_FAMILY,
      }}
    >
      {Icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 16,
            lineHeight: "24px",
            fontWeight: 400,
            color: T.textPrimary,
            letterSpacing: -0.32,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 14,
            lineHeight: "20px",
            color: "rgba(0,0,0,0.6)",
            letterSpacing: -0.28,
            marginTop: 2,
          }}
        >
          {meta}
        </div>
      </div>
      {chevron === "down" && (
        <ChevronDown size={28} color={T.textTertiary} strokeWidth={1.75} />
      )}
      {chevron === "right" && (
        <ChevronRight size={28} color={T.textTertiary} strokeWidth={1.75} />
      )}
    </button>
  );
};

const ExpandedRow: FC<{
  icon: ReactNode;
  title: string;
  detail: string;
  amount?: string;
  isLast?: boolean;
}> = ({ icon, title, detail, amount, isLast }) => (
  <div
    style={{
      padding: "12px 16px",
      borderBottom: isLast ? "0" : `1px solid ${T.border}`,
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: T.radiusFull,
        background: T.bgPrimary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.3 }}>
        {title}
      </div>
      <div
        style={{
          fontSize: 12,
          color: T.textSecondary,
          letterSpacing: -0.2,
          marginTop: 2,
        }}
      >
        {detail}
      </div>
    </div>
    {amount && (
      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.3 }}>
        {amount}
      </div>
    )}
  </div>
);

const RecommendationRow: FC<{
  title: string;
  body: string;
  recommended?: boolean;
  isLast?: boolean;
}> = ({ title, body, recommended, isLast }) => (
  <div
    style={{
      padding: "16px",
      borderBottom: isLast ? "0" : `1px solid ${T.border}`,
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
    }}
  >
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        border: `1.5px solid ${T.textTertiary}`,
        flexShrink: 0,
        marginTop: 2,
      }}
    />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>
          {title}
        </span>
        {recommended && <RecommendedBadge />}
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: "18px",
          color: T.textSecondary,
          letterSpacing: -0.2,
        }}
      >
        {body}
      </div>
    </div>
    <ChevronRight size={20} color={T.textTertiary} />
  </div>
);

const OverviewScreen: FC<{
  state: DetectionState;
  onContinue: () => void;
  onBack: () => void;
  onTapBills: () => void;
}> = ({ state, onContinue, onBack, onTapBills }) => {
  // Both pillar accordions land collapsed regardless of detection state.
  // Reduces above-the-fold cognitive load — meta line carries the summary,
  // user expands only the pillar they want detail on.
  const [bankExpanded, setBankExpanded] = useState(false);
  const [paycheckExpanded, setPaycheckExpanded] = useState(false);
  const [moreWaysExpanded, setMoreWaysExpanded] = useState(true);

  // Detection per pillar. Partial = paycheck found, bills still pending — the
  // most common asymmetric case in the field (income lands monthly, bills can
  // take a full cycle to surface).
  const paycheckDetected = state === "high" || state === "partial";
  const billsDetected = state === "high";

  const sectionTitle =
    state === "high" || state === "partial"
      ? "Here's what we found"
      : "Your Setup Checklist";

  return (
    <PhoneFrame>
      <StatusBar />
      <NavBar title="Cash Flow" onBack={onBack} />

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 24 }}>
        <div style={{ padding: "8px 16px 0" }}>
          <h1
            style={{
              fontSize: 28,
              lineHeight: "34px",
              fontWeight: 600,
              letterSpacing: -1,
              margin: 0,
            }}
          >
            See exactly where your money stands
          </h1>
          <p
            style={{
              marginTop: 12,
              fontSize: 14,
              lineHeight: "20px",
              color: T.textSecondary,
              letterSpacing: -0.2,
            }}
          >
            Link the accounts where your paycheck lands and your bills come
            from. The more you add, the more accurate your forecast.
          </p>

          {state === "building" && (
            <div style={{ marginTop: 12 }}>
              <ConfidenceChip variant="building" />
            </div>
          )}
          {state === "low" && (
            <div style={{ marginTop: 12 }}>
              <ConfidenceChip variant="limited" />
            </div>
          )}

          <SectionHeader mt={20}>{sectionTitle}</SectionHeader>

          <Card>
            <PillarRow
              title="Bank connection"
              meta="3 accounts linked"
              iconKind="confirmed"
              chevron={bankExpanded ? "down" : "right"}
              onClick={() => setBankExpanded(!bankExpanded)}
            />
            {bankExpanded &&
              BANK_ACCOUNTS.map((acc) => (
                <ExpandedRow
                  key={acc.name}
                  icon={
                    <MerchantAvatar
                      color={acc.color}
                      initial={acc.name[0]}
                      size={32}
                      src={acc.src}
                      iconSrc={acc.iconSrc}
                    />
                  }
                  title={acc.name}
                  detail={acc.detail}
                  amount={`$${acc.balance.toLocaleString()}`}
                  isLast={false}
                />
              ))}

            <PillarRow
              title="Paycheck"
              meta={
                paycheckDetected
                  ? "$1,400 detected bi-weekly"
                  : "No income detected"
              }
              iconKind={paycheckDetected ? "confirmed" : "indeterminate"}
              chevron={
                paycheckDetected
                  ? paycheckExpanded
                    ? "down"
                    : "right"
                  : "none"
              }
              onClick={
                paycheckDetected
                  ? () => setPaycheckExpanded(!paycheckExpanded)
                  : undefined
              }
            />
            {paycheckDetected &&
              paycheckExpanded &&
              PAYCHECK_SOURCES.map((src) => (
                <ExpandedRow
                  key={src.name}
                  icon={
                    <Landmark size={16} color={T.textSecondary} strokeWidth={2} />
                  }
                  title={src.name}
                  detail={src.detail}
                  amount={`$${src.amount.toLocaleString()}`}
                  isLast={false}
                />
              ))}

            <PillarRow
              title="Recurring bills"
              meta={
                billsDetected ? "$850/mo detected" : "No bills detected"
              }
              iconKind={billsDetected ? "confirmed" : "indeterminate"}
              chevron="none"
              onClick={billsDetected ? onTapBills : undefined}
              isLast
            />
          </Card>

          <div style={{ marginTop: 24 }}>
            <Card>
              <button
                onClick={() => setMoreWaysExpanded(!moreWaysExpanded)}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: "transparent",
                  border: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  fontFamily: FONT_FAMILY,
                  borderBottom: moreWaysExpanded
                    ? `1px solid ${T.border}`
                    : "0",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: -0.3,
                    color: T.textPrimary,
                  }}
                >
                  More ways to improve your cash flow
                </span>
                {moreWaysExpanded ? (
                  <ChevronDown size={20} color={T.textTertiary} />
                ) : (
                  <ChevronRight size={20} color={T.textTertiary} />
                )}
              </button>
              {moreWaysExpanded && (
                <>
                  <RecommendationRow
                    title="Link another account"
                    body="Add the bank where your rent, cards, or everyday spending comes from."
                  />
                  <RecommendationRow
                    title="Set up direct deposit"
                    body="Bring your paycheck to RoarMoney to unlock instant deposits, fee savings, and your full forecast."
                    recommended
                    isLast
                  />
                </>
              )}
            </Card>
          </div>

          <p
            style={{
              fontSize: 12,
              lineHeight: "16px",
              color: T.textTertiary,
              textAlign: "center",
              marginTop: 16,
              padding: "0 8px",
              letterSpacing: -0.2,
            }}
          >
            You can return here anytime to improve your cashflow forecast or
            finish the suggested tasks.
          </p>
        </div>
      </div>

      <div
        style={{
          padding: "12px 16px 16px",
          borderTop: `1px solid ${T.border}`,
          background: T.bgPrimary,
        }}
      >
        <PrimaryButton label="View my Cashflow" onClick={onContinue} />
      </div>

      <HomeIndicator />
    </PhoneFrame>
  );
};

// =====================================================================
// Screen A2b — Stepper Onboarding (parallel path to A2 Overview)
// =====================================================================

type StepperPartialMode = "skip" | "show";

type DemoConfig = {
  path: "a2" | "a2b";
  mode: StepperPartialMode;
  detection: DetectionState;
};

const StepProgress: FC<{ current: number; total: number }> = ({
  current,
  total,
}) => (
  <div
    style={{
      display: "flex",
      gap: 6,
      padding: "0 16px",
      marginBottom: 4,
    }}
  >
    {Array.from({ length: total }, (_, i) => (
      <div
        key={i}
        style={{
          flex: 1,
          height: 4,
          borderRadius: 2,
          background: i < current ? T.tealPrimary : T.bgNeutral,
          transition: "background 200ms ease",
        }}
      />
    ))}
  </div>
);

const StepperShell: FC<{
  step: number;
  totalSteps: number;
  onBack: () => void;
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  showBack?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  footerLink?: { label: string; onClick?: () => void };
}> = ({
  step,
  totalSteps,
  onBack,
  children,
  primaryLabel,
  onPrimary,
  showBack = true,
  secondaryLabel,
  onSecondary,
  footerLink,
}) => (
  <PhoneFrame>
    <StatusBar />
    <NavBar title="Cash Flow" onBack={onBack} showBack={showBack} />
    <StepProgress current={step} total={totalSteps} />

    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "8px 16px 0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}

      <div style={{ flex: 1, minHeight: 16 }} />

      {footerLink && (
        <button
          onClick={footerLink.onClick}
          style={{
            background: "transparent",
            border: 0,
            color: T.accent,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: -0.2,
            fontFamily: FONT_FAMILY,
            cursor: "pointer",
            padding: "8px 0",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {footerLink.label}
        </button>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          paddingBottom: 16,
        }}
      >
        <PrimaryButton label={primaryLabel} onClick={onPrimary} />
        {secondaryLabel && onSecondary && (
          <TransparentButton label={secondaryLabel} onClick={onSecondary} />
        )}
      </div>
    </div>

    <HomeIndicator />
  </PhoneFrame>
);

// Step 1 — Accounts we're tracking
const AccountsStepScreen: FC<{
  totalSteps: number;
  onContinue: () => void;
  onBack: () => void;
}> = ({ totalSteps, onContinue, onBack }) => (
  <StepperShell
    step={1}
    totalSteps={totalSteps}
    onBack={onBack}
    primaryLabel="Continue"
    onPrimary={onContinue}
    showBack
    footerLink={{ label: "Link another account" }}
  >
    <h1
      style={{
        fontSize: 28,
        lineHeight: "36px",
        fontWeight: 600,
        letterSpacing: -1,
        margin: 0,
      }}
    >
      Accounts we're tracking
    </h1>
    <p
      style={{
        marginTop: 8,
        fontSize: 14,
        lineHeight: "20px",
        color: T.textSecondary,
        letterSpacing: -0.2,
      }}
    >
      Here's where we'll watch your money move. Add more accounts for a
      fuller picture.
    </p>

    <div style={{ marginTop: 20 }}>
      <Card>
        {BANK_ACCOUNTS.map((acc, i) => (
          <ExpandedRow
            key={acc.name}
            icon={
              <MerchantAvatar
                src={acc.src}
                iconSrc={acc.iconSrc}
                color={acc.color}
                initial={acc.name[0]}
                size={36}
              />
            }
            title={acc.name}
            detail={acc.detail}
            amount={`$${acc.balance.toLocaleString()}`}
            isLast={i === BANK_ACCOUNTS.length - 1}
          />
        ))}
      </Card>
    </div>

    <p
      style={{
        marginTop: 16,
        fontSize: 12,
        lineHeight: "16px",
        color: T.textTertiary,
        letterSpacing: -0.2,
        textAlign: "center",
      }}
    >
      Read-only access. We never store your login.
    </p>
  </StepperShell>
);

// Step 2 — Your income
const IncomeStepScreen: FC<{
  totalSteps: number;
  detection: DetectionState;
  partialMode: StepperPartialMode;
  onContinue: () => void;
  onBack: () => void;
}> = ({ totalSteps, detection, partialMode, onContinue, onBack }) => {
  const incomeDetected = detection === "high" || detection === "partial";

  const headline = incomeDetected
    ? "Your income"
    : detection === "building"
      ? "Your income"
      : "Your income";

  const subhead = incomeDetected
    ? "We found these paychecks coming in."
    : detection === "building"
      ? "We're still analyzing your transactions. Income patterns usually appear within 24 hours."
      : "We didn't find income yet. Income from accounts you haven't linked won't show up here.";

  return (
    <StepperShell
      step={2}
      totalSteps={totalSteps}
      onBack={onBack}
      primaryLabel="Continue"
      onPrimary={onContinue}
      secondaryLabel="Back"
      onSecondary={onBack}
    >
      <h1
        style={{
          fontSize: 28,
          lineHeight: "36px",
          fontWeight: 600,
          letterSpacing: -1,
          margin: 0,
        }}
      >
        {headline}
      </h1>
      <p
        style={{
          marginTop: 8,
          fontSize: 14,
          lineHeight: "20px",
          color: T.textSecondary,
          letterSpacing: -0.2,
        }}
      >
        {subhead}
      </p>

      {incomeDetected ? (
        <div style={{ marginTop: 20 }}>
          <Card>
            {PAYCHECK_SOURCES.map((src, i) => (
              <ExpandedRow
                key={src.name}
                icon={
                  <Landmark
                    size={16}
                    color={T.textSecondary}
                    strokeWidth={2}
                  />
                }
                title={src.name}
                detail={src.detail}
                amount={`$${src.amount.toLocaleString()}`}
                isLast={i === PAYCHECK_SOURCES.length - 1}
              />
            ))}
          </Card>
        </div>
      ) : (
        partialMode === "show" && (
          <div style={{ marginTop: 20 }}>
            <Card pad={16}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: T.radiusFull,
                    background:
                      detection === "building" ? T.bgWarning : T.bgNeutral,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {detection === "building" ? (
                    <RotateCw
                      size={22}
                      color={T.warning}
                      strokeWidth={2}
                      style={{ animation: "v2-spin 2s linear infinite" }}
                    />
                  ) : (
                    <Minus
                      size={22}
                      color={T.textTertiary}
                      strokeWidth={2}
                    />
                  )}
                </div>
                <ConfidenceChip
                  variant={detection === "building" ? "building" : "limited"}
                />
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: "18px",
                    color: T.textSecondary,
                    letterSpacing: -0.2,
                    margin: 0,
                  }}
                >
                  {detection === "building"
                    ? "Check back soon. We'll notify you when we detect a paycheck."
                    : "Try linking the account where your paycheck lands."}
                </p>
              </div>
            </Card>
          </div>
        )
      )}
    </StepperShell>
  );
};

// Step 3 — Your recurring bills
const BillsStepScreen: FC<{
  totalSteps: number;
  detection: DetectionState;
  partialMode: StepperPartialMode;
  onContinue: () => void;
  onBack: () => void;
  onBrowseTransactions?: () => void;
}> = ({
  totalSteps,
  detection,
  partialMode,
  onContinue,
  onBack,
  onBrowseTransactions,
}) => {
  const billsDetected = detection === "high";

  const subhead = billsDetected
    ? "These bills are on our radar. We'll track them each cycle."
    : detection === "building" || detection === "partial"
      ? "We're still detecting your recurring bills. This can take up to a full billing cycle."
      : "We didn't find any recurring charges yet. Bills paid in cash or from a different bank won't show up here.";

  return (
    <StepperShell
      step={3}
      totalSteps={totalSteps}
      onBack={onBack}
      primaryLabel="View my Cashflow"
      onPrimary={onContinue}
      secondaryLabel="Back"
      onSecondary={onBack}
      footerLink={
        !billsDetected && partialMode === "show" && onBrowseTransactions
          ? { label: "Browse transactions", onClick: onBrowseTransactions }
          : undefined
      }
    >
      <h1
        style={{
          fontSize: 28,
          lineHeight: "36px",
          fontWeight: 600,
          letterSpacing: -1,
          margin: 0,
        }}
      >
        Your recurring bills
      </h1>
      <p
        style={{
          marginTop: 8,
          fontSize: 14,
          lineHeight: "20px",
          color: T.textSecondary,
          letterSpacing: -0.2,
        }}
      >
        {subhead}
      </p>

      {billsDetected ? (
        <div style={{ marginTop: 20 }}>
          <Card>
            {RECURRING_BILLS.map((bill, i) => (
              <ExpandedRow
                key={bill.name}
                icon={
                  <MerchantAvatar
                    color={bill.color}
                    initial={bill.name[0]}
                    size={36}
                  />
                }
                title={bill.name}
                detail={bill.due}
                amount={`$${bill.amount}`}
                isLast={i === RECURRING_BILLS.length - 1}
              />
            ))}
          </Card>
        </div>
      ) : (
        partialMode === "show" && (
          <div style={{ marginTop: 20 }}>
            <Card pad={16}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: T.radiusFull,
                    background:
                      detection === "building" || detection === "partial"
                        ? T.bgWarning
                        : T.bgNeutral,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {detection === "building" || detection === "partial" ? (
                    <RotateCw
                      size={22}
                      color={T.warning}
                      strokeWidth={2}
                      style={{ animation: "v2-spin 2s linear infinite" }}
                    />
                  ) : (
                    <Receipt
                      size={22}
                      color={T.textTertiary}
                      strokeWidth={2}
                    />
                  )}
                </div>
                <ConfidenceChip
                  variant={
                    detection === "building" || detection === "partial"
                      ? "building"
                      : "limited"
                  }
                />
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: "18px",
                    color: T.textSecondary,
                    letterSpacing: -0.2,
                    margin: 0,
                  }}
                >
                  {detection === "building" || detection === "partial"
                    ? "Recurring charges can take up to a billing cycle to appear. We'll update as we find them."
                    : "Try browsing your recent transactions to tag a recurring charge manually."}
                </p>
              </div>
            </Card>
          </div>
        )
      )}
    </StepperShell>
  );
};

// Stepper flow controller — owns step routing and Skip-mode pruning
const StepperFlow: FC<{
  step: number;
  detection: DetectionState;
  partialMode: StepperPartialMode;
  onStepChange: (step: number) => void;
  onFinish: () => void;
  onBack: () => void;
  onBrowseTransactions: () => void;
}> = ({
  step,
  detection,
  partialMode,
  onStepChange,
  onFinish,
  onBack,
  onBrowseTransactions,
}) => {
  const incomeDetected = detection === "high" || detection === "partial";
  const billsDetected = detection === "high";

  // Build the ordered list of steps this user will see.
  // Step 1 (accounts) always shows. Steps 2 & 3 are pruned in skip mode
  // when the data for that step hasn't been detected.
  const visibleSteps: number[] = [1];
  if (partialMode === "show" || incomeDetected) visibleSteps.push(2);
  if (partialMode === "show" || billsDetected) visibleSteps.push(3);

  const totalSteps = visibleSteps.length;

  const goNext = () => {
    const currentIdx = visibleSteps.indexOf(step);
    if (currentIdx < visibleSteps.length - 1) {
      onStepChange(visibleSteps[currentIdx + 1]);
    } else {
      onFinish();
    }
  };

  const goPrev = () => {
    const currentIdx = visibleSteps.indexOf(step);
    if (currentIdx > 0) {
      onStepChange(visibleSteps[currentIdx - 1]);
    } else {
      onBack();
    }
  };

  if (step === 1) {
    return (
      <AccountsStepScreen
        totalSteps={totalSteps}
        onContinue={goNext}
        onBack={onBack}
      />
    );
  }

  if (step === 2) {
    return (
      <IncomeStepScreen
        totalSteps={totalSteps}
        detection={detection}
        partialMode={partialMode}
        onContinue={goNext}
        onBack={goPrev}
      />
    );
  }

  return (
    <BillsStepScreen
      totalSteps={totalSteps}
      detection={detection}
      partialMode={partialMode}
      onContinue={onFinish}
      onBack={goPrev}
      onBrowseTransactions={onBrowseTransactions}
    />
  );
};

// =====================================================================
// Screen A3 — Confirm Bills
// =====================================================================
const ConfirmBillsScreen: FC<{
  state: BillsState;
  onConfirm: () => void;
  onBack: () => void;
  onBrowseTransactions: () => void;
}> = ({ state, onConfirm, onBack, onBrowseTransactions }) => (
  <PhoneFrame>
    <StatusBar />
    <NavBar title="Cash Flow" onBack={onBack} />

    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: "8px 16px 0" }}>
        <h1
          style={{
            fontSize: 26,
            lineHeight: "32px",
            fontWeight: 600,
            letterSpacing: -1,
            margin: 0,
          }}
        >
          Your upcoming bills
        </h1>
        <p
          style={{
            marginTop: 12,
            fontSize: 14,
            lineHeight: "20px",
            color: T.textSecondary,
            letterSpacing: -0.2,
          }}
        >
          Your recurring bills shape how much you actually have to work with
          each month.
        </p>

        {state === "default" ? (
          <>
            <SectionHeader>We found these</SectionHeader>
            <Card>
              {RECURRING_BILLS.map((bill, i) => (
                <div
                  key={bill.name}
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    borderBottom:
                      i === RECURRING_BILLS.length - 1
                        ? "0"
                        : `1px solid ${T.border}`,
                  }}
                >
                  <MerchantAvatar color={bill.color} initial={bill.name[0]} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        letterSpacing: -0.3,
                      }}
                    >
                      {bill.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: T.textSecondary,
                        letterSpacing: -0.2,
                        marginTop: 2,
                      }}
                    >
                      {bill.due}
                    </div>
                  </div>
                  <div
                    style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}
                  >
                    ${bill.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </Card>

            <Card style={{ marginTop: 16, padding: 16 }}>
              <div
                style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}
              >
                Anything we missed?
              </div>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: "18px",
                  color: T.textSecondary,
                  letterSpacing: -0.2,
                  marginTop: 4,
                }}
              >
                Browse your recent transactions and tap + to add any recurring
                bills we missed.
              </div>
              <button
                onClick={onBrowseTransactions}
                style={{
                  marginTop: 12,
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  color: T.accent,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: -0.2,
                  fontFamily: FONT_FAMILY,
                  cursor: "pointer",
                }}
              >
                Browse transactions
              </button>
            </Card>
          </>
        ) : (
          <>
            <div style={{ marginTop: 16 }}>
              <ConfidenceChip variant="building" />
            </div>
            <Card style={{ marginTop: 12, padding: 24, textAlign: "center" }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: -0.3,
                  marginBottom: 8,
                }}
              >
                We're still tracking your transactions
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: "20px",
                  color: T.textSecondary,
                  letterSpacing: -0.2,
                }}
              >
                This usually takes up to a day after linking your account.
              </div>
            </Card>
          </>
        )}
      </div>
    </div>

    <div
      style={{
        padding: "12px 16px 16px",
        borderTop: `1px solid ${T.border}`,
        background: T.bgPrimary,
      }}
    >
      <PrimaryButton label="Confirm your bills" onClick={onConfirm} />
    </div>

    <HomeIndicator />
  </PhoneFrame>
);

// =====================================================================
// Screen A3.1 — Transaction Picker
// =====================================================================
const TransactionPickerScreen: FC<{
  state: PickerState;
  onBack: () => void;
}> = ({ state, onBack }) => (
  <PhoneFrame>
    <StatusBar />
    <NavBar title="Add a bill" onBack={onBack} />

    <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
      <div style={{ padding: "8px 16px 0" }}>
        <h1
          style={{
            fontSize: 26,
            lineHeight: "32px",
            fontWeight: 600,
            letterSpacing: -1,
            margin: 0,
          }}
        >
          Tap any recurring charge
        </h1>
        <p
          style={{
            marginTop: 12,
            fontSize: 14,
            lineHeight: "20px",
            color: T.textSecondary,
            letterSpacing: -0.2,
          }}
        >
          We pulled your last 30 days of transactions. Add anything that hits
          regularly.
        </p>

        {state === "building" ? (
          <>
            <div style={{ marginTop: 20 }}>
              <ConfidenceChip variant="building" />
            </div>
            <Card style={{ marginTop: 12, padding: 24, textAlign: "center" }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: -0.3,
                  marginBottom: 8,
                }}
              >
                We're still pulling in your transactions
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: "20px",
                  color: T.textSecondary,
                  letterSpacing: -0.2,
                }}
              >
                This usually takes up to a day after linking your account.
              </div>
            </Card>
          </>
        ) : (
          <div style={{ marginTop: 20, paddingBottom: 80 }}>
            {RECENT_TRANSACTIONS.map((group, gi) => (
              <div key={group.group} style={{ marginBottom: gi === RECENT_TRANSACTIONS.length - 1 ? 0 : 16 }}>
                <SectionHeader mt={gi === 0 ? 0 : 16}>{group.group}</SectionHeader>
                <Card>
                  {group.items.map((tx, i) => (
                    <div
                      key={tx.name + tx.date}
                      style={{
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        borderBottom:
                          i === group.items.length - 1
                            ? "0"
                            : `1px solid ${T.border}`,
                      }}
                    >
                      <MerchantAvatar color={tx.color} initial={tx.name[0]} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            letterSpacing: -0.3,
                          }}
                        >
                          {tx.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: T.textSecondary,
                            letterSpacing: -0.2,
                            marginTop: 2,
                          }}
                        >
                          {tx.date} · ${tx.amount.toFixed(2)}
                        </div>
                      </div>
                      <button
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: T.radiusFull,
                          border: `1.5px solid ${T.textPrimary}`,
                          background: "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          padding: 0,
                          flexShrink: 0,
                        }}
                        aria-label={`Add ${tx.name}`}
                      >
                        <Plus size={18} color={T.textPrimary} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {state === "toast" && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            right: 16,
            background: T.textPrimary,
            color: T.textInverse,
            borderRadius: T.radiusMd,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            fontFamily: FONT_FAMILY,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>
            Added to your bills
          </span>
          <button
            style={{
              background: "transparent",
              border: 0,
              color: T.tealPrimary,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: -0.2,
              cursor: "pointer",
              fontFamily: FONT_FAMILY,
              padding: 0,
            }}
          >
            Undo
          </button>
        </div>
      )}
    </div>

    {state !== "building" && (
      <div
        style={{
          padding: "12px 16px",
          borderTop: `1px solid ${T.border}`,
          background: T.bgPrimary,
        }}
      >
        <div
          style={{
            fontSize: 12,
            lineHeight: "16px",
            color: T.textTertiary,
            textAlign: "center",
            letterSpacing: -0.2,
          }}
        >
          Don't see it? Recurring bills can take up to a day to appear after
          linking your account.
        </div>
      </div>
    )}

    <HomeIndicator />
  </PhoneFrame>
);

// =====================================================================
// Dashboard (Build 2 — state-adaptive hero + section placeholders)
// =====================================================================
type DashboardHeroState = "positive" | "negative" | "building" | "low";

// Build 2.1 — event-based chart model
// "Today" is always at the left edge. Chart projects forward to the next
// paycheck (or the end of the visible window). Each event is a discrete
// transaction (bill or paycheck) with a signed amount; the curve traces the
// running balance through those events.
type CashflowEvent = {
  day: number;          // days from today (1..N). today itself = 0 (no event)
  date: string;         // "Apr 22" — short label
  type: "bill" | "paycheck";
  amount: number;       // signed: bills negative, paycheck positive
  detail?: string;      // merchant or source — informational only, not rendered
};

type ChartConfig = {
  startBalance: number;     // balance at today (day 0)
  totalDays: number;        // x-axis length, today (0) to last labeled day
  todayLabel: string;       // "Today"
  endLabel: string;         // "Apr 28"
  midLabel?: { day: number; label: string }; // optional middle x-axis tick
  events: CashflowEvent[];
};

type ChartMode = "filled" | "skeleton";

const POSITIVE_CHART: ChartConfig = {
  startBalance: 1780,
  totalDays: 8,
  todayLabel: "Today",
  endLabel: "Apr 28",
  midLabel: { day: 5, label: "Apr 26" },
  events: [
    { day: 1, date: "Apr 22", type: "bill", amount: -24, detail: "National Grid" },
    { day: 3, date: "Apr 24", type: "bill", amount: -40, detail: "T-Mobile" },
    { day: 5, date: "Apr 26", type: "paycheck", amount: 1200, detail: "Uber" },
    { day: 7, date: "Apr 28", type: "bill", amount: -300, detail: "Rent" },
  ],
};

const NEGATIVE_CHART: ChartConfig = {
  startBalance: 200,
  totalDays: 8,
  todayLabel: "Today",
  endLabel: "Apr 28",
  midLabel: { day: 5, label: "Apr 26" },
  events: [
    { day: 1, date: "Apr 22", type: "bill", amount: -40, detail: "T-Mobile" },
    { day: 3, date: "Apr 24", type: "bill", amount: -24, detail: "National Grid" },
    { day: 5, date: "Apr 26", type: "bill", amount: -300, detail: "Rent" },
    { day: 7, date: "Apr 28", type: "paycheck", amount: 1200, detail: "Uber" },
  ],
};

const BUILDING_CHART: ChartConfig = {
  startBalance: 430,
  totalDays: 8,
  todayLabel: "Today",
  endLabel: "Apr 28",
  events: [],
};

const LOW_CHART: ChartConfig = {
  startBalance: 500,
  totalDays: 8,
  todayLabel: "Today",
  endLabel: "Apr 28",
  events: [],
};

// Event-based forward chart. Renders a smooth balance curve from today (left)
// through each event to the end of the cycle (right). Each event gets a
// signed amount label above the curve and a categorical pill on the curve
// (`Payday` filled teal, `Bills` neutral).
const BalanceChart: FC<{
  width: number;
  height: number;
  config: ChartConfig;
  mode: ChartMode;
  /** unique gradient id so multiple charts on one screen don't collide */
  gradientId: string;
}> = ({ width, height, config, mode, gradientId }) => {
  const padX = 16;
  const padTop = 36; // room for amount labels above curve
  const padBottom = 28; // room for x-axis labels
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const isSkeleton = mode === "skeleton";
  const lineColor = T.tealPrimary;

  // Build the running-balance points: today + each event in chronological
  // order. For empty event lists we synthesize a flat tail at startBalance so
  // the curve still spans the chart.
  type Pt = { day: number; bal: number; event?: CashflowEvent };
  const points: Pt[] = [{ day: 0, bal: config.startBalance }];
  let running = config.startBalance;
  for (const ev of config.events) {
    running += ev.amount;
    points.push({ day: ev.day, bal: running, event: ev });
  }
  // Ensure curve reaches the right edge
  if (points[points.length - 1].day < config.totalDays) {
    points.push({ day: config.totalDays, bal: running });
  }

  const minBal = Math.min(...points.map((p) => p.bal), 0);
  const maxBal = Math.max(...points.map((p) => p.bal), config.startBalance);
  const range = maxBal - minBal || 1;
  // Add a little headroom so peaks don't hug the top of the chart
  const yPadFraction = 0.18;
  const paddedRange = range * (1 + yPadFraction * 2);
  const paddedMin = minBal - range * yPadFraction;

  const x = (day: number) => padX + (day / config.totalDays) * innerW;
  const y = (bal: number) =>
    padTop + (1 - (bal - paddedMin) / paddedRange) * innerH;
  const zeroY = y(0);

  // Smooth cubic bezier between consecutive points
  const buildPath = (close: boolean) => {
    if (points.length < 2) return "";
    let p = `M ${x(points[0].day)} ${y(points[0].bal)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const x0 = x(points[i].day);
      const x1 = x(points[i + 1].day);
      const y0 = y(points[i].bal);
      const y1 = y(points[i + 1].bal);
      const cx = (x0 + x1) / 2;
      p += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    if (close) {
      p += ` L ${x(points[points.length - 1].day)} ${padTop + innerH}`;
      p += ` L ${x(points[0].day)} ${padTop + innerH} Z`;
    }
    return p;
  };

  const todayX = x(0);
  const todayY = y(config.startBalance);

  // Format helpers
  const fmt = (n: number) =>
    `${n < 0 ? "-" : "+"}$${Math.abs(n).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={lineColor}
            stopOpacity={isSkeleton ? 0 : 0.28}
          />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Zero baseline — only visible when balance crosses zero */}
      {minBal < 0 && (
        <line
          x1={padX}
          x2={padX + innerW}
          y1={zeroY}
          y2={zeroY}
          stroke="rgba(255,255,255,0.24)"
          strokeWidth={1}
          strokeDasharray="2 4"
        />
      )}

      {/* Filled area (skipped in skeleton) */}
      {!isSkeleton && (
        <path d={buildPath(true)} fill={`url(#${gradientId})`} />
      )}

      {/* Curve */}
      <path
        d={buildPath(false)}
        fill="none"
        stroke={lineColor}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={isSkeleton || config.events.length === 0 ? "5 5" : undefined}
        opacity={isSkeleton ? 0.28 : config.events.length === 0 ? 0.4 : 1}
      />

      {/* Today dot at the left edge */}
      {!isSkeleton && (
        <circle
          cx={todayX}
          cy={todayY}
          r={6}
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth={2}
        />
      )}

      {/* Event markers + pills + amount labels */}
      {!isSkeleton &&
        points.map((p) => {
          if (!p.event) return null;
          const ev = p.event;
          const cx = x(p.day);
          const cy = y(p.bal);
          const isPayday = ev.type === "paycheck";

          return (
            <g key={`ev-${p.day}`}>
              {/* Amount label above pill */}
              <text
                x={cx}
                y={cy - 18}
                fontSize={11}
                fontFamily={FONT_FAMILY}
                fill={
                  isPayday
                    ? T.tealPrimary
                    : "rgba(255,255,255,0.72)"
                }
                fontWeight={600}
                letterSpacing={-0.3}
                textAnchor="middle"
              >
                {fmt(ev.amount)}
              </text>

              {/* Pill background */}
              <rect
                x={cx - 27}
                y={cy - 11}
                width={54}
                height={22}
                rx={11}
                fill={isPayday ? T.tealPrimary : "rgba(255,255,255,0.16)"}
              />
              {/* Pill label */}
              <text
                x={cx}
                y={cy + 4}
                fontSize={10}
                fontFamily={FONT_FAMILY}
                fill={isPayday ? "#000000" : "rgba(255,255,255,0.88)"}
                fontWeight={600}
                letterSpacing={-0.2}
                textAnchor="middle"
              >
                {isPayday ? "Payday" : "Bills"}
              </text>
            </g>
          );
        })}

      {/* Empty-state inline pill for Building / Low (no events) */}
      {!isSkeleton && config.events.length === 0 && (
        <g>
          <rect
            x={padX + innerW / 2 - 70}
            y={padTop + innerH / 2 - 12}
            width={140}
            height={24}
            rx={12}
            fill="rgba(255,255,255,0.12)"
          />
          <text
            x={padX + innerW / 2}
            y={padTop + innerH / 2 + 4}
            fontSize={11}
            fontFamily={FONT_FAMILY}
            fill="rgba(255,255,255,0.88)"
            fontWeight={600}
            letterSpacing={-0.2}
            textAnchor="middle"
          >
            Forecast lands in 24h
          </text>
        </g>
      )}

      {/* X-axis labels */}
      <text
        x={padX}
        y={height - 8}
        fontSize={10}
        fontFamily={FONT_FAMILY}
        fill={isSkeleton ? "rgba(255,255,255,0.48)" : "#FFFFFF"}
        letterSpacing={-0.2}
        fontWeight={600}
      >
        {config.todayLabel}
      </text>
      {config.midLabel && (
        <text
          x={x(config.midLabel.day)}
          y={height - 8}
          fontSize={10}
          fontFamily={FONT_FAMILY}
          fill="rgba(255,255,255,0.48)"
          letterSpacing={-0.2}
          textAnchor="middle"
        >
          {config.midLabel.label}
        </text>
      )}
      <text
        x={padX + innerW}
        y={height - 8}
        fontSize={10}
        fontFamily={FONT_FAMILY}
        fill="rgba(255,255,255,0.48)"
        letterSpacing={-0.2}
        textAnchor="end"
      >
        {config.endLabel}
      </text>
    </svg>
  );
};

const MetricTile: FC<{ label: string; value: string; sublabel?: string }> = ({
  label,
  value,
  sublabel,
}) => (
  <div
    style={{
      flex: 1,
      background: "rgba(255,255,255,0.06)",
      borderRadius: T.radiusSm,
      padding: "12px 12px 14px",
      minWidth: 0,
    }}
  >
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "rgba(255,255,255,0.56)",
        letterSpacing: -0.2,
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
    <div
      style={{
        marginTop: 6,
        fontSize: 18,
        fontWeight: 600,
        color: "#FFFFFF",
        letterSpacing: -0.6,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {value}
    </div>
    {sublabel && (
      <div
        style={{
          marginTop: 2,
          fontSize: 11,
          color: "rgba(255,255,255,0.56)",
          letterSpacing: -0.1,
        }}
      >
        {sublabel}
      </div>
    )}
  </div>
);

// =====================================================================
// Unified DashboardHero
// Same UI shell across all states: header, big number, sub-line, chart,
// 3 metric tiles. Only the data and accent colors change with state.
// =====================================================================
type HeroData = {
  /** Top-left label. Defaults to "Safe to spend". */
  headerLabel?: string;
  /** Top-right meta. Defaults to "through Apr 28". Pass "" to hide. */
  headerRight?: string;
  bigNumber: string;
  bigNumberColor: string;
  subLine: string;
  subLineColor: string;
  chart: ChartConfig;
  chartMode: ChartMode;
  tiles: Array<{ label: string; value: string; sublabel?: string }>;
};

const HERO_DATA: Record<DashboardHeroState, HeroData> = {
  positive: {
    bigNumber: "$1,606.80",
    bigNumberColor: "#FFFFFF",
    subLine: "+$120 vs last cycle at this point",
    subLineColor: T.tealPrimary,
    chart: POSITIVE_CHART,
    chartMode: "filled",
    tiles: [
      { label: "Income", value: "$1,780", sublabel: "this cycle" },
      { label: "Bills left", value: "$340", sublabel: "3 due" },
      { label: "To payday", value: "11d", sublabel: "Apr 28" },
    ],
  },
  negative: {
    // Per D10: lead with the shortfall framing, not the literal STS. STS
    // stays in the sub-line as a smaller secondary number for transparency.
    headerLabel: "Until payday",
    headerRight: "Apr 28",
    bigNumber: "$45 short",
    bigNumberColor: "#FF7083",
    subLine: "Paycheck arrives Apr 28 · -$45.00 Safe to Spend",
    subLineColor: "rgba(255,112,131,0.85)",
    chart: NEGATIVE_CHART,
    chartMode: "filled",
    tiles: [
      { label: "Income", value: "$1,200", sublabel: "incoming Apr 28" },
      { label: "Bills left", value: "$340", sublabel: "3 due" },
      { label: "To payday", value: "8d", sublabel: "Apr 28" },
    ],
  },
  building: {
    bigNumber: "Building",
    bigNumberColor: "rgba(255,255,255,0.88)",
    subLine: "Live forecast within 24 hours of linking",
    subLineColor: T.yellow500,
    chart: BUILDING_CHART,
    chartMode: "filled",
    tiles: [
      { label: "Income", value: "Detecting" },
      { label: "Bills left", value: "Detecting" },
      { label: "To payday", value: "—" },
    ],
  },
  low: {
    headerLabel: "In your accounts",
    headerRight: "across linked accounts",
    bigNumber: "$500.00",
    bigNumberColor: "#FFFFFF",
    subLine: "Add a bill or paycheck below to forecast safe to spend",
    subLineColor: T.yellow500,
    chart: LOW_CHART,
    chartMode: "skeleton",
    tiles: [
      { label: "Safe to spend", value: "—", sublabel: "needs detection" },
      { label: "Bills left", value: "—" },
      { label: "To payday", value: "—" },
    ],
  },
};

const DashboardHero: FC<{ state: DashboardHeroState }> = ({ state }) => {
  const d = HERO_DATA[state];

  // Big-number sizing: 44px for currency, 32px for word states ("Building", "—")
  // so the dash doesn't feel like a placeholder hole.
  const isCurrency = d.bigNumber.startsWith("$") || d.bigNumber.startsWith("-$");
  const numberFontSize = isCurrency ? 44 : 32;
  const numberLineHeight = isCurrency ? "52px" : "40px";
  const numberLetterSpacing = isCurrency ? -1.6 : -1;

  return (
    <div
      style={{
        background: "#000000",
        borderRadius: T.radiusLg,
        padding: "20px 20px 16px",
        color: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(255,255,255,0.72)",
            letterSpacing: -0.2,
          }}
        >
          {d.headerLabel ?? "Safe to spend"}
        </span>
        {(d.headerRight ?? "through Apr 28") && (
          <span
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.56)",
              letterSpacing: -0.2,
            }}
          >
            {d.headerRight ?? "through Apr 28"}
          </span>
        )}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: numberFontSize,
          lineHeight: numberLineHeight,
          fontWeight: 600,
          letterSpacing: numberLetterSpacing,
          color: d.bigNumberColor,
        }}
      >
        {d.bigNumber}
      </div>
      <div
        style={{
          marginTop: 2,
          fontSize: 13,
          color: d.subLineColor,
          letterSpacing: -0.2,
          fontWeight: 600,
        }}
      >
        {d.subLine}
      </div>

      <div style={{ marginTop: 12, marginLeft: -8, marginRight: -8 }}>
        <BalanceChart
          width={326}
          height={180}
          config={d.chart}
          mode={d.chartMode}
          gradientId={`stsFill-${state}`}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {d.tiles.map((t) => (
          <MetricTile
            key={t.label}
            label={t.label}
            value={t.value}
            sublabel={t.sublabel}
          />
        ))}
      </div>
    </div>
  );
};

// Pinned card shown below the hero only in the Low Confidence state. Keeps the
// "Add a bill" CTA accessible without breaking the unified hero shell.
const LowConfidenceCallout: FC<{ onAddDetails: () => void }> = ({
  onAddDetails,
}) => (
  <div
    style={{
      marginTop: 12,
      background: T.bgCard,
      borderRadius: 12,
      padding: 16,
      border: "1px solid rgba(0,0,0,0.15)",
    }}
  >
    <div
      style={{
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: -0.3,
      }}
    >
      Help us forecast
    </div>
    <div
      style={{
        marginTop: 4,
        fontSize: 13,
        color: T.textSecondary,
        letterSpacing: -0.2,
        lineHeight: "18px",
      }}
    >
      Add at least one bill or paycheck and we'll show your safe-to-spend
      through Apr 28.
    </div>
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <button
        onClick={onAddDetails}
        style={{
          flex: 1,
          height: 40,
          borderRadius: T.radiusFull,
          border: 0,
          background: T.tealPrimary,
          color: T.textPrimary,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: -0.3,
          fontFamily: FONT_FAMILY,
          cursor: "pointer",
        }}
      >
        Add a bill
      </button>
      <button
        onClick={onAddDetails}
        style={{
          flex: 1,
          height: 40,
          borderRadius: T.radiusFull,
          border: `1px solid ${T.border}`,
          background: "transparent",
          color: T.textPrimary,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: -0.3,
          fontFamily: FONT_FAMILY,
          cursor: "pointer",
        }}
      >
        Review what we have
      </button>
    </div>
  </div>
);

// =====================================================================
// Build 3.1 — Section helpers + Bills + Smart Actions
// =====================================================================

// Merchant color map. Real logos out of scope; brand-tinted avatars instead.
const MERCHANT_COLORS: Record<string, string> = {
  "National Grid": T.contextualCoral,
  "T-Mobile": "#E20074",
  "Spotify": "#1DB954",
  "Spotify Premium": "#1DB954",
  Rent: "#3B82F6",
  Netflix: "#E50914",
  Starbucks: "#006241",
  "Whole Foods": "#00674B",
  Uber: "#000000",
  Mcdonalds: "#FFC72C",
};

const merchantColor = (name: string): string =>
  MERCHANT_COLORS[name] || T.contextualLightBlue;

// Convert "days from today" into a human-readable due-date label.
const formatDueDay = (day: number): string => {
  if (day === 0) return "Today";
  if (day === 1) return "Tomorrow";
  // For day 2+, render the date label embedded on the event.
  return "";
};

// Section card primitive — title + meta + optional trailing + body slot.
// `onHeaderClick` makes the header a button (used by the Recap accordion).
const SectionCard: FC<{
  title: string;
  meta?: string;
  icon: ReactNode;
  accent?: boolean; // Teal-100 surface treatment when actively recommending
  trailing?: ReactNode;
  onHeaderClick?: () => void;
  children?: ReactNode;
}> = ({ title, meta, icon, accent, trailing, onHeaderClick, children }) => {
  const HeaderTag = onHeaderClick ? "button" : "div";
  return (
    <div
      style={{
        background: accent ? T.bgAccent : T.bgCard,
        borderRadius: 12,
        border: `1px solid ${accent ? T.borderAccent : "rgba(0,0,0,0.15)"}`,
        overflow: "hidden",
      }}
    >
      <HeaderTag
        onClick={onHeaderClick}
        style={{
          width: "100%",
          padding: "14px 16px 12px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "transparent",
          border: 0,
          cursor: onHeaderClick ? "pointer" : "default",
          fontFamily: FONT_FAMILY,
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: T.radiusFull,
            background: accent ? "#FFFFFF" : T.bgPrimary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: T.textPrimary,
              letterSpacing: -0.3,
            }}
          >
            {title}
          </div>
          {meta && (
            <div
              style={{
                marginTop: 2,
                fontSize: 12,
                color: T.textTertiary,
                letterSpacing: -0.2,
                lineHeight: "16px",
              }}
            >
              {meta}
            </div>
          )}
        </div>
        {trailing && <div style={{ flexShrink: 0 }}>{trailing}</div>}
      </HeaderTag>
      {children}
    </div>
  );
};

// Bills section — consumes the chart's event list so what shows on the chart
// equals what shows in the section. Single source of truth.
const BillsSection: FC<{ state: DashboardHeroState }> = ({ state }) => {
  // Pull bill events out of the active chart config
  const config =
    state === "positive"
      ? POSITIVE_CHART
      : state === "negative"
      ? NEGATIVE_CHART
      : null;

  if (!config) {
    // Building / Low — empty state
    return (
      <SectionCard
        title="Upcoming bills"
        meta={
          state === "building"
            ? "We'll list bills here within 24 hours of linking."
            : "Add a bill to start tracking."
        }
        icon={<Receipt size={16} color={T.textSecondary} strokeWidth={2} />}
      />
    );
  }

  const bills = config.events.filter((e) => e.type === "bill");
  const total = bills.reduce((sum, b) => sum + Math.abs(b.amount), 0);

  return (
    <SectionCard
      title="Upcoming bills"
      meta={`Next 7 days · ${bills.length} bills · $${total.toLocaleString()}`}
      icon={<Receipt size={16} color={T.textSecondary} strokeWidth={2} />}
    >
      {bills.map((b) => {
        const merchant = b.detail || "Bill";
        const dueLabel = formatDueDay(b.day) || b.date;
        return (
          <button
            key={`${b.day}-${merchant}`}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderTop: `1px solid ${T.border}`,
              borderBottom: 0,
              borderLeft: 0,
              borderRight: 0,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              fontFamily: FONT_FAMILY,
              textAlign: "left",
            }}
          >
            <MerchantAvatar
              color={merchantColor(merchant)}
              initial={merchant[0]}
              size={32}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.textPrimary,
                  letterSpacing: -0.3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {merchant}
              </div>
              <div
                style={{
                  marginTop: 1,
                  fontSize: 12,
                  color: T.textTertiary,
                  letterSpacing: -0.2,
                }}
              >
                {dueLabel}
              </div>
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: T.textPrimary,
                letterSpacing: -0.3,
              }}
            >
              -${Math.abs(b.amount).toLocaleString()}
            </div>
            <ChevronRight
              size={18}
              color={T.textTertiary}
              strokeWidth={2}
            />
          </button>
        );
      })}
    </SectionCard>
  );
};

// Smart Actions section — content varies by state; position is fixed.
// Negative state gets a carousel of Cover-pillar options (move from savings
// + Instacash advance, both Phase 1 triggers per D11). Positive / Building /
// Low get state-specific empty states.

type SmartActionMath = { label: string; value: string; highlight?: boolean };

type SmartActionConfig = {
  source: "Savings transfer" | "Instacash";
  title: string;
  body: string;
  math: SmartActionMath[];
  primaryLabel: string;
  secondaryLabel: string;
};

const NEGATIVE_SMART_ACTIONS: SmartActionConfig[] = [
  {
    source: "Instacash",
    title: "Get a $50 Instacash advance",
    body: "Bridges your $45 gap before payday. Auto-repays from your next paycheck Apr 28. No interest, no credit check.",
    math: [
      { label: "Cash advance", value: "$50.00" },
      { label: "Closes shortfall of", value: "$45.00" },
      { label: "Auto-repays", value: "Apr 28", highlight: true },
    ],
    primaryLabel: "Get $50",
    secondaryLabel: "Skip",
  },
  {
    source: "Savings transfer",
    title: "Move $50 from Chase Savings to cover Friday",
    body: "Closes your $45 gap before payday Apr 28. No fees. Repays itself when your paycheck lands.",
    math: [
      { label: "Transfer in", value: "$50.00" },
      { label: "Closes shortfall of", value: "$45.00" },
      { label: "Buffer remaining", value: "$5.00", highlight: true },
    ],
    primaryLabel: "Review move",
    secondaryLabel: "Skip",
  },
];

const SmartActionInnerCard: FC<{ config: SmartActionConfig }> = ({
  config,
}) => (
  <div
    style={{
      flexShrink: 0,
      width: "100%",
      scrollSnapAlign: "start",
      background: "#FFFFFF",
      borderRadius: T.radiusSm,
      padding: 14,
      border: `1px solid ${T.borderAccent}`,
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 6,
        marginBottom: 6,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          padding: "3px 8px",
          borderRadius: T.radiusFull,
          background: T.bgAccent,
          color: T.accent,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 0.3,
          textTransform: "uppercase",
        }}
      >
        Recommended
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: T.textTertiary,
          letterSpacing: -0.2,
        }}
      >
        {config.source}
      </span>
    </div>
    <div
      style={{
        fontSize: 16,
        fontWeight: 600,
        color: T.textPrimary,
        letterSpacing: -0.4,
        lineHeight: "22px",
      }}
    >
      {config.title}
    </div>
    <div
      style={{
        marginTop: 4,
        fontSize: 13,
        color: T.textSecondary,
        letterSpacing: -0.2,
        lineHeight: "18px",
      }}
    >
      {config.body}
    </div>

    <div
      style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: `1px solid ${T.border}`,
      }}
    >
      {config.math.map((row, i) => (
        <div
          key={row.label}
          style={{
            marginTop: i === 0 ? 0 : 4,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            letterSpacing: -0.2,
          }}
        >
          <span style={{ color: T.textTertiary }}>{row.label}</span>
          <span
            style={{
              fontWeight: 600,
              color: row.highlight ? T.accent : T.textPrimary,
            }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>

    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
      <button
        style={{
          flex: 1,
          height: 40,
          borderRadius: T.radiusFull,
          border: 0,
          background: T.accent,
          color: "#FFFFFF",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: -0.3,
          fontFamily: FONT_FAMILY,
          cursor: "pointer",
        }}
      >
        {config.primaryLabel}
      </button>
      <button
        style={{
          flex: 1,
          height: 40,
          borderRadius: T.radiusFull,
          border: `1px solid ${T.borderAccent}`,
          background: "transparent",
          color: T.accent,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: -0.3,
          fontFamily: FONT_FAMILY,
          cursor: "pointer",
        }}
      >
        {config.secondaryLabel}
      </button>
    </div>
  </div>
);

const SmartActionsCard: FC<{ state: DashboardHeroState }> = ({ state }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  if (state === "negative") {
    const onScroll = () => {
      const el = scrollRef.current;
      if (!el) return;
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      if (idx !== activeIdx) setActiveIdx(idx);
    };

    return (
      <SectionCard
        title="Smart Actions"
        meta={`${NEGATIVE_SMART_ACTIONS.length} ways to close your shortfall`}
        icon={<Sprout size={16} color={T.accent} strokeWidth={2.5} />}
        accent
      >
        <div style={{ padding: "0 16px 14px" }}>
          <div
            ref={scrollRef}
            onScroll={onScroll}
            style={{
              display: "flex",
              gap: 12,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {NEGATIVE_SMART_ACTIONS.map((cfg) => (
              <SmartActionInnerCard key={cfg.source} config={cfg} />
            ))}
          </div>

          {/* Pagination dots */}
          <div
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {NEGATIVE_SMART_ACTIONS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  const el = scrollRef.current;
                  if (el) {
                    el.scrollTo({
                      left: i * el.clientWidth,
                      behavior: "smooth",
                    });
                  }
                }}
                aria-label={`Smart Action ${i + 1}`}
                style={{
                  width: i === activeIdx ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  border: 0,
                  padding: 0,
                  background:
                    i === activeIdx
                      ? T.accent
                      : "rgba(0,102,87,0.24)",
                  cursor: "pointer",
                  transition: "width 150ms ease",
                }}
              />
            ))}
          </div>
        </div>
      </SectionCard>
    );
  }

  // Empty states — content shifts per state, layout consistent
  const empty: Record<
    Exclude<DashboardHeroState, "negative">,
    { meta: string; body: string; icon: ReactNode }
  > = {
    positive: {
      meta: "All clear · no actions needed",
      body: "We'll surface smart moves when your situation changes.",
      icon: <Check size={16} color={T.accent} strokeWidth={2.5} />,
    },
    building: {
      meta: "Live within 24 hours",
      body: "We'll surface personalized actions once your bills and income land.",
      icon: <Sprout size={16} color={T.textSecondary} strokeWidth={2} />,
    },
    low: {
      meta: "Add details to unlock",
      body: "Add at least one bill or paycheck above to see personalized recommendations.",
      icon: <Sprout size={16} color={T.textSecondary} strokeWidth={2} />,
    },
  };
  const e = empty[state];

  return (
    <SectionCard
      title="Smart Actions"
      meta={e.meta}
      icon={e.icon}
    >
      <div
        style={{
          padding: "0 16px 16px",
          marginLeft: 60, // align with title (icon 32 + gap 12 + card pad 16)
          fontSize: 13,
          color: T.textSecondary,
          letterSpacing: -0.2,
          lineHeight: "18px",
        }}
      >
        {e.body}
      </div>
    </SectionCard>
  );
};

// =====================================================================
// Build 3.2 — Income / Recap / Spending sections
// =====================================================================

type IncomeData = {
  source: string;
  amount: number;
  daysAway: number;
  date: string;
};

const INCOME_DATA: Partial<Record<DashboardHeroState, IncomeData>> = {
  positive: { source: "Uber", amount: 1200, daysAway: 4, date: "Apr 26" },
  negative: { source: "Uber", amount: 1200, daysAway: 6, date: "Apr 28" },
};

const IncomeSection: FC<{ state: DashboardHeroState }> = ({ state }) => {
  const data = INCOME_DATA[state];

  if (!data) {
    return (
      <SectionCard
        title="Income"
        meta={
          state === "building"
            ? "Detecting income patterns"
            : "Add a paycheck to forecast income"
        }
        icon={<Briefcase size={16} color={T.textSecondary} strokeWidth={2} />}
      />
    );
  }

  const dueLabel =
    data.daysAway <= 1
      ? data.daysAway === 0
        ? "Today"
        : "Tomorrow"
      : `${data.date} · in ${data.daysAway} days`;

  return (
    <SectionCard
      title="Income"
      meta={`Next paycheck in ${data.daysAway} days`}
      icon={<Briefcase size={16} color={T.textSecondary} strokeWidth={2} />}
    >
      <button
        style={{
          width: "100%",
          padding: "12px 16px",
          borderTop: `1px solid ${T.border}`,
          borderBottom: 0,
          borderLeft: 0,
          borderRight: 0,
          background: "transparent",
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          fontFamily: FONT_FAMILY,
          textAlign: "left",
        }}
      >
        <MerchantAvatar
          color={merchantColor(data.source)}
          initial={data.source[0]}
          size={32}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: T.textPrimary,
              letterSpacing: -0.3,
            }}
          >
            {data.source}
          </div>
          <div
            style={{
              marginTop: 1,
              fontSize: 12,
              color: T.textTertiary,
              letterSpacing: -0.2,
            }}
          >
            {dueLabel}
          </div>
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: T.accent,
            letterSpacing: -0.3,
          }}
        >
          +${data.amount.toLocaleString()}
        </div>
        <ChevronRight size={18} color={T.textTertiary} strokeWidth={2} />
      </button>
    </SectionCard>
  );
};

// ---------------------------------------------------------------------
// Recap

type RecapData = {
  spent: number;
  budget: number;
  billsOnTime: { paid: number; total: number };
  vsLastCycle: { delta: number; better: boolean };
  startDate: string;
  daysIn: number;
};

const RECAP_DATA: Partial<Record<DashboardHeroState, RecapData>> = {
  positive: {
    spent: 735,
    budget: 1200,
    billsOnTime: { paid: 4, total: 4 },
    vsLastCycle: { delta: 120, better: true },
    startDate: "Apr 14",
    daysIn: 7,
  },
  negative: {
    spent: 845,
    budget: 1200,
    billsOnTime: { paid: 3, total: 4 },
    vsLastCycle: { delta: 90, better: false },
    startDate: "Apr 14",
    daysIn: 7,
  },
};

const RecapStatRow: FC<{
  label: string;
  value: string;
  valueColor?: string;
  helper?: string;
}> = ({ label, value, valueColor, helper }) => (
  <div
    style={{
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      paddingBottom: 8,
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 13,
          color: T.textSecondary,
          letterSpacing: -0.2,
        }}
      >
        {label}
      </div>
      {helper && (
        <div
          style={{
            marginTop: 1,
            fontSize: 11,
            color: T.textTertiary,
            letterSpacing: -0.1,
          }}
        >
          {helper}
        </div>
      )}
    </div>
    <div
      style={{
        fontSize: 15,
        fontWeight: 600,
        color: valueColor || T.textPrimary,
        letterSpacing: -0.3,
      }}
    >
      {value}
    </div>
  </div>
);

const RecapSection: FC<{ state: DashboardHeroState }> = ({ state }) => {
  const [expanded, setExpanded] = useState(false);
  const data = RECAP_DATA[state];

  if (!data) {
    return (
      <SectionCard
        title="This cycle"
        meta={
          state === "building"
            ? "Recap unlocks within 24 hours"
            : "Recap unlocks once we detect a paycheck"
        }
        icon={<RotateCw size={16} color={T.textSecondary} strokeWidth={2} />}
      />
    );
  }

  const pct = Math.round((data.spent / data.budget) * 100);
  const trail = (
    <ChevronDown
      size={18}
      color={T.textTertiary}
      strokeWidth={2}
      style={{
        transform: expanded ? "rotate(180deg)" : "none",
        transition: "transform 200ms",
      }}
    />
  );

  return (
    <SectionCard
      title="This cycle"
      meta={`Started ${data.startDate} · Day ${data.daysIn} of cycle`}
      icon={<RotateCw size={16} color={T.textSecondary} strokeWidth={2} />}
      trailing={trail}
      onHeaderClick={() => setExpanded((v) => !v)}
    >
      {expanded && (
        <div
          style={{
            padding: "12px 16px 16px",
            borderTop: `1px solid ${T.border}`,
          }}
        >
          <RecapStatRow
            label="Spent"
            value={`$${data.spent.toLocaleString()} of $${data.budget.toLocaleString()}`}
            helper={`${pct}% of expected income spent`}
          />
          {/* Spent bar */}
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: T.bgPrimary,
              marginTop: -2,
              marginBottom: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min(pct, 100)}%`,
                height: "100%",
                background: pct > 90 ? T.negative : T.accent,
              }}
            />
          </div>
          <RecapStatRow
            label="Bills paid on time"
            value={`${data.billsOnTime.paid} of ${data.billsOnTime.total}`}
            valueColor={
              data.billsOnTime.paid === data.billsOnTime.total
                ? T.accent
                : T.warning
            }
          />
          <RecapStatRow
            label="vs last cycle, this point"
            value={`${data.vsLastCycle.better ? "−" : "+"}$${data.vsLastCycle.delta} ${data.vsLastCycle.better ? "less" : "more"}`}
            valueColor={data.vsLastCycle.better ? T.accent : T.negative}
          />
        </div>
      )}
    </SectionCard>
  );
};

// ---------------------------------------------------------------------
// Spending

type SpendingCategory = {
  name: string;
  amount: number;
  color: string;
  icon: ReactNode;
};

type SpendingData = {
  total: number;
  categories: SpendingCategory[];
};

const SPENDING_DATA: Partial<Record<DashboardHeroState, SpendingData>> = {
  positive: {
    total: 1247,
    categories: [
      {
        name: "Groceries",
        amount: 410,
        color: "#22A06B",
        icon: <ShoppingCart size={14} color="#FFFFFF" strokeWidth={2.2} />,
      },
      {
        name: "Dining out",
        amount: 185,
        color: "#F59E0B",
        icon: <Utensils size={14} color="#FFFFFF" strokeWidth={2.2} />,
      },
      {
        name: "Transit",
        amount: 140,
        color: "#3B82F6",
        icon: <Car size={14} color="#FFFFFF" strokeWidth={2.2} />,
      },
    ],
  },
  negative: {
    total: 1389,
    categories: [
      {
        name: "Groceries",
        amount: 478,
        color: "#22A06B",
        icon: <ShoppingCart size={14} color="#FFFFFF" strokeWidth={2.2} />,
      },
      {
        name: "Dining out",
        amount: 215,
        color: "#F59E0B",
        icon: <Utensils size={14} color="#FFFFFF" strokeWidth={2.2} />,
      },
      {
        name: "Transit",
        amount: 168,
        color: "#3B82F6",
        icon: <Car size={14} color="#FFFFFF" strokeWidth={2.2} />,
      },
    ],
  },
};

const SpendingSection: FC<{ state: DashboardHeroState }> = ({ state }) => {
  const data = SPENDING_DATA[state];

  if (!data) {
    return (
      <SectionCard
        title="Spending"
        meta={
          state === "building"
            ? "Spending breakdown unlocks within 24 hours"
            : "Add accounts to see spending breakdown"
        }
        icon={<Wallet size={16} color={T.textSecondary} strokeWidth={2} />}
      />
    );
  }

  return (
    <SectionCard
      title="Spending"
      meta={`Last 30 days · $${data.total.toLocaleString()} total`}
      icon={<Wallet size={16} color={T.textSecondary} strokeWidth={2} />}
    >
      {data.categories.map((cat) => {
        const pct = Math.round((cat.amount / data.total) * 100);
        return (
          <button
            key={cat.name}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderTop: `1px solid ${T.border}`,
              borderBottom: 0,
              borderLeft: 0,
              borderRight: 0,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              fontFamily: FONT_FAMILY,
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: T.radiusFull,
                background: cat.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {cat.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.textPrimary,
                  letterSpacing: -0.3,
                }}
              >
                {cat.name}
              </div>
              <div
                style={{
                  marginTop: 4,
                  height: 3,
                  borderRadius: 2,
                  background: T.bgPrimary,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: cat.color,
                  }}
                />
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.textPrimary,
                  letterSpacing: -0.3,
                }}
              >
                ${cat.amount.toLocaleString()}
              </div>
              <div
                style={{
                  marginTop: 1,
                  fontSize: 11,
                  color: T.textTertiary,
                  letterSpacing: -0.2,
                }}
              >
                {pct}%
              </div>
            </div>
          </button>
        );
      })}
      <button
        style={{
          width: "100%",
          padding: "12px 16px",
          borderTop: `1px solid ${T.border}`,
          borderBottom: 0,
          borderLeft: 0,
          borderRight: 0,
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          cursor: "pointer",
          fontFamily: FONT_FAMILY,
          fontSize: 13,
          fontWeight: 600,
          color: T.accent,
          letterSpacing: -0.2,
        }}
      >
        See all spending
        <ArrowUpRight size={14} color={T.accent} strokeWidth={2.5} />
      </button>
    </SectionCard>
  );
};

// =====================================================================
// Build 3.3 — Activity + Improve sections
// =====================================================================

type ActivityRow = {
  merchant: string;
  amount: number; // signed: negative = debit, positive = credit
  when: string;
};

const ACTIVITY_DATA: Partial<Record<DashboardHeroState, ActivityRow[]>> = {
  positive: [
    { merchant: "Whole Foods", amount: -87.42, when: "Today" },
    { merchant: "Spotify", amount: -12.99, when: "Yesterday" },
    { merchant: "Starbucks", amount: -6.85, when: "Apr 19" },
    { merchant: "National Grid", amount: -31.0, when: "Apr 18" },
    { merchant: "Uber", amount: 1200.0, when: "Apr 14" },
  ],
  negative: [
    { merchant: "Whole Foods", amount: -112.2, when: "Today" },
    { merchant: "Doordash", amount: -48.5, when: "Yesterday" },
    { merchant: "Shell", amount: -52.0, when: "Apr 19" },
    { merchant: "Verizon", amount: -72.0, when: "Apr 17" },
    { merchant: "Uber", amount: 1200.0, when: "Apr 14" },
  ],
  // Low confidence: we don't have detection but the linked account *does* have
  // transaction history. Show last 3 to reward linking and anchor the user.
  low: [
    { merchant: "Whole Foods", amount: -87.42, when: "Today" },
    { merchant: "Starbucks", amount: -6.85, when: "Yesterday" },
    { merchant: "ATM Withdrawal", amount: -60.0, when: "Apr 19" },
  ],
};

const fmtAmount = (amt: number): string => {
  const abs = Math.abs(amt);
  const sign = amt < 0 ? "-" : "+";
  return `${sign}$${abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const ActivitySection: FC<{ state: DashboardHeroState }> = ({ state }) => {
  const rows = ACTIVITY_DATA[state];

  if (!rows) {
    return (
      <SectionCard
        title="Recent activity"
        meta="Activity unlocks within 24 hours of linking"
        icon={<RotateCw size={16} color={T.textSecondary} strokeWidth={2} />}
      />
    );
  }

  return (
    <SectionCard
      title="Recent activity"
      meta={`Last ${rows.length} transactions`}
      icon={<RotateCw size={16} color={T.textSecondary} strokeWidth={2} />}
    >
      {rows.map((r, idx) => {
        const isCredit = r.amount > 0;
        return (
          <button
            key={`${r.merchant}-${idx}`}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderTop: `1px solid ${T.border}`,
              borderBottom: 0,
              borderLeft: 0,
              borderRight: 0,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              fontFamily: FONT_FAMILY,
              textAlign: "left",
            }}
          >
            <MerchantAvatar
              color={merchantColor(r.merchant)}
              initial={r.merchant[0]}
              size={32}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.textPrimary,
                  letterSpacing: -0.3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.merchant}
              </div>
              <div
                style={{
                  marginTop: 1,
                  fontSize: 12,
                  color: T.textTertiary,
                  letterSpacing: -0.2,
                }}
              >
                {r.when}
              </div>
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: isCredit ? T.accent : T.textPrimary,
                letterSpacing: -0.3,
              }}
            >
              {fmtAmount(r.amount)}
            </div>
          </button>
        );
      })}
      <button
        style={{
          width: "100%",
          padding: "12px 16px",
          borderTop: `1px solid ${T.border}`,
          borderBottom: 0,
          borderLeft: 0,
          borderRight: 0,
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          cursor: "pointer",
          fontFamily: FONT_FAMILY,
          fontSize: 13,
          fontWeight: 600,
          color: T.accent,
          letterSpacing: -0.2,
        }}
      >
        See all activity
        <ArrowUpRight size={14} color={T.accent} strokeWidth={2.5} />
      </button>
    </SectionCard>
  );
};

// ---------------------------------------------------------------------
// Improve

type ImproveItem = {
  title: string;
  body: string;
  iconBg: string;
  icon: ReactNode;
};

const IMPROVE_ITEMS: ImproveItem[] = [
  {
    title: "Set up direct deposit",
    body: "Get paid up to 2 days early and unlock member benefits.",
    iconBg: T.tealLight,
    icon: <ArrowUpRight size={16} color={T.accent} strokeWidth={2.5} />,
  },
  {
    title: "Add a savings goal",
    body: "Turn surplus into a buffer that grows between paychecks.",
    iconBg: "#F1E8FC",
    icon: <Sprout size={16} color="#7517E6" strokeWidth={2.5} />,
  },
  {
    title: "Link your other accounts",
    body: "Add credit cards or another bank for a full picture.",
    iconBg: "#FFFCE9",
    icon: <Landmark size={16} color={T.warning} strokeWidth={2.5} />,
  },
];

const ImproveSection: FC<{ onAddDetails: () => void }> = ({ onAddDetails }) => (
  <SectionCard
    title="Improve your cash flow"
    meta="3 ways to get more from MoneyLion"
    icon={<TrendingUp size={16} color={T.textSecondary} strokeWidth={2} />}
  >
    {IMPROVE_ITEMS.map((item) => (
      <button
        key={item.title}
        onClick={onAddDetails}
        style={{
          width: "100%",
          padding: "14px 16px",
          borderTop: `1px solid ${T.border}`,
          borderBottom: 0,
          borderLeft: 0,
          borderRight: 0,
          background: "transparent",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          cursor: "pointer",
          fontFamily: FONT_FAMILY,
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: T.radiusFull,
            background: item.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {item.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: T.textPrimary,
              letterSpacing: -0.3,
            }}
          >
            {item.title}
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 12,
              color: T.textSecondary,
              letterSpacing: -0.2,
              lineHeight: "16px",
            }}
          >
            {item.body}
          </div>
        </div>
        <ChevronRight
          size={18}
          color={T.textTertiary}
          strokeWidth={2}
          style={{ marginTop: 2 }}
        />
      </button>
    ))}
  </SectionCard>
);

// Section keys drive ordering in `DashboardScreen`. Each key maps to a real
// section component (see render switch below) — there are no placeholders left
// after Build 3.3.
type DashboardSectionKey =
  | "smart"
  | "bills"
  | "income"
  | "recap"
  | "spending"
  | "activity"
  | "improve";

const DashboardScreen: FC<{
  state: DashboardHeroState;
  onBack: () => void;
  onAddDetails: () => void;
}> = ({ state, onBack, onAddDetails }) => {
  const hero = <DashboardHero state={state} />;

  // Section order is uniform across all states per D17c — Smart Actions always
  // sits at section position 1 directly below the hero. State drives section
  // *content* and *visual emphasis*, not position. Low confidence trims the
  // mid-tail (Income / Recap / Spending) since those sections have no data
  // until detection completes; Activity + Improve still render because Activity
  // shows recent transactions from linked accounts and Improve is universal.
  const fullOrder: DashboardSectionKey[] = [
    "smart",
    "bills",
    "income",
    "recap",
    "spending",
    "activity",
    "improve",
  ];
  const sectionOrder: readonly DashboardSectionKey[] =
    state === "low" ? ["smart", "bills", "activity", "improve"] : fullOrder;

  return (
    <PhoneFrame>
      <StatusBar />
      <NavBar title="Cash Flow" onBack={onBack} showHelp={true} />

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "8px 16px 24px",
        }}
      >
        <div>{hero}</div>

        {/* Low confidence: action card below the hero replaces the in-hero CTAs */}
        {state === "low" && <LowConfidenceCallout onAddDetails={onAddDetails} />}

        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {sectionOrder.map((key) => {
            // All seven dashboard sections are real components after Build 3.3.
            if (key === "smart") return <SmartActionsCard key={key} state={state} />;
            if (key === "bills") return <BillsSection key={key} state={state} />;
            if (key === "income") return <IncomeSection key={key} state={state} />;
            if (key === "recap") return <RecapSection key={key} state={state} />;
            if (key === "spending") return <SpendingSection key={key} state={state} />;
            if (key === "activity") return <ActivitySection key={key} state={state} />;
            if (key === "improve")
              return <ImproveSection key={key} onAddDetails={onAddDetails} />;
            return null;
          })}
        </div>

        {state === "low" && (
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: T.textTertiary,
              letterSpacing: -0.2,
              textAlign: "center",
              lineHeight: "16px",
            }}
          >
            Income, Recap, and Spending sections unlock once we detect at
            least one bill and one paycheck.
          </div>
        )}
      </div>

      <HomeIndicator />
    </PhoneFrame>
  );
};

// =====================================================================
// State Switcher (dev only — visible in canvas for stakeholder demos)
// =====================================================================

type DemoState =
  | { screen: "splash"; page: number; linked: boolean }
  | { screen: "gate"; gateState: GateState }
  | { screen: "overview"; detection: DetectionState }
  | { screen: "stepperA2b"; step: number; detection: DetectionState; partialMode: StepperPartialMode }
  | { screen: "bills"; billsState: BillsState }
  | { screen: "picker"; pickerState: PickerState }
  | { screen: "dashboard"; heroState: DashboardHeroState };

type SwitcherGroup = {
  id: string;
  title: string;
  entries: Array<{ label: string; state: DemoState }>;
};

// Non-splash groups. Splash gets a custom row with a Linked/Unlinked toggle
// (renders inside StateSwitcher) since it's the only state with a flag dim.
const SWITCHER_GROUPS: SwitcherGroup[] = [
  {
    id: "gate",
    title: "A1 Gate",
    entries: [
      { label: "Default", state: { screen: "gate", gateState: "default" } },
      { label: "Loading", state: { screen: "gate", gateState: "loading" } },
      { label: "Error", state: { screen: "gate", gateState: "error" } },
    ],
  },
  {
    id: "overview",
    title: "A2 Overview",
    entries: [
      { label: "High confidence", state: { screen: "overview", detection: "high" } },
      { label: "Partial", state: { screen: "overview", detection: "partial" } },
      { label: "Building", state: { screen: "overview", detection: "building" } },
      { label: "Low confidence", state: { screen: "overview", detection: "low" } },
    ],
  },
  {
    id: "stepperA2b",
    title: "A2b Stepper",
    entries: [
      { label: "Step 1 · High", state: { screen: "stepperA2b", step: 1, detection: "high", partialMode: "skip" } },
      { label: "Step 2 · High", state: { screen: "stepperA2b", step: 2, detection: "high", partialMode: "skip" } },
      { label: "Step 3 · High", state: { screen: "stepperA2b", step: 3, detection: "high", partialMode: "skip" } },
      { label: "Step 1 · Partial", state: { screen: "stepperA2b", step: 1, detection: "partial", partialMode: "skip" } },
      { label: "Step 2 · Partial (Skip)", state: { screen: "stepperA2b", step: 2, detection: "partial", partialMode: "skip" } },
      { label: "Step 2 · Building (Show)", state: { screen: "stepperA2b", step: 2, detection: "building", partialMode: "show" } },
      { label: "Step 2 · Low (Show)", state: { screen: "stepperA2b", step: 2, detection: "low", partialMode: "show" } },
      { label: "Step 3 · Partial (Show)", state: { screen: "stepperA2b", step: 3, detection: "partial", partialMode: "show" } },
      { label: "Step 3 · Building (Show)", state: { screen: "stepperA2b", step: 3, detection: "building", partialMode: "show" } },
      { label: "Step 3 · Low (Show)", state: { screen: "stepperA2b", step: 3, detection: "low", partialMode: "show" } },
    ],
  },
  {
    id: "bills",
    title: "A3 Bills",
    entries: [
      { label: "Default", state: { screen: "bills", billsState: "default" } },
      { label: "Building", state: { screen: "bills", billsState: "building" } },
    ],
  },
  {
    id: "picker",
    title: "A3.1 Picker",
    entries: [
      { label: "Default", state: { screen: "picker", pickerState: "default" } },
      { label: "Building", state: { screen: "picker", pickerState: "building" } },
      { label: "+ Toast", state: { screen: "picker", pickerState: "toast" } },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    entries: [
      { label: "Positive STS", state: { screen: "dashboard", heroState: "positive" } },
      { label: "Negative STS", state: { screen: "dashboard", heroState: "negative" } },
      { label: "Building (24h)", state: { screen: "dashboard", heroState: "building" } },
      { label: "Low confidence", state: { screen: "dashboard", heroState: "low" } },
    ],
  },
];

// Map the active state to a group id so we can auto-expand the right group.
const groupIdForState = (s: DemoState): string => {
  if (s.screen === "splash") return "splash";
  if (s.screen === "gate") return "gate";
  if (s.screen === "overview") return "overview";
  if (s.screen === "stepperA2b") return "stepperA2b";
  if (s.screen === "bills") return "bills";
  if (s.screen === "picker") return "picker";
  return "dashboard";
};

// One-line summary of the current state for the header status row.
const summarizeState = (s: DemoState): string => {
  if (s.screen === "splash")
    return `A0 Splash · ${s.linked ? "Linked" : "Unlinked"} · Page ${s.page + 1}`;
  if (s.screen === "gate") return `A1 Gate · ${s.gateState}`;
  if (s.screen === "overview") return `A2 Overview · ${s.detection}`;
  if (s.screen === "stepperA2b")
    return `A2b Step ${s.step} · ${s.detection} · ${s.partialMode}`;
  if (s.screen === "bills") return `A3 Bills · ${s.billsState}`;
  if (s.screen === "picker") return `A3.1 Picker · ${s.pickerState}`;
  return `Dashboard · ${s.heroState}`;
};

const StateSwitcher: FC<{
  current: DemoState;
  setCurrent: (s: DemoState) => void;
  demoConfig: DemoConfig;
  setDemoConfig: (c: DemoConfig) => void;
  onStartFlow: () => void;
}> = ({ current, setCurrent, demoConfig, setDemoConfig, onStartFlow }) => {
  // Splash has a sub-toggle for the linked flag. Default to the current
  // splash linked value if we're on splash, else linked.
  const [splashLinked, setSplashLinked] = useState(
    current.screen === "splash" ? current.linked : true,
  );

  // Single-open accordion. Auto-expand the group containing the active state.
  const [openGroup, setOpenGroup] = useState<string>(groupIdForState(current));

  useEffect(() => {
    setOpenGroup(groupIdForState(current));
    if (current.screen === "splash") setSplashLinked(current.linked);
  }, [current]);

  const isActive = (s: DemoState) =>
    JSON.stringify(s) === JSON.stringify(current);

  const isSplashActive = (page: number) =>
    current.screen === "splash" &&
    current.page === page &&
    current.linked === splashLinked;

  const buttonStyle = (active: boolean): CSSProperties => ({
    textAlign: "left",
    padding: "7px 10px",
    borderRadius: 8,
    border: 0,
    background: active ? T.bgAccent : "transparent",
    color: active ? T.accent : T.textPrimary,
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    letterSpacing: -0.2,
    fontFamily: FONT_FAMILY,
    cursor: "pointer",
  });

  const groupHeaderStyle = (active: boolean): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: 0,
    background: "transparent",
    color: active ? T.textPrimary : T.textSecondary,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: -0.2,
    fontFamily: FONT_FAMILY,
    cursor: "pointer",
  });

  const splashGroupOpen = openGroup === "splash";

  return (
    <div
      style={{
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: T.radiusMd,
        padding: 12,
        width: 248,
        fontFamily: FONT_FAMILY,
        height: "fit-content",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "4px 6px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: T.textPrimary,
            letterSpacing: -0.3,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: T.accent,
            }}
          />
          Mastiff · Cashflow
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: T.textTertiary,
            letterSpacing: -0.2,
            lineHeight: "15px",
          }}
        >
          {summarizeState(current)}
        </div>
      </div>

      <div style={{ height: 1, background: T.border, margin: "0 -12px 8px" }} />

      {/* Demo Setup — cascading selectors */}
      <div style={{ padding: "0 2px 10px" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: T.textTertiary,
            letterSpacing: 0.5,
            textTransform: "uppercase" as const,
            marginBottom: 8,
            padding: "0 4px",
          }}
        >
          Demo Setup
        </div>

        {/* Row 1: Path */}
        <div style={{ marginBottom: 6 }}>
          <div
            style={{
              fontSize: 11,
              color: T.textSecondary,
              letterSpacing: -0.2,
              marginBottom: 4,
              padding: "0 4px",
            }}
          >
            Path
          </div>
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: 3,
              background: T.bgPrimary,
              borderRadius: T.radiusFull,
              border: `1px solid ${T.border}`,
            }}
          >
            {([
              { key: "a2" as const, label: "One-pager" },
              { key: "a2b" as const, label: "Stepper" },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() =>
                  setDemoConfig({ ...demoConfig, path: opt.key })
                }
                style={{
                  flex: 1,
                  height: 24,
                  border: 0,
                  borderRadius: T.radiusFull,
                  background:
                    demoConfig.path === opt.key ? T.bgCard : "transparent",
                  color:
                    demoConfig.path === opt.key
                      ? T.textPrimary
                      : T.textTertiary,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: -0.2,
                  fontFamily: FONT_FAMILY,
                  cursor: "pointer",
                  boxShadow:
                    demoConfig.path === opt.key
                      ? "0 1px 2px rgba(0,0,0,0.06)"
                      : "none",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Mode — only when Stepper */}
        {demoConfig.path === "a2b" && (
          <div style={{ marginBottom: 6 }}>
            <div
              style={{
                fontSize: 11,
                color: T.textSecondary,
                letterSpacing: -0.2,
                marginBottom: 4,
                padding: "0 4px",
              }}
            >
              Mode
            </div>
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: 3,
                background: T.bgPrimary,
                borderRadius: T.radiusFull,
                border: `1px solid ${T.border}`,
              }}
            >
              {([
                { key: "skip" as const, label: "Skip" },
                { key: "show" as const, label: "Show" },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() =>
                    setDemoConfig({ ...demoConfig, mode: opt.key })
                  }
                  style={{
                    flex: 1,
                    height: 24,
                    border: 0,
                    borderRadius: T.radiusFull,
                    background:
                      demoConfig.mode === opt.key ? T.bgCard : "transparent",
                    color:
                      demoConfig.mode === opt.key
                        ? T.textPrimary
                        : T.textTertiary,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: -0.2,
                    fontFamily: FONT_FAMILY,
                    cursor: "pointer",
                    boxShadow:
                      demoConfig.mode === opt.key
                        ? "0 1px 2px rgba(0,0,0,0.06)"
                        : "none",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Row 3: Detection */}
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 11,
              color: T.textSecondary,
              letterSpacing: -0.2,
              marginBottom: 4,
              padding: "0 4px",
            }}
          >
            Detection
          </div>
          <div
            style={{
              display: "flex",
              gap: 3,
              padding: 3,
              background: T.bgPrimary,
              borderRadius: T.radiusFull,
              border: `1px solid ${T.border}`,
            }}
          >
            {([
              { key: "high" as const, label: "High" },
              { key: "partial" as const, label: "Partial" },
              { key: "building" as const, label: "Building" },
              { key: "low" as const, label: "Low" },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() =>
                  setDemoConfig({ ...demoConfig, detection: opt.key })
                }
                style={{
                  flex: 1,
                  height: 24,
                  border: 0,
                  borderRadius: T.radiusFull,
                  background:
                    demoConfig.detection === opt.key
                      ? T.bgCard
                      : "transparent",
                  color:
                    demoConfig.detection === opt.key
                      ? T.textPrimary
                      : T.textTertiary,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: -0.2,
                  fontFamily: FONT_FAMILY,
                  cursor: "pointer",
                  boxShadow:
                    demoConfig.detection === opt.key
                      ? "0 1px 2px rgba(0,0,0,0.06)"
                      : "none",
                  padding: "0 2px",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={onStartFlow}
          style={{
            width: "100%",
            height: 30,
            borderRadius: T.radiusFull,
            border: 0,
            background: T.tealPrimary,
            color: T.textPrimary,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: -0.2,
            fontFamily: FONT_FAMILY,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          ▶ Start from Splash
        </button>
      </div>

      <div style={{ height: 1, background: T.border, margin: "0 -12px 8px" }} />

      {/* Splash group — custom render with linked toggle */}
      <div style={{ marginBottom: 4 }}>
        <button
          onClick={() => setOpenGroup(splashGroupOpen ? "" : "splash")}
          style={groupHeaderStyle(groupIdForState(current) === "splash")}
        >
          <span>A0 Splash</span>
          <ChevronRight
            size={14}
            color={T.textTertiary}
            style={{
              transform: splashGroupOpen ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 150ms ease",
            }}
          />
        </button>
        {splashGroupOpen && (
          <div style={{ padding: "4px 0 6px" }}>
            {/* Linked / Unlinked segmented toggle */}
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: 3,
                margin: "0 6px 6px",
                background: T.bgPrimary,
                borderRadius: T.radiusFull,
                border: `1px solid ${T.border}`,
              }}
            >
              {[
                { key: true, label: "Linked" },
                { key: false, label: "Unlinked" },
              ].map((opt) => (
                <button
                  key={String(opt.key)}
                  onClick={() => {
                    setSplashLinked(opt.key);
                    if (current.screen === "splash") {
                      setCurrent({
                        screen: "splash",
                        page: current.page,
                        linked: opt.key,
                      });
                    }
                  }}
                  style={{
                    flex: 1,
                    height: 24,
                    border: 0,
                    borderRadius: T.radiusFull,
                    background:
                      splashLinked === opt.key ? T.bgCard : "transparent",
                    color:
                      splashLinked === opt.key ? T.textPrimary : T.textTertiary,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: -0.2,
                    fontFamily: FONT_FAMILY,
                    cursor: "pointer",
                    boxShadow:
                      splashLinked === opt.key
                        ? "0 1px 2px rgba(0,0,0,0.06)"
                        : "none",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { label: "Page 1 · See", page: 0 },
                { label: "Page 2 · Cover", page: 1 },
                { label: "Page 3 · Grow", page: 2 },
              ].map((p) => (
                <button
                  key={p.page}
                  onClick={() =>
                    setCurrent({
                      screen: "splash",
                      page: p.page,
                      linked: splashLinked,
                    })
                  }
                  style={buttonStyle(isSplashActive(p.page))}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generic groups — accordion */}
      {SWITCHER_GROUPS.map((g) => {
        const open = openGroup === g.id;
        const groupActive = groupIdForState(current) === g.id;
        return (
          <div key={g.id} style={{ marginBottom: 4 }}>
            <button
              onClick={() => setOpenGroup(open ? "" : g.id)}
              style={groupHeaderStyle(groupActive)}
            >
              <span>{g.title}</span>
              <ChevronRight
                size={14}
                color={T.textTertiary}
                style={{
                  transform: open ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 150ms ease",
                }}
              />
            </button>
            {open && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  padding: "4px 0 6px",
                }}
              >
                {g.entries.map((e) => (
                  <button
                    key={e.label}
                    onClick={() => setCurrent(e.state)}
                    style={buttonStyle(isActive(e.state))}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ height: 1, background: T.border, margin: "8px -12px 0" }} />

      <div
        style={{
          marginTop: 10,
          padding: "0 6px",
          fontSize: 11,
          lineHeight: "15px",
          color: T.textTertiary,
          letterSpacing: -0.2,
        }}
      >
        Mastiff · A2 + A2b onboarding · all dashboard states
      </div>
    </div>
  );
};

// =====================================================================
// Main App
// =====================================================================
export default function CashFlowV2Draft() {
  const [demo, setDemo] = useState<DemoState>({
    screen: "stepperA2b",
    step: 1,
    detection: "high",
    partialMode: "skip",
  });

  const [demoConfig, setDemoConfig] = useState<DemoConfig>({
    path: "a2b",
    mode: "skip",
    detection: "high",
  });

  const goSplash = (linked = true) =>
    setDemo({ screen: "splash", page: 0, linked });
  const goGate = () => setDemo({ screen: "gate", gateState: "default" });
  const goOverview = (
    detection: DetectionState = "high",
  ): void => setDemo({ screen: "overview", detection });
  const goStepper = (
    detection: DetectionState = "high",
    partialMode: StepperPartialMode = "skip",
  ) =>
    setDemo({ screen: "stepperA2b", step: 1, detection, partialMode });
  const goBills = () => setDemo({ screen: "bills", billsState: "default" });
  const goPicker = () => setDemo({ screen: "picker", pickerState: "default" });
  const goDashboard = (heroState: DashboardHeroState = "positive") =>
    setDemo({ screen: "dashboard", heroState });

  const heroForDetection = (d: DetectionState): DashboardHeroState => {
    if (d === "high") return "positive";
    if (d === "partial") return "negative";
    if (d === "building") return "building";
    return "low";
  };

  const onStartFlow = () =>
    setDemo({ screen: "splash", page: 0, linked: true });

  const onSplashContinue = () => {
    if (demo.screen !== "splash") return;
    if (demo.linked) {
      if (demoConfig.path === "a2b") {
        goStepper(demoConfig.detection, demoConfig.mode);
      } else {
        goOverview(demoConfig.detection);
      }
    } else {
      goGate();
    }
  };

  useEffect(() => {
    if (demo.screen === "gate" && demo.gateState === "loading") {
      const t = setTimeout(() => {
        if (demoConfig.path === "a2b") {
          goStepper(demoConfig.detection, demoConfig.mode);
        } else {
          goOverview(demoConfig.detection);
        }
      }, 1500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [demo, demoConfig]);

  let phone: ReactNode;

  if (demo.screen === "splash") {
    phone = (
      <SplashScreen
        page={demo.page}
        setPage={(n) =>
          setDemo({ screen: "splash", page: n, linked: demo.linked })
        }
        linked={demo.linked}
        onContinue={onSplashContinue}
      />
    );
  } else if (demo.screen === "gate") {
    phone = (
      <LinkingGateScreen
        state={demo.gateState}
        onLink={() => setDemo({ screen: "gate", gateState: "loading" })}
        onBack={() => goSplash(false)}
      />
    );
  } else if (demo.screen === "overview") {
    phone = (
      <OverviewScreen
        state={demo.detection}
        onContinue={() => goDashboard(heroForDetection(demo.detection))}
        onBack={goSplash}
        onTapBills={goBills}
      />
    );
  } else if (demo.screen === "stepperA2b") {
    phone = (
      <StepperFlow
        step={demo.step}
        detection={demo.detection}
        partialMode={demo.partialMode}
        onStepChange={(s) =>
          setDemo({ ...demo, step: s })
        }
        onFinish={() => goDashboard(heroForDetection(demo.detection))}
        onBack={goSplash}
        onBrowseTransactions={goPicker}
      />
    );
  } else if (demo.screen === "bills") {
    phone = (
      <ConfirmBillsScreen
        state={demo.billsState}
        onConfirm={goOverview}
        onBack={goOverview}
        onBrowseTransactions={goPicker}
      />
    );
  } else if (demo.screen === "picker") {
    phone = (
      <TransactionPickerScreen state={demo.pickerState} onBack={goBills} />
    );
  } else {
    phone = (
      <DashboardScreen
        state={demo.heroState}
        onBack={() => {
          if (demoConfig.path === "a2b") {
            goStepper(demoConfig.detection, demoConfig.mode);
          } else {
            goOverview(demoConfig.detection);
          }
        }}
        onAddDetails={goBills}
      />
    );
  }

  const screenLabel = (() => {
    if (demo.screen === "splash") return "Splash";
    if (demo.screen === "gate") return "Linking Gate";
    if (demo.screen === "overview") return "Overview";
    if (demo.screen === "stepperA2b") return `Stepper · Step ${demo.step}`;
    if (demo.screen === "bills") return "Confirm Bills";
    if (demo.screen === "picker") return "Transaction Picker";
    return "Dashboard";
  })();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F0F0F0",
        fontFamily: FONT_FAMILY,
      }}
    >
      <style>{`@keyframes v2-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Page header */}
      <div
        style={{
          padding: "20px 32px",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          background: "#FFFFFF",
          display: "flex",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: -0.3,
            color: T.textPrimary,
          }}
        >
          MoneyLion
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: T.textSecondary,
            letterSpacing: -0.2,
          }}
        >
          Mastiff — Cashflow Prototype
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          padding: "32px 32px 48px",
          display: "flex",
          gap: 40,
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        {/* Left column: scenarios + switcher */}
        <div>
          <div style={{ marginBottom: 6 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: T.textTertiary,
                letterSpacing: 0.8,
                textTransform: "uppercase" as const,
                marginBottom: 4,
              }}
            >
              Scenarios
            </div>
            <p
              style={{
                fontSize: 12,
                lineHeight: "17px",
                color: T.textSecondary,
                letterSpacing: -0.2,
                margin: 0,
                maxWidth: 220,
              }}
            >
              Use these controls to change mock data. The phone shows the
              mobile UI at 375×812px.
            </p>
          </div>
          <StateSwitcher
            current={demo}
            setCurrent={setDemo}
            demoConfig={demoConfig}
            setDemoConfig={setDemoConfig}
            onStartFlow={onStartFlow}
          />
        </div>

        {/* Right column: breakpoint label + phone */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.8,
              color: T.textTertiary,
              textTransform: "uppercase" as const,
              marginBottom: 16,
            }}
          >
            {screenLabel} · 375 × 812PX
          </div>
          {phone}
        </div>
      </div>
    </div>
  );
}
