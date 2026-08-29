import { useCallback, useState } from 'react';
import { detectInAppBrowser } from './environment';
import { isInsideArmenia } from './geo';
import type { LatLng } from './types';

export type LocateStatus =
  | 'idle'
  | 'locating'
  | 'ready'
  | 'manual'
  | 'denied'
  | 'unavailable'
  | 'outside';

export const LOCATE_MESSAGES: Record<LocateStatus, string> = {
  idle: 'Տեղադիրքը դեռ որոշված չէ',
  locating: 'Որոշում ենք ձեր տեղադիրքը…',
  ready: 'Տեղադիրքը որոշված է',
  manual: 'Տեղադիրքը նշված է ձեռքով',
  denied: 'Թույլտվությունը մերժված է — գրե՛ք բնակավայրի անունը կամ շարժե՛ք քարտեզը',
  unavailable: 'Ավտոմատ չստացվեց — գրե՛ք բնակավայրի անունը կամ շարժե՛ք քարտեզը',
  outside: 'Ձեր տեղադիրքը Հայաստանից դուրս է — նշե՛ք կետը ձեռքով',
};

export function useGeolocation() {
  const [status, setStatus] = useState<LocateStatus>('idle');
  const [position, setPosition] = useState<LatLng | null>(null);

  const locate = useCallback((): Promise<LatLng | null> => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return Promise.resolve(null);
    }

    setStatus('locating');

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const point = { lat: coords.latitude, lng: coords.longitude };
          if (!isInsideArmenia(point)) {
            // Outside the service area the coordinates are worse than useless —
            // they would drop a pin the map cannot even show.
            setStatus('outside');
            resolve(null);
            return;
          }
          setPosition(point);
          setStatus('ready');
          resolve(point);
        },
        (error) => {
          setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          // In-app browsers usually never answer at all, so fail fast and let
          // the user get on with typing their village instead of watching a
          // spinner run out the full timeout.
          timeout: detectInAppBrowser() ? 6000 : 12000,
          maximumAge: 60000,
        },
      );
    });
  }, []);

  /**
   * Sets the location without asking the device — used when someone picks their
   * settlement by name. That is the only route available inside in-app
   * browsers, where the Geolocation API never answers.
   */
  const setManualPosition = useCallback((point: LatLng) => {
    setPosition(point);
    setStatus('manual');
  }, []);

  return { status, position, locate, setPosition, setManualPosition };
}
