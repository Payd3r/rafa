import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./Root";
import { LoadingPage } from "./portfolio/LoadingPage";
import "./style.css";

// Service worker completamente rimosso per evitare problemi di caching
// Disabilita service worker in sviluppo E produzione
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().then(() => {
        console.log("Service Worker disabilitato");
      });
    });
  });
}

// Lazy con retry per gestire errori di rete/cache temporanei
function lazyWithRetry<
  T extends React.ComponentType<{ detail?: boolean; gallery?: boolean }>,
>(importer: () => Promise<{ default: T }>) {
  const MAX_RETRIES = 2;
  let retries = 0;
  return React.lazy(async () => {
    while (true) {
      try {
        return await importer();
      } catch (e) {
        if (retries >= MAX_RETRIES) throw e;
        retries++;
        // attende e riprova
        await new Promise((r) => setTimeout(r, 300 * retries));
      }
    }
  });
}

const Home = lazyWithRetry(() => import("./portfolio/Portfolio"));
const Gallery = lazyWithRetry(() => import("./portfolio/Portfolio"));
const Projects = lazyWithRetry(() => import("./portfolio/Portfolio"));
const ProjectDetail = lazyWithRetry(() => import("./portfolio/Portfolio"));

const Admin = React.lazy(() => import("./pages/Admin"));

function RouteError() {
  return (
    <div className="p-8 text-center">
      <h1 className="h2-title mb-2">Qualcosa è andato storto</h1>
      <p className="text-gray700">Riprova a ricaricare la pagina.</p>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <RouteError />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/gallery", element: <Gallery gallery /> },
      { path: "/projects", element: <Projects /> },
      { path: "/projects/:slug", element: <ProjectDetail detail /> },
      { path: "/admin", element: <Admin /> },
    ],
  },
]);

const rootElement = document.getElementById("app")!;
// Resolve the font faces used above the fold before showing real text.
void Promise.all([300,400,500].map(weight => document.fonts.load(`${weight} 16px "MADE Tommy"`).catch(() => []))).then(() => {
createRoot(rootElement).render(
  <React.StrictMode>
    <React.Suspense
      fallback={<LoadingPage />}
    >
      <RouterProvider router={router} />
    </React.Suspense>
  </React.StrictMode>,
);

});
