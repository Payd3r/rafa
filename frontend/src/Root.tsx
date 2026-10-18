import { Seo } from "./shared/Seo";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ImageMetaProvider } from "./shared/contexts/ImageMetaContext";

export default function Root() {
  const location = useLocation();

  useEffect(() => {
    // Scrolla all'inizio ad ogni cambio di percorso
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  return (
    <ImageMetaProvider>
      <Seo />
      <Outlet />
    </ImageMetaProvider>
  );
}
