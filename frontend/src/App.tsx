import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MainLayout } from "@/components/layout/MainLayout";

function App() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-screen w-screen overflow-hidden bg-background text-foreground">
      <Header />
      <MainLayout />
      <Footer />
    </div>
  );
}

export default App;
