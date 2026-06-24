# Catalog Findings — June 2026

## Source files reviewed

| File | Type | Notes |
| --- | --- | --- |
| `/home/ubuntu/upload/اسعاربيعمنتجاتJUSTTOP.pdf` | Accessories catalog | Contains real product thumbnail images beside item codes and Arabic names. Suitable for replacing old price-table screenshots in accessory cards. |
| `/home/ubuntu/upload/PRIMEWOOD-ARKOPA.pdf` | Color/material catalog | Reviewed first pages; catalog confirmed received for later material-family mapping. |
| `/home/ubuntu/upload/POLYLAC_BRO_EgyptPannel_09.03.2020_mail.pdf` | Color/material catalog | Poly-Lac catalog confirmed. |
| `/home/ubuntu/upload/GoodWood2024.pdf` | Color/material catalog | Large catalog (120 pages), likely mixed decorative board families and finishes. |

## Just Top product findings from viewed pages

| Pages | Section | Example codes seen | Finding |
| --- | --- | --- | --- |
| 5 | Dish racks + lift-up mechanisms | `JT0519S`, `JT0519W`, `B03`, `B01`, `R221`, `JT044A`, `JT044B`, `JT05`, `JT044C`, `G012`, `H025`, `JT044D`, `JT043`, `JT0432`, `JT042` | These pages contain individual product photos that can be used as card images. |
| 6 | Runners + waste baskets | `JTD003`, `JT01`, `JT3203`, `JT04`, `JT215`, `G25-30`, `G25-35`, `G25-40`, `G25-45`, `JT122`, `JT0528`, `BC-300`, `BC-400`, `BC-450`, `BC-600`, `JT014` | Product thumbnails are present and clearer than previous PDF table crops. |
| 7 | Countertop accessories + tables | `JT0556`, `JT0565`, `A04`, `A06`, `J211`, `JT304`, `J9A-1`, `G09`, `JT008`, `JT-GS1003`, `JT-GS1011`, `JT-GS1010`, `JT-GS1010H` | Real product thumbnails available for countertop accessories and movable table mechanisms. |
| 8 | Mechanisms | `G001`, `G002`, `A13`, `A09`, `A11`, `A12`, `J10`, `X6-4009`, `JT-0523`, `JTKL5`, `LK001`, `JTA10`, `JT-0568`, `JT-G0554`, `JT29` | Real product thumbnails available for mechanism-related accessories and pull-out systems. |

## Implementation implications

| Area | Decision |
| --- | --- |
| Accessory cards | Prefer mapping by accessory code when available, then fall back to Arabic name matching. |
| Colors tab | Build a new material-aware tab after review/discount stage, then attach only the catalogs relevant to the material selected in the pricing/materials step. |
| Upload strategy | Extract preview pages or selected catalog pages to app storage for fast in-app browsing. |

