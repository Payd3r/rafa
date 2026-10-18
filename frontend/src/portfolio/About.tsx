import { SmartImage } from "./SmartImage";
import portraits from "./portraits.json";
export function About() {
  return (
    <section className="about-me" id="about" aria-labelledby="about-title">
      <div className="about-heading">
        <span className="eyebrow">Chi sono</span>
        <span className="eyebrow">Fotografo</span>
      </div>
      <figure className="about-frame about-primary">
        <SmartImage
          photo={portraits[0]}
          sizes="(max-width:760px) 44vw, 25vw"
        />
        <figcaption>
          ANDREA FARAO <span>01</span>
        </figcaption>
      </figure>
      <div className="about-intro">
        <h2 id="about-title">
          Dall’altra
          <br />
          parte dell’obiettivo.
        </h2>
        <p>
          Sono Andrea, fotografo e videomaker. Lavoro tra Como, Lecco, Monza e Milano,
          con progetti di moda, musica e sperimentazione visiva.
        </p>
        <p>
          Ritratti, eventi e ricerca sulla luce attraversano il mio lavoro.
          Realizzo servizi fotografici e video in Lombardia e nel Nord Italia.
        </p>
        <a className="about-contact" href="#contact">
          Creiamo qualcosa insieme <span>↗</span>
        </a>
      </div>
      <figure className="about-frame about-secondary">
        <SmartImage
          photo={portraits[1]}
          sizes="(max-width:760px) 44vw, 25vw"
        />
        <figcaption>
          Un’altra prospettiva <span>02</span>
        </figcaption>
      </figure>
      <div className="about-bottom">
        <span>Fotografia</span>
        <span>Video</span>
        <span>Ricerca visiva</span>
      </div>
    </section>
  );
}
