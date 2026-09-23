import Modal from './Modal';
import QrPoster from './QrPoster';
import { pinSvg, SALE_TYPE_SHORT } from './markers';
import {
  IconCheck,
  IconClock,
  IconPhone,
  IconPin,
  IconRoute,
  IconService,
  IconShield,
  IconWarn,
} from './Icons';
import { SERVICES } from '../data/services';

/* Counted rather than written out, so the note cannot go on saying "two"
   after the trials have been replaced by real advertisers. */
const TRIAL_COUNT = SERVICES.filter((service) => service.trial).length;
import type { Role, SaleType } from '../lib/types';

interface GuideSheetProps {
  role: Role;
  onClose: () => void;
}

/**
 * The user guide. Its first and largest section is the listing expiration rule,
 * because that is the one thing about this platform people have to understand
 * before they use it — a seller needs to know their listing will vanish, and a
 * buyer needs to know that everything they see is genuinely current.
 */
export default function GuideSheet({ role, onClose }: GuideSheetProps) {
  return (
    <Modal
      title="Ինչպես օգտվել"
      subtitle="Կարճ ուղեցույց՝ 1 րոպե"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-cta btn-block" onClick={onClose}>
          <IconCheck />
          Հասկացա
        </button>
      }
    >
      {/* ─── the rule that matters most ────────────────────────────────── */}
      <section className="guide-hero">
        <div className="guide-hero-badge">
          <IconClock size={20} />
          Ժամկետ
        </div>
        <h3>Ամեն հայտարարություն ունի ժամկետ</h3>
        <p>
          Հրապարակելուց պես հայտարարությունն ինքնաշխատ հեռանում է քարտեզից և
          անցնում ձեր արխիվ։ Դուք ընտրում եք ժամկետը՝ 5 օր, 10 օր, 1 ամիս կամ 3 ամիս։
          Նոր բերքի համար տեղադրե՛ք նոր հայտարարություն՝ թարմ գնով և քանակով։
        </p>
      </section>

      <section className="guide-section">
        <h4>Ինչու է այդպես</h4>
        <ul className="guide-list">
          <li>
            <b>Գյուղմթերքը արագ է վաճառվում։</b> Այսօրվա 200 կիլոգրամ ծիրանից վաղը կարող է
            ոչինչ չմնալ։
          </li>
          <li>
            <b>Գինը օրեօր փոխվում է։</b> Բերքահավաքի թափից կախված՝ գինը մեկ օրում կարող է
            զգալի իջնել կամ բարձրանալ։
          </li>
          <li>
            <b>Հին հայտարարությունը վնաս է տալիս բոլորին։</b> Գնորդը զանգում է, ճանապարհ
            է ընկնում, իսկ բերքն արդեն վաճառված է։ Մեկ-երկու այդպիսի դեպքից հետո մարդիկ
            դադարում են վստահել քարտեզին։
          </li>
          <li>
            <b>Դրա փոխարեն դուք ստանում եք երաշխիք։</b> Քարտեզի վրա ամեն ինչ թարմ է - ամեն
            հայտարարություն ունի սահմանված ժամկետ, որից հետո ինքնաշխատ հանվում է։
          </li>
        </ul>
      </section>

      {/* ─── role-specific ─────────────────────────────────────────────── */}
      {role === 'seller' ? (
        <section className="guide-section">
          <h4>Ինչպես տեղադրել բերք</h4>
          <ol className="guide-steps">
            <li>Սեղմե՛ք «Տեղադրել բերք»։</li>
            <li>Ընտրե՛ք ապրանքը ցանկից։ Եթե չիր եք վաճառում, նշե՛ք «Չիր»։</li>
            <li>
              Ընտրե՛ք՝ մանրածախ, մեծածախ, թե երկուսն էլ։ Ըստ դրա կակտիվանան գնի դաշտերը։
            </li>
            <li>
              Գրե՛ք հեռախոսահամարը <b>առանց առջևի զրոյի</b> - <code>+374</code>-ն արդեն
              դրված է։
            </li>
            <li>
              Նշե՛ք վաճառքի կետը։ Համակարգը փորձում է ինքը գտնել, բայց կարող եք գրել
              գյուղի անունը կամ շարժել քարտեզը։
            </li>
            <li>
              Ընտրե՛ք հայտարարության ժամկետը՝ 5 օր, 10 օր, 1 ամիս կամ 3 ամիս։
            </li>
            <li>
              Հրապարակելուց հետո կստանաք <b>եռանիշ կոդ</b>։ Պահե՛ք այն. հեռախոսահամարի
              հետ միասին այն վերադարձնում է ձեր հայտարարությունները, եթե հեռախոսը
              փոխեք կամ բրաուզերի հիշողությունը մաքրվի։
            </li>
          </ol>
          <p className="guide-note">
            <IconClock size={15} />
            «Իմ հայտարարությունները» բաժնում տեսնում եք, թե որքան ժամանակ է մնացել, և
            կարող եք վաղաժամ հանել քարտեզից, եթե բերքն արդեն վաճառվել է։ Դա ամենակարևոր
            բանն է, որ կարող եք անել գնորդների վստահությունը պահելու համար։
          </p>
        </section>
      ) : null}

      {/* ─── the services layer, sellers only ──────────────────────────── */}
      {role === 'seller' ? (
        <section className="guide-section">
          <h4>
            <IconService size={15} /> Գյուղատնտեսական ծառայություններ
          </h4>
          <p>
            Քարտեզի վերևի ձախ անջատիչը ցույց է տալիս ոչ թե բերք, այլ այն, ինչ պետք է
            բերքից առաջ։ Միացնելիս հայտարարությունները մարում են, և դրանց տեղում
            հայտնվում են ծառայությունների կետերը։ Անջատելիս ամեն ինչ վերադառնում է։
          </p>
          {/* The two kinds of marker, drawn as they appear - not the list of
              trades, which is two dozen long and belongs in each sheet. */}
          <ul className="guide-legend guide-services">
            <li>
              <span className="service-mark" aria-hidden="true">
                🧪
              </span>
              Երկնագույն կետերը խանութներ և ծառայություններ են, ոչ թե բերք։
            </li>
            <li>
              <span className="guide-bubble" aria-hidden="true">
                <span>🫘</span> Սերմեր
              </span>
              Պտտվող պատուհանը հերթով ցույց է տալիս, թե ինչ կա այնտեղ։
            </li>
          </ul>
          <p>Սեղմե՛ք ցանկացածի վրա՝ հեռախոսը, հասցեն և ամբողջ ցանկը տեսնելու համար։</p>
          {TRIAL_COUNT > 0 ? (
            <p className="guide-note">
              <IconWarn size={15} />
              Բաժինը փորձնական է։ Քարտեզին այս պահին {TRIAL_COUNT} ցուցադրական կետ կա՝
              իրական ծառայություններ չեն։ Գնորդները այս բաժինը չեն տեսնում։
            </p>
          ) : (
            <p className="guide-note">
              <IconWarn size={15} />
              Գնորդները այս բաժինը չեն տեսնում։
            </p>
          )}
        </section>
      ) : (
        <section className="guide-section">
          <h4>Ինչպես գտնել ձեզ պետք եղածը</h4>
          <ul className="guide-list">
            <li>
              <IconRoute size={15} /> <b>Հասանելիության շառավիղը</b> հաշվարկվում է
              ճանապարհի երկարությամբ, ոչ թե ուղիղ գծով։ Լեռնային ճանապարհներին այդ երկու
              թիվը շատ է տարբերվում։ «≈» նշանը նշանակում է, որ հեռավորությունը մոտավոր է։
            </li>
            <li>
              <b>Ֆիլտրերում</b> կարող եք ընտրել գինը, մեծածախ կամ մանրածախ, կոնկրետ
              ապրանքը, ինչպես նաև՝ թարմ է թե չիր։
            </li>
            <li>
              <IconPhone size={15} /> <b>Զանգում եք ուղիղ վաճառողին։</b> Հարթակը միջնորդ
              չէ, տոկոս չի վերցնում և գործարքին չի մասնակցում։
            </li>
          </ul>
        </section>
      )}

      {/* ─── map symbols ───────────────────────────────────────────────── */}
      <section className="guide-section">
        <h4>Քարտեզի նշանները</h4>
        <ul className="guide-legend">
          {(['retail', 'wholesale', 'both'] as SaleType[]).map((type) => (
            <li key={type}>
              <span dangerouslySetInnerHTML={{ __html: pinSvg(type, '#9aa79c', 0.62) }} />
              {SALE_TYPE_SHORT[type]}
            </li>
          ))}
        </ul>
        <p className="guide-note">
          Նշանի <b>ձևը</b> ցույց է տալիս վաճառքի եղանակը, <b>գույնը</b>՝ մրգի կամ
          բանջարեղենի տեսակը։ Չիրի նշանները նույն գույնի ավելի մուգ երանգով են։
        </p>
      </section>

      {/* ─── location in in-app browsers ───────────────────────────────── */}
      <section className="guide-section">
        <h4>
          <IconPin size={15} /> Եթե տեղադիրքը չի որոշվում
        </h4>
        <p>
          Messenger-ի, Facebook-ի կամ Instagram-ի ներսում բացված էջերում տեղադիրքի
          ավտոմատ որոշումը չի աշխատում - դա այդ հավելվածների սահմանափակումն է։ Պարզապես
          գրե՛ք ձեր գյուղի կամ քաղաքի անունը որոնման դաշտում, և կետը կհայտնվի քարտեզին։
        </p>
      </section>

      {/* ─── safety ────────────────────────────────────────────────────── */}
      <section className="guide-section">
        <h4>
          <IconShield size={15} /> Անվտանգություն
        </h4>
        <ul className="guide-list">
          <li>Ապրանքը տեսե՛ք և ստուգե՛ք տեղում, նախքան վճարելը։</li>
          <li>Նախապես գումար մի՛ փոխանցեք անծանոթ մարդուն։</li>
          <li>
            Հարթակը չի ստուգում հայտարարությունների ճշտությունը և կողմ չէ գործարքին։
          </li>
        </ul>
      </section>

      {/* Last, so it is what is on screen when the guide is scrolled through. */}
      <QrPoster />
    </Modal>
  );
}
