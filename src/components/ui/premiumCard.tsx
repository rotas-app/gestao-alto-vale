export default function PremiumCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        rounded-3xl border border-zinc-800
        bg-gradient-to-br from-zinc-900 via-zinc-950 to-black
        shadow-2xl p-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}