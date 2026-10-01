# Quaderno DSA

Quaderno digitale open source per studenti DSA delle scuole superiori (ITT e Licei), pensato per essere disponibile e gratuito anche su Linux.

L'obiettivo è un unico strumento che copra testo, calcolo e grafici con l'accessibilità come requisito centrale, non un'aggiunta:

- **Foglio a quadretti** con testo grande e font ad alta leggibilità
- **Calcolo in colonna**: addizione, sottrazione, moltiplicazione e divisione all'italiana, con incolonnamento automatico, riporti e prestiti e i passaggi spiegati a parole
- **Grafici**: funzioni scritte come a scuola (`3x² - 0,5`, `sen(x)`), piano cartesiano con punti, segmenti, rette e circonferenze, grafici statistici con media, mediana e moda
- **Sintesi vocale**, disattivabile, che legge il testo, i calcoli e i loro passaggi
- **Salvataggio** in file `.quaderno` e copia di ripristino automatica: chiudere senza salvare non fa perdere il lavoro

## Scaricare l'app (Windows)

Gli installer per Windows vengono creati automaticamente da GitHub Actions:

- **Versioni pubblicate**: nella pagina [Releases](../../releases) del repository.
- **Ultima versione in sviluppo**: nella scheda [Actions](../../actions/workflows/windows.yml), apri l'ultima esecuzione riuscita e scarica `quaderno-dsa-windows` dagli *Artifacts*.

Ci sono due formati:

- `.exe`: installer consigliato. Si installa per l'utente corrente, quindi **non servono i permessi di amministratore** (utile nei laboratori scolastici).
- `.msi`: pacchetto per installare l'app su più computer.

La sintesi vocale su Windows usa le voci già presenti nel sistema; se manca una voce italiana si può aggiungere da *Impostazioni → Ora e lingua → Voce*.

## Sviluppo

Il progetto gira su NixOS tramite una dev shell (`flake.nix`) che fornisce Node, Rust e le librerie di sistema necessarie (GTK3, WebKitGTK, speech-dispatcher), così non serve installare nulla globalmente.

```bash
nix --extra-experimental-features 'nix-command flakes' develop
pnpm install
pnpm tauri dev
```

Controlli e test:

```bash
pnpm typecheck
pnpm test
```

### Pubblicare una nuova versione

1. Aggiorna `version` in `src-tauri/tauri.conf.json` e `package.json`.
2. Crea e invia un tag con lo stesso numero:
   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```
3. GitHub Actions crea una Release in **bozza** con gli installer allegati: controllala e pubblicala dalla pagina Releases.

## Stack

Tauri v2 · React + TypeScript · TipTap · JSXGraph · Chart.js · crate `tts` (speech-dispatcher su Linux, voci di sistema su Windows)

## Licenza

GPLv3 con [Commons Clause](https://commonsclause.com/): codice libero da usare, studiare, modificare e ridistribuire, ma non vendibile né utilizzabile come base di un servizio a scopo di lucro. Vedi [LICENSE](./LICENSE).
