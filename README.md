# MHT Fresh Website

Static, responsive corporate website for MHT Fresh / MHT Group.

## Deploy
Cloudflare Pages: connect this repository, select **None** as framework preset, leave build command blank, and use `/` as the build output directory.

## Pages
- `index.html` — corporate landing page and contact information.
- `fruits.html` — searchable fruit library with categories, fruit profiles, varieties and six product-information sections.
- `_headers` — baseline security response headers.

## Fruit data integrity
Fruit names, variety examples and indicative origins are an initial navigation catalogue, not confirmation of current supply or import eligibility. Fruit-specific Brix, firmness, calibre, storage and temperature values are deliberately not fabricated; they are marked for supplier/technical verification. Validate each commercial specification, Indian import eligibility and current crop window before publishing shipment claims.

## Notes
- Enquiry form opens the visitor's email application; it does not store or transmit form data to a server.
- Product photography on the landing page is loaded from Unsplash and requires internet access.
- Keep existing MX, SPF, DKIM, DMARC and mail-related DNS records intact when configuring the website domain.
