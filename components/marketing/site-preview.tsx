import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

export type PreviewVariant =
  | "chat"
  | "dashboard"
  | "game"
  | "landing"
  | "mobile"
  | "portfolio"
  | "status"
  | "storefront";

const NEON_GRADIENT = `linear-gradient(135deg, ${brand.accent}, ${brand.accentViolet} 55%, ${brand.accentAlt})`;

const FEATURE_SLOTS = ["left", "middle", "right"] as const;
const SIDEBAR_SLOTS = ["overview", "traffic", "sales"] as const;
const CHAT_ROOMS = [
  { accent: brand.accent, label: "SLI" },
  { accent: brand.accentViolet, label: "WORK" },
  { accent: brand.accentAlt, label: "LAB" },
] as const;
const STATUS_ROWS = [
  { accent: "#00ff88", label: "Render" },
  { accent: "#00e5ff", label: "Postgres" },
  { accent: "#ff8c42", label: "Blob" },
] as const;
const PIXELS = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

/**
 * ภาพตัวอย่างที่ "วาดด้วย CSS" ล้วน ๆ — ไม่ใช้ภาพจากภายนอก
 */
export function SitePreview({
  className,
  variant,
}: {
  className?: string;
  variant: PreviewVariant;
}) {
  return (
    <div className={cn("relative size-full overflow-hidden", className)}>
      {renderVariant(variant)}
    </div>
  );
}

function renderVariant(variant: PreviewVariant) {
  if (variant === "chat") {
    return <ChatPreview />;
  }

  if (variant === "dashboard") {
    return <DashboardPreview />;
  }

  if (variant === "game") {
    return <GamePreview />;
  }

  if (variant === "landing") {
    return <LandingPreview />;
  }

  if (variant === "mobile") {
    return <MobilePreview />;
  }

  if (variant === "portfolio") {
    return <PortfolioPreview />;
  }

  if (variant === "status") {
    return <StatusPreview />;
  }

  return <StorefrontPreview />;
}

function LandingPreview() {
  return (
    <div className="size-full bg-[#f5f6fb] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-[4px] bg-[#0a0a0a]" />
          <span className="h-1.5 w-8 rounded-full bg-black/15" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-5 rounded-full bg-black/10" />
          <span className="h-1.5 w-5 rounded-full bg-black/10" />
          <span className="h-4 w-10 rounded-full bg-[#0a0a0a]" />
        </div>
      </div>

      <div className="mt-7 space-y-2">
        <div className="h-3.5 w-4/5 rounded-full bg-black/80" />
        <div className="h-3.5 w-1/2 rounded-full bg-black/80" />
        <div className="h-1.5 w-3/5 rounded-full bg-black/20" />
      </div>

      <div className="mt-4 flex gap-2">
        <span
          className="h-5 w-16 rounded-full"
          style={{ backgroundImage: NEON_GRADIENT }}
        />
        <span className="h-5 w-16 rounded-full border border-black/15" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {FEATURE_SLOTS.map((slot) => (
          <div
            className="h-14 rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
            key={slot}
          />
        ))}
      </div>
    </div>
  );
}

