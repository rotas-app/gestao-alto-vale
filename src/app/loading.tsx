export default function Loading() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>

        <p className="text-yellow-400 text-xl font-bold">
          Carregando...
        </p>
      </div>
    </main>
  );
}