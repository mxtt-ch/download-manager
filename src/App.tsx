import { ThemeProvider } from "@/contexts/ThemeContext";
import MainPage from "@/views/index/MainPage";
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
