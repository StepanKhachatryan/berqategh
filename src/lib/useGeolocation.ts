import { useCallback, useState } from 'react';
import { isInsideArmenia } from './geo';
import type { LatLng } from './types';

export type LocateStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable' | 'outside';

export const LOCATE_MESSAGES: Record<LocateStatus, string> = {
  idle: 'Տեղադիրքը դեռ որոշված չէ',
  locating: 'Որոշում ենք ձեր տեղադիրքը…',
  ready: 'Տեղադիրքը որոշված է',
  denied: 'Տեղադիրքի թույլտվությունը մերժված է — նշե՛ք ձեռքով քարտեզի վրա',
  unavailable: 'Չհաջողվեց որոշել տեղադիրքը — նշե՛ք ձեռքով քարտեզի վրա',
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
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
      );
    });
  }, []);

  return { status, position, locate, setPosition };
}
