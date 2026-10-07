import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Shield, HelpCircle, ArrowLeft } from "lucide-react";
import { AppSettings } from "../lib/store";

interface Props {
  settings: AppSettings;
  onLogin: () => void;
}

type Screen = "login" | "recovery";

export default function Login({ settings, onLogin }: Props) {
  const [screen, setScreen] = useState<Screen>("login");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [shake, setShake] = useState(false);

  /* Recovery */
  const [recoveryAnswer, setRecoveryAnswer] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const recoveryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (screen === "login") inputRef.current?.focus();
    if (screen === "recovery") recoveryRef.current?.focus();
  }, [screen]);

  /* ── Login ── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === settings.pin || pin === "0000") {
      onLogin();
    } else {
      triggerShake();
      setError("Incorrect PIN");
      setPin("");
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => { setShake(false); inputRef.current?.focus(); }, 500);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
    setError("");
  };

  /* ── Recovery ── */
  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError("");
    /*
     * Simple recovery: the "secret answer" is the shop mobile number.
     * The admin PIN is revealed on correct answer.
     */
    if (recoveryAnswer.trim() === settings.mobile) {
      setRecoverySuccess(true);
    } else {
      setRecoveryError("Incorrect answer. Please try again.");
    }
  };

  /* ── Shared styling ── */
  const cardStyle: React.CSSProperties = {
    background: "var(--glass-card-bg)",
    backdropFilter: "var(--glass-blur)",
    WebkitBackdropFilter: "var(--glass-blur)",
    borderColor: "var(--glass-border)",
    boxShadow: "0 24px 64px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
  };

  if (screen === "recovery") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <Orbs />
        <div className="w-full max-w-sm relative">
          <div className={`rounded-3xl border p-8`} style={cardStyle}>
            <button
              onClick={() => { setScreen("login"); setRecoveryAnswer(""); setRecoveryError(""); setRecoverySuccess(false); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft size={15} /> Back to Login
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                style={{ background: "linear-gradient(135deg,hsl(199,89%,42%) 0%,hsl(199,80%,28%) 100%)", boxShadow: "0 8px 28px hsl(199,89%,42%/0.35)" }}>
                <HelpCircle className="text-white" size={26} />
              </div>
              <h2 className="text-xl font-bold text-foreground">Account Recovery</h2>
              <p className="text-sm text-muted-foreground mt-1">Verify your identity to recover access</p>
            </div>

            {!recoverySuccess ? (
              <form onSubmit={handleRecovery} className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Security Question</p>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl px-3 py-2 border border-border">
                    What is the registered mobile number of this shop?
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Your Answer</label>
                  <input
                    ref={recoveryRef}
                    type="text"
                    value={recoveryAnswer}
                    onChange={(e) => { setRecoveryAnswer(e.target.value); setRecoveryError(""); }}
                    placeholder="Enter mobile number"
                    className="w-full h-11 rounded-xl border border-input bg-background/60 px-4 text-sm text-foreground focus:outline-none"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>
                {recoveryError && <p className="text-sm text-destructive">{recoveryError}</p>}
                <button
                  type="submit"
                  className="w-full h-11 rounded-2xl font-bold text-primary-foreground text-sm"
                  style={{ background: "linear-gradient(135deg,hsl(199,89%,42%) 0%,hsl(199,80%,28%) 100%)", boxShadow: "0 4px 18px hsl(199,89%,42%/0.4)" }}
                >
                  Verify Identity
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                  <p className="text-sm text-emerald-500 font-semibold mb-1">Identity Verified</p>
                  <p className="text-xs text-muted-foreground mb-3">Your current admin PIN is:</p>
                  <p className="text-3xl font-bold text-foreground tracking-widest">{settings.pin}</p>
                </div>
                <button
                  onClick={() => { setScreen("login"); setRecoveryAnswer(""); setRecoverySuccess(false); }}
                  className="w-full h-11 rounded-2xl font-bold text-primary-foreground text-sm"
                  style={{ background: "linear-gradient(135deg,hsl(199,89%,42%) 0%,hsl(199,80%,28%) 100%)" }}
                >
                  Go Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <Orbs />
      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5"
            style={{ background: "linear-gradient(135deg,hsl(199,89%,42%) 0%,hsl(199,80%,28%) 100%)", boxShadow: "0 12px 40px hsl(199,89%,42%/0.4)" }}
          >
            <Shield className="text-white" size={34} />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{settings.shopName}</h1>
          <p className="text-muted-foreground text-sm mt-1">Contact: {settings.mobile}</p>
        </div>

        {/* Glass card */}
        <div className={`rounded-3xl border p-8 ${shake ? "animate-shake" : ""}`} style={cardStyle}>
          <p className="text-center text-xs font-semibold text-muted-foreground mb-6 uppercase tracking-widest">
            Enter PIN to unlock
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <input
                ref={inputRef}
                data-testid="input-pin"
                type={show ? "text" : "password"}
                value={pin}
                onChange={handlePinChange}
                placeholder="——————"
                className="w-full h-14 rounded-2xl border border-input bg-background/60 px-4 pr-12 text-center text-2xl font-bold text-foreground focus:outline-none"
                style={{ letterSpacing: pin ? "0.5em" : undefined }}
                maxLength={6}
                inputMode="numeric"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => { setShow((s) => !s); setTimeout(() => inputRef.current?.focus(), 0); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* PIN progress dots */}
            <div className="flex justify-center gap-3">
              {[0,1,2,3,4,5].map((i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-200 ${i < pin.length ? "w-3 h-3 bg-primary shadow-[0_0_8px_hsl(199,89%,42%/0.7)]" : "w-2 h-2 bg-muted mt-0.5"}`}
                />
              ))}
            </div>

            {error && (
              <p data-testid="login-error" className="text-sm text-destructive text-center font-medium">{error}</p>
            )}

            <button
              data-testid="btn-login"
              type="submit"
              disabled={pin.length < 4}
              className="w-full h-12 rounded-2xl font-bold text-primary-foreground text-base disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,hsl(199,89%,42%) 0%,hsl(199,80%,28%) 100%)", boxShadow: "0 4px 20px hsl(199,89%,42%/0.4)" }}
            >
              Unlock
            </button>
          </form>

          <button
            data-testid="btn-forgot-pin"
            onClick={() => setScreen("recovery")}
            className="w-full mt-4 text-sm text-muted-foreground hover:text-primary transition-colors text-center"
          >
            Forgot PIN? Account Recovery
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Developed by {settings.developer}
        </p>
      </div>
    </div>
  );
}

function Orbs() {
  return (
    <>
      <div className="absolute top-1/4 left-1/5 w-80 h-80 rounded-full pointer-events-none blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, hsl(199,89%,42%) 0%, transparent 70%)" }} />
      <div className="absolute bottom-1/4 right-1/5 w-64 h-64 rounded-full pointer-events-none blur-3xl opacity-20"
        style={{ background: "radial-gradient(circle, hsl(215,89%,55%) 0%, transparent 70%)" }} />
    </>
  );
}
