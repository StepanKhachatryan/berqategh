import Modal from './Modal';
import QrPoster from './QrPoster';
import { pinSvg, SALE_TYPE_SHORT, serviceSvg } from './markers';
import type { SaleType } from '../lib/types';

/** Which guide: each mode gets only what is useful in it. */
export type GuideMode = 'buyer' | 'seller' | 'services';

interface GuideSheetProps {
  mode: GuideMode;
  onClose: () => void;
}

const TITLES: Record<GuideMode, string> = {
  buyer: 'Ինչպես գնել',
  seller: 'Ինչպես վաճառել',
  services: 'Գյուղատնտեսական ծառայություններ',
};

/** The one thing in a section that must not be missed: a thin light-red frame. */
function Important({ children }: { children: React.ReactNode }) {
  return <div className="guide-important">{children}</div>;
}

function BuyerGuide() {
  return (
    <>
      <section className="guide-section">
        <h4>Ինչպես գտնել բերք</h4>
        <ol className="guide-steps">
          <li>Նայե՛ք քարտեզը կամ ցանկը։ Մոտեցրե՛ք քարտեզը՝ ձեր մոտակայքը տեսնելու համար։</li>
          <li>
            <b>Ֆիլտրերում</b> ընտրե՛ք ապրանքը, գինը, մանրածախ կամ մեծածախ, թարմ թե չիր։
          </li>
          <li>Սեղմե՛ք կետի կամ ցանկի տողի վրա՝ գները, քանակը և լուսանկարը տեսնելու համար։</li>
          <li>
            Զանգե՛ք կամ գրե՛ք <b>ուղիղ վաճառողին</b>՝ WhatsApp-ով, Viber-ով կամ Telegram-ով։
          </li>
          <li>«Ինչպես հասնել»-ը բացում է ճանապարհը Yandex կամ Google քարտեզում։</li>
        </ol>
      </section>

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
        <p>
          Նշանի <b>ձևը</b> ցույց է տալիս վաճառքի եղանակը, <b>գույնը</b>՝ բերքի տեսակը։
          Չիրը նույն գույնի ավելի մուգ երանգով է։
        </p>
      </section>

      <section className="guide-section">
        <h4>Հեռավորություն և առաքում</h4>
        <p>
          Հեռավորությունը հաշվվում է ճանապարհով։ «≈» նշանը նշանակում է, որ այն մոտավոր է։ Եթե
          տեսնում եք <b className="guide-green">«Առաքում կա»</b>, վաճառողը կարող է բերել ձեզ
          մոտ, և հեռավորությունը խնդիր չէ։
        </p>
      </section>

      <section className="guide-section">
        <Important>
          <b>Քարտեզին ամեն ինչ թարմ է։</b> Ամեն հայտարարություն ունի ժամկետ և ինքնաշխատ
          հանվում է։ Ապրանքը տեսե՛ք տեղում նախքան վճարելը և նախապես գումար մի՛ փոխանցեք
          անծանոթին։ ԲերքաՏեղը միջնորդ չէ և գործարքին չի մասնակցում։
        </Important>
      </section>

      <section className="guide-section">
        <h4>Եթե տեղադիրքը չի որոշվում</h4>
        <p>
          Messenger-ի, Facebook-ի կամ Instagram-ի ներսում տեղադիրքի որոշումը չի աշխատում։
          Բացե՛ք կայքը Chrome-ում կամ Safari-ում, կամ պարզապես մոտեցրե՛ք քարտեզը ձեր գյուղին։
        </p>
      </section>
    </>
  );
}

