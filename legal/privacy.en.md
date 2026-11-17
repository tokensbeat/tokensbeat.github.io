Version: 2026-11-17

This Privacy Policy explains what personal data {{site_name}} ({{site_host}}, {{api_host}} and {{agent_name}}, our agent at {{agent_host}} — the "Service") collects, why, who it is shared with, and how long it is kept. The controller is the operator of {{site_host}} ("we"). It forms part of our [Terms of Service](/legal/terms).

## 1. Data we collect

**Account data.** Sign-in is handled by Clerk. From it we receive and store your e-mail address, display name, avatar and a user identifier, plus the time of your sign-ins. We keep settings you choose (language, theme, notification preferences) and the API keys you create (stored so that we can recognise them; treat them as secrets).

**Billing data.** Orders, the amount and currency, the payment method type, the processor's reference and status, promo or redeem codes used, affiliate ledger entries, your balance and subscriptions. Card numbers and wallet keys are handled by the payment processor and never reach us.

**Gift cards.** For each gift card we keep its amount, state and dates, the account that made it and the top-ups that paid for it, the account that redeemed it, and a history of what was done with it (for example made, code shown, sent, cancelled, redeemed, put on hold, reversed), with the balance after each change. The code is stored encrypted; only its last five characters are kept readable, to tell cards apart. If the maker gives a recipient's e-mail address and a note, we keep them with the card and use the address only to send that person the card: its code, amount, note and expiry date, and the maker's e-mail address with most characters hidden. The recipient does not need an account. When the maker shows a card's code in the console, the page holds it in memory only and hides it after two minutes; each showing is recorded. Failed attempts to redeem a code are counted per account and per IP address for ten minutes, to stop guessing. A redeem link carries the code after a "#", which the browser does not send to our servers; the console keeps it in that tab's session storage for up to 30 minutes, so that signing in does not lose it.

**Promotional credits.** If you take part in a promotion that credits your balance with your first top-up, and only after this policy version is in force, we record with that order the time, the amount, the payment method, the IP address and browser from which the order was placed, the e-mail domain and the age of the account, to detect abuse of the promotion. We also keep a keyed, pseudonymous fingerprint of the account's sign-in e-mail address so that the credit is given once per e-mail address and account; we can match it against other accounts but cannot read the address from it. The IP address and browser are deleted after 90 days, the other signals after 12 months and the fingerprint after 36 months, including after the account is deleted. We do not fingerprint payment cards. The credit itself and its reversals are part of your balance history. We rely on our legitimate interest in preventing abuse; you may object or ask for these records to be deleted through Support, and we review each request individually within 30 days.

**Usage records.** For every request we record who made it (user, API key, group), the model and endpoint, token or image or video quantities, the cost charged, timing, request identifiers, the IP address and user-agent of the client, and whether the request succeeded. These records are the basis of your bill and of our abuse protection.

**Content.** What happens to prompts, files and output depends on where you use them:

