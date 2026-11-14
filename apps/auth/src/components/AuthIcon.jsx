export default function AuthIcon({ name, size = 18, ...props }) {
  const paths = {
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    arrowLeft: <><path d="M20 12H4" /><path d="m10 6-6 6 6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    user: <><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="1.6" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></>,
    eye: <><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.8" /></>,
    eyeOff: <><path d="M3 3 21 21" /><path d="M10.6 6.1A11 11 0 0 1 12 6c6.4 0 10 6 10 6a15.7 15.7 0 0 1-4 4.2M6.1 6.2C3.4 8 2 12 2 12s3.6 6 10 6c1.2 0 2.3-.2 3.3-.5" /><path d="M10 10a3 3 0 0 0 4 4" /></>,
    arrow: <><path d="M4 12h16" /><path d="m14 6 6 6-6 6" /></>,
    replay: <><path d="M3 11a9 9 0 1 1 2.1 6" /><path d="M3 4v7h7" /></>,
    headlight: <><path d="M14 6c4 0 6 3 6 6s-2 6-6 6h-2V6h2Z" /><path d="M8 7H3m5 5H2m6 5H3" /></>,
    play: <path d="m8 5 11 7-11 7z" />,
    pause: <><path d="M9 5v14" /><path d="M15 5v14" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  );
}
