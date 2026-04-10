import { useState, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════════
   MLDS 4.0 TOKENS
═══════════════════════════════════════════════════════════════════ */
const T = {
  bgPage:       "#F6F6F6",
  bgCard:       "#FFFFFF",
  bgAccent:     "#E1FEFA",
  bgWarning:    "#FFFCE9",
  bgNegative:   "#FFEBED",
  text1:        "#000000",
  text2:        "rgba(0,0,0,0.64)",
  text3:        "rgba(0,0,0,0.48)",
  border:       "rgba(0,0,0,0.08)",
  tealDark:     "#006657",
  tealBright:   "#00E5C4",
  yellow:       "#B89F00",
  yellowBorder: "#FFF3A5",
  red:          "#CE293F",
  redBorder:    "#FFADB8",
} as const;

/* ═══════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════ */
type Screen =
  | "accounts" | "splash"
  | "link-bank" | "link-connecting" | "joint-account" | "bill-review" | "paycheck-confirm" | "reconciliation"
  | "manual-paycheck" | "manual-bills"
  | "cashflow";

type AccountState = "new-user" | "manual-only" | "roarmoney-only" | "roarmoney-dd" | "bv-linked";
type RiskLevel     = "ahead" | "tight" | "short";
type PayFreq       = "weekly" | "biweekly" | "semimonthly" | "monthly";
type Confidence    = "High confidence" | "Medium confidence" | "Low confidence" | "Manual estimate" | "Still learning" | "Unreliable" | "Partial view";
type LinkedOverlay = "none" | "still-learning" | "reconnect" | "missing-tx";
type PaycheckSignal = "detected" | "not-detected";
type LinkedIncomeStatus = "unconfirmed" | "confirmed" | "manual" | "dd";

interface Bill { id: string; label: string; amount: string; enabled: boolean; dueDay: number }
interface CFObligation { label: string; amount: number; date: string; pending?: boolean }
interface DetectedItem {
  id: string; label: string; amount: number; frequency: string;
  confirmed: boolean; userAdded?: boolean;
}
type ReconRowType = "conflict" | "unmatched-manual" | "new-detected";
type ReconDecision = "keep-mine" | "use-detected" | "keep" | "remove" | "add" | "skip";
interface ReconRow {
  id: string;
  type: ReconRowType;
  label: string;
  manualAmount?: number;
  detectedAmount?: number;
  decision?: ReconDecision;
}
interface CFModel {
  balance: number; safeToSpend: number; committedTotal: number;
  estimatedVariable: number; buffer: number; confidence: Confidence;
  asOf: string; stale: boolean; nextPayday: string; committed: CFObligation[];
  savings?: number;
  pendingTx?: CFObligation[];
}

/* ═══════════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════════ */
const BANKS = [
  { name: "Chase",           initials: "CH", color: "#003087" },
  { name: "Bank of America", initials: "BA", color: "#E31837" },
  { name: "Wells Fargo",     initials: "WF", color: "#D71E2B" },
  { name: "Citibank",        initials: "CI", color: "#003D97" },
  { name: "Capital One",     initials: "CO", color: "#004977" },
  { name: "TD Bank",         initials: "TD", color: "#34B233" },
  { name: "US Bank",         initials: "US", color: "#6B3F9E" },
  { name: "PNC",             initials: "PN", color: "#EF7622" },
  { name: "Ally",            initials: "AL", color: "#5F259F" },
  { name: "Navy Federal",    initials: "NF", color: "#1B4F8A" },
];

const FREQ_OPTIONS: { value: PayFreq; label: string }[] = [
  { value: "weekly",      label: "Every week"    },
  { value: "biweekly",    label: "Every 2 weeks" },
  { value: "semimonthly", label: "Twice a month" },
  { value: "monthly",     label: "Once a month"  },
];

const PAY_DATES: Record<PayFreq, string[]> = {
  weekly:      ["Apr 11", "Apr 18", "Apr 25"],
  biweekly:    ["Apr 14", "Apr 28"],
  semimonthly: ["Apr 15", "Apr 30"],
  monthly:     ["Apr 30"],
};

const DEFAULT_BILLS: Bill[] = [
  { id: "rent",  label: "Rent / Mortgage", amount: "850", enabled: true,  dueDay: 1  },
  { id: "phone", label: "Phone",           amount: "78",  enabled: true,  dueDay: 12 },
  { id: "net",   label: "Internet / Cable",amount: "60",  enabled: false, dueDay: 15 },
  { id: "str",   label: "Streaming",       amount: "25",  enabled: false, dueDay: 8  },
  { id: "gym",   label: "Gym",             amount: "40",  enabled: false, dueDay: 5  },
  { id: "car",   label: "Car payment",     amount: "350", enabled: false, dueDay: 20 },
  { id: "util",  label: "Utilities",       amount: "120", enabled: false, dueDay: 18 },
];

const INITIAL_DETECTED: DetectedItem[] = [
  { id:"rent",    label:"Rent / Mortgage", amount:850,   frequency:"Monthly",  confirmed:false },
  { id:"phone",   label:"T-Mobile",        amount:78,    frequency:"Monthly",  confirmed:false },
  { id:"spotify", label:"Spotify",         amount:10.99, frequency:"Monthly",  confirmed:false },
  { id:"netflix", label:"Netflix",         amount:15.49, frequency:"Monthly",  confirmed:false },
  { id:"gym",     label:"Planet Fitness",  amount:24.99, frequency:"Monthly",  confirmed:false },
];

const INITIAL_RECON_ROWS: ReconRow[] = [
  { id:"r-conflict-rent", type:"conflict",         label:"Rent / Mortgage", manualAmount:850, detectedAmount:900 },
  { id:"r-unmatched-util", type:"unmatched-manual", label:"Utilities",       manualAmount:120 },
  { id:"r-new-insurance", type:"new-detected",     label:"Car insurance",    detectedAmount:96 },
];

const CF: Record<"linked"|"manual"|"partial", Record<RiskLevel, CFModel>> = {
  linked: {
    ahead: { balance:1492, savings:1035, safeToSpend:342,  committedTotal:955, estimatedVariable:105, buffer:90, confidence:"Medium confidence", asOf:"Today, 11:42 AM",  stale:false, nextPayday:"Apr 14",
      committed:[{label:"Rent",amount:850,date:"Apr 11"},{label:"Phone bill",amount:78,date:"Apr 12"},{label:"Subscriptions",amount:27,date:"Apr 13"}],
      pendingTx:[{label:"Walmart",amount:32,date:"Today",pending:true},{label:"Starbucks",amount:8,date:"Today",pending:true}] },
    tight: { balance:1138, savings:1035, safeToSpend:89,   committedTotal:955, estimatedVariable:94,  buffer:0,  confidence:"Medium confidence", asOf:"Today, 11:42 AM",  stale:false, nextPayday:"Apr 14",
      committed:[{label:"Rent",amount:850,date:"Apr 11"},{label:"Phone bill",amount:78,date:"Apr 12"},{label:"Subscriptions",amount:27,date:"Apr 13"},{label:"Instacash repayment",amount:55,date:"Apr 14"}],
      pendingTx:[{label:"Amazon",amount:67,date:"Today",pending:true}] },
    short: { balance:992,  savings:1035, safeToSpend:-43,  committedTotal:955, estimatedVariable:90,  buffer:0,  confidence:"Medium confidence", asOf:"Today, 11:42 AM",  stale:false, nextPayday:"Apr 14",
      committed:[{label:"Rent",amount:850,date:"Apr 11"},{label:"Phone bill",amount:78,date:"Apr 12"},{label:"Subscriptions",amount:27,date:"Apr 13"},{label:"Instacash repayment",amount:55,date:"Apr 14"}],
      pendingTx:[{label:"Target",amount:94,date:"Today",pending:true},{label:"Spotify",amount:11,date:"Today",pending:true}] },
  },
  manual: {
    ahead: { balance:1320, safeToSpend:392,  committedTotal:928,  estimatedVariable:0, buffer:0, confidence:"Manual estimate", asOf:"Apr 9, 2026", stale:false, nextPayday:"Apr 15", committed:[{label:"Rent",amount:850,date:"Apr 11"},{label:"Phone",amount:78,date:"Apr 12"}] },
    tight: { balance:1082, safeToSpend:52,   committedTotal:1030, estimatedVariable:0, buffer:0, confidence:"Manual estimate", asOf:"Apr 9, 2026", stale:false, nextPayday:"Apr 15", committed:[{label:"Rent",amount:850,date:"Apr 11"},{label:"Phone",amount:78,date:"Apr 12"},{label:"Streaming",amount:25,date:"Apr 13"},{label:"Gym",amount:40,date:"Apr 14"},{label:"Internet",amount:37,date:"Apr 14"}] },
    short: { balance:947,  safeToSpend:-88,  committedTotal:1035, estimatedVariable:0, buffer:0, confidence:"Manual estimate", asOf:"Apr 9, 2026", stale:false, nextPayday:"Apr 15", committed:[{label:"Rent",amount:850,date:"Apr 11"},{label:"Phone",amount:78,date:"Apr 12"},{label:"Streaming",amount:25,date:"Apr 13"},{label:"Gym",amount:40,date:"Apr 14"},{label:"Internet",amount:37,date:"Apr 14"},{label:"Car payment",amount:53,date:"Apr 14"}] },
  },
  partial: {
    ahead: { balance:1090, safeToSpend:128,  committedTotal:861, estimatedVariable:120, buffer:0,  confidence:"Partial view", asOf:"Today, 2:06 AM",   stale:true,  nextPayday:"Apr 14", committed:[{label:"Rent",amount:850,date:"Apr 11"},{label:"Linked subscription",amount:11,date:"Apr 12"}] },
    tight: { balance:1015, safeToSpend:34,   committedTotal:861, estimatedVariable:120, buffer:0,  confidence:"Partial view", asOf:"Today, 2:06 AM",   stale:true,  nextPayday:"Apr 14", committed:[{label:"Rent",amount:850,date:"Apr 11"},{label:"Linked subscription",amount:11,date:"Apr 12"}] },
    short: { balance:836,  safeToSpend:-25,  committedTotal:861, estimatedVariable:120, buffer:0,  confidence:"Partial view", asOf:"Today, 2:06 AM",   stale:true,  nextPayday:"Apr 14", committed:[{label:"Rent",amount:850,date:"Apr 11"},{label:"Linked subscription",amount:11,date:"Apr 12"}] },
  },
};

const ACCOUNT_BALANCE_DATA = {
  roarmoney: { checking: 1492, savings: 0, roarMoney: 1492, creditCardLiability: 631 },
  linked: { checking: 1684, savings: 1035, roarMoney: 1492, creditCardLiability: 631 },
};

const STATUS_COPY:  Record<RiskLevel, string> = { ahead:"You are ahead",   tight:"Budget is tight",   short:"You may come up short" };
const STATUS_COLOR: Record<RiskLevel, string> = { ahead:T.tealDark,       tight:T.yellow,            short:T.red                   };
const STATUS_BG:    Record<RiskLevel, string> = { ahead:T.bgAccent,       tight:T.bgWarning,         short:T.bgNegative            };
const CONF_COLOR:   Record<Confidence,string> = { "High confidence":T.tealDark, "Medium confidence":T.yellow, "Low confidence":T.red, "Manual estimate":T.yellow, "Still learning":T.yellow, "Unreliable":T.red, "Partial view":T.yellow };
const CONF_BG:      Record<Confidence,string> = { "High confidence":T.bgAccent, "Medium confidence":T.bgWarning, "Low confidence":T.bgNegative, "Manual estimate":T.bgWarning, "Still learning":T.bgWarning, "Unreliable":T.bgNegative, "Partial view":T.bgWarning };

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════ */
const fmt = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString()}`;

/* ═══════════════════════════════════════════════════════════════════
   SHARED ATOMS
═══════════════════════════════════════════════════════════════════ */
function NavBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div style={{ display:"flex", alignItems:"center", height:56, padding:"0 4px", flexShrink:0 }}>
      <button onClick={onBack} style={{ width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", background:"none", border:"none", cursor: onBack ? "pointer":"default", fontSize:20, color: onBack ? T.text1:"transparent" }}>←</button>
      <span style={{ flex:1, textAlign:"center", fontSize:16, fontWeight:600, letterSpacing:"-0.3px" }}>{title}</span>
      {right ?? <div style={{ width:44 }} />}
    </div>
  );
}

function Chip({ label, selected, onClick }: { label:string; selected:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ height:44, padding:"0 16px", borderRadius:999, cursor:"pointer", border:`1.5px solid ${selected ? T.tealDark : T.border}`, background: selected ? T.bgAccent : T.bgCard, color: selected ? T.tealDark : T.text2, fontSize:13, fontWeight:600, whiteSpace:"nowrap", transition:"all 120ms ease", fontFamily:"inherit" }}>{label}</button>
  );
}

function Badge({ label, color, bg }: { label:string; color:string; bg:string }) {
  return <span style={{ background:bg, color, borderRadius:999, padding:"4px 10px", fontSize:11, fontWeight:600 }}>{label}</span>;
}

function PrimaryBtn({ label, onClick, bg = T.text1 }: { label:string; onClick?:()=>void; bg?:string }) {
  return (
    <button onClick={onClick} style={{ width:"100%", height:52, border:"none", borderRadius:999, background:bg, color: bg === T.tealBright ? T.text1 : "#FFF", fontWeight:600, fontSize:15, cursor:"pointer", fontFamily:"inherit", transition:"opacity 120ms ease" }}>{label}</button>
  );
}

function StepBar({ step, total }: { step:number; total:number }) {
  return (
    <div style={{ display:"flex", gap:4 }}>
      {Array.from({ length:total }).map((_,i) => (
        <div key={i} style={{ flex:1, height:4, borderRadius:999, background: i < step ? T.tealBright : T.border, transition:"background 200ms ease" }} />
      ))}
    </div>
  );
}

function SpendBar({ model }: { model:CFModel }) {
  const t = model.balance;
  const p = (n:number) => `${Math.max(0, Math.round((Math.max(0,n)/t)*100))}%`;
  return (
    <div style={{ display:"grid", gap:8 }}>
      <div style={{ height:10, borderRadius:999, background:"#EEE", overflow:"hidden", display:"flex" }}>
        <div style={{ width:p(model.committedTotal),    background:T.red,        transition:"width 300ms ease" }} />
        <div style={{ width:p(model.estimatedVariable), background:T.yellow,     transition:"width 300ms ease" }} />
        <div style={{ width:p(Math.max(0,model.safeToSpend)), background:T.tealBright, transition:"width 300ms ease" }} />
      </div>
      <div style={{ display:"flex", gap:12 }}>
        {([["Committed",T.red],["Variable",T.yellow],["Safe",T.tealBright]] as [string,string][]).map(([l,c])=>(
          <div key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:8, height:8, borderRadius:999, background:c }} />
            <span style={{ fontSize:11, color:T.text3, fontWeight:600 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaycheckBar({ model }: { model: CFModel }) {
  const paycheck = model.balance;
  const billsPct   = `${Math.min(100, Math.round((model.committedTotal / paycheck) * 100))}%`;
  const remainPct  = `${Math.max(0, Math.round((Math.max(0, model.safeToSpend) / paycheck) * 100))}%`;
  return (
    <div style={{ display:"grid", gap:8 }}>
      <div style={{ height:10, borderRadius:999, background:"#EEE", overflow:"hidden", display:"flex" }}>
        <div style={{ width:billsPct,  background:T.red,        transition:"width 300ms ease" }} />
        <div style={{ width:remainPct, background:T.tealBright, transition:"width 300ms ease" }} />
      </div>
      <div style={{ display:"flex", gap:14 }}>
        {([["Bills", T.red], ["Expected remaining", T.tealBright]] as [string,string][]).map(([l,c]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:8, height:8, borderRadius:999, background:c }} />
            <span style={{ fontSize:11, color:T.text3, fontWeight:600 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function totalBalanceFor(state: AccountState): number | null {
  if (state === "new-user" || state === "manual-only") return null;
  if (state === "roarmoney-only") return ACCOUNT_BALANCE_DATA.roarmoney.roarMoney;
  if (state === "roarmoney-dd") return ACCOUNT_BALANCE_DATA.roarmoney.roarMoney;
  return ACCOUNT_BALANCE_DATA.linked.roarMoney + ACCOUNT_BALANCE_DATA.linked.checking + ACCOUNT_BALANCE_DATA.linked.savings;
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 1 — ACCOUNTS
═══════════════════════════════════════════════════════════════════ */
function CashFlowWidget({
  accountState, linkedIncomeStatus, onTap,
}: {
  accountState:AccountState; linkedIncomeStatus:LinkedIncomeStatus; onTap:()=>void;
}) {
  const card: React.CSSProperties = { width:"100%", background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, padding:20, textAlign:"left", cursor:"pointer", display:"grid", gap:12, fontFamily:"inherit" };
  if (accountState === "new-user") return (
    <button onClick={onTap} style={card}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:16, fontWeight:600 }}>Cash Flow</span>
        <Badge label="New" color={T.tealDark} bg={T.bgAccent} />
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ fontSize:38, fontWeight:700, color:"#CCC", letterSpacing:-2, filter:"blur(5px)", userSelect:"none" }}>$???</div>
        <div>
          <p style={{ margin:0, fontSize:14, fontWeight:600 }}>See your Safe to Spend</p>
          <p style={{ margin:"2px 0 0 0", fontSize:12, color:T.text2, lineHeight:"18px" }}>Know what's available before your next paycheck</p>
        </div>
      </div>
      <div style={{ background:T.tealBright, borderRadius:999, height:44, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:600, fontSize:14 }}>Get started →</div>
    </button>
  );
  if (accountState === "manual-only") return (
    <button onClick={onTap} style={card}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:16, fontWeight:600 }}>Cash Flow</span>
        <Badge label="Manual estimate" color={T.yellow} bg={T.bgWarning} />
      </div>
      <p style={{ margin:0, fontSize:12, color:T.text3, fontWeight:600 }}>EXPECTED AFTER BILLS</p>
      <p style={{ margin:"-8px 0 0 0", fontSize:36, fontWeight:600, letterSpacing:-1 }}>~$190</p>
      <p style={{ margin:"-4px 0 0 0", fontSize:12, color:T.text3 }}>Manual data · Next paycheck Apr 15</p>
      <div style={{ fontSize:13, color:T.tealDark, fontWeight:600 }}>View details →</div>
    </button>
  );
  if (accountState === "roarmoney-only") return (
    <button onClick={onTap} style={card}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:16, fontWeight:600 }}>Cash Flow</span>
        <Badge label="Partial view" color={T.yellow} bg={T.bgWarning} />
      </div>
      <p style={{ margin:0, fontSize:12, color:T.text3, fontWeight:600 }}>SAFE TO SPEND</p>
      <p style={{ margin:"-8px 0 0 0", fontSize:36, fontWeight:600, letterSpacing:-1 }}>$128</p>
      <p style={{ margin:"-4px 0 0 0", fontSize:12, color:T.text3 }}>RoarMoney only · Next paycheck Apr 14</p>
      <div style={{ background:T.bgWarning, borderRadius:12, padding:"10px 12px" }}>
        <p style={{ margin:0, fontSize:13, color:T.text1 }}>You are set up with RoarMoney. <span style={{ color:T.tealDark, fontWeight:600 }}>Link your main spending account</span> for a clearer picture.</p>
      </div>
      <div style={{ fontSize:13, color:T.tealDark, fontWeight:600 }}>View details →</div>
    </button>
  );
  if (accountState === "roarmoney-dd") return (
    <button onClick={onTap} style={card}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:16, fontWeight:600 }}>Cash Flow</span>
        <Badge label="Partial view" color={T.yellow} bg={T.bgWarning} />
      </div>
      <p style={{ margin:0, fontSize:12, color:T.text3, fontWeight:600 }}>SAFE TO SPEND</p>
      <p style={{ margin:"-8px 0 0 0", fontSize:36, fontWeight:600, letterSpacing:-1 }}>$196</p>
      <p style={{ margin:"-4px 0 0 0", fontSize:12, color:T.text3 }}>RoarMoney + DD income · External bills not linked</p>
      <div style={{ background:T.bgWarning, borderRadius:12, padding:"10px 12px" }}>
        <p style={{ margin:0, fontSize:13, color:T.text1 }}>Income is confirmed through direct deposit. <span style={{ color:T.tealDark, fontWeight:600 }}>Link external spending accounts</span> for a full picture.</p>
      </div>
      <div style={{ fontSize:13, color:T.tealDark, fontWeight:600 }}>View details →</div>
    </button>
  );
  return (
    <button onClick={onTap} style={card}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:16, fontWeight:600 }}>Cash Flow</span>
        <Badge
          label={linkedIncomeStatus === "confirmed" || linkedIncomeStatus === "dd" ? "High confidence" : "Medium confidence"}
          color={linkedIncomeStatus === "confirmed" || linkedIncomeStatus === "dd" ? T.tealDark : T.yellow}
          bg={linkedIncomeStatus === "confirmed" || linkedIncomeStatus === "dd" ? T.bgAccent : T.bgWarning}
        />
      </div>
      <p style={{ margin:0, fontSize:12, color:T.text3, fontWeight:600 }}>SAFE TO SPEND</p>
      <p style={{ margin:"-8px 0 0 0", fontSize:36, fontWeight:600, letterSpacing:-1 }}>$342</p>
      <p style={{ margin:"-4px 0 0 0", fontSize:12, color:T.text3 }}>
        {linkedIncomeStatus === "confirmed" || linkedIncomeStatus === "dd"
          ? "As of 11:42 AM · Next paycheck Apr 14"
          : "Bills detected · Paycheck pending confirmation"}
      </p>
      <div style={{ height:6, borderRadius:999, background:"#EEE", overflow:"hidden", display:"flex" }}>
        <div style={{ width:"64%", background:T.red }} /><div style={{ width:"7%", background:T.yellow }} /><div style={{ width:"23%", background:T.tealBright }} />
      </div>
      <div style={{ fontSize:13, color:T.tealDark, fontWeight:600 }}>View details →</div>
    </button>
  );
}

function AccountsScreen({
  accountState, linkedIncomeStatus, onWidgetTap,
}: {
  accountState:AccountState; linkedIncomeStatus:LinkedIncomeStatus; onWidgetTap:()=>void;
}) {
  const totalBalance = totalBalanceFor(accountState);
  const showsRoarMoney = accountState !== "new-user" && accountState !== "manual-only";
  const showsExternalAccounts = accountState === "bv-linked";

  return (
    <div>
      <NavBar title="Accounts" />
      <div style={{ padding:"4px 16px 24px", display:"grid", gap:12 }}>
        {totalBalance !== null && (
          <div style={{ background:T.bgCard, borderRadius:20, padding:20, border:`1px solid ${T.border}` }}>
            <p style={{ margin:0, fontSize:11, color:T.text3, fontWeight:600, letterSpacing:"0.5px" }}>TOTAL BALANCE</p>
            <p style={{ margin:"4px 0 2px", fontSize:34, fontWeight:600, letterSpacing:-1 }}>{fmt(totalBalance)}</p>
            <p style={{ margin:0, fontSize:12, color:T.text3 }}>
              {accountState === "roarmoney-only"
                ? "RoarMoney only"
                : "Checking + Savings + RoarMoney (credit cards excluded)"}
            </p>
          </div>
        )}

        {accountState === "manual-only" && (
          <div style={{ background:T.bgCard, borderRadius:20, padding:20, border:`1px solid ${T.border}`, display:"grid", gap:8 }}>
            <p style={{ margin:0, fontSize:16, fontWeight:600 }}>Let’s Get You Started</p>
            <p style={{ margin:0, fontSize:13, color:T.text2, lineHeight:"19px" }}>
              Link your bank to see your total balance and get a more accurate Cash Flow forecast.
            </p>
            <button style={{ height:40, borderRadius:999, border:"none", background:T.tealBright, color:T.text1, fontWeight:600, fontSize:13, fontFamily:"inherit", cursor:"pointer" }}>
              Link bank account
            </button>
          </div>
        )}

        {showsRoarMoney && (
          <div style={{ background:T.bgCard, borderRadius:20, padding:"14px 20px", border:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:14, background:T.bgAccent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🦁</div>
              <div>
                <p style={{ margin:0, fontSize:14, fontWeight:600 }}>RoarMoney</p>
                <p style={{ margin:"2px 0 0 0", fontSize:12, color:T.text3 }}>Checking ••• 4821</p>
              </div>
            </div>
            <p style={{ margin:0, fontSize:16, fontWeight:600 }}>{fmt(ACCOUNT_BALANCE_DATA.roarmoney.roarMoney)}</p>
          </div>
        )}

        {showsExternalAccounts && (
          <>
            <div style={{ background:T.bgCard, borderRadius:20, padding:"14px 20px", border:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:14, background:"#EEF5FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏦</div>
                <div>
                  <p style={{ margin:0, fontSize:14, fontWeight:600 }}>Linked checking</p>
                  <p style={{ margin:"2px 0 0 0", fontSize:12, color:T.text3 }}>Across connected banks</p>
                </div>
              </div>
              <p style={{ margin:0, fontSize:16, fontWeight:600 }}>{fmt(ACCOUNT_BALANCE_DATA.linked.checking)}</p>
            </div>
            <div style={{ background:T.bgCard, borderRadius:20, padding:"14px 20px", border:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:14, background:"#F2EEFF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>💰</div>
                <div>
                  <p style={{ margin:0, fontSize:14, fontWeight:600 }}>Linked savings</p>
                  <p style={{ margin:"2px 0 0 0", fontSize:12, color:T.text3 }}>Included in total balance only</p>
                </div>
              </div>
              <p style={{ margin:0, fontSize:16, fontWeight:600 }}>{fmt(ACCOUNT_BALANCE_DATA.linked.savings)}</p>
            </div>
          </>
        )}

        <CashFlowWidget accountState={accountState} linkedIncomeStatus={linkedIncomeStatus} onTap={onWidgetTap} />
        <div style={{ background:T.bgCard, borderRadius:20, padding:20, border:`1px solid ${T.border}`, opacity:0.45 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
            <span style={{ fontSize:16, fontWeight:600 }}>Spending</span>
            <span style={{ fontSize:12, color:T.text3 }}>April</span>
          </div>
          <div style={{ height:6, borderRadius:999, background:"#EEE" }}>
            <div style={{ width:"70%", height:"100%", background:T.yellow, borderRadius:999 }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
            <span style={{ fontSize:12, color:T.text3 }}>$842 spent</span>
            <span style={{ fontSize:12, color:T.text3 }}>$1,200 budget</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 2 — SPLASH / FEATURE INTRO
═══════════════════════════════════════════════════════════════════ */
function SplashScreen({ onClose, onLinkBank, onManual }: { onClose:()=>void; onLinkBank:()=>void; onManual:()=>void }) {
  return (
    <div>
      <div style={{ background:T.bgAccent, paddingBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"flex-end", padding:"14px 14px 0" }}>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:999, border:"none", background:"rgba(0,0,0,0.08)", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" }}>×</button>
        </div>
        <div style={{ padding:"8px 20px 0" }}>
          <div style={{ background:T.bgCard, borderRadius:20, padding:20, boxShadow:"0 8px 24px rgba(0,101,87,0.14)" }}>
            <p style={{ margin:0, fontSize:11, fontWeight:600, color:T.text3, letterSpacing:"0.5px" }}>SAFE TO SPEND</p>
            <p style={{ margin:"4px 0 2px", fontSize:44, fontWeight:600, letterSpacing:-2, color:T.tealDark }}>$342</p>
            <p style={{ margin:"0 0 10px", fontSize:12, color:T.text3 }}>As of today · Next paycheck Apr 14</p>
            <div style={{ height:8, borderRadius:999, background:"#EEE", overflow:"hidden", display:"flex", marginBottom:8 }}>
              <div style={{ width:"64%", background:T.red }} /><div style={{ width:"7%", background:T.yellow }} /><div style={{ width:"23%", background:T.tealBright }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <Badge label="High confidence" color={T.tealDark} bg={T.bgAccent} />
              <Badge label="Budget is tight" color={T.yellow} bg={T.bgWarning} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:"24px 20px 28px", display:"grid", gap:20 }}>
        <div>
          <h1 style={{ margin:0, fontSize:26, lineHeight:"33px", fontWeight:600, letterSpacing:"-0.7px" }}>See your future clearly. Stay ahead.</h1>
          <p style={{ margin:"10px 0 0 0", fontSize:15, lineHeight:"22px", color:T.text2 }}>Cash Flow shows exactly how much you can spend before your next paycheck, after every bill.</p>
        </div>

        <div style={{ display:"grid", gap:12 }}>
          {[
            "Know your real available balance after upcoming bills",
            "Spot shortfalls before payday — not after",
            "One clear number, updated as your spending changes",
          ].map(text => (
            <div key={text} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
              <div style={{ width:20, height:20, borderRadius:999, background:T.bgAccent, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                <span style={{ fontSize:11, fontWeight:700, color:T.tealDark }}>✓</span>
              </div>
              <span style={{ fontSize:14, lineHeight:"20px", color:T.text2 }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ background:T.bgCard, borderRadius:16, padding:"16px 20px", border:`1px solid ${T.border}`, display:"grid", gap:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ margin:0, fontSize:14, fontWeight:600 }}>Link my bank account</p>
              <p style={{ margin:"2px 0 0 0", fontSize:12, color:T.text2 }}>Most accurate · updates in real time</p>
            </div>
            <Badge label="Recommended" color={T.tealDark} bg={T.bgAccent} />
          </div>
          <PrimaryBtn label="Connect my bank →" onClick={onLinkBank} bg={T.tealBright} />
        </div>

        <div style={{ textAlign:"center" }}>
          <button onClick={onManual} style={{ background:"none", border:"none", fontSize:14, fontWeight:600, color:T.text2, cursor:"pointer", fontFamily:"inherit", textDecoration:"underline", textDecorationColor:T.border }}>Or enter my info manually</button>
        </div>

        <p style={{ margin:0, fontSize:11, color:T.text3, lineHeight:"16px", textAlign:"center" }}>Linking connects via Plaid. MoneyLion never stores your bank credentials.</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 3A — LINK BANK ACCOUNT
═══════════════════════════════════════════════════════════════════ */
function LinkBankScreen({ onBack, onSelect }: { onBack:()=>void; onSelect:(bank:string)=>void }) {
  const [q, setQ] = useState("");
  const list = BANKS.filter(b => b.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <NavBar title="Choose your bank" onBack={onBack} />
      <div style={{ padding:"4px 16px 24px", display:"grid", gap:12 }}>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", color:T.text3 }}>🔍</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search banks" style={{ width:"100%", height:52, borderRadius:14, border:`1.5px solid ${T.border}`, paddingLeft:46, fontSize:15, background:T.bgCard, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} />
        </div>
        <div style={{ display:"grid", gap:8 }}>
          {list.map(b => (
            <button key={b.name} onClick={() => onSelect(b.name)} style={{ display:"flex", alignItems:"center", gap:14, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, padding:"12px 16px", cursor:"pointer", textAlign:"left", width:"100%", fontFamily:"inherit" }}>
              <div style={{ width:44, height:44, borderRadius:12, background:b.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#FFF", fontWeight:700, fontSize:13, flexShrink:0 }}>{b.initials}</div>
              <span style={{ fontSize:15, fontWeight:600, flex:1 }}>{b.name}</span>
              <span style={{ color:T.text3, fontSize:18 }}>›</span>
            </button>
          ))}
        </div>
        <p style={{ margin:0, fontSize:11, color:T.text3, textAlign:"center", lineHeight:"16px" }}>Your login credentials are never stored. Connections are powered by Plaid.</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 3B — LINK CONNECTING (auto-advances)
═══════════════════════════════════════════════════════════════════ */
function LinkConnectingScreen({ bank, onConnected }: { bank:string; onConnected:()=>void }) {
  const [phase, setPhase] = useState<"connecting"|"success">("connecting");
  const bankObj = BANKS.find(b => b.name === bank) ?? BANKS[0];
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("success"), 2600);
    const t2 = setTimeout(onConnected, 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onConnected]);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:420, padding:"40px 24px", gap:24, textAlign:"center" }}>
      <div style={{ width:72, height:72, borderRadius:20, background:bankObj.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#FFF", fontWeight:700, fontSize:22 }}>{bankObj.initials}</div>
      {phase === "connecting" ? (
        <>
          <div>
            <p style={{ margin:0, fontSize:20, fontWeight:600 }}>Connecting to {bank}</p>
            <p style={{ margin:"6px 0 0 0", fontSize:14, color:T.text2 }}>This usually takes a few seconds</p>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {[0,1,2].map(i => <div key={i} style={{ width:10, height:10, borderRadius:999, background:T.tealBright, animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
          </div>
        </>
      ) : (
        <>
          <div style={{ width:60, height:60, borderRadius:999, background:T.bgAccent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, animation:"pop 200ms ease" }}>✓</div>
          <div>
            <p style={{ margin:0, fontSize:20, fontWeight:600, color:T.tealDark }}>Connected!</p>
            <p style={{ margin:"6px 0 0 0", fontSize:14, color:T.text2 }}>Building your Cash Flow now</p>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 4A — MANUAL: PAYCHECK
═══════════════════════════════════════════════════════════════════ */
function ManualPaycheckScreen({ onBack, onContinue }: { onBack:()=>void; onContinue:()=>void }) {
  const [amount, setAmount] = useState("2800");
  const [freq, setFreq]     = useState<PayFreq>("biweekly");
  const [date, setDate]     = useState(PAY_DATES["biweekly"][0]);
  const onFreq = (f: PayFreq) => { setFreq(f); setDate(PAY_DATES[f][0]); };
  return (
    <div>
      <NavBar title="" onBack={onBack} />
      <div style={{ padding:"4px 20px 28px", display:"grid", gap:24 }}>
        <div style={{ display:"grid", gap:12 }}>
          <StepBar step={1} total={2} />
          <h1 style={{ margin:0, fontSize:22, lineHeight:"30px", fontWeight:600, letterSpacing:"-0.5px" }}>How much do you take home each paycheck?</h1>
          <p style={{ margin:0, fontSize:14, color:T.text2 }}>After taxes and any deductions</p>
        </div>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:18, top:"50%", transform:"translateY(-50%)", fontSize:26, fontWeight:600, color:T.text3 }}>$</span>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} style={{ width:"100%", height:76, borderRadius:18, border:`1.5px solid ${amount ? T.tealDark : T.border}`, paddingLeft:50, fontSize:30, fontWeight:600, letterSpacing:-1, background:T.bgCard, outline:"none", fontFamily:"inherit", boxSizing:"border-box", color:T.text1 }} />
        </div>
        <div>
          <p style={{ margin:"0 0 10px", fontSize:14, fontWeight:600 }}>How often do you get paid?</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {FREQ_OPTIONS.map(({ value, label }) => <Chip key={value} label={label} selected={freq===value} onClick={()=>onFreq(value)} />)}
          </div>
        </div>
        <div>
          <p style={{ margin:"0 0 10px", fontSize:14, fontWeight:600 }}>When is your next paycheck?</p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {PAY_DATES[freq].map(d => <Chip key={d} label={d} selected={date===d} onClick={()=>setDate(d)} />)}
          </div>
        </div>
        <PrimaryBtn label="Continue" onClick={onContinue} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 4B — MANUAL: BILLS
═══════════════════════════════════════════════════════════════════ */
function ManualBillsScreen({ onBack, onDone }: { onBack:()=>void; onDone:()=>void }) {
  const [bills, setBills]       = useState<Bill[]>(DEFAULT_BILLS);
  const [showAdd, setShowAdd]   = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAmt, setNewAmt]     = useState("");
  const toggle = (id:string) => setBills(bs => bs.map(b => b.id===id ? {...b, enabled:!b.enabled} : b));
  const setAmt = (id:string, v:string) => setBills(bs => bs.map(b => b.id===id ? {...b, amount:v} : b));
  const addCustom = () => {
    if (!newLabel || !newAmt) return;
    setBills(bs => [...bs, { id:`c-${Date.now()}`, label:newLabel, amount:newAmt, enabled:true, dueDay:1 }]);
    setNewLabel(""); setNewAmt(""); setShowAdd(false);
  };
  const total = bills.filter(b=>b.enabled).reduce((s,b) => s + (parseFloat(b.amount)||0), 0);
  return (
    <div>
      <NavBar title="" onBack={onBack} />
      <div style={{ padding:"4px 20px 28px", display:"grid", gap:20 }}>
        <div style={{ display:"grid", gap:12 }}>
          <StepBar step={2} total={2} />
          <h1 style={{ margin:0, fontSize:22, lineHeight:"30px", fontWeight:600, letterSpacing:"-0.5px" }}>What are your regular bills?</h1>
          <p style={{ margin:0, fontSize:14, color:T.text2 }}>Select the ones that apply. You can edit amounts.</p>
        </div>
        <div style={{ display:"grid", gap:8 }}>
          {bills.map(b => (
            <div key={b.id} style={{ background:T.bgCard, border:`1.5px solid ${b.enabled ? T.tealDark : T.border}`, borderRadius:16, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, transition:"border-color 120ms ease" }}>
              <button onClick={()=>toggle(b.id)} style={{ width:26, height:26, borderRadius:999, border:`2px solid ${b.enabled ? T.tealDark : "#CCC"}`, background: b.enabled ? T.tealDark : "transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, color:"#FFF", fontSize:13, fontWeight:700, fontFamily:"inherit" }}>{b.enabled ? "✓" : ""}</button>
              <span style={{ flex:1, fontSize:14, fontWeight:600, color: b.enabled ? T.text1 : T.text3 }}>{b.label}</span>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", fontSize:13, color:T.text3 }}>$</span>
                <input type="number" value={b.amount} disabled={!b.enabled} onChange={e=>setAmt(b.id,e.target.value)} onClick={e=>e.stopPropagation()} style={{ width:78, height:36, border:`1px solid ${b.enabled ? T.border : "transparent"}`, borderRadius:10, paddingLeft:22, fontSize:14, fontWeight:600, fontFamily:"inherit", background: b.enabled ? T.bgPage : "transparent", outline:"none", color:T.text1 }} />
              </div>
            </div>
          ))}
          {showAdd ? (
            <div style={{ background:T.bgCard, border:`1.5px solid ${T.tealDark}`, borderRadius:16, padding:"12px 14px", display:"grid", gap:10 }}>
              <input placeholder="Bill name" value={newLabel} onChange={e=>setNewLabel(e.target.value)} style={{ height:40, border:`1px solid ${T.border}`, borderRadius:10, padding:"0 12px", fontSize:14, fontFamily:"inherit", outline:"none" }} />
              <div style={{ display:"flex", gap:8 }}>
                <input placeholder="$ Amount" type="number" value={newAmt} onChange={e=>setNewAmt(e.target.value)} style={{ flex:1, height:40, border:`1px solid ${T.border}`, borderRadius:10, padding:"0 12px", fontSize:14, fontFamily:"inherit", outline:"none" }} />
                <button onClick={addCustom} style={{ height:40, padding:"0 16px", borderRadius:10, border:"none", background:T.tealDark, color:"#FFF", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Add</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setShowAdd(true)} style={{ background:"none", border:`1.5px dashed ${T.border}`, borderRadius:16, padding:"14px 16px", fontSize:14, color:T.tealDark, fontWeight:600, cursor:"pointer", textAlign:"center", fontFamily:"inherit" }}>+ Add a bill</button>
          )}
        </div>
        <div style={{ background:T.bgAccent, borderRadius:16, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:14, color:T.text2 }}>Total committed monthly</span>
          <span style={{ fontSize:18, fontWeight:600, color:T.tealDark }}>{fmt(total)}</span>
        </div>
        <PrimaryBtn label="See my Cash Flow →" onClick={onDone} bg={T.tealBright} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 4B-GATE — BILL REVIEW (D6, D7)
═══════════════════════════════════════════════════════════════════ */
function BillReviewScreen({ simulateLowHistory, onBack, onComplete }: {
  simulateLowHistory: boolean; onBack: () => void; onComplete: () => void;
}) {
  const [items, setItems]         = useState<DetectedItem[]>(INITIAL_DETECTED);
  const [removed, setRemoved]     = useState<DetectedItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAmt,   setEditAmt]   = useState("");
  const [showAdd,   setShowAdd]   = useState(false);
  const [newLabel,  setNewLabel]  = useState("");
  const [newAmt,    setNewAmt]    = useState("");

  const confirmedCount = items.filter(i => i.confirmed).length;
  const canProceed     = confirmedCount > 0;

  const confirmItem = (id: string) => setItems(p => p.map(i => i.id === id ? { ...i, confirmed: true } : i));
  const removeItem  = (id: string) => {
    setItems(prev => {
      const target = prev.find(i => i.id === id);
      if (target) setRemoved(r => [target, ...r.filter(x => x.id !== id)]);
      return prev.filter(i => i.id !== id);
    });
  };
  const restoreItem = (id: string) => {
    setRemoved(prev => {
      const target = prev.find(i => i.id === id);
      if (target) {
        setItems(itemsPrev => itemsPrev.some(i => i.id === target.id) ? itemsPrev : [...itemsPrev, target]);
      }
      return prev.filter(i => i.id !== id);
    });
  };
  const startEdit   = (item: DetectedItem) => { setEditingId(item.id); setEditLabel(item.label); setEditAmt(String(item.amount)); };
  const saveEdit    = (id: string) => { setItems(p => p.map(i => i.id === id ? { ...i, label: editLabel, amount: parseFloat(editAmt) || i.amount, confirmed: true } : i)); setEditingId(null); };
  const cancelEdit  = () => setEditingId(null);
  const addManual   = () => {
    if (!newLabel || !newAmt) return;
    setItems(p => [...p, { id:`u-${Date.now()}`, label:newLabel, amount:parseFloat(newAmt)||0, frequency:"Monthly", confirmed:true, userAdded:true }]);
    setNewLabel(""); setNewAmt(""); setShowAdd(false);
  };

  const rowBase: React.CSSProperties = { borderRadius:14, padding:"12px 14px", display:"grid", gap:8, transition:"all 120ms ease" };

  return (
    <div>
      <NavBar title="" onBack={onBack} />
      <div style={{ padding:"4px 20px 32px", display:"grid", gap:20 }}>

        {/* Header */}
        <div style={{ display:"grid", gap:6 }}>
          <h1 style={{ margin:0, fontSize:22, fontWeight:600, lineHeight:"30px", letterSpacing:"-0.5px" }}>
            We found {INITIAL_DETECTED.length} recurring payments
          </h1>
          <p style={{ margin:0, fontSize:14, color:T.text2, lineHeight:"20px" }}>
            Review and confirm before we calculate your Cash Flow number.
          </p>
        </div>

        {/* Low-history banner (D7) */}
        {simulateLowHistory && (
          <div style={{ background:T.bgWarning, border:`1px solid ${T.yellowBorder}`, borderRadius:14, padding:"12px 14px", display:"grid", gap:4 }}>
            <p style={{ margin:0, fontSize:13, fontWeight:600, color:T.yellow }}>We do not have enough history yet</p>
            <p style={{ margin:0, fontSize:13, color:T.text2, lineHeight:"18px" }}>
              Your account is newer than 14 days so we may have missed some bills. Add anything below.
            </p>
          </div>
        )}

        {/* Items list */}
        <div style={{ display:"grid", gap:8 }}>
          {items.map(item => {
            const isEditing   = editingId === item.id;
            const isConfirmed = item.confirmed && !isEditing;

            if (isEditing) return (
              <div key={item.id} style={{ ...rowBase, background:T.bgCard, border:`1.5px solid ${T.tealDark}` }}>
                <p style={{ margin:0, fontSize:11, color:T.tealDark, fontWeight:600, letterSpacing:"0.4px" }}>EDITING</p>
                <input
                  value={editLabel} onChange={e=>setEditLabel(e.target.value)}
                  placeholder="Bill name"
                  style={{ height:40, border:`1px solid ${T.border}`, borderRadius:10, padding:"0 12px", fontSize:14, fontFamily:"inherit", outline:"none", background:T.bgPage }}
                />
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ position:"relative", flex:1 }}>
                    <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:T.text3 }}>$</span>
                    <input
                      type="number" value={editAmt} onChange={e=>setEditAmt(e.target.value)}
                      style={{ width:"100%", height:40, border:`1px solid ${T.border}`, borderRadius:10, paddingLeft:24, fontSize:14, fontFamily:"inherit", outline:"none", background:T.bgPage }}
                    />
                  </div>
                  <button onClick={()=>saveEdit(item.id)} style={{ height:40, padding:"0 18px", border:"none", borderRadius:10, background:T.tealDark, color:"#FFF", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Save ✓</button>
                  <button onClick={cancelEdit} style={{ height:40, padding:"0 14px", border:`1px solid ${T.border}`, borderRadius:10, background:"transparent", color:T.text2, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
                </div>
              </div>
            );

            return (
              <div key={item.id} style={{ ...rowBase, background: isConfirmed ? T.bgAccent : T.bgCard, border:`1.5px solid ${isConfirmed ? T.tealDark : T.border}` }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                  {/* Confirm checkbox */}
                  <button
                    onClick={() => !isConfirmed && confirmItem(item.id)}
                    style={{ width:26, height:26, borderRadius:999, border:`2px solid ${isConfirmed ? T.tealDark : "#CCC"}`, background: isConfirmed ? T.tealDark : "transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor: isConfirmed ? "default" : "pointer", flexShrink:0, fontSize:13, fontWeight:700, color:"#FFF", fontFamily:"inherit", marginTop:1 }}
                  >{isConfirmed ? "✓" : ""}</button>

                  {/* Content */}
                  <div style={{ flex:1, display:"grid", gap:4 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                      <span style={{ fontSize:14, fontWeight:600, color: isConfirmed ? T.tealDark : T.text1 }}>{item.label}</span>
                      {item.userAdded && (
                        <span style={{ fontSize:10, fontWeight:600, color:T.tealDark, background:"rgba(0,102,87,0.1)", borderRadius:999, padding:"2px 7px" }}>You added this</span>
                      )}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:600, color: isConfirmed ? T.tealDark : T.text1 }}>${item.amount.toFixed(2)}</span>
                      <span style={{ fontSize:11, color:T.text3, background:T.bgPage, border:`1px solid ${T.border}`, borderRadius:999, padding:"2px 8px" }}>{item.frequency}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <button onClick={()=>startEdit(item)} style={{ fontSize:12, color:T.text3, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", padding:"4px 2px" }}>Edit</button>
                    <button onClick={()=>removeItem(item.id)} style={{ width:28, height:28, borderRadius:999, border:"none", background:"rgba(206,41,63,0.08)", color:T.red, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" }}>×</button>
                  </div>
                </div>

                {/* Unconfirmed CTA */}
                {!isConfirmed && (
                  <button onClick={()=>confirmItem(item.id)} style={{ height:38, border:`1.5px solid ${T.tealDark}`, borderRadius:999, background:"transparent", color:T.tealDark, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                    ✓ Confirm this bill
                  </button>
                )}
              </div>
            );
          })}

          {/* Add form */}
          {showAdd ? (
            <div style={{ ...rowBase, background:T.bgCard, border:`1.5px solid ${T.tealDark}` }}>
              <p style={{ margin:0, fontSize:11, color:T.tealDark, fontWeight:600, letterSpacing:"0.4px" }}>ADD A BILL</p>
              <input placeholder="Bill name" value={newLabel} onChange={e=>setNewLabel(e.target.value)} style={{ height:40, border:`1px solid ${T.border}`, borderRadius:10, padding:"0 12px", fontSize:14, fontFamily:"inherit", outline:"none", background:T.bgPage }} />
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ position:"relative", flex:1 }}>
                  <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:T.text3 }}>$</span>
                  <input type="number" placeholder="Amount" value={newAmt} onChange={e=>setNewAmt(e.target.value)} style={{ width:"100%", height:40, border:`1px solid ${T.border}`, borderRadius:10, paddingLeft:24, fontSize:14, fontFamily:"inherit", outline:"none", background:T.bgPage }} />
                </div>
                <button onClick={addManual} style={{ height:40, padding:"0 18px", border:"none", borderRadius:10, background:T.tealDark, color:"#FFF", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Add</button>
                <button onClick={()=>{ setShowAdd(false); setNewLabel(""); setNewAmt(""); }} style={{ height:40, padding:"0 14px", border:`1px solid ${T.border}`, borderRadius:10, background:"transparent", color:T.text2, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setShowAdd(true)} style={{ background:"none", border:`1.5px dashed ${T.border}`, borderRadius:14, padding:"14px", fontSize:13, color:T.tealDark, fontWeight:600, cursor:"pointer", textAlign:"center", fontFamily:"inherit" }}>
              + Add a bill we missed
            </button>
          )}
        </div>

        {/* Soft delete restore strip */}
        {removed.length > 0 && (
          <div style={{ display:"grid", gap:8 }}>
            <p style={{ margin:0, fontSize:12, color:T.text3 }}>
              Removed items (not included). Restore any accidental removals before continuing.
            </p>
            {removed.map(item => (
              <div key={item.id} style={{ border:`1px dashed ${T.redBorder}`, borderRadius:12, background:T.bgNegative, padding:"10px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                <div>
                  <p style={{ margin:0, fontSize:13, fontWeight:600, color:T.red }}>{item.label}</p>
                  <p style={{ margin:"2px 0 0", fontSize:12, color:T.text3 }}>${item.amount.toFixed(2)} · {item.frequency}</p>
                </div>
                <button onClick={()=>restoreItem(item.id)} style={{ height:34, padding:"0 12px", border:`1px solid ${T.redBorder}`, borderRadius:999, background:"#FFF", color:T.red, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Progress summary */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ flex:1, height:4, borderRadius:999, background:T.border, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${Math.round((confirmedCount / Math.max(items.length, 1)) * 100)}%`, background:T.tealDark, borderRadius:999, transition:"width 200ms ease" }} />
          </div>
          <span style={{ fontSize:12, color:T.text3, whiteSpace:"nowrap" }}>{confirmedCount} of {items.length} confirmed</span>
        </div>

        {/* CTA — gated on at least 1 confirmed */}
        <div style={{ display:"grid", gap:8 }}>
          <button
            onClick={canProceed ? onComplete : undefined}
            style={{ height:52, border:"none", borderRadius:999, background: canProceed ? T.tealDark : T.border, color: canProceed ? "#FFF" : T.text3, fontWeight:600, fontSize:15, cursor: canProceed ? "pointer" : "default", fontFamily:"inherit", transition:"all 120ms ease" }}
          >
            Looks right, show my Cash Flow →
          </button>
          {!canProceed && (
            <p style={{ margin:0, fontSize:12, color:T.text3, textAlign:"center" }}>Confirm at least one bill to continue.</p>
          )}
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 4B-INCOME — PAYCHECK CONFIRMATION
═══════════════════════════════════════════════════════════════════ */
function PaycheckConfirmScreen({
  signal, onBack, onConfirmDetected, onUseManual, onUseDirectDeposit,
}: {
  signal: PaycheckSignal;
  onBack: () => void;
  onConfirmDetected: () => void;
  onUseManual: () => void;
  onUseDirectDeposit: () => void;
}) {
  const [amount, setAmount] = useState("1320");
  const [freq, setFreq]     = useState<PayFreq>("biweekly");
  const [date, setDate]     = useState("Apr 14");
  const [showManual, setShowManual] = useState(false);
  const [manualAmount, setManualAmount] = useState("1200");
  const [manualFreq, setManualFreq] = useState<PayFreq>("biweekly");
  const [manualDate, setManualDate] = useState("Apr 15");

  if (signal === "detected") {
    return (
      <div>
        <NavBar title="" onBack={onBack} />
        <div style={{ padding:"4px 20px 28px", display:"grid", gap:18 }}>
          <div style={{ display:"grid", gap:8 }}>
            <h1 style={{ margin:0, fontSize:22, lineHeight:"30px", fontWeight:600, letterSpacing:"-0.5px" }}>We found your paycheck</h1>
            <p style={{ margin:0, fontSize:14, color:T.text2, lineHeight:"20px" }}>
              Confirm or edit this so we can calculate your Cash Flow with higher confidence.
            </p>
          </div>
          <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, padding:"14px 14px", display:"grid", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:13, color:T.text3, fontWeight:600 }}>Detected source</span>
              <span style={{ fontSize:12, color:T.tealDark, background:T.bgAccent, borderRadius:999, padding:"3px 9px", fontWeight:600 }}>Payroll match</span>
            </div>
            <p style={{ margin:0, fontSize:15, fontWeight:600 }}>MoneyLion Financial (Employer)</p>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:T.text3 }}>$</span>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} style={{ width:"100%", height:42, border:`1px solid ${T.border}`, borderRadius:10, paddingLeft:24, fontSize:14, fontWeight:600, fontFamily:"inherit", background:T.bgPage, outline:"none" }} />
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {FREQ_OPTIONS.map(o => <Chip key={o.value} label={o.label} selected={freq===o.value} onClick={()=>{ setFreq(o.value); setDate(PAY_DATES[o.value][0]); }} />)}
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {PAY_DATES[freq].map(d => <Chip key={d} label={d} selected={date===d} onClick={()=>setDate(d)} />)}
            </div>
          </div>
          <PrimaryBtn label="Confirm income and continue →" onClick={onConfirmDetected} bg={T.tealDark} />
          <button onClick={onUseDirectDeposit} style={{ height:42, border:`1px solid ${T.tealDark}`, borderRadius:999, background:"transparent", color:T.tealDark, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            Set up direct deposit instead
          </button>
          <button onClick={onUseManual} style={{ background:"none", border:"none", color:T.text2, fontSize:13, cursor:"pointer", padding:0, fontFamily:"inherit" }}>
            This looks wrong — I will enter it manually
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar title="" onBack={onBack} />
      <div style={{ padding:"4px 20px 28px", display:"grid", gap:18 }}>
        <div style={{ display:"grid", gap:8 }}>
          <h1 style={{ margin:0, fontSize:22, lineHeight:"30px", fontWeight:600, letterSpacing:"-0.5px" }}>We could not find a clear paycheck yet</h1>
          <p style={{ margin:0, fontSize:14, color:T.text2, lineHeight:"20px" }}>
            We found bills, but your income pattern is unclear. Set up direct deposit for the most accurate Cash Flow.
          </p>
        </div>
        <div style={{ background:T.bgAccent, border:`1px solid ${T.border}`, borderRadius:16, padding:"14px 14px", display:"grid", gap:8 }}>
          <p style={{ margin:0, fontSize:13, color:T.text2 }}>Recommended</p>
          <p style={{ margin:0, fontSize:15, fontWeight:600 }}>Set up direct deposit with RoarMoney</p>
          <p style={{ margin:0, fontSize:13, color:T.text2, lineHeight:"18px" }}>Income updates automatically and improves confidence in your weekly number.</p>
        </div>
        <PrimaryBtn label="Set up direct deposit →" onClick={onUseDirectDeposit} bg={T.tealDark} />
        {showManual ? (
          <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, padding:"12px 12px", display:"grid", gap:10 }}>
            <p style={{ margin:0, fontSize:12, color:T.text3, fontWeight:600 }}>ENTER PAYCHECK MANUALLY</p>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:T.text3 }}>$</span>
              <input type="number" value={manualAmount} onChange={e=>setManualAmount(e.target.value)} style={{ width:"100%", height:40, border:`1px solid ${T.border}`, borderRadius:10, paddingLeft:24, fontSize:14, fontFamily:"inherit", background:T.bgPage, outline:"none" }} />
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {FREQ_OPTIONS.map(o => <Chip key={o.value} label={o.label} selected={manualFreq===o.value} onClick={()=>{ setManualFreq(o.value); setManualDate(PAY_DATES[o.value][0]); }} />)}
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {PAY_DATES[manualFreq].map(d => <Chip key={d} label={d} selected={manualDate===d} onClick={()=>setManualDate(d)} />)}
            </div>
            <button onClick={onUseManual} style={{ height:40, border:`1px solid ${T.tealDark}`, borderRadius:999, background:"transparent", color:T.tealDark, fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
              Save manual paycheck and continue
            </button>
          </div>
        ) : (
          <button onClick={()=>setShowManual(true)} style={{ background:"none", border:"none", color:T.tealDark, fontSize:13, fontWeight:600, cursor:"pointer", textAlign:"left", padding:0, fontFamily:"inherit" }}>
            Enter paycheck manually instead
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 4B-RECON — MANUAL TO BV RECONCILIATION (D2)
═══════════════════════════════════════════════════════════════════ */
function ReconciliationScreen({
  onBack, onComplete,
}: {
  onBack: () => void; onComplete: (keptUnmatchedManual: number) => void;
}) {
  const [rows, setRows] = useState<ReconRow[]>(INITIAL_RECON_ROWS);
  const setDecision = (id: string, decision: ReconDecision) => setRows(prev => prev.map(r => r.id === id ? { ...r, decision } : r));
  const allResolved = rows.every(r => !!r.decision);
  const keptUnmatchedManual = rows.filter(r => r.type === "unmatched-manual" && r.decision === "keep").length;

  const ChoiceBtn = ({
    active, label, onClick,
  }: {
    active: boolean; label: string; onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      style={{
        height: 34, padding: "0 12px", borderRadius: 999, cursor: "pointer",
        border: `1.5px solid ${active ? T.tealDark : T.border}`,
        background: active ? T.bgAccent : T.bgCard,
        color: active ? T.tealDark : T.text2, fontSize: 12, fontWeight: 600, fontFamily: "inherit",
      }}
    >{label}</button>
  );

  return (
    <div>
      <NavBar title="" onBack={onBack} />
      <div style={{ padding:"4px 20px 32px", display:"grid", gap:18 }}>
        <div style={{ display:"grid", gap:6 }}>
          <h1 style={{ margin:0, fontSize:22, lineHeight:"30px", fontWeight:600, letterSpacing:"-0.5px" }}>Let's check what changed</h1>
          <p style={{ margin:0, fontSize:14, color:T.text2, lineHeight:"20px" }}>
            We compared what you entered with what we found. Review any differences.
          </p>
        </div>

        <div style={{ display:"grid", gap:10 }}>
          {rows.map(row => (
            <div key={row.id} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:"12px 14px", display:"grid", gap:8 }}>
              {row.type === "conflict" && (
                <>
                  <p style={{ margin:0, fontSize:14, fontWeight:600 }}>{row.label}</p>
                  <p style={{ margin:0, fontSize:13, color:T.text2 }}>
                    You entered: <strong>{fmt(row.manualAmount ?? 0)}</strong> · We found: <strong>{fmt(row.detectedAmount ?? 0)}</strong>
                  </p>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <ChoiceBtn active={row.decision==="keep-mine"} label="Keep mine" onClick={()=>setDecision(row.id, "keep-mine")} />
                    <ChoiceBtn active={row.decision==="use-detected"} label="Use detected" onClick={()=>setDecision(row.id, "use-detected")} />
                  </div>
                </>
              )}

              {row.type === "unmatched-manual" && (
                <>
                  <p style={{ margin:0, fontSize:14, fontWeight:600 }}>{row.label}</p>
                  <p style={{ margin:0, fontSize:13, color:T.text2 }}>
                    We did not find this in linked activity. Keep as an obligation?
                  </p>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <ChoiceBtn active={row.decision==="keep"} label="Keep" onClick={()=>setDecision(row.id, "keep")} />
                    <ChoiceBtn active={row.decision==="remove"} label="Remove" onClick={()=>setDecision(row.id, "remove")} />
                  </div>
                </>
              )}

              {row.type === "new-detected" && (
                <>
                  <p style={{ margin:0, fontSize:14, fontWeight:600 }}>{row.label}</p>
                  <p style={{ margin:0, fontSize:13, color:T.text2 }}>
                    We found this recurring payment: <strong>{fmt(row.detectedAmount ?? 0)}</strong>. Add it?
                  </p>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <ChoiceBtn active={row.decision==="add"} label="Add" onClick={()=>setDecision(row.id, "add")} />
                    <ChoiceBtn active={row.decision==="skip"} label="Skip" onClick={()=>setDecision(row.id, "skip")} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <p style={{ margin:0, fontSize:12, color:T.text3, lineHeight:"18px" }}>
          Any manual entries you keep stay as user-confirmed obligations until you remove them later in Settings.
        </p>

        <button
          onClick={allResolved ? () => onComplete(keptUnmatchedManual) : undefined}
          style={{ height:52, border:"none", borderRadius:999, background: allResolved ? T.tealDark : T.border, color: allResolved ? "#FFF" : T.text3, fontWeight:600, fontSize:15, cursor: allResolved ? "pointer" : "default", fontFamily:"inherit" }}
        >
          Confirm and continue →
        </button>
        {!allResolved && (
          <p style={{ margin:0, fontSize:12, color:T.text3, textAlign:"center" }}>Resolve each row to continue.</p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 4C — JOINT ACCOUNT INTERSTITIAL (D8)
═══════════════════════════════════════════════════════════════════ */
function JointAccountScreen({ bank, onConfirm }: { bank: string; onConfirm: (share: number | null) => void }) {
  const [choice, setChoice] = useState<"full" | "share">("full");
  const [pct, setPct] = useState(50);

  const OptionCard = ({
    title, desc, selected, onClick, children,
  }: {
    id?: string; title: string; desc: string; selected: boolean;
    onClick: () => void; children?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      style={{
        background: selected ? T.bgAccent : T.bgCard,
        border: `1.5px solid ${selected ? T.tealDark : T.border}`,
        borderRadius: 16, padding: "14px 16px", textAlign: "left",
        cursor: "pointer", display: "grid", gap: 6, fontFamily: "inherit",
        transition: "all 120ms ease", width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 20, height: 20, borderRadius: 999, border: `2px solid ${selected ? T.tealDark : "#CCC"}`,
          background: selected ? T.tealDark : "transparent", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {selected && <div style={{ width: 8, height: 8, borderRadius: 999, background: "#FFF" }} />}
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: T.text1 }}>{title}</span>
      </div>
      <p style={{ margin: "0 0 0 30px", fontSize: 13, lineHeight: "18px", color: T.text2 }}>{desc}</p>
      {children}
    </button>
  );

  return (
    <div>
      <NavBar title="" />
      <div style={{ padding: "4px 20px 32px", display: "grid", gap: 24 }}>

        {/* Header */}
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: T.bgWarning, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👥</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, lineHeight: "32px", letterSpacing: "-0.5px" }}>This looks like a joint account</h1>
          <p style={{ margin: 0, fontSize: 15, color: T.text2, lineHeight: "22px" }}>
            We detected that your <strong>{bank}</strong> account may be shared. How should we count this balance in your Cash Flow?
          </p>
        </div>

        {/* Options */}
        <div style={{ display: "grid", gap: 10 }}>
          <OptionCard
            id="full"
            title="Use full balance"
            desc="Count the entire account balance as yours. Useful if you manage all the money in this account."
            selected={choice === "full"}
            onClick={() => setChoice("full")}
          />
          <OptionCard
            id="share"
            title="Use my share only"
            desc="Count only your portion. We will apply your chosen percentage to the balance."
            selected={choice === "share"}
            onClick={() => setChoice("share")}
          >
            {choice === "share" && (
              <div style={{ margin: "8px 0 0 30px", display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={e => { e.stopPropagation(); setPct(p => Math.max(5, p - 5)); }}
                  style={{ width: 36, height: 36, borderRadius: 999, border: `1.5px solid ${T.border}`, background: T.bgPage, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
                >−</button>
                <div style={{ textAlign: "center", minWidth: 56 }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 600, color: T.tealDark }}>{pct}%</p>
                  <p style={{ margin: 0, fontSize: 11, color: T.text3 }}>my share</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setPct(p => Math.min(95, p + 5)); }}
                  style={{ width: 36, height: 36, borderRadius: 999, border: `1.5px solid ${T.border}`, background: T.bgPage, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
                >+</button>
                <p style={{ margin: 0, fontSize: 13, color: T.text2 }}>
                  = <strong style={{ color: T.text1 }}>${Math.round(1684 * (pct / 100)).toLocaleString()}</strong> counted
                </p>
              </div>
            )}
          </OptionCard>
        </div>

        {/* Disclosure note */}
        <p style={{ margin: 0, fontSize: 12, color: T.text3, lineHeight: "18px", padding: "0 2px" }}>
          Your choice is saved and shown as a badge on this account in your Cash Flow view. You can change it anytime in Settings › Cash Flow › Account settings.
        </p>

        <PrimaryBtn
          label="Confirm and continue →"
          onClick={() => onConfirm(choice === "full" ? null : pct)}
          bg={T.tealDark}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCREEN 5 — CASH FLOW FEATURE
═══════════════════════════════════════════════════════════════════ */
function LinkBankPrompt({ accountState, onLinkBank }: { accountState: AccountState; onLinkBank: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const isManual    = accountState === "manual-only";
  const isRoarOnly  = accountState === "roarmoney-only" || accountState === "roarmoney-dd";
  if (!isManual && !isRoarOnly) return null;

  const heading = isManual
    ? "Get a more accurate number"
    : "See your full financial picture";
  const body = isManual
    ? "Your Cash Flow is based on what you entered manually. Link your bank account for a real-time view that updates automatically."
    : "Your number is based on RoarMoney data only. Link your main spending account for a more complete and accurate Cash Flow.";
  const cta = isManual ? "Link my bank account" : "Link another account";

  return (
    <div style={{
      background: T.bgAccent, border: `1px solid ${T.border}`,
      borderRadius: 20, padding: 16, display: "grid", gap: 12, position: "relative",
    }}>
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute", top: 12, right: 12, width: 28, height: 28,
          borderRadius: 999, border: "none", background: "rgba(0,0,0,0.06)",
          cursor: "pointer", fontSize: 15, color: T.text3, display: "flex",
          alignItems: "center", justifyContent: "center", fontFamily: "inherit",
          lineHeight: 1,
        }}
        aria-label="Dismiss"
      >×</button>
      <div style={{ paddingRight: 32 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.tealDark }}>{heading}</p>
        <p style={{ margin: "4px 0 0", fontSize: 13, lineHeight: "19px", color: T.text2 }}>{body}</p>
      </div>
      <button
        onClick={onLinkBank}
        style={{
          height: 44, border: "none", borderRadius: 999, background: T.tealDark,
          color: "#FFF", fontWeight: 600, fontSize: 13, cursor: "pointer",
          fontFamily: "inherit", transition: "opacity 120ms ease",
        }}
      >{cta} →</button>
      <p style={{ margin: 0, fontSize: 11, color: T.text3 }}>
        Dismissed? You can always find this in Settings › Cash Flow › Improve your accuracy.
      </p>
    </div>
  );
}

function CashFlowScreen({
  accountState, risk, linkedOverlay, linkedIncomeStatus, carriedManualObligations, isJointAccount, jointShare, onBack, onLinkBank,
}: {
  accountState:AccountState; risk:RiskLevel; linkedOverlay:LinkedOverlay; linkedIncomeStatus:LinkedIncomeStatus;
  carriedManualObligations:number; isJointAccount:boolean; jointShare:number|null; onBack:()=>void; onLinkBank:()=>void;
}) {
  const profile =
    accountState === "manual-only" ? "manual"
      : accountState === "bv-linked" ? "linked"
      : "partial";
  const m = CF[profile][risk];
  const [expanded, setExpanded] = useState(false);

  const isLinked      = profile !== "manual";
  const isReconnect   = isLinked && linkedOverlay === "reconnect";
  const isStillLearning = isLinked && linkedOverlay === "still-learning";
  const isMissingTx   = isLinked && linkedOverlay === "missing-tx";

  const confidenceBadge: Confidence =
    isReconnect     ? "Unreliable"
    : isStillLearning ? "Still learning"
    : profile === "partial" ? "Partial view"
    : profile === "linked" && (linkedIncomeStatus === "confirmed" || linkedIncomeStatus === "dd") ? "High confidence"
    : profile === "linked" ? "Medium confidence"
    : m.confidence;

  return (
    <div>
      <NavBar title="Cash Flow" onBack={onBack} />
      <div style={{ padding:"4px 16px 28px", display:"grid", gap:12 }}>

        {/* Reconnect needed — top-of-screen persistent alert (D13) */}
        {isReconnect && (
          <div style={{ background:T.bgNegative, border:`1.5px solid ${T.redBorder}`, borderRadius:20, padding:16, display:"grid", gap:10 }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
              <span style={{ fontSize:18, lineHeight:"22px" }}>⚠️</span>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontSize:14, fontWeight:600, color:T.red }}>Your Chase connection needs attention</p>
                <p style={{ margin:"4px 0 0", fontSize:13, lineHeight:"19px", color:T.text2 }}>Your number may be unreliable until you reconnect. This is different from a data delay — we need you to re-authorize to continue.</p>
              </div>
            </div>
            <button style={{ height:48, border:"none", borderRadius:999, background:T.red, color:"#FFF", fontWeight:600, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
              Reconnect Chase →
            </button>
          </div>
        )}

        {/* Hero */}
        <div style={{ background:T.bgCard, border:`1px solid ${isReconnect ? T.redBorder : T.border}`, borderRadius:20, padding:20, display:"grid", gap:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, flexWrap:"wrap" }}>
            <Badge label={STATUS_COPY[risk]}  color={STATUS_COLOR[risk]}  bg={STATUS_BG[risk]}  />
            <Badge label={confidenceBadge}    color={CONF_COLOR[confidenceBadge]} bg={CONF_BG[confidenceBadge]} />
          </div>
          <div>
            <p style={{ margin:0, fontSize:11, color:T.text3, fontWeight:600, letterSpacing:"0.5px" }}>
              {profile === "manual" ? "EXPECTED AFTER BILLS" : isReconnect ? "LAST KNOWN VALUE" : "SAFE TO SPEND"}
            </p>
            <p style={{ margin:"4px 0 0", fontSize:52, lineHeight:"58px", letterSpacing:-2, fontWeight:600, color: risk==="short" ? T.red : isReconnect ? T.text3 : T.text1, opacity: isReconnect ? 0.6 : 1 }}>
              {fmt(m.safeToSpend)}
            </p>
            <p style={{ margin:"6px 0 0", fontSize:12, color:T.text3 }}>
              {profile === "manual"
                ? `Based on your ${m.asOf} update · Next paycheck ${m.nextPayday}`
                : isReconnect
                ? `Last synced ${m.asOf} — may not reflect recent activity`
                : `As of ${m.asOf} · Next paycheck ${m.nextPayday}`}
            </p>
          </div>
          {profile === "manual" ? <PaycheckBar model={m} /> : <SpendBar model={m} />}

          {/* Missing transactions banner (D16) */}
          {isMissingTx && (
            <div style={{ background:T.bgWarning, border:`1px solid ${T.yellowBorder}`, borderRadius:12, padding:"10px 12px" }}>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:T.yellow }}>Some recent spending may not be reflected yet</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:T.text2 }}>Balance updated · Transactions last synced: Today, 8:04 AM</p>
            </div>
          )}

          {/* Stale data banner */}
          {m.stale && !isReconnect && (
            <div style={{ background:T.bgWarning, border:`1px solid ${T.yellowBorder}`, borderRadius:12, padding:"10px 12px" }}>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:T.yellow }}>Some linked data is delayed</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:T.text2 }}>This number may be lower confidence until your accounts refresh.</p>
            </div>
          )}

          {/* Still learning banner (D12) */}
          {isStillLearning && (
            <div style={{ background:T.bgWarning, border:`1px solid ${T.yellowBorder}`, borderRadius:12, padding:"10px 12px" }}>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:T.yellow }}>We are still building your pattern</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:T.text2 }}>Your number gets more accurate over the next few weeks as we learn your spending habits.</p>
            </div>
          )}

          {profile === "linked" && linkedIncomeStatus !== "confirmed" && linkedIncomeStatus !== "dd" && !isReconnect && !isStillLearning && (
            <div style={{ background:T.bgWarning, border:`1px solid ${T.yellowBorder}`, borderRadius:12, padding:"10px 12px" }}>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:T.yellow }}>Income signal needs confirmation</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:T.text2 }}>Bills are linked, but paycheck timing or amount still needs confirmation for full-confidence Cash Flow.</p>
            </div>
          )}

          <button style={{ height:52, border:"none", borderRadius:999, background: risk==="short" ? T.red : T.text1, color:"#FFF", fontWeight:600, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>
            {profile === "manual"
              ? "Review my entries"
              : isReconnect
              ? "Reconnect to update"
              : risk === "short" ? "See coverage options" : "Plan this week"}
          </button>
        </div>

        {/* Soft BV-link prompt — manual and RoarMoney-only states (D1) */}
        <LinkBankPrompt accountState={accountState} onLinkBank={onLinkBank} />

        {/* Instacash nudge — short state, linked users only, not when reconnect needed */}
        {risk === "short" && profile !== "manual" && !isReconnect && (
          <div style={{ background:T.bgNegative, border:`1px solid ${T.redBorder}`, borderRadius:20, padding:20, display:"grid", gap:10 }}>
            <p style={{ margin:0, fontSize:15, fontWeight:600, color:T.red }}>You may come up short before {m.nextPayday}</p>
            <p style={{ margin:0, fontSize:14, lineHeight:"20px", color:T.text2 }}>Instacash can cover the gap up to your limit, with no interest and no late fees.</p>
            <p style={{ margin:0, fontSize:11, color:T.text3 }}>Why now: your committed bills exceed your current balance before next payday.</p>
            <button style={{ height:48, border:`1.5px solid ${T.red}`, borderRadius:999, background:"transparent", color:T.red, fontWeight:600, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>Check my Instacash limit</button>
          </div>
        )}

        {/* Why this number */}
        <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, padding:20, display:"grid", gap:10 }}>
          <button onClick={()=>setExpanded(!expanded)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:"inherit" }}>
            <h2 style={{ margin:0, fontSize:16, fontWeight:600, letterSpacing:"-0.3px" }}>How we got this number</h2>
            <span style={{ color:T.text3, fontSize:20, display:"inline-block", transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition:"transform 200ms ease" }}>›</span>
          </button>

          {profile === "manual" ? (
            <>
              {[
                [`Next paycheck (${m.nextPayday})`, fmt(m.balance),         false],
                [`Bills due before ${m.nextPayday}`, fmt(-m.committedTotal), false],
              ].map(([l,v]) => (
                <div key={l as string} style={{ display:"flex", justifyContent:"space-between", padding:"2px 0" }}>
                  <span style={{ fontSize:14, color:T.text1 }}>{l as string}</span>
                  <span style={{ fontSize:14, fontWeight:600, color:T.text1 }}>{v as string}</span>
                </div>
              ))}
              <div style={{ height:1, background:T.border, margin:"4px 0" }} />
              <div style={{ display:"flex", justifyContent:"space-between", padding:"2px 0" }}>
                <span style={{ fontSize:14, fontWeight:600, color: m.safeToSpend < 0 ? T.red : T.tealDark }}>Expected after bills</span>
                <span style={{ fontSize:14, fontWeight:600, color: m.safeToSpend < 0 ? T.red : T.tealDark }}>{fmt(m.safeToSpend)}</span>
              </div>
              {expanded && <p style={{ margin:"4px 0 0", fontSize:12, color:T.text3, lineHeight:"18px" }}>Based only on what you entered. This does not account for everyday spending — link your bank for a real-time view.</p>}
            </>
          ) : (
            <>
              {[
                ["Current balance (checking)",    fmt(m.balance),                false],
                ["Committed obligations",          fmt(-m.committedTotal),        false],
                ["Estimated variable spend",       fmt(-m.estimatedVariable),     true ],
                ...(m.buffer > 0 ? [["Safety buffer", fmt(-m.buffer), true] as [string,string,boolean]] : []),
              ].map(([l,v,dim],i,arr) => (
                <div key={l as string}>
                  {i === arr.length-1 && <div style={{ height:1, background:T.border, margin:"4px 0" }} />}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"2px 0" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:14, color: dim ? T.text2 : T.text1 }}>{l as string}</span>
                      {i === 0 && isJointAccount && (
                        <span style={{ fontSize:10, fontWeight:600, color:T.yellow, background:T.bgWarning, borderRadius:999, padding:"2px 7px" }}>
                          Joint account{jointShare !== null ? ` · ${jointShare}% share` : " · Full balance"}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize:14, fontWeight:600, color: dim ? T.text2 : T.text1 }}>{v as string}</span>
                  </div>
                </div>
              ))}
              {/* Savings informational row — visible in breakdown but not in STS (D15) */}
              {m.savings !== undefined && m.savings > 0 && (
                <div style={{ background:T.bgAccent, borderRadius:10, padding:"8px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:2 }}>
                  <span style={{ fontSize:12, color:T.text2 }}>Savings balance <span style={{ color:T.tealDark, fontWeight:600 }}>(not counted in Safe to Spend)</span></span>
                  <span style={{ fontSize:13, fontWeight:600, color:T.tealDark }}>{fmt(m.savings)}</span>
                </div>
              )}
              {expanded && <p style={{ margin:0, fontSize:12, color:T.text3, lineHeight:"18px" }}>Estimated variable spend is based on your recent transaction patterns. It is not a guarantee.</p>}
            </>
          )}
        </div>

        {profile !== "manual" && carriedManualObligations > 0 && (
          <div style={{ background:T.bgWarning, border:`1px solid ${T.yellowBorder}`, borderRadius:14, padding:"10px 12px" }}>
            <p style={{ margin:0, fontSize:13, color:T.text2 }}>
              Includes <strong>{carriedManualObligations}</strong> user-confirmed manual obligation{carriedManualObligations > 1 ? "s" : ""} that were not matched in linked data.
            </p>
          </div>
        )}

        {/* Upcoming payments */}
        <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, padding:20, display:"grid", gap:10 }}>
          <h2 style={{ margin:0, fontSize:16, fontWeight:600, letterSpacing:"-0.3px" }}>
            {profile === "manual" ? "Bills you entered" : "Upcoming committed payments"}
          </h2>
          {m.committed.map(item => (
            <div key={item.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", borderRadius:12, background:T.bgPage, border:`1px solid ${T.border}` }}>
              <div>
                <p style={{ margin:0, fontSize:14, fontWeight:600 }}>{item.label}</p>
                <p style={{ margin:"2px 0 0", fontSize:12, color:T.text3 }}>Due {item.date}</p>
              </div>
              <span style={{ fontSize:14, fontWeight:600, color:T.red }}>{fmt(-item.amount)}</span>
            </div>
          ))}

          {/* Pending transactions (D10) — lighter treatment, distinct from confirmed */}
          {profile !== "manual" && m.pendingTx && m.pendingTx.length > 0 && (
            <>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0 2px" }}>
                <div style={{ flex:1, height:1, background:T.border }} />
                <span style={{ fontSize:11, color:T.text3, fontWeight:600, whiteSpace:"nowrap" }}>PENDING</span>
                <div style={{ flex:1, height:1, background:T.border }} />
              </div>
              {m.pendingTx.map(tx => (
                <div key={tx.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", borderRadius:12, background:T.bgPage, border:`1px dashed ${T.border}`, opacity:0.7 }}>
                  <div>
                    <p style={{ margin:0, fontSize:14, fontWeight:600, color:T.text2 }}>{tx.label} — Pending</p>
                    <p style={{ margin:"2px 0 0", fontSize:12, color:T.text3 }}>Authorised {tx.date} · Not yet cleared</p>
                  </div>
                  <span style={{ fontSize:14, fontWeight:600, color:T.text2 }}>{fmt(-tx.amount)}</span>
                </div>
              ))}
            </>
          )}

          <button style={{ background:"none", border:"none", color:T.tealDark, fontSize:13, fontWeight:600, cursor:"pointer", textAlign:"left", padding:0, fontFamily:"inherit" }}>
            {profile === "manual" ? "Edit my bills ›" : "Something look wrong? Flag it"}
          </button>
        </div>

        {/* Next step */}
        <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, padding:20, display:"grid", gap:8 }}>
          <h2 style={{ margin:0, fontSize:16, fontWeight:600, letterSpacing:"-0.3px" }}>Recommended next step</h2>
          <p style={{ margin:0, fontSize:14, lineHeight:"20px", color:T.text2 }}>
            {profile === "manual"
              ? (risk === "short"
                  ? `Your bills exceed your paycheck before ${m.nextPayday}. Review your bill amounts — or link your bank for a more accurate picture.`
                  : risk === "tight"
                  ? `Your expected remainder is under $100. Double-check your bill amounts and paycheck date to make sure this is right.`
                  : `You look good based on what you entered. Link your bank for a real-time view that updates automatically.`)
              : (risk === "short"
                  ? `You may not make it to payday at your current pace. See options to cover this week and avoid an overdraft.`
                  : risk === "tight"
                  ? `You have less than $100 left. Avoid non-essential spend until your next paycheck on ${m.nextPayday}.`
                  : `You are in good shape this week. Consider moving any surplus to savings before payday.`)}
          </p>
          <p style={{ margin:0, fontSize:12, color:T.text3 }}>
            {profile === "manual"
              ? "Based on the paycheck amount and bills you entered."
              : "Based on your next 7 days of bills and your latest account activity."}
          </p>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   APP — NAVIGATION + FRAME
