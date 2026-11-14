import AuthIcon from "./AuthIcon.jsx";

export default function AuthField({ id, label, icon, children, ...inputProps }) {
  return (
    <div className="ignicao-field">
      <label htmlFor={id}>{label}</label>
      <div className="ignicao-input-wrap">
        <AuthIcon name={icon} size={17} />
        <input id={id} {...inputProps} />
        {children}
      </div>
    </div>
  );
}
