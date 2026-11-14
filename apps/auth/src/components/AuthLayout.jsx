import { useId } from "react";
import AuthHero from "./AuthHero.jsx";
import AuthIcon from "./AuthIcon.jsx";
import "./AuthLayout.css";

// O painel visual é fixo; cada página passa seu conteúdo pela prop children.
export default function AuthLayout({ eyebrow, title, description, recovery = false, children }) {
  const titleId = useId();

  return (
    <main className={recovery ? "ignicao-login ignicao-recovery" : "ignicao-login"}>
      <div className="ignicao-container">
        <AuthHero />
        <div className="ignicao-divider" aria-hidden="true" />

        <section className="ignicao-access" aria-labelledby={titleId}>
          <div className="ignicao-form-panel">
            <div className="ignicao-form-eyebrow"><span aria-hidden="true">●</span> {eyebrow}</div>
            <h2 id={titleId}>{title}</h2>
            {description && <p className="ignicao-subtitle">{description}</p>}
            {children}
            <div className="ignicao-small-divider" aria-hidden="true" />
            <div className="ignicao-form-footer"><AuthIcon name="shield" size={14} /></div>
          </div>
        </section>
      </div>
      <span className="ignicao-decor ignicao-decor-left" aria-hidden="true">+</span>
      <span className="ignicao-decor ignicao-decor-right" aria-hidden="true">+</span>
    </main>
  );
}