function SellerGuide() {
  return (
    <>
      <section className="guide-section">
        <h4>Ինչպես տեղադրել բերք</h4>
        <ol className="guide-steps">
          <li>Սեղմե՛ք «Տեղադրել բերք»։</li>
          <li>Ընտրե՛ք ապրանքը ցանկից։ Եթե չիր եք վաճառում, նշե՛ք «Չիր»։</li>
          <li>Ընտրե՛ք՝ մանրածախ, մեծածախ, թե երկուսն էլ, և գրե՛ք գինը։</li>
          <li>
            Եթե կարող եք բերքը տանել գնորդին, նշե՛ք <b>«Կարող եմ նաև առաքել»</b>։
          </li>
          <li>Ըստ ցանկության ավելացրե՛ք մեկ լուսանկար՝ ձեր բերքի։</li>
          <li>
            Գրե՛ք հեռախոսահամարը <b>առանց առջևի զրոյի</b>՝ +374-ն արդեն դրված է։
          </li>
          <li>Նշե՛ք վաճառքի կետը. գրե՛ք գյուղի անունը կամ շարժե՛ք քարտեզը։</li>
          <li>Ընտրե՛ք ժամկետը՝ 10 օր, 1 ամիս կամ 3 ամիս։</li>
        </ol>
      </section>

      <section className="guide-section">
        <Important>
          <b>Վաճառե՞լ եք՝ հանե՛ք քարտեզից։</b> «Իմ հայտարարությունները» բաժնում կարող եք
          վաղաժամ հանել հայտարարությունը։ Գնորդը, որ զանգում է արդեն վաճառված բերքի համար,
          այլևս չի վստահում քարտեզին։
        </Important>
      </section>

      <section className="guide-section">
        <h4>Ձեր հայտարարությունները ցանկացած սարքից</h4>
        <p>
          Հրապարակելուց հետո ստանում եք <b>եռանիշ կոդ</b>։ Այն ձեր հեռախոսահամարի հետ
          վերադարձնում է հայտարարությունները նոր հեռախոսում։ Կարող եք նաև մուտք գործել
          <b> Gmail-ով</b> (վերևի մարդու նշանը)՝ ոչ պարտադիր է, բայց այդ դեպքում ամեն ինչ
          կերևա ցանկացած սարքից՝ առանց կոդի։
        </p>
      </section>

      <section className="guide-section">
        <h4>Եթե տեղադիրքը չի որոշվում</h4>
        <p>
          Messenger-ի, Facebook-ի կամ Instagram-ի ներսում տեղադիրքի որոշումը չի աշխատում։
          Գրե՛ք գյուղի կամ քաղաքի անունը որոնման դաշտում, և կետը կհայտնվի քարտեզին։
        </p>
      </section>

      <QrPoster />
    </>
  );
}

function ServicesGuide() {
  return (
    <>
      <section className="guide-section">
        <h4>Ինչ է այս բաժինը</h4>
        <p>
          Այստեղ են խանութներն ու ծառայությունները, որոնք պետք են բերքից առաջ՝ սերմ,
          պարարտանյութ, թունաքիմիկատ, տեխնիկա, ոռոգում և այլն։ Միացնելիս բերքի կետերը մարում
          են, անջատելիս ամեն ինչ վերադառնում է։
        </p>
      </section>

      <section className="guide-section">
        <h4>Ինչպես գտնել</h4>
        <ol className="guide-steps">
          <li>Գրե՛ք որոնման դաշտում՝ «սերմ», «տրակտոր», «ոռոգում»։</li>
          <li>Կամ ընտրե՛ք տեսակը որոնման տակի կոճակներից։</li>
          <li>Սեղմե՛ք կետի վրա՝ հեռախոսը, կայքը, հասցեն և ճանապարհը տեսնելու համար։</li>
        </ol>
      </section>

      <section className="guide-section">
        <h4>Կետերի տեսակները</h4>
        <ul className="guide-legend guide-services">
          <li>
            <span dangerouslySetInnerHTML={{ __html: serviceSvg(0.7) }} />
            Խանութ կամ ծառայություն
          </li>
          <li>
            <span className="guide-bubble" aria-hidden="true">
              Սերմեր
            </span>
            Պտտվող նշանը հերթով ցույց է տալիս, թե ինչ կա այնտեղ
          </li>
        </ul>
      </section>

      <section className="guide-section">
        <Important>
          <b>Սրանք գովազդատուներ են։</b> ԲերքաՏեղը չի երաշխավորում նրանց ապրանքների
          որակը և գործարքին չի մասնակցում։ Գնորդները այս բաժինը չեն տեսնում։
        </Important>
      </section>
    </>
  );
}

/** The guide for the mode the person is in, nothing else. */
export default function GuideSheet({ mode, onClose }: GuideSheetProps) {
  return (
    <Modal
      title={TITLES[mode]}
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>
          Հասկացա
        </button>
      }
    >
      {mode === 'buyer' ? <BuyerGuide /> : mode === 'seller' ? <SellerGuide /> : <ServicesGuide />}
    </Modal>
  );
}
