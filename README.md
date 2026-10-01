# Quaderno DSA

Quaderno digitale open source per studenti DSA delle scuole superiori (ITT e Licei), pensato per essere disponibile e gratuito anche su Linux.

L'obiettivo è un unico strumento che copra testo, calcolo e grafici con l'accessibilità come requisito centrale, non un'aggiunta:

- **Editor di testo** con font e spaziatura accessibili
- **Calcolo in colonna** con incolonnamento automatico (niente errori di allineamento) e inserimento facilitato di frazioni/potenze, senza dover scrivere sintassi LaTeX
- **Grafici**: funzioni matematiche, geometria analitica interattiva e grafici statistici
- **Sintesi vocale (TTS)**, disattivabile, anche per leggere i passaggi dei calcoli

Stato attuale: scaffold iniziale (editor di testo funzionante), i moduli di calcolo/grafici/TTS sono in sviluppo.

## Stack

Tauri v2 · React + TypeScript · TipTap · MathLive/KaTeX · JSXGraph · Chart.js

## Sviluppo

Il progetto gira su NixOS tramite una dev shell (`flake.nix`) che fornisce Node, Rust e le librerie di sistema necessarie (GTK3, WebKitGTK), così non serve installare nulla globalmente.

```bash
nix --extra-experimental-features 'nix-command flakes' develop
pnpm install
pnpm tauri dev
```

## Licenza

GPLv3 con [Commons Clause](https://commonsclause.com/): codice libero da usare, studiare, modificare e ridistribuire, ma non vendibile né utilizzabile come base di un servizio a scopo di lucro. Vedi [LICENSE](./LICENSE).
