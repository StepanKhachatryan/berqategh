import { useEffect, useState } from 'react';
import qrUrl from '../assets/qr-berqategh.svg';
import { SITE_URL, SITE_HOST } from '../lib/site';
import { IconClose } from './Icons';

/**
 * The site's address as a QR code, and a way to throw it up full screen.
 *
 * It is here for standing in front of a room: open the guide, press the code,
 * and it fills the display at whatever size the screen allows. Nobody has to
 * type "berqategh.am" while twenty people wait.
 *
 * The picture is a file in the repository, drawn once by scripts/build-qr.mjs.
 * No QR service is called, nothing is fetched when the guide opens, and the
 * code therefore works in a village hall with no signal at all.
 */
export default function QrPoster() {
  const [full, setFull] = useState(false);

  /*
   * Escape should close the poster, not the guide underneath it. The guide
   * listens on document too, so this listens in the capture phase and stops the
   * event before it gets there.
   */
  useEffect(() => {
    if (!full) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopImmediatePropagation();
      setFull(false);
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [full]);

  return (
    <section className="guide-section">
      <h4>Կիսվե՛ք կայքով</h4>
      <p>
        Ուղղե՛ք հեռախոսի ֆոտոխցիկը կոդին։ Ներկայացման ժամանակ սեղմե՛ք կոդի վրա - այն
        կբացվի ամբողջ էկրանով, որպեսզի դահլիճից էլ սկանավորվի։
      </p>

      <button type="button" className="qr-card" onClick={() => setFull(true)}>
        <img src={qrUrl} alt={`QR կոդ՝ ${SITE_HOST}`} width={168} height={168} />
        <span className="qr-url">{SITE_HOST}</span>
      </button>

      {full ? (
        <div
          className="qr-full"
          role="dialog"
          aria-label={`QR կոդ՝ ${SITE_HOST}`}
          onClick={() => setFull(false)}
        >
          <img src={qrUrl} alt={`QR կոդ՝ ${SITE_URL}`} />
          <span className="qr-url">{SITE_HOST}</span>
          <button type="button" className="icon-btn qr-close" aria-label="Փակել">
            <IconClose />
          </button>
        </div>
      ) : null}
    </section>
  );
}
