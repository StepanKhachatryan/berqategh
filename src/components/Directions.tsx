import { IconPin } from './Icons';

interface DirectionsProps {
  lat: number;
  lng: number;
}

/** Yandex Maps' red pin. */
function YandexPin() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" fill="#FC3F1D" />
      <circle cx="12" cy="9" r="2.8" fill="#fff" />
    </svg>
  );
}

/** Google Maps' four-colour pin. */
function GooglePin() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <clipPath id="gm-pin">
          <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" />
        </clipPath>
      </defs>
      <g clipPath="url(#gm-pin)">
        <rect x="0" y="0" width="24" height="24" fill="#34A853" />
        <path d="M0 0h12l-5 9H0z" fill="#1A73E8" />
        <path d="M12 0h12v8l-7 2-5-1z" fill="#EA4335" />
        <path d="M7 9l5 0 6 1-6 6-5-4z" fill="#FBBC04" />
      </g>
      <circle cx="12" cy="9" r="2.6" fill="#fff" />
    </svg>
  );
}

/**
 * How to get there, in one row: the label on the left, the two apps people in
 * Armenia actually navigate with on the right, each with its own pin so it is
 * recognised before it is read. Used by listings, services and premium cards.
 */
export default function Directions({ lat, lng }: DirectionsProps) {
  const point = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const yandexUrl = `https://yandex.com/maps/?rtext=~${point}&rtt=auto&z=16`;
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${point}`;

  return (
    <div className="nav-row">
      <span className="nav-row-label">
        <IconPin />
        <span>
          Ինչպես
          <br />
          հասնել
        </span>
      </span>
      <a className="nav-app" href={yandexUrl} target="_blank" rel="noreferrer noopener">
        <YandexPin />
        <span>
          Yandex<span className="nav-app-maps"> Maps</span>
        </span>
      </a>
      <a className="nav-app" href={googleUrl} target="_blank" rel="noreferrer noopener">
        <GooglePin />
        <span>
          Google<span className="nav-app-maps"> Maps</span>
        </span>
      </a>
    </div>
  );
}
