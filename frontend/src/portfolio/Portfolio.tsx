import { ArrowIcon } from "../shared/ArrowIcon";
import { PROJECT_CATEGORIES, categoryLabel } from "../shared/categories";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProjects } from "../shared/hooks/useProjects";

import type { Photo } from "../shared/types";
import { contactMarkup } from "./content";
import homeStyles from "./home.css?inline";
import { Header, LoadingContent } from "./LoadingPage";
import detailStyles from "./detail.css?inline";
import { useConnection } from "../shared/hooks/useConnection";
import { About } from "./About";
import { SmartImage } from "./SmartImage";
import { ProjectVideo } from "./ProjectVideo";
import { ProjectGallery } from "./ProjectGallery";
import { HeroCarousel } from "./HeroCarousel";
import { useImageMetaContext } from "../shared/contexts/ImageMetaContext";
import viewerStyles from "./viewer.css?inline";

function Viewer({
  photos,
  index,
  setIndex,
  title,
}: {
  photos: Photo[];
  index: number | null;
  setIndex: (index: number | null) => void;
  title: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { constrained, online } = useConnection();
  useEffect(() => {
    if (index === null || constrained || !online || photos.length < 2) return;
    const next = photos[(index + 1) % photos.length];
    const variant = next.variants?.avif.filter(item => item.width <= 960).at(-1);
    if (!variant) return;
    const timer = window.setTimeout(() => { const image = new Image(); image.fetchPriority = 'low'; image.src = variant.src; }, 750);
    return () => window.clearTimeout(timer);
  }, [index, photos, constrained, online]);

  const touch = useRef<{ x: number; y: number } | null>(null);
  const move = (direction: number) =>
    setIndex(((index ?? 0) + direction + photos.length) % photos.length);
  useEffect(() => {
    const dialog = ref.current!;
    if (index === null) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [index]);
  return (
    <dialog
      ref={ref}
      aria-label="Photo viewer"
      onClose={() => setIndex(null)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          move(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
    >
      <div className="viewer-layout">
        <div className="viewer-bar">
          <span className="viewer-project">{title}</span>
          <button
            className="close"
            aria-label="Close photo viewer"
            onClick={() => setIndex(null)}
          >
            ×
          </button>
        </div>
        <div
          className="viewer-stage"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIndex(null);
          }}
          onTouchStart={(event) => {
            touch.current = {
              x: event.touches[0].clientX,
              y: event.touches[0].clientY,
            };
          }}
          onTouchEnd={(event) => {
            if (!touch.current) return;
            const dx = event.changedTouches[0].clientX - touch.current.x;
            const dy = event.changedTouches[0].clientY - touch.current.y;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4)
              move(dx < 0 ? 1 : -1);
            touch.current = null;
          }}
        >
          {index !== null && photos[index] && (
            <SmartImage
              key={photos[index].src}
              photo={photos[index]}
              viewer
              priority
              sizes="100vw"
              fit="contain"
            />
          )}
          <button
            className="viewer-arrow previous"
            aria-label="Fotografia precedente"
            onClick={() => move(-1)}
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            className="viewer-arrow next"
            aria-label="Fotografia successiva"
            onClick={() => move(1)}
          >
            <ArrowIcon />
          </button>
        </div>
        <div className="viewer-footer">
          <button
            className="mobile-arrow"
            aria-label="Fotografia precedente"
            onClick={() => move(-1)}
          >
            <ArrowIcon direction="left" />
          </button>
          <span className="counter" role="status" aria-live="polite">
            {String((index ?? 0) + 1).padStart(2, "0")} /{" "}
            {String(photos.length).padStart(2, "0")}
          </span>
          <button
            className="mobile-arrow"
            aria-label="Fotografia successiva"
            onClick={() => move(1)}
          >
            <ArrowIcon />
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default function Portfolio({
  detail = false,
  gallery = false,
}: {
  detail?: boolean;
  gallery?: boolean;
}) {
  const { projects, loading, error } = useProjects();
  const { imageMeta } = useImageMetaContext();
  const { slug } = useParams();
  const navigate = useNavigate();
  const enrich = (photo: Photo): Photo => ({
    ...photo,
    ...imageMeta[photo.src],
  });
  const [index, setIndex] = useState<number | null>(null);
  const [detailViewerPhotos, setDetailViewerPhotos] = useState<Photo[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width:760px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width:760px)");
    const update = () => setMobile(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const project = projects.find((project) => project.slug === slug);
  const allPhotos = Array.from(
    new Map(
      projects
        .flatMap((project) => [project.cover, ...project.gallery])
        .filter(Boolean)
        .map((photo) => [photo.src, enrich(photo)]),
    ).values(),
  );
  const best = allPhotos.filter(
    (photo) => imageMeta[photo.src]?.isBest || photo.isBest,
  ).sort((a, b) => (imageMeta[a.src]?.bestOrder ?? a.bestOrder ?? Infinity) - (imageMeta[b.src]?.bestOrder ?? b.bestOrder ?? Infinity));
  const featured = (
    best.length ? best : projects.map((project) => enrich(project.cover))
  );
  const photos = detail
    ? (project?.gallery.map(enrich) ?? [])
    : gallery
      ? allPhotos
      : featured;
  const next =
    projects[
      (projects.findIndex((item) => item.slug === slug) + 1) % projects.length
    ];
  useEffect(() => {
    setIndex(null);
    setDetailViewerPhotos(null);

  }, [slug, detail, project]);
  const status =
    loading
      ? "Caricamento fotografie…"
      : error && !projects.length
        ? "Impossibile caricare i progetti. Riprova."
        : detail && !project
          ? "Progetto non trovato."
          : !projects.length
            ? "Nuove fotografie in arrivo."
            : null;
  return (
    <div className="portfolio" id="top">
      <style>
        {homeStyles +
          "\n" +
          (detail ? detailStyles : "") +
          viewerStyles +
          "\n.portfolio{background:var(--paper);color:var(--ink);min-height:100vh}.portfolio-status{padding:60px var(--pad)}"}
      </style>
      <a className="skip" href={detail ? "#photos" : "#work"}>
        Vai alle fotografie
      </a>
      <Header />
      {status ? (
        loading ? <LoadingContent detail={detail} gallery={gallery}/> : <main className="portfolio-status" role="status">
          {status}
          {detail && <p><Link to="/"><ArrowIcon direction="left" size={18} /> Tutti i progetti</Link></p>}
        </main>
      ) : detail && project ? (
        <main>
          <div className="project-return">
            <button type="button" className="project-back" onClick={() => {
              if (window.history.state?.idx > 0) void navigate(-1);
              else void navigate("/#work");
            }} aria-label="Torna alla pagina precedente">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6" /></svg>
              Indietro
            </button>
          </div>
          <div className="project-heading">
            <h1>{project.title}</h1>
            <div className="project-meta">
              <span className="year">{project.dateISO.slice(0, 4)}</span>
              <span className="project-meta-divider" aria-hidden="true" />
              <span className="project-category">{categoryLabel(project.category)}</span>
              {project.instagramUrl && (
                <a
                  className="project-instagram"
                  href={project.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Apri ${project.title} su Instagram`}
                  title="Instagram"
                >
                  <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r=".9" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              )}
            </div>
          </div>
          {project.video && <ProjectVideo key={project.video.src} video={project.video} />}
          <ProjectGallery photos={photos} onOpen={(photoIndex, orderedPhotos) => {
            setDetailViewerPhotos(orderedPhotos);
            setIndex(photoIndex);
          }} />
          <footer className="project-closing" aria-label="Project navigation">
            {next && next.slug !== project.slug && (
              <Link className="project-follow" to={`/projects/${next.slug}`} aria-label={`Prossimo progetto: ${next.title}`}>
                <div className="project-follow-copy">
                  <span className="project-follow-label">Prossimo progetto</span>
                  <h2>{next.title}</h2>
                  <span className="project-follow-meta">{categoryLabel(next.category) && <>{categoryLabel(next.category)}<span aria-hidden="true"> / </span></>}{next.dateISO.slice(0, 4)}</span>
                </div>
                <svg className="project-follow-arrow" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
                  <path d="M5 16h22M18 7l9 9-9 9" />
                </svg>
                <span className="project-follow-preview">
                  <SmartImage key={next.cover.src} photo={enrich(next.cover)} sizes="(max-width:760px) 24vw, 180px" />
                </span>
              </Link>
            )}
            <div className="project-colophon">
              <span>© {new Date().getFullYear()} Andrea Farao</span>
              <a href="mailto:insidefaraostudio@gmail.com">Lavoriamo insieme</a>
            </div>
          </footer>
        </main>
      ) : (
        <main>
          {!gallery && (
            <section className="hero" aria-label="Fotografie in evidenza">
              <h1>ANDREA FARAO</h1>
              <div className="gallery-shell">
                <HeroCarousel photos={featured} mobile={mobile} onOpen={(photoIndex) => {
                  const photo = featured[photoIndex];
                  const owner = projects.find(item => item.cover.src === photo.src || item.gallery.some(image => image.src === photo.src));
                  if (owner) void navigate(`/projects/${owner.slug}`);
                }} />
              </div>
              <div className="hero-bottom">
                <a href="#work" aria-label="Esplora i progetti">
                  Esplora i progetti
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 4v16m-6-6 6 6 6-6" />
                  </svg>
                </a>
              </div>
            </section>
          )}
          <section className={`work${gallery ? "" : " work-projects"}`} id="work">
            <div className="section-heading">
              {gallery && (
                <h2>
                  Fotografie<sup>({allPhotos.length})</sup>
                </h2>
              )}
              {!gallery && (
                <div className="filters" aria-label="Filtra i progetti">
                  {[{ value: "all", label: "Tutti" }, ...PROJECT_CATEGORIES].map(({ value, label }) => (
                    <button
                      className="filter"
                      aria-pressed={filter === value}
                      key={value}
                      onClick={() => setFilter(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={`projects${gallery ? "" : " project-archive"}`}>
              {gallery
                ? photos.map((photo, i) => (
                    <figure className="project" key={photo.id}>
                      <button
                        className="project-button"
                        onClick={() => setIndex(i)}
                      >
                        <SmartImage
                          key={photo.src}
                          photo={photo}
                          priority={detail && i < 2}
                          sizes={
                            detail
                              ? "(max-width:760px) 43vw, 46vw"
                              : "(max-width:760px) 88vw, 42vw"
                          }
                        />
                      </button>
                    </figure>
                  ))
                : projects
                    .filter(
                      (project) =>
                        filter === "all" ||
                        project.category === filter,
                    )
                    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
                    .map((project, i) => (
                      <figure
                        className={`project ${filter !== "all" ? "filtered" : ""}`}
                        key={project.slug}
                      >
                        <div className="project-artwork">
                          <Link
                            className="project-button"
                            to={`/projects/${project.slug}`}
                            aria-label={`Open project ${project.title}`}
                          >
                            <SmartImage
                              key={project.cover.src}
                              photo={enrich(project.cover)}
                              sizes="(max-width:760px) 75vw, (min-width:1985px) 824px, 43vw"
                            />
                          </Link>
                        </div>
                        <figcaption className="caption">
                          <div>
                            <h3>{project.title}</h3>
                            <p>
                              {categoryLabel(project.category)} /{" "}
                              {project.dateISO.slice(0, 4)}
                            </p>
                          </div>
                          <span>{String(i + 1).padStart(2, "0")}</span>
                        </figcaption>
                      </figure>
                    ))}
            </div>
            {filter !== "all" &&
              !projects.some((project) =>
                project.category === filter,
              ) && <p>Nessun progetto in questa selezione.</p>}
          </section>
          <About />
          <div
            dangerouslySetInnerHTML={{
              __html: contactMarkup.replace(
                "© 2026",
                `© ${new Date().getFullYear()}`,
              ),
            }}
          />
        </main>
      )}
      <Viewer
        photos={detail ? detailViewerPhotos || photos : photos}
        index={index}
        setIndex={setIndex}
        title={project?.title ?? "Andrea Farao"}
      />
    </div>
  );
}
