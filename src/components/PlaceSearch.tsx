import { useEffect, useRef, useState } from 'react';
import { searchPlaces, type PlaceResult } from '../lib/geocode';
import { IconPin, IconSearch } from './Icons';
import type { LatLng } from '../lib/types';

interface PlaceSearchProps {
  onPick: (point: LatLng, label: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Set a location by typing its name. This is the path that always works: it
 * needs no device permission, so it carries the whole flow inside Messenger and
 * other in-app browsers where the Geolocation API is simply unavailable.
 */
export default function PlaceSearch({
  onPick,
  placeholder = 'Գյուղի կամ քաղաքի անունը…',
  autoFocus = false,
}: PlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = window.setTimeout(() => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      searchPlaces(query, controller.signal).then((found) => {
        if (controller.signal.aborted) return;
        setResults(found);
        setSearched(true);
        setSearching(false);
      });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return (
    <div className="place-search">
      <div className="input-affix">
        <span className="affix" aria-hidden="true">
          <IconSearch />
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label="Փնտրել բնակավայրը"
          autoComplete="off"
          autoFocus={autoFocus}
        />
        {searching ? (
          <span className="affix affix-end">
            <span className="spinner spinner-dark" />
          </span>
        ) : null}
      </div>

      {results.length > 0 ? (
        <ul className="place-results">
          {results.map((result, index) => (
            <li key={`${result.label}-${index}`}>
              <button
                type="button"
                onClick={() => {
                  onPick(result.point, result.label);
                  setQuery('');
                  setResults([]);
                  setSearched(false);
                }}
              >
                <IconPin size={17} />
                <span>
                  <strong>{result.label}</strong>
                  {result.detail ? <small>{result.detail}</small> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : searched && !searching ? (
        <p className="place-empty">
          «{query}» անունով բնակավայր չգտնվեց։ Փորձե՛ք ավելի կարճ գրել, կամ նշե՛ք կետը
          ձեռքով՝ քարտեզը շարժելով։
        </p>
      ) : null}
    </div>
  );
}