function StorefrontPreview() {
  return (
    <div className="size-full bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-semibold tracking-[0.18em] text-neutral-900 uppercase">
          Handmade
        </span>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-4 rounded-full bg-black/15" />
          <span className="h-1.5 w-4 rounded-full bg-black/15" />
          <span className="size-3 rounded-full bg-[#0a0a0a]" />
        </div>
      </div>

      <div className="mt-4 flex h-24 items-center gap-3 rounded-xl bg-[#e9eaef] px-4">
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 w-3/4 rounded-full bg-black/70" />
          <div className="h-1.5 w-2/3 rounded-full bg-black/20" />
          <div className="mt-2 h-4 w-14 rounded-full bg-[#0a0a0a]" />
        </div>
        <span
          className="size-12 rounded-full opacity-80"
          style={{ backgroundImage: NEON_GRADIENT }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {FEATURE_SLOTS.map((slot) => (
          <div className="space-y-1.5" key={slot}>
            <div className="h-16 rounded-lg bg-[#f1f2f6]" />
            <div className="h-1.5 w-3/4 rounded-full bg-black/20" />
            <div className="h-1.5 w-1/2 rounded-full bg-black/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PortfolioPreview() {
  return (
    <div className="size-full bg-[#0b0d17] p-4 text-white">
      <div className="flex items-center justify-between text-[7px] tracking-[0.22em] text-white/40 uppercase">
        <span>Sirinat Studio</span>
        <span>2026</span>
      </div>

      <div className="mt-8 font-serif text-[26px] italic leading-none">
        I create,
      </div>
      <div className="font-serif text-[26px] italic leading-none text-white/60">
        therefore I am
      </div>

      <div className="mt-6 flex items-end gap-3">
        <div className="h-20 w-24 rounded-md bg-[linear-gradient(135deg,#2a2f45,#4b3b6b)]" />
        <div className="h-14 w-16 rounded-md bg-[linear-gradient(135deg,rgba(0,229,255,0.25),rgba(255,45,149,0.25))]" />
        <span className="mb-1 size-2 rounded-full bg-white/60" />
      </div>

      <div className="mt-4 h-1.5 w-2/3 rounded-full bg-white/15" />
    </div>
  );
}

function GamePreview() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 bg-[#10121f]">
      <div className="grid h-20 w-[68%] place-items-center rounded-md bg-[#7cc243] shadow-[0_0_24px_rgba(124,194,67,0.25)]">
        <div className="grid grid-cols-4 gap-1">
          {PIXELS.map((pixel) => (
            <span className="size-2 bg-[#2f4a19]" key={pixel} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="grid grid-cols-3 grid-rows-3 gap-0.5">
          <span />
          <span className="size-3 rounded-sm bg-[#3a4059]" />
          <span />
          <span className="size-3 rounded-sm bg-[#3a4059]" />
          <span className="size-3 rounded-sm bg-[#4b5273]" />
          <span className="size-3 rounded-sm bg-[#3a4059]" />
          <span />
          <span className="size-3 rounded-sm bg-[#3a4059]" />
          <span />
        </div>
        <div className="flex items-center gap-3">
          <span
            className="size-6 rounded-full"
            style={{ backgroundImage: NEON_GRADIENT }}
          />
          <span className="size-6 rounded-full bg-[#3a4059]" />
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="flex size-full bg-[#080a13] text-white">
      <div className="w-1/5 space-y-2 border-white/10 border-r p-3">
        <span className="block size-3 rounded-[4px] bg-[#00e5ff]" />
        {SIDEBAR_SLOTS.map((slot) => (
          <span className="block h-1.5 rounded-full bg-white/15" key={slot} />
        ))}
      </div>

      <div className="flex-1 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[7px] tracking-[0.2em] text-white/50 uppercase">
            M.O.N.K.Y
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[#00ff88]" />
            <span className="h-1.5 w-6 rounded-full bg-white/15" />
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {["a", "b", "c"].map((slot) => (
            <div
              className="space-y-1.5 rounded-md border border-white/10 bg-white/[0.03] p-2"
              key={slot}
            >
              <span className="block h-1.5 w-2/3 rounded-full bg-white/20" />
              <span className="block h-2.5 w-1/2 rounded-full bg-white/60" />
            </div>
          ))}
        </div>

        <svg
          aria-hidden="true"
          className="mt-3 h-14 w-full"
          preserveAspectRatio="none"
          viewBox="0 0 200 60"
        >
          <polyline
            fill="none"
            points="0,48 25,40 50,44 75,26 100,30 125,16 150,22 175,8 200,12"
            stroke="#00e5ff"
            strokeWidth="2"
          />
          <polyline
            fill="none"
            points="0,56 25,52 50,54 75,44 100,48 125,38 150,42 175,32 200,36"
            stroke="#ff2d95"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
}

function StatusPreview() {
  return (
    <div className="flex size-full flex-col bg-[#01030a] p-4 text-white">
      <div className="flex items-center justify-between">
        <span className="text-[7px] tracking-[0.22em] text-[#00e5ff] uppercase">
          {brand.name} EYE · ONLINE
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-[#00ff88]" />
          <span className="h-1.5 w-5 rounded-full bg-white/15" />
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {STATUS_ROWS.map((row) => (
          <div className="flex items-center gap-2" key={row.label}>
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: row.accent }}
            />
            <span className="text-[7px] text-white/60 uppercase">
              {row.label}
            </span>
            <span className="h-1 flex-1 rounded-full bg-white/10" />
            <span className="h-1.5 w-6 rounded-full bg-white/25" />
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-end gap-1">
        {PIXELS.map((pixel, index) => (
          <span
            className="flex-1 rounded-sm bg-[linear-gradient(180deg,#00e5ff,#a78bfa)]"
            key={pixel}
            style={{ height: `${8 + ((index * 5) % 26)}px` }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatPreview() {
  return (
    <div className="flex size-full flex-col bg-[#01030a] p-4">
      <div className="flex gap-1.5">
        {CHAT_ROOMS.map((room, index) => (
          <span
            className={cn(
              "rounded-full px-2 py-1 text-[7px] font-semibold tracking-[0.12em]",
              index === 0 ? "text-[#01030a]" : "text-white/60"
            )}
            key={room.label}
            style={
              index === 0
                ? { backgroundColor: room.accent }
                : { backgroundColor: "rgba(255,255,255,0.06)" }
            }
          >
            {room.label}
          </span>
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        <div className="flex items-end gap-2">
          <span
            className="size-5 shrink-0 rounded-full"
            style={{ backgroundImage: NEON_GRADIENT }}
          />
          <div className="space-y-1.5 rounded-2xl rounded-bl-md bg-white/8 px-3 py-2">
            <span className="block h-1.5 w-28 rounded-full bg-white/40" />
            <span className="block h-1.5 w-16 rounded-full bg-white/25" />
          </div>
        </div>

        <div className="flex justify-end">
          <div className="space-y-1.5 rounded-2xl rounded-br-md bg-white/[0.14] px-3 py-2">
            <span className="block h-1.5 w-24 rounded-full bg-white/50" />
            <span className="block h-1.5 w-12 rounded-full bg-white/30" />
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
        <span className="h-1.5 flex-1 rounded-full bg-white/20" />
        <span
          className="size-5 rounded-full"
          style={{ backgroundImage: NEON_GRADIENT }}
        />
      </div>
    </div>
  );
}

function MobilePreview() {
  return (
    <div className="grid size-full place-items-center bg-[#0b0d17] p-4">
      <div className="flex h-full w-[58%] flex-col rounded-[20px] border-[3px] border-[#2a2f45] bg-[#01030a] p-3">
        <span className="mx-auto mb-3 h-1 w-8 rounded-full bg-white/20" />
        <div className="space-y-3">
          {CHAT_ROOMS.map((room) => (
            <div className="flex items-center gap-2" key={room.label}>
              <span
                className="size-5 shrink-0 rounded-full"
                style={{ backgroundColor: room.accent }}
              />
              <div className="flex-1 space-y-1">
                <span className="block h-1.5 w-3/4 rounded-full bg-white/35" />
                <span className="block h-1.5 w-1/2 rounded-full bg-white/15" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5">
          <span className="h-1.5 flex-1 rounded-full bg-white/20" />
          <span
            className="size-4 rounded-full"
            style={{ backgroundImage: NEON_GRADIENT }}
          />
        </div>
      </div>
    </div>
  );
}
