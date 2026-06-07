import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ProtectedPage from "@/components/ProtectedPage";

export default function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <ProtectedPage>
      <div className="flex flex-col md:flex-row bg-black">
        <Sidebar />

        <div className="flex-1 min-h-screen">
          <Header />

          <main className="relative p-6 md:p-8 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.10),_transparent_35%),linear-gradient(180deg,#09090b,#050505)] min-h-screen">
            <div className="mb-8">
              <p className="text-zinc-500 uppercase tracking-[0.35em] text-xs">
                Alto Vale Transportes
              </p>

              <h1 className="text-4xl md:text-5xl text-yellow-400 font-black mt-2">
                {title}
              </h1>

              {subtitle && (
                <p className="text-zinc-400 mt-2">
                  {subtitle}
                </p>
              )}
            </div>

            {children}
          </main>
        </div>
      </div>
    </ProtectedPage>
  );
}