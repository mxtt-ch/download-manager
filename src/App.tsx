import { ThemeProvider } from "@/contexts/ThemeContext";
import { MainPage } from "@/views/MainPage";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <ThemeProvider>
      <MainPage />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
