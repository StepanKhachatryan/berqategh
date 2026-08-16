import type { Role } from '../lib/types';
import { IconArrowRight, IconLeaf, IconPin, IconShield } from './Icons';

/**
 * The first thing anyone sees. Everything downstream — the menus, the map
 * controls, the primary action — is shaped by this one answer, so it is asked
 * before anything else and can be changed later from the header.
 */
export default function RoleGate({ onPick }: { onPick: (role: Role) => void }) {
  return (
    <div className="gate">
      <div className="gate-inner">
        <img src="/favicon.svg" alt="" className="gate-logo" />

        <h1>
          Բարի գալուստ <em>ԲերքաՏեղ</em>
        </h1>
        <p className="gate-lede">
          Թարմ բերքը՝ ուղիղ ֆերմերից։ Առանց միջնորդի, առանց ավելորդ գնի։
        </p>

        <p className="gate-question">Դուք ո՞վ եք</p>

        <div className="gate-choices">
          <button type="button" className="gate-card buyer" onClick={() => onPick('buyer')}>
            <div className="gate-icon">🛒</div>
            <h3>Գնորդ եմ</h3>
            <p>
              Գտի՛ր մոտակա ֆերմերներին քարտեզի վրա, համեմատի՛ր գները և զանգահարի՛ր ուղիղ։
            </p>
            <span className="gate-go">
              Բացել քարտեզը <IconArrowRight />
            </span>
          </button>

          <button type="button" className="gate-card seller" onClick={() => onPick('seller')}>
            <div className="gate-icon">🧑‍🌾</div>
            <h3>Վաճառող եմ</h3>
            <p>
              Տեղադրի՛ր քո բերքը մեկ րոպեում՝ գին, տեղադիրք, հեռախոս։ Գնորդներն իրենք կզանգեն։
            </p>
            <span className="gate-go">
              Տեղադրել հայտարարություն <IconArrowRight />
            </span>
          </button>
        </div>

        <div className="gate-trust">
          <span>
            <IconShield /> Առանց գրանցման
          </span>
          <span>
            <IconLeaf /> Անվճար հայտարարություն
          </span>
          <span>
            <IconPin /> Ամբողջ Հայաստանով
          </span>
        </div>
      </div>
    </div>
  );
}
