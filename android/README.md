# ԲերքաՏեղ Android հավելված

Հավելվածը **Trusted Web Activity** է. այն բացում է berqategh.am-ը ամբողջ
էկրանով, առանց հասցեի տողի։ Կայքի ամեն թարմացում հավելվածում երևում է
միանգամից. Google Play-ում նոր տարբերակ հրապարակել պետք է միայն այն դեպքում,
երբ փոխվում է հենց հավելվածի պատյանը (անուն, պատկերակ, թույլտվություններ)։

- `twa-manifest.json` — Bubblewrap-ի կարգավորումները (փաթեթի անունը՝
  `am.berqategh.app`)։
- Կայքի և հավելվածի կապը (`/.well-known/assetlinks.json`) սպասարկվում է
  Supabase-ից (`app_config` աղյուսակ, `assetlinks` բանալի)։ Google Play Console-ում
  հավելվածը ստեղծելուց հետո այնտեղ ավելացվում է «App signing key certificate»-ի
  SHA-256 մատնահետքը՝ առանց կայքի deploy-ի։
- Ստորագրման բանալին (`upload-key.keystore`) և դրա գաղտնաբառը **երբեք** չեն
  պահվում այս repository-ում։

## Ինչպես կառուցել

1. **Մեկ անգամ.** GitHub-ում՝ Settings → Secrets and variables → Actions →
   New repository secret, ավելացնել երկու գաղտնիք.
   - `ANDROID_KEYSTORE_BASE64` — `ANDROID_KEYSTORE_BASE64.txt` ֆայլի ամբողջ
     պարունակությունը;
   - `ANDROID_KEYSTORE_PASSWORD` — `password.txt` ֆայլի պարունակությունը։
2. Actions → **Android app** → Run workflow։ Մի քանի րոպեից run-ի էջում
   կհայտնվի ներբեռնելու ֆայլ (zip)՝ `app-release.aab` (Google Play-ի համար) և
   `app-release.apk` (հեռախոսում ուղիղ տեղադրելու համար)։

Բանալու ֆայլը (`berqategh-upload.keystore`) և գաղտնաբառը պահեք ապահով տեղում
(օրինակ՝ Google Drive)։ Դրանք պետք են app-ի ամեն նոր տարբերակի համար։
