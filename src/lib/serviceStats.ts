import { useEffect } from 'react';
import { record } from './analytics';

/**
 * What an advertiser's card reports, for their monthly figures: that it was
 * opened, and which button was pressed - call or a messenger, their website or
 * page, the way there. Anonymous like every other event: a random per-tab
 * session id, no names, no numbers.
 */
export function useServiceStats(serviceId: string) {
  useEffect(() => {
    record({ kind: 'service_open', target: serviceId });
  }, [serviceId]);

  return {
    onContact: (via: string) => record({ kind: 'service_contact', target: serviceId, detail: via }),
    onLink: (kind: string) => record({ kind: 'service_link', target: serviceId, detail: kind }),
    onDirections: (app: string) => record({ kind: 'service_directions', target: serviceId, detail: app }),
  };
}
