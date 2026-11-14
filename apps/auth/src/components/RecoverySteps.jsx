import "./RecoverySteps.css";

const labels = ["E-mail", "Código", "Nova senha"];

export default function RecoverySteps({ current }) {
  return (
    <ol className="ignicao-recovery-steps" aria-label="Etapas da recuperação">
      {labels.map((label, index) => {
        const step = index + 1;
        return (
          <li key={label} aria-current={step === current ? "step" : undefined}>
            <span aria-hidden="true">0{step}</span> {label}
          </li>
        );
      })}
    </ol>
  );
}
