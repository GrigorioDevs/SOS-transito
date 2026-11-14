import { useId, useState } from "react";
import AuthIcon from "./AuthIcon.jsx";

function CarHeadlights() {
  const id = useId();
  const glowId = `${id}-glow`;
  const beamId = `${id}-beam`;

  // Mesmas coordenadas do PNG (1644 × 957): a luz acompanha seu tamanho.
  return (
    <svg
      className="ignicao-headlights"
      viewBox="0 0 1644 957"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={glowId} x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
        <linearGradient
          id={beamId}
          x1="900" y1="465" x2="1590" y2="900"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffe6a0" stopOpacity=".21" />
          <stop offset="1" stopColor="#ffe6a0" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d="M829 450L1644 730V957L1500 957Z" fill={`url(#${beamId})`} />

      {/* Halo suave em volta das duas lâmpadas. */}
      <ellipse cx="829" cy="450" rx="34" ry="28" fill="#ffe7a5" filter={`url(#${glowId})`} />
      <ellipse cx="1476" cy="408" rx="18" ry="29" fill="#ffe7a5" filter={`url(#${glowId})`} />

      {/* Núcleo claro e definido, como no print de referência. */}
      <ellipse cx="829" cy="450" rx="16" ry="17" fill="#fff4ce" opacity=".88" />
      <ellipse cx="1476" cy="408" rx="8" ry="14" fill="#fff4ce" opacity=".85" />
    </svg>
  );
}

export default function AuthHero() {
  const [carroAnimado, setCarroAnimado] = useState(false);
  const [carroCarregado, setCarroCarregado] = useState(false);
  const [repeticao, setRepeticao] = useState(0);
  const [farois, setFarois] = useState(true);

  function redesenhar() {
    setRepeticao((atual) => atual + 1);
    setCarroAnimado(true);
  }

  return (
    <section className="ignicao-hero" aria-label="Apresentação SOS Trânsito">
      <div className="ignicao-eyebrow">
        <span className="ignicao-eyebrow-line" aria-hidden="true" />
        SEU PRÓXIMO DESTINO COMEÇA AQUI
      </div>

      <div className="ignicao-heading-group">
        <h1 className="ignicao-heading">
          <span className="ignicao-heading-thin">SUA JORNADA</span>
          <span className="ignicao-heading-bold">CONTINUA.</span>
        </h1>
        <p className="ignicao-intro">
          Para cada imprevisto, um novo caminho.<br />
          Conte com a gente para seguir em frente.
        </p>
      </div>

      <div
        className={`ignicao-car-stage ${carroAnimado ? "is-moving" : ""} ${farois ? "lights-on" : ""}`}
        aria-label="Ilustração de carro esportivo branco"
      >
        <div className="ignicao-car-shadow" aria-hidden="true" />
        <div
          key={repeticao}
          className={`ignicao-car-visual ${repeticao > 0 ? "is-redrawing" : ""}`}
        >
          <img
            className="ignicao-car"
            src={`${import.meta.env.BASE_URL}carro-sem-fundo.png`}
            alt="Ilustração em traço preto e branco de um carro esportivo"
            draggable="false"
            onLoad={() => setCarroCarregado(true)}
          />
          {carroCarregado && <CarHeadlights />}
        </div>
      </div>

      <footer className="ignicao-hero-bottom">
        <span className="ignicao-footer-label"><i aria-hidden="true" /> PAIXÃO EM CADA TRAÇO.</span>
        <div className="ignicao-visual-controls" aria-label="Controles do carro">
          <button type="button" className="ignicao-replay" onClick={redesenhar} aria-label="Reiniciar animação" title="Reiniciar animação">
            <AuthIcon name="replay" size={15} />
          </button>
          <button type="button" className={`ignicao-round-btn ${farois ? "is-active" : ""}`} onClick={() => setFarois((valor) => !valor)} aria-label={farois ? "Desligar faróis" : "Acender faróis"} aria-pressed={farois} title="Alternar faróis">
            <AuthIcon name="headlight" size={17} />
          </button>
          <button type="button" className="ignicao-round-btn" onClick={() => setCarroAnimado((valor) => !valor)} aria-label={carroAnimado ? "Pausar animação" : "Iniciar animação"} aria-pressed={carroAnimado} title={carroAnimado ? "Pausar animação" : "Iniciar animação"}>
            <AuthIcon name={carroAnimado ? "pause" : "play"} size={16} />
          </button>
        </div>
      </footer>
    </section>
  );
}
