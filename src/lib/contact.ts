/**
 * The ways to reach a seller, from the one phone number they gave us.
 *
 * Armenian numbers are stored in full international form, which is exactly
 * what the messaging apps want, so no second field is needed: a listing that
 * can be called can also be messaged.
 *
 * Nobody here knows whether a given farmer actually has WhatsApp. Checking is
 * not possible without asking each app about the number, which would mean
 * handing a stranger's phone number to three foreign services on every listing
 * anyone opens - so the buttons are offered unconditionally and a dead one
 * costs a tap. That is a far better trade than the alternative.
 */

export interface ContactLink {
  id: 'call' | 'whatsapp' | 'viber' | 'telegram';
  label: string;
  href: string;
}

/** "+37493123456" -> "37493123456", which is what every app's link wants. */
function digits(e164: string): string {
  return e164.replace(/\D/g, '');
}

export function contactLinks(e164: string): ContactLink[] {
  const national = digits(e164);

  return [
    // wa.me is WhatsApp's own shortener: it opens the app on a phone and
    // web.whatsapp.com on a desktop, so it never dead-ends in a browser.
    { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/${national}` },

    // Viber has no web fallback and only ever answers as a custom scheme; the
    // + has to be percent-encoded or the query loses it to a space.
    { id: 'viber', label: 'Viber', href: `viber://chat?number=%2B${national}` },

    // Telegram resolves a phone number only through its own scheme. t.me has
    // no equivalent - its /+ links are group invites, not numbers.
    { id: 'telegram', label: 'Telegram', href: `tg://resolve?phone=${national}` },
  ];
}