═══════════════════════════════════════════════════════════════════ */
const SCREEN_LABELS: Record<Screen, string> = {
  "accounts":         "Accounts page",
  "splash":           "Feature intro",
  "link-bank":        "Link bank",
  "link-connecting":  "Connecting",
  "joint-account":    "Joint account",
  "bill-review":      "Bill review",
  "paycheck-confirm": "Paycheck confirm",
  "reconciliation":   "Reconciliation",
  "manual-paycheck":  "Manual: paycheck",
  "manual-bills":     "Manual: bills",
  "cashflow":         "Cash Flow",
};

export default function App() {
  const [screen,  setScreen]  = useState<Screen>("accounts");
  const [accountState, setAccountState] = useState<AccountState>("new-user");
  const [risk,    setRisk]    = useState<RiskLevel>("tight");
  const [linkedOverlay, setLinkedOverlay] = useState<LinkedOverlay>("none");
  const [bank,    setBank]    = useState<string | null>(null);
  const [linkedIncomeStatus, setLinkedIncomeStatus] = useState<LinkedIncomeStatus>("unconfirmed");
  const [needsReconciliation, setNeedsReconciliation] = useState(false);
  const [carriedManualObligations, setCarriedManualObligations] = useState(0);
  const [isJointAccount, setIsJointAccount] = useState(false);
  const [jointShare,     setJointShare]     = useState<number | null>(null);
  const [simulateJoint,  setSimulateJoint]  = useState(false);
  const [simulateLowHistory, setSimulateLowHistory] = useState(false);
  const [paycheckSignal, setPaycheckSignal] = useState<PaycheckSignal>("detected");

  const go = (s: Screen) => setScreen(s);

  const handleWidgetTap = () => {
    if (accountState === "new-user") go("splash");
    else go("cashflow");
  };

  const handleBankSelect = (b: string) => { setBank(b); go("link-connecting"); };

  const handleConnected = () => {
    const wasManualUser = accountState === "manual-only";
    setAccountState("bv-linked");
    setLinkedIncomeStatus("unconfirmed");
    setNeedsReconciliation(wasManualUser);
    setCarriedManualObligations(0);
    if (simulateJoint) go("joint-account");
    else go("bill-review");
  };

  const handleJointConfirm = (share: number | null) => {
    setIsJointAccount(true);
    setJointShare(share);
    go("bill-review");
  };

  const handleBillReviewComplete = () => {
    go("paycheck-confirm");
  };

  const continueAfterIncome = () => {
    if (needsReconciliation) go("reconciliation");
    else go("cashflow");
  };

  const handleIncomeDetectedConfirm = () => {
    setLinkedIncomeStatus("confirmed");
    continueAfterIncome();
  };

  const handleIncomeManualConfirm = () => {
    setLinkedIncomeStatus("manual");
    continueAfterIncome();
  };

  const handleIncomeDDConfirm = () => {
    setLinkedIncomeStatus("dd");
    continueAfterIncome();
  };

  const handleReconciliationComplete = (keptUnmatchedManual: number) => {
    setCarriedManualObligations(keptUnmatchedManual);
    setNeedsReconciliation(false);
    go("cashflow");
  };

  const handleManualDone = () => { setAccountState("manual-only"); go("cashflow"); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #E2E2E2; }
        @keyframes shimmer { 0% { transform:translateX(-100%) } 100% { transform:translateX(100%) } }
        @keyframes bounce  { 0%,80%,100% { transform:scale(0.8); opacity:.6 } 40% { transform:scale(1.2); opacity:1 } }
        @keyframes pop     { 0% { transform:scale(0.4); opacity:0 } 70% { transform:scale(1.1) } 100% { transform:scale(1); opacity:1 } }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ minHeight:"100vh", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"32px 16px", fontFamily:"'DM Sans', -apple-system, system-ui, sans-serif", gap:28, flexWrap:"wrap" }}>

        {/* ── Controls panel ───────────────────────────────────── */}
        <div style={{ width:230, background:"#FFF", borderRadius:20, padding:20, boxShadow:"0 4px 16px rgba(0,0,0,0.08)", display:"grid", gap:20, alignSelf:"flex-start", position:"sticky", top:32 }}>
          <p style={{ margin:0, fontSize:13, fontWeight:600, color:T.text1 }}>Prototype controls</p>

          <div>
            <p style={{ margin:"0 0 8px", fontSize:10, fontWeight:600, color:T.text3, textTransform:"uppercase", letterSpacing:"0.6px" }}>Jump to screen</p>
            <div style={{ display:"grid", gap:6 }}>
              {(Object.entries(SCREEN_LABELS) as [Screen, string][]).map(([s, label]) => (
                <Chip key={s} label={label} selected={screen===s} onClick={()=>go(s)} />
              ))}
            </div>
          </div>

          <div>
            <p style={{ margin:"0 0 8px", fontSize:10, fontWeight:600, color:T.text3, textTransform:"uppercase", letterSpacing:"0.6px" }}>Widget / profile state</p>
            <div style={{ display:"grid", gap:6 }}>
              <Chip label="New user"             selected={accountState==="new-user"}      onClick={()=>setAccountState("new-user")} />
              <Chip label="Manual setup"         selected={accountState==="manual-only"}   onClick={()=>setAccountState("manual-only")} />
              <Chip label="RoarMoney only"       selected={accountState==="roarmoney-only"} onClick={()=>setAccountState("roarmoney-only")} />
              <Chip label="RoarMoney + Plaid DD" selected={accountState==="roarmoney-dd"}  onClick={()=>setAccountState("roarmoney-dd")} />
              <Chip label="External BV linked"   selected={accountState==="bv-linked"}     onClick={()=>setAccountState("bv-linked")} />
            </div>
          </div>

          <div>
            <p style={{ margin:"0 0 8px", fontSize:10, fontWeight:600, color:T.text3, textTransform:"uppercase", letterSpacing:"0.6px" }}>Cash flow risk</p>
            <div style={{ display:"grid", gap:6 }}>
              <Chip label="Ahead" selected={risk==="ahead"} onClick={()=>setRisk("ahead")} />
              <Chip label="Tight" selected={risk==="tight"} onClick={()=>setRisk("tight")} />
              <Chip label="Short" selected={risk==="short"} onClick={()=>setRisk("short")} />
            </div>
          </div>

          <div>
            <p style={{ margin:"0 0 8px", fontSize:10, fontWeight:600, color:T.text3, textTransform:"uppercase", letterSpacing:"0.6px" }}>Linked state overlay</p>
            <p style={{ margin:"0 0 8px", fontSize:10, color:T.text3, lineHeight:"14px" }}>Active on linked / RoarMoney profiles only</p>
            <div style={{ display:"grid", gap:6 }}>
              <Chip label="None"                 selected={linkedOverlay==="none"}         onClick={()=>setLinkedOverlay("none")} />
              <Chip label="Still learning"       selected={linkedOverlay==="still-learning"} onClick={()=>setLinkedOverlay("still-learning")} />
              <Chip label="Reconnect needed"     selected={linkedOverlay==="reconnect"}    onClick={()=>setLinkedOverlay("reconnect")} />
              <Chip label="Missing transactions" selected={linkedOverlay==="missing-tx"}   onClick={()=>setLinkedOverlay("missing-tx")} />
            </div>
          </div>

          <div>
            <p style={{ margin:"0 0 8px", fontSize:10, fontWeight:600, color:T.text3, textTransform:"uppercase", letterSpacing:"0.6px" }}>Onboarding flags</p>
            <div style={{ display:"grid", gap:6 }}>
              {([
                ["Simulate joint account",  simulateJoint,       setSimulateJoint],
                ["Simulate low history",    simulateLowHistory,  setSimulateLowHistory],
              ] as [string, boolean, (v:boolean)=>void][]).map(([label, active, setter]) => (
                <button key={label} onClick={() => setter(!active)}
                  style={{ height:44, padding:"0 16px", borderRadius:999, cursor:"pointer", border:`1.5px solid ${active ? T.yellow : T.border}`, background: active ? T.bgWarning : T.bgCard, color: active ? T.yellow : T.text2, fontSize:13, fontWeight:600, fontFamily:"inherit", transition:"all 120ms ease", textAlign:"left" }}
                >{active ? "✓ " : ""}{label}</button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ margin:"0 0 8px", fontSize:10, fontWeight:600, color:T.text3, textTransform:"uppercase", letterSpacing:"0.6px" }}>Paycheck signal</p>
            <div style={{ display:"grid", gap:6 }}>
              <Chip label="Detected"     selected={paycheckSignal==="detected"}     onClick={()=>setPaycheckSignal("detected")} />
              <Chip label="Not detected" selected={paycheckSignal==="not-detected"} onClick={()=>setPaycheckSignal("not-detected")} />
            </div>
          </div>

          <button onClick={()=>{ go("accounts"); setAccountState("new-user"); setRisk("tight"); setLinkedOverlay("none"); setLinkedIncomeStatus("unconfirmed"); setNeedsReconciliation(false); setCarriedManualObligations(0); setIsJointAccount(false); setJointShare(null); setSimulateJoint(false); setSimulateLowHistory(false); setPaycheckSignal("detected"); }} style={{ height:40, border:`1px solid ${T.border}`, borderRadius:999, background:"transparent", fontSize:13, fontWeight:600, color:T.text2, cursor:"pointer", fontFamily:"inherit" }}>↺ Reset flow</button>

          <p style={{ margin:0, fontSize:10, color:T.text3, lineHeight:"15px" }}>Font: DM Sans<br/>Production: Baton Turbo<br/>Tokens: MLDS 4.0</p>
        </div>

        {/* ── Phone frame ──────────────────────────────────────── */}
        <div style={{ width:390, borderRadius:52, overflow:"hidden", boxShadow:"0 24px 64px rgba(0,0,0,0.28)", background:T.bgPage, border:"8px solid #1A1A1A", flexShrink:0, display:"flex", flexDirection:"column" }}>

          {/* Status bar */}
          <div style={{ height:52, background:T.bgPage, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", fontSize:13, fontWeight:600, flexShrink:0, position:"relative" }}>
            <span>9:41</span>
            <div style={{ position:"absolute", left:"50%", transform:"translateX(-50%)", width:120, height:32, background:"#1A1A1A", borderRadius:999 }} />
            <span>5G 92%</span>
          </div>

          {/* Scrollable screen content */}
          <div style={{ flex:1, overflowY:"auto", maxHeight:730 }}>
            {screen === "accounts"        && <AccountsScreen    accountState={accountState} linkedIncomeStatus={linkedIncomeStatus} onWidgetTap={handleWidgetTap} />}
            {screen === "splash"          && <SplashScreen      onClose={()=>go("accounts")} onLinkBank={()=>go("link-bank")} onManual={()=>go("manual-paycheck")} />}
            {screen === "link-bank"       && <LinkBankScreen    onBack={()=>go("splash")}    onSelect={handleBankSelect} />}
            {screen === "link-connecting" && <LinkConnectingScreen bank={bank ?? "Chase"} onConnected={handleConnected} />}
            {screen === "joint-account"   && <JointAccountScreen bank={bank ?? "Chase"} onConfirm={handleJointConfirm} />}
            {screen === "bill-review"     && <BillReviewScreen simulateLowHistory={simulateLowHistory} onBack={()=>go("link-connecting")} onComplete={handleBillReviewComplete} />}
            {screen === "paycheck-confirm"&& <PaycheckConfirmScreen signal={paycheckSignal} onBack={()=>go("bill-review")} onConfirmDetected={handleIncomeDetectedConfirm} onUseManual={handleIncomeManualConfirm} onUseDirectDeposit={handleIncomeDDConfirm} />}
            {screen === "reconciliation"  && <ReconciliationScreen onBack={()=>go("paycheck-confirm")} onComplete={handleReconciliationComplete} />}
            {screen === "manual-paycheck" && <ManualPaycheckScreen onBack={()=>go("splash")} onContinue={()=>go("manual-bills")} />}
            {screen === "manual-bills"    && <ManualBillsScreen  onBack={()=>go("manual-paycheck")} onDone={handleManualDone} />}
            {screen === "cashflow"        && <CashFlowScreen     accountState={accountState} risk={risk} linkedOverlay={linkedOverlay} linkedIncomeStatus={linkedIncomeStatus} carriedManualObligations={carriedManualObligations} isJointAccount={isJointAccount} jointShare={jointShare} onBack={()=>go("accounts")} onLinkBank={()=>go("link-bank")} />}
          </div>

          {/* Home indicator */}
          <div style={{ height:34, background:T.bgPage, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <div style={{ width:134, height:5, borderRadius:999, background:"#1A1A1A" }} />
          </div>
        </div>

      </div>
    </>
  );
}
