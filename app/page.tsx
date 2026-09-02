import { AppProvider } from "./components/AppProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./components/App";

export default function Page() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  );
}
