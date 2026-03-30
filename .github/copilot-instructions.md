# Project general coding guidelines

Verwende shadcn/vue-Komponenten in Kombination mit Tailwind CSS gemäß den empfohlenen Best Practices: Nutze die kopieren-und-anpassen-Architektur, um volle Kontrolle über den Code zu behalten.  Baue auf Reka UI-Primitiven auf, die Barrierefreiheit (a11y, aria) und korrekte Zustandsverwaltung gewährleisten.  Setze Datenattribute (data-state, data-highlighted) für CSS-basierte Zustandsstile ein. Verwende cva für typsichere Varianten und cn() zum sicheren Mergen von Klassen. Halte Design-Konsistenz durch CSS-Design-Tokens (HSL/OKLCH) und eine zentrale theme.css. Nutze Context-Provider für gemeinsame Zustände (z. B. Sidebar, Theme) und das asChild-Pattern für flexible Element-Rendering. Stelle sicher, dass alle Komponenten tastaturbedienbar, responsive und mit korrekten role-Attributen ausgestattet sind. Nutze im Projekt ausschließlich lucide Icons (siehe https://lucide.dev/llms.txt)

## Code-Stil
- Verwende semantische HTML5-Elemente (header, main, section, article usw.)
- Bevorzuge moderne JavaScript-Funktionen (ES6+) wie const/let, Pfeilfunktionen und Template-Literale

## Namenskonventionen
- Verwende PascalCase für Komponentennamen, Schnittstellen und Typ-Aliase
- Verwende camelCase für Variablen, Funktionen und Methoden
- Setze privaten Klassenelementen ein Unterstrich (_) voran
- Verwende ALL_CAPS für Konstanten

## Codequalität
- Verwende aussagekräftige Variablen- und Funktionsnamen, die deren Zweck klar beschreiben
- Füge hilfreiche Kommentare für komplexe Logik hinzu
- Füge Fehlerbehandlung für Benutzereingaben und API-Aufrufe hinzu

## Datenbank
- Verwende MongoDB als Datenbanklösung
- Nutze interfaces und Typen, um die Datenstruktur zu definieren und die Typensicherheit zu gewährleisten

## Validierung
- Implementiere serverseitige Validierung für alle Benutzereingaben, um die Datenintegrität zu gewährleisten
- Nutze Validierungsbibliothek Zod für die Validierung von Datenmodellen und API-Anfragen
- Füge clientseitige Validierung hinzu, um die Benutzererfahrung zu verbessern und Fehler frühzeitig zu erkennen