- *API requests* are forwarded to the model provider (for Discount groups, through a trusted third party; see section 3) and streamed back. We do not keep request bodies or output in our database, apart from the safety excerpts described below and short-lived caches needed to serve the request.
- *{{agent_name}}* chats are stored as conversation history until you delete the chat. Files you upload are stored (de-duplicated, up to the quota shown in the app) until you delete them or the chat that uses them; files never attached to a message are removed after 24 hours. Images you generate on the Image page and frame images in video projects are stored until you delete them or the project.
- *Private sessions* ({{agent_name}}) are switched off for now: no private-session sandbox runs and no private-session backups are kept. While they are off, the files {{agent_name}}'s tools create in a chat are kept on our own servers with that chat and are deleted with it. As with any {{agent_name}} tool, the commands the agent runs and the file contents it reads or writes also appear in the chat history.
- *{{agent_name}} memories* are short notes you ask {{agent_name}} to remember across chats. Memory is off until you turn it on: on {{agent_name}}'s Memory page, in the account menu, or when {{agent_name}} asks above the chatbox. Memories are saved only when you add them on the Memory page, or when you approve {{agent_name}} saving one in a chat ({{agent_name}} always asks first, even in automatic mode); nothing is extracted from your chats automatically. While memory is on, your memories (except those you hide) are sent with each chat message to the model you chose, as part of its context. On the Memory page you can view, edit, hide, export (JSON) and delete them; a deleted memory stays in the trash for 30 days so you can restore it, then it is removed for good, or at once if you choose "Delete forever".
- *Learned memory.* Learned memory is off until you turn it on on {{agent_name}}'s Memory page. With it on, {{agent_name}} reads the messages you type in your chats (not its own replies, the files you attach or what its tools return) and keeps short summaries and facts about you, which it recalls in later chats. It learns from your chats after you turn learning on; when you press Learn on a chat, it also reads that chat's earlier messages, including ones typed before you turned learning on, and only that chat's. The learning and the recall are done by Qwen models on our own servers, reached over a private connection: one model writes the summaries and facts; an embedding model indexes them and, each time {{agent_name}} recalls or you search your memory, reads the message or search it is looked up with. Those model calls are ordinary calls on your key and are handled by the gateway exactly as its other calls are: billed and counted in a usage record without text; the answer of each learning and indexing call is kept for 24 hours (for indexing, a list of numbers, not text; recall and search calls are not kept) so that a repeated call is replayed rather than run and billed again (this table is excluded from database backups and leaves server snapshots within 35 days); a failed call's error text stays in the gateway's error records for 30 days, and those records are in database backups for up to a year. Forget does not change any of these. What it learns can be wrong: you can see, search, correct (as a note), forget and export it on the Memory page at any time, and deleting a chat forgets what was learned from it. Each chat or task learned, the indexing of what was learned, and each recall or memory search cost what their Qwen calls cost on the {{site_name}} API key your chat runs on, at the Qwen group's prices, with no fee of ours; without balance on that key, recall and search find memories by keyword only; learned memory counts in your storage. Learning stops at 600 chat summaries and 6,000 facts per scope. What you forget is gone at once from what {{agent_name}} uses, and from the memory store's backups within 35 days. Turning learned memory off stops learning and recall in your chats; what was learned stays until you forget it, and you can still see it and search it by keyword on the Memory page.
- *Videos* are stored only in our archive storage, on our own servers. Videos created through the API are deleted seven days after completion; videos created in {{agent_name}} are kept until you delete them. The GPU host that renders a video keeps no copy once the render has been archived.

**Safety records.** Requests may be scanned by automated classifiers. When a request is flagged we keep an event with the model, the categories and scores, a redacted excerpt of the prompt and, for serious findings, the prompt text itself, so that the decision can be reviewed and abuse can be stopped. Moderation notices sent to you are recorded.

**Security and administrative logs.** Server logs and administrator audit logs (actions taken in the admin console, with IP address and user-agent) are kept to protect the Service; audit logs are deleted after 180 days.

**Cookies and local storage.** We use Clerk's session cookies to keep you signed in and the browser's local storage for your preferences (theme, language, open project, drafts); a gift card's code from a redeem link stays in the tab's session storage for up to 30 minutes. We do not use advertising or cross-site tracking cookies.

## 2. Why we process it

- To provide the Service you asked for: route requests, run {{agent_name}}, render videos, keep your chats and projects (performance of our contract with you).
- To bill you and keep the accounting records the law requires.
- To protect the Service, its users and the model providers against abuse, fraud and illegal content, and to comply with the providers' usage policies (our legitimate interest and legal obligations).
- To send service messages: balance and quota warnings, order confirmations, security and moderation notices, and a gift card to the recipient its maker named. We do not send marketing e-mail. Notification e-mails contain an unsubscribe link for non-essential messages.
- To understand how the Service is used, with aggregated statistics that do not identify you.

## 3. Who receives data

