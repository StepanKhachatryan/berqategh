import { useMemo, useState } from 'react';
import Modal from './Modal';
import { IconSearch } from './Icons';
import { swatchStyle } from './markers';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  searchProduce,
  type Produce,
  type ProduceCategory,
} from '../data/produce';

interface ProducePickerProps {
  /** Product ids already chosen. Single-select forms pass at most one. */
  selected: string[];
  multiple?: boolean;
  title?: string;
  onToggle: (produce: Produce) => void;
  onClose: () => void;
}

export default function ProducePicker({
  selected,
  multiple = false,
  title = 'Ընտրել ապրանքը',
  onToggle,
  onClose,
}: ProducePickerProps) {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const matches = searchProduce(query);
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: matches.filter((produce) => produce.category === category),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  const chosen = new Set(selected);

  return (
    <Modal
      title={title}
      subtitle={multiple ? 'Կարող եք ընտրել մի քանիսը' : undefined}
      onClose={onClose}
      footer={
        multiple ? (
          <button type="button" className="btn btn-green btn-block" onClick={onClose}>
            Պատրաստ է{selected.length > 0 ? ` (${selected.length})` : ''}
          </button>
        ) : undefined
      }
    >
      <div className="produce-search">
        <div className="input-affix">
          <span className="affix" aria-hidden="true">
            <IconSearch />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Փնտրել՝ խնձոր, lolik, pomidor…"
            aria-label="Փնտրել ապրանք"
            autoComplete="off"
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="empty-note">
          «{query}» անունով ապրանք չգտնվեց։
          <br />
          Փորձե՛ք այլ անվանում։
        </p>
      ) : (
        groups.map((group) => (
          <ProduceGroup
            key={group.category}
            category={group.category}
            items={group.items}
            chosen={chosen}
            onToggle={(produce) => {
              onToggle(produce);
              if (!multiple) onClose();
            }}
          />
        ))
      )}
    </Modal>
  );
}

function ProduceGroup({
  category,
  items,
  chosen,
  onToggle,
}: {
  category: ProduceCategory;
  items: Produce[];
  chosen: Set<string>;
  onToggle: (produce: Produce) => void;
}) {
  return (
    <section className="produce-group">
      <h4>{CATEGORY_LABELS[category]}</h4>
      <div className="produce-grid">
        {items.map((produce) => (
          <button
            key={produce.id}
            type="button"
            className="produce-item"
            aria-pressed={chosen.has(produce.id)}
            onClick={() => onToggle(produce)}
          >
            <span
              className="produce-swatch produce-dot"
              style={swatchStyle(produce.color)}
              aria-hidden="true"
            >
              <span>{produce.emoji}</span>
            </span>
            <span>{produce.hy}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
