import { useState } from 'react';
import { currentSession } from '../lib/analytics';
import { isConfigured, supabase } from '../lib/supabase';
import { IconWarn } from './Icons';

const REASONS: { id: string; label: string }[] = [
  { id: 'sexual', label: 'Սեռական բնույթի նկար կամ տեքստ' },
  { id: 'child', label: 'Երեխաներին վնասող նյութ' },
  { id: 'drugs', label: 'Թմրամիջոցներ' },
  { id: 'violence', label: 'Բռնություն կամ վիրավորանք' },
  { id: 'scam', label: 'Խաբեություն կամ սխալ տվյալներ' },
  { id: 'other', label: 'Այլ' },
];

/**
 * A quiet link at the foot of a listing for the rare one that should not be
 * there. Sexual content or anything involving children takes the name, note
 * and photo down on the first report; anything else on the second, from a
 * different visitor. Product, price and phone stay, so a false report costs
 * an honest seller little (see report_listing in migration 0025).
 */
export default function ReportListing({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isConfigured) return null;

  if (sent) {
    return <p className="report-done">Շնորհակալություն։ Մենք կստուգենք այս հայտարարությունը։</p>;
  }

  if (!open) {
    return (
      <button type="button" className="report-link" onClick={() => setOpen(true)}>
        <IconWarn size={14} />
        Բողոքել հայտարարությունից
      </button>
    );
  }

  return (
    <div className="report-box">
      <p className="report-title">Ի՞նչն է սխալ այս հայտարարության մեջ</p>
      <div className="report-reasons">
        {REASONS.map((reason) => (
          <button
            key={reason.id}
            type="button"
            className="report-reason"
            onClick={() => {
              setSent(true);
              void supabase()
                .rpc('report_listing', { p_id: listingId, p_session: currentSession(), p_reason: reason.id })
                .then(
                  () => undefined,
                  () => undefined,
                );
            }}
          >
            {reason.label}
          </button>
        ))}
      </div>
      <button type="button" className="report-cancel" onClick={() => setOpen(false)}>
        Չեղարկել
      </button>
    </div>
  );
}