- **Model providers.** The content of a request — your prompt, attached files or images, and conversation context — is sent to the provider of the model you chose (for example OpenAI, Anthropic, Google, xAI, Moonshot, Zhipu, DeepSeek, MiniMax). Each provider processes it under its own terms and privacy policy, usually in the United States. Models we host ourselves (for example Qwen chat models and the video generator) run on our own hardware and send nothing to a third party.
- **Trusted third parties (Discount groups).** Requests sent with a key in a Discount group (for example "Claude · Discount" or "OpenAI · Discount") are relayed through a trusted third party, which passes them on to the model's provider. That third party receives the same request content, processes it under its own terms and privacy policy, and may be located in another country. Official groups send requests straight to the provider; where one is offered, use it if you do not want a third party to relay your requests.
- **Infrastructure.** Our servers host the database, {{agent_name}} and the video archive; Cloudflare provides DNS, TLS and traffic routing (it sees your IP address and request metadata); GitHub Pages hosts our public website (it sees the IP address and request metadata of each visit); the e-mail delivery provider configured by the operator sends notification e-mail. Our servers are in mainland China; Cloudflare and GitHub Pages serve traffic from their networks around the world.
- **Identity and payments.** Clerk (authentication), Stripe, NOWPayments and WeChat Pay (payments), each under their own policies.
- **Authorities.** When the law requires it, or to establish or defend legal claims.

We do not sell personal data and we do not share it with advertisers. Where a recipient is outside your country, the transfer rests on the contract with you or on the recipient's safeguards.

## 4. How long we keep data

| Data | Kept |
| --- | --- |
| Account and settings | Until you delete your account; the e-mail address of a deleted account is kept for 30 days so that it cannot be used for a new account during that time, then erased with the rest of the profile |
| Support tickets | While the account exists; closed tickets of a deleted account are deleted 30 days after the deletion |
| Sign-in identifier of a deleted account | Kept without other personal data, so that the deleted account cannot be signed into again |
| Orders, invoices, balance ledger | As long as accounting law requires after the transaction |
| Gift cards and their history, including the recipient's e-mail address and note | As long as accounting law requires after the card is redeemed, cancelled or expires |
| Promotional-credit records (first-top-up credit) | IP address and browser: 90 days; other signals and refusal reasons: 12 months; the e-mail fingerprint: 36 months, also after the account is deleted; the credit and its reversals stay with the balance ledger |
| Usage records | For the life of the account, for billing, disputes and abuse analysis; older records may be aggregated |
| {{agent_name}} chats, uploads, generated images, video projects | Until you delete them (orphan uploads: 24 hours) |
| {{agent_name}} memories | Until you delete them; deleted ones stay in the trash for 30 days |
| Learned memory | Until you forget it; forgotten entries leave the memory store's backups within 35 days |
| Gateway replay copies of API call answers | 24 hours; never in database backups; in server snapshots up to 35 days |
| Gateway error records | 30 days (in database backups up to one year) |
| Private-session files and backups | None kept while private sessions are switched off |
| API videos | 7 days after completion |
| {{agent_name}} videos | Until you delete them |
| Safety and moderation events | As long as needed to enforce our policies and defend claims |
| Administrator audit logs | 180 days |

When you delete your account we delete your account data, chats, uploads, generated media and projects, and keep only the records that the law or an open dispute requires. These are orders, payments, referral withdrawals, gift cards and balance and referral ledgers, which include the name and e-mail address given at checkout, the payout wallet address and a gift card's recipient e-mail address; they are kept for the period the law requires.

## 5. Your rights

Depending on where you live you may have the right to access, export, correct or delete your personal data, to restrict or object to its processing, and to complain to a supervisory authority. In the Service you can view your usage records, export chats and files, delete chats, media, projects and API keys, change notification preferences and delete your account. For anything else, contact us (section 8).

## 6. Security

Traffic to the Service is encrypted with TLS. API keys are treated as secrets, access to production systems is restricted to administrators and logged, and payment data stays with the processors. No system is perfectly secure; tell us immediately if you believe a key or account has been compromised.

## 7. Children

The Service is for adults. We do not knowingly collect data from anyone under 18; if we learn that we have, we delete the account.

## 8. Changes and contact

We may update this Policy; the version date at the top shows the current version and material changes are announced in the console or by e-mail. For questions or requests about your data:

{{contact}}
