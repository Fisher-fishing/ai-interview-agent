import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import AuthPage from "./components/AuthPage";
import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import "./styles.scss";

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        正在检查登录状态……
      </div>
    );
  }

  return user ? <App /> : <AuthPage />;
}

const rootElement = document.getElementById("root");

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>,
);