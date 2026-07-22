# ReadyRoad Keyword Research

Reviewed: 21 July 2026

## Evidence levels

- **Verified:** wording observed in current search results or an official Belgian source.
- **Estimated opportunity:** a qualitative judgement based on result relevance, page formats, and language coverage.
- **Unavailable:** numeric search volume, CPC, and Search Console impressions were not available.
- **Implemented:** mapped to an existing ReadyRoad page and included in the Milestone 7 implementation.

No numeric search volume or competition score is presented as fact. Google Search Console, Keyword Planner, and authenticated Google Trends exports were unavailable.

## Research sources

Search-result samples were reviewed in Dutch, French, English, and Arabic. Official terminology and regional exam context were checked against:

- [Flanders: theory exam for category B](https://www.vlaanderen.be/mobiliteit-en-openbare-werken/auto-en-motor/rijbewijzen-en-rijopleiding/rijbewijs-b/theorie-examen-voor-rijbewijs-b)
- [Wallonia: taking the category-B theory test](https://wallonie.be/en/demarches/taking-category-b-driving-theory-test)
- [Brussels: licence B training and tests](https://be.brussels/en/transport-mobility/drivers-license-and-vehicle-registration/getting-your-driving-licence/driver-training-and-driving-licence-tests-licence-b)
- [FPS Mobility: traffic rules](https://mobilit.belgium.be/fr/route/conduire/code-de-la-route-violations-et-sanctions/regles-de-circulation)
- [FPS Mobility: future public-road code from 1 June 2027](https://mobilit.belgium.be/en/node/5061)

Official pages are used for terminology and legal context, not as proof of keyword volume.

## Dutch findings

Strong result patterns:

- `theorie-examen rijbewijs B oefenen België`
- `gratis theorie-examen oefenen België`
- `proefexamen rijbewijs B`
- `theorie rijbewijs B België`
- `verkeersborden België betekenis`
- `voorrang van rechts België`
- `parkeerregels België`
- `snelheidsbeperkingen België`
- `lage-emissiezone België regels`

Intent is split between high-intent practice queries and educational/legal clarification. Commercial competition is high for generic exam-practice terms. ReadyRoad has a better fit for multilingual study, governed sign meanings, and topic-level long-tail queries than for promises such as “slaaggarantie”.

## French findings

Strong result patterns:

- `examen théorique permis B Belgique`
- `test permis théorique Belgique gratuit`
- `examen blanc permis B Belgique`
- `cours théorie permis B Belgique`
- `panneaux de signalisation Belgique`
- `priorité de droite Belgique`
- `règles de stationnement Belgique`
- `limitations de vitesse Belgique`
- `zone de basses émissions Belgique`

French results are strongly optimized around `gratuit`, `examen blanc`, and `permis B online`. ReadyRoad should use these concepts only where the existing page genuinely offers practice; the public lesson and sign pages should retain educational intent.

## English findings

Strong result patterns:

- `Belgian driving theory test practice`
- `Belgium category B theory test in English`
- `free driving theory test Belgium`
- `Belgian traffic signs meanings`
- `Belgian road rules explained`
- `priority rules Belgium`
- `parking rules Belgium`
- `speed limits Belgium`
- `low emission zone Belgium rules`

English search results contain fewer Belgium-specific learning platforms than Dutch or French. Users frequently ask how to study or take the exam in English. ReadyRoad can credibly target study-language intent, but must not imply that Arabic or English is an official exam language in every region.

## Arabic findings

Observed natural variants:

- `امتحان رخصة القيادة النظري في بلجيكا بالعربي`
- `امتحان رخصة السياقة في بلجيكا بالعربية`
- `أسئلة امتحان السياقة في بلجيكا`
- `اختبار نظري مجاني للسياقة في بلجيكا`
- `إشارات المرور في بلجيكا بالعربي`
- `علامات المرور في بلجيكا`
- `قواعد المرور البلجيكية بالعربية`
- `تعليم السياقة النظري في بلجيكا`
- `امتحان التيوري بلجيكا`

The sampled Arabic results were sparse and often led to app stores or non-Belgian material. This is a high qualitative opportunity for ReadyRoad's existing Arabic interface, lessons, and sign catalog.

Terminology policy:

- Use `القيادة` as the neutral standard in core headings and Metadata.
- Include `السياقة` naturally in supporting copy because it is widely used by North African Arabic speakers in Belgium.
- Use `رخصة القيادة` as the standard and `رخصة السياقة` as a search synonym.
- Use `امتحان القيادة النظري` as the standard; `امتحان النظري` and `امتحان التيوري` are query variants, not preferred legal prose.
- Use `إشارات المرور` in search-focused headings and allow `علامات المرور` as a natural synonym.

## Search intent summary

| Cluster | Primary intent | Existing page | Priority |
|---|---|---|---|
| General Belgian theory | Exam preparation | `/` | P0 |
| Category B lessons | Educational | `/lessons` | P0 |
| Belgian traffic signs | Informational / educational | `/traffic-signs` | P0 |
| Specific sign meaning | Informational / legal clarification | `/traffic-signs/{signCode}` | P1 |
| Priority to the right | Educational / legal clarification | `/lessons/les-19` | P1 |
| Parking rules | Educational / legal clarification | `/lessons/les-28` | P1 |
| Speed limits | Legal clarification | `/lessons/les-3` | P1 |
| Arabic theory in Belgium | High-intent learning | `/`, `/lessons`, `/traffic-signs` | P0 |

The complete cluster and page mapping is maintained in `keyword-map.json`.
