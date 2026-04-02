import Link from "next/link";

interface UpgradePromptProps {
  message: string;
  currentPlan?: string;
  suggestedPlan?: string;
}

export default function UpgradePrompt({ message, currentPlan }: UpgradePromptProps) {
  return (
    <div className="bg-[#181818] border border-[#00ff88]/20 rounded-2xl p-6 flex items-center gap-4">
      <div className="text-3xl">🔒</div>
      <div className="flex-1">
        <p className="text-[#f0f0f0] font-medium">{message}</p>
        <p className="text-[#888] text-sm mt-1">
          Plan actual: <span className="capitalize">{currentPlan || "básico"}</span>
        </p>
      </div>
      <Link
        href="/pricing#contacto"
        className="px-5 py-2.5 bg-[#00ff88] text-[#0a0a0a] font-bold rounded-xl text-sm hover:bg-[#00e07a] transition-colors whitespace-nowrap"
      >
        Contactar para upgrade ↗
      </Link>
    </div>
  );
}
