import { AppFooter } from "./components/AppFooter";
import { AppHeader } from "./components/AppHeader";
import { AppMain } from "./components/AppMain";

export function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <AppMain />
      <AppFooter />
    </div>
  );
}
