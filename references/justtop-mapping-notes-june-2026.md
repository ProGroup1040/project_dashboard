# Just Top catalog extraction notes — June 2026

Source file: `/home/ubuntu/upload/اسعاربيعمنتجاتJUSTTOP.pdf`
Rendered pages: `/home/ubuntu/jt_hires/page_01.png` to `page_13.png` at 300 DPI.

## Layout findings

- Catalog pages render at approximately **2550 × 3300 px**.
- Table content sits roughly inside **x = 327 to 2192**.
- The **product image column is the leftmost table column** in the rendered page, approximately **x = 327 to 620**.
- Extracted thumbnails from this column are usable enough for card previews after targeted cropping.

## Page-to-code mapping observed manually

### Page 1
- `JT-452R` → pull-out corner basket, image present
- `JT-60S` → tall pull-out stainless, image present
- `JT-45S` → tall pull-out stainless, shares image block with JT-60S
- `JT-605S` → acrylic tall pull-out, image present
- `JT-456S` → acrylic tall pull-out, shares image block with JT-605S
- `JT0202-300` → aluminium trolley 25 cm, image present
- `JT0202-350` → aluminium trolley 30 cm, shares image block with JT0202-300
- `JT0202-400` → aluminium trolley 35 cm, shares image block with JT0202-300
- `JT0205-150` → side acrylic trolley 10 cm, image present
- `JT0205-200` → side acrylic trolley 15 cm, shares image block with JT0205-150
- `JT0205-250` → side acrylic trolley 20 cm, shares image block with JT0205-150
- `PC-216` → lower aluminium trolley 3 shelves 10 cm, image present

### Page 2
- `PC-217` → lower aluminium trolley 3 shelves 15 cm, image present
- `PC-213` → lower stainless trolley 3 shelves 20 cm, shares image block with PC-214 / PC-215
- `PC-214` → lower stainless trolley 3 shelves 25 cm, shares same image block
- `PC-215` → lower stainless trolley 3 shelves 30 cm, shares same image block
- `BL-200-F-G` → lower acrylic trolley 3 shelves 15 cm, image present
- `JT0202-200` → stainless trolley 15 cm, image present
- `JT0203-300` → stainless trolley 25 cm, shares image block with JT0203-350 / JT0203-400
- `JT0203-350` → stainless trolley 30 cm, shares same image block
- `JT0203-400` → stainless trolley 35 cm, shares same image block
- `JT0520R` → right magic corner S aluminium, image present
- `JT0520L` → left magic corner S aluminium, shares image block with JT0520R
- `JT0151G` → modified acrylic horse-corner magic, image present
- `XGW-900` → right-left modified glass magic corner, image present
- `JT-0512` → right-left modified stainless magic corner, image present
- `JT-214` → 3/4 moving basket 90 cm, image present

### Page 3
- `JT160` → stainless dish rack 60, image present
- `JT170` → stainless dish rack 70, shares image with JT160 family
- `JT180` → stainless dish rack 80, shares image with JT160 family
- `JT190` → stainless dish rack 90, shares image with JT160 family
- `JT200` → stainless dish rack 100, shares image with JT160 family
- `JT160G` → brown stainless dish rack 60, image present
- `JT170G` → brown stainless dish rack 70, shares image with JT160G family
- `JT180G` → brown stainless dish rack 80, shares image with JT160G family
- `JT190G` → brown stainless dish rack 90, shares image with JT160G family
- `JT0514B-700A` → acrylic hydraulic dish rack 70, image present
- `JT0514B-800A` → acrylic hydraulic dish rack 80, shares image with previous
- `JT-0514B` → aluminium hydraulic dish rack 70, image present
- `JT-0514C` → aluminium hydraulic dish rack 80, shares image with previous
- `JT-0514D` → aluminium hydraulic dish rack 90, shares image with previous
- `JT-0561` → stainless electric pantry, image present
- `JT-0562` → aluminium electric pantry, image present
- `B02` → hanging hydraulic carrier, image present
- `H202` → two-level hanging hydraulic carrier, image present
- `JT-600AX` → two-level dish rack 60 cm, image present

### Page 4
- `JT G24` → moving pantry basket, image present
- `JT0555` → moving pantry basket, image present
- `JT0516-700` → lower dish rack stainless 70, image present
- `JT0516-800` → lower dish rack stainless 80, shares image with previous
- `JT0516-900` → lower dish rack stainless 90, shares image with previous
- `JT0201-700` → lower acrylic dish rack 70, image present
- `JT0201-750` → lower acrylic dish rack 75, shares image with previous
- `JT0201-800` → lower acrylic dish rack 80, shares image with previous
- `JT0201-900` → lower acrylic dish rack 90, shares image with previous
- `JT0206-700` → lower two-level acrylic dish rack 70, image present
- `JT0206-800` → lower two-level acrylic dish rack 80, shares image with previous
- `JT0206-900` → lower two-level acrylic dish rack 90, shares image with previous
- `JT-600PL` → stainless box 60, image present
- `JT-700PL` → stainless box 70, shares image with PL family
- `JT-800PL` → stainless box 80, shares image with PL family
- `JT-900PL` → stainless box 90, shares image with PL family
- `JT-700A` → acrylic box 70, image present
- `JT-800A` → acrylic box 80, shares image with previous
- `JT0519S` → surface dish rack stainless 50, page break; clearer image continues on page 5

### Page 5
- `JT0519S` → surface dish rack stainless 60, image visible
- `JT0519W` → surface dish rack wood 50, image present
- `JT0519W` variant → surface dish rack wood 70, shares image with previous
- `B03` → surface dish drain, image present
- `B01` → built-in surface dish drain / later side soft-close mechanism also appears with same code label in this catalog; needs cautious mapping by product name when used
- `R221` → RHK lift mechanism with hinges, image present
- `JT044A` → RHK lift mechanism without hinges, image present
- `JT044B` → soft-close lift mechanism SHL, image present
- `JT05` → NHF lift mechanism, image present
- `JT044C` → soft-close lift mechanism SHF, image present
- `G012` → door lift mechanism, image present
- `H025` → clock lift mechanism holder, image present
- `JT044D` → soft-close helper 80/100N, image present
- `JT043` → soft-close helper with barrel 80/100/120N, image present
- `JT0432` → SGS helper control, image present
- `JT042` → NGS helper 100N, image present

## Practical implementation note

- Many catalog images are **shared across size variants**. This is acceptable for UI cards if the same preview is mapped across sibling codes in the same family.
- Some codes in the catalog may not exist in the current database and should be ignored unless found in the app data.
- For implementation speed, priority should be given to codes currently displayed in the accessories tab of `ProfessorKitchensEngine.tsx`.

## Extracted asset folders

- High-resolution pages: `/home/ubuntu/jt_hires/`
- First-pass cropped thumbnails: `/home/ubuntu/jt_product_imgs/`

Next step: use these notes to build a code-to-image URL mapping for Just Top products that exist in the current accessories dataset.
