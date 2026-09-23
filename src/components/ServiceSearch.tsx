import { useState } from 'react';
import { IconClose, IconSearch } from './Icons';
import {
  OFFERINGS,
  offeringsInUse,
  primaryOffering,
  type AgriService,
  type OfferingId,
} from '../data/services';

interface ServiceSearchProps {
  /** Every service, for the chips: a chip is offered only if something has it. */
  all: AgriService[];
  /** What the search currently leaves, for the list. */
  matches: AgriService[];
  query: string;
  onQueryChange: (query: string) => void;
  offering: OfferingId | null;
  onOfferingChange: (offering: OfferingId | null) => void;
  onPick: (id: string) => void;
}

/**
 * Finding a service once there are too many points to scan by eye.
 *
 * Built the way map apps do it, because that is what people already know: a
 * box to type into, and under it a row of the kinds of thing there are, one
 * tap each. Either one narrows the points on the map itself - the map frames
 * what is left - and a short list names the matches so one can be opened
 * without hunting for its pin.
 *
 * The list folds away on request, so the seller can look at where the matches
 * are; typing or choosing again brings it back.
 */
export default function ServiceSearch({
  all,
  matches,
  query,
  onQueryChange,
  offering,
  onOfferingChange,
  onPick,
}: ServiceSearchProps) {
  const [listOpen, setListOpen] = useState(true);
  const chips = offeringsInUse(all);
  const filtering = query.trim() !== '' || offering !== null;

  return (
    <div className="svc-search">
      <div className="svc-search-box">
        <IconSearch size={17} />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setListOpen(true);
          }}
          onFocus={() => setListOpen(true)}
          placeholder="Սերմ, տրակտոր, ոռոգում…"
          aria-label="Որոնել ծառայություն"
          enterKeyHint="search"
        />
        {filtering ? (
          <button
            type="button"
            className="svc-search-clear"
            onClick={() => {
              onQueryChange('');
              onOfferingChange(null);
            }}
            aria-label="Մաքրել որոնումը"
          >
            <IconClose size={16} />
          </button>
        ) : null}
      </div>

      <div className="svc-chips" role="group" aria-label="Ծառայության տեսակ">
        {chips.map(({ id, count }) => (
          <button
            key={id}
            type="button"
            className="svc-chip"
            aria-pressed={offering === id}
            onClick={() => {
              onOfferingChange(offering === id ? null : id);
              setListOpen(true);
            }}
          >
            <span aria-hidden="true">{OFFERINGS[id].emoji}</span>
            {OFFERINGS[id].short}
            <span className="svc-chip-count">{count}</span>
          </button>
        ))}
      </div>

      {filtering && listOpen ? (
        <div className="svc-results">
          <div className="svc-results-head">
            <span>
              {matches.length === 0 ? 'Ոչինչ չգտնվեց' : `${matches.length} արդյունք`}
            </span>
            {matches.length > 0 ? (
              <button type="button" className="svc-results-hide" onClick={() => setListOpen(false)}>
                Տեսնել քարտեզում
              </button>
            ) : null}
          </div>

          {matches.length === 0 ? (
            <p className="svc-results-empty">
              Փորձե՛ք այլ բառ կամ ընտրե՛ք տեսակը վերևի ցանկից։
            </p>
          ) : (
            <ul>
              {matches.map((service) => (
                <li key={service.id}>
                  <button type="button" onClick={() => onPick(service.id)}>
                    <span className="service-mark" aria-hidden="true">
                      {primaryOffering(service).emoji}
                    </span>
                    <span className="svc-result-text">
                      <b>{service.name}</b>
                      <small>
                        {service.offerings.map((id) => OFFERINGS[id].short).join(' · ')}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
