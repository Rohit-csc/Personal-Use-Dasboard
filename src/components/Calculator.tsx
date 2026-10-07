import { useState, useEffect, useRef, useCallback } from "react";
import { Calculator, X, Minus } from "lucide-react";

export default function FloatingCalculator() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(false);

  // Drag state
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const calcRef = useRef<HTMLDivElement>(null);

  const press = useCallback((val: string) => {
    if (val === "C") {
      setDisplay("0"); setPrev(null); setOp(null); setFresh(false); return;
    }
    if (val === "+/-") { setDisplay((d) => (parseFloat(d) * -1).toString()); return; }
    if (val === "%") { setDisplay((d) => (parseFloat(d) / 100).toString()); return; }
    if (["+", "-", "*", "/"].includes(val)) {
      setPrev(parseFloat(display)); setOp(val); setFresh(true); return;
    }
    if (val === "=") {
      if (prev !== null && op) {
        const cur = parseFloat(display);
        let r = 0;
        if (op === "+") r = prev + cur;
        if (op === "-") r = prev - cur;
        if (op === "*") r = prev * cur;
        if (op === "/") r = cur !== 0 ? prev / cur : 0;
        const s = Number.isInteger(r) ? r.toString() : parseFloat(r.toFixed(8)).toString();
        setDisplay(s); setPrev(null); setOp(null); setFresh(false);
      }
      return;
    }
    if (val === ".") {
      if (fresh) { setDisplay("0."); setFresh(false); return; }
      if (!display.includes(".")) setDisplay((d) => d + "."); return;
    }
    setDisplay((d) => fresh ? val : (d === "0" ? val : d.length < 12 ? d + val : d));
    setFresh(false);
  }, [display, prev, op, fresh]);

  // Keyboard support — only when calculator is open
  useEffect(() => {
    if (!open || minimized) return;
    const handler = (e: KeyboardEvent) => {
      // Don't steal keypresses from other inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key >= "0" && e.key <= "9") press(e.key);
      else if (e.key === "+") press("+");
      else if (e.key === "-") press("-");
      else if (e.key === "*") press("*");
      else if (e.key === "/") { e.preventDefault(); press("/"); }
      else if (e.key === "Enter" || e.key === "=") press("=");
      else if (e.key === "." || e.key === ",") press(".");
      else if (e.key === "Backspace") setDisplay((d) => d.length > 1 ? d.slice(0, -1) : "0");
      else if (e.key === "Escape") setOpen(false);
      else if (e.key === "c" || e.key === "C") press("C");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, minimized, press]);

  // Drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    e.preventDefault();
  };
  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      setPos({
        x: dragStart.current.px + (e.clientX - dragStart.current.mx),
        y: dragStart.current.py + (e.clientY - dragStart.current.my),
      });
    };
    const up = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [dragging]);

  // Touch drag
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    dragStart.current = { mx: t.clientX, my: t.clientY, px: pos.x, py: pos.y };
  };
  useEffect(() => {
    const move = (e: TouchEvent) => {
      if (!calcRef.current) return;
      const t = e.touches[0];
      setPos({
        x: dragStart.current.px + (t.clientX - dragStart.current.mx),
        y: dragStart.current.py + (t.clientY - dragStart.current.my),
      });
    };
    window.addEventListener("touchmove", move, { passive: false });
    return () => window.removeEventListener("touchmove", move);
  }, []);

  const BtnClass = (type: "num" | "op" | "eq" | "fn") => {
    const base = "h-11 rounded-xl text-sm font-semibold active:scale-95 select-none cursor-pointer flex items-center justify-center";
    if (type === "op") return `${base} bg-primary/15 text-primary hover:bg-primary/25`;
    if (type === "eq") return `${base} bg-primary text-primary-foreground hover:bg-primary/90`;
    if (type === "fn") return `${base} bg-destructive/15 text-destructive hover:bg-destructive/25`;
    return `${base} bg-secondary/80 text-foreground hover:bg-secondary`;
  };

  const Btn = ({ val, type = "num", span }: { val: string; type?: "num" | "op" | "eq" | "fn"; span?: boolean }) => (
    <button
      data-testid={`calc-btn-${val}`}
      onPointerDown={(e) => { e.preventDefault(); press(val); }}
      className={`${BtnClass(type)} ${span ? "col-span-2" : ""}`}
    >
      {val}
    </button>
  );

  const transform = `translate(${pos.x}px, ${pos.y}px)`;

  return (
    <div
      ref={calcRef}
      className="fixed bottom-6 right-6 z-50 no-print select-none"
      style={{ transform }}
    >
      {open && (
        <div
          className="mb-3 w-60 rounded-2xl border overflow-hidden"
          style={{
            background: "var(--glass-card-bg)",
            backdropFilter: "var(--glass-blur)",
            WebkitBackdropFilter: "var(--glass-blur)",
            borderColor: "var(--glass-border)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          }}
        >
          {/* Title bar — drag handle */}
          <div
            className="flex items-center justify-between px-3 py-2.5 border-b border-border/50 cursor-grab active:cursor-grabbing"
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
          >
            <div className="flex items-center gap-1.5">
              <Calculator size={13} className="text-primary" />
              <span className="text-xs font-semibold text-foreground">Calculator</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onPointerDown={(e) => { e.stopPropagation(); setMinimized((m) => !m); }}
                className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/40 flex items-center justify-center"
                data-testid="calc-minimize"
              >
                <Minus size={9} />
              </button>
              <button
                onPointerDown={(e) => { e.stopPropagation(); setOpen(false); }}
                className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/40 flex items-center justify-center"
                data-testid="calc-close"
              >
                <X size={9} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Display */}
              <div className="px-4 py-3 text-right bg-black/20">
                {op && prev !== null && (
                  <p className="text-xs text-muted-foreground/60 mb-0.5">{prev} {op}</p>
                )}
                <p className="text-3xl font-light text-foreground tracking-tight truncate">{display}</p>
              </div>

              {/* Buttons */}
              <div className="p-2.5 grid grid-cols-4 gap-1.5 bg-transparent">
                <Btn val="C" type="fn" />
                <Btn val="+/-" type="fn" />
                <Btn val="%" type="fn" />
                <Btn val="/" type="op" />
                <Btn val="7" />
                <Btn val="8" />
                <Btn val="9" />
                <Btn val="*" type="op" />
                <Btn val="4" />
                <Btn val="5" />
                <Btn val="6" />
                <Btn val="-" type="op" />
                <Btn val="1" />
                <Btn val="2" />
                <Btn val="3" />
                <Btn val="+" type="op" />
                <Btn val="0" span />
                <Btn val="." />
                <Btn val="=" type="eq" />
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        data-testid="calc-toggle"
        onClick={() => { setOpen((o) => !o); setMinimized(false); }}
        className="w-14 h-14 rounded-full text-primary-foreground shadow-2xl flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(160,70%,28%) 100%)",
          boxShadow: "0 8px 32px hsl(var(--primary)/0.45)",
        }}
      >
        <Calculator size={22} />
      </button>
    </div>
  );
}
