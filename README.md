# MHT Fresh Website

Static, responsive corporate website for MHT Fresh / MHT Group, deployed on Cloudflare Pages.

## Existing pages
- `index.html` — corporate landing page and contact information.
- `fruits.html` — searchable fruit library with categories, fruit profiles and variety information.
- `admin-media.html` — private-token-protected media search and approval interface.
- `functions/api/media/` — server-side Unsplash API proxy and media-library endpoints.
- `media/schema.sql` — Cloudflare D1 schema for approved/rejected image metadata.

## Unsplash media integration

The browser never receives the Unsplash Access Key or Secret Key. Configure these values as Cloudflare Pages secrets/environment variables:

- `UNSPLASH_ACCESS_KEY` — required secret used by the server-side API proxy.
- `UNSPLASH_SECRET_KEY` — store as a secret for future OAuth/provider expansion; current Access Key-based search and download tracking do not use the Secret Key.
- `MHT_MEDIA_ADMIN_TOKEN` — long random admin token required by all media API routes.
- Bind a Cloudflare D1 database as `MHT_MEDIA_DB`.

### Cloudflare setup
1. In Cloudflare Dashboard, open **Workers & Pages → mht-fresh-website → Settings → Variables and Secrets**.
2. Add the three values above as encrypted secrets. Never put real values in GitHub, HTML, JavaScript, or a committed `.env` file.
3. Under **Storage & databases → D1**, create a database, for example `mht-fresh-media`.
4. Open the D1 console and execute the SQL in `media/schema.sql`.
5. In the Pages project, add a D1 database binding named `MHT_MEDIA_DB` pointing to that database. Redeploy after changing bindings.
6. Open `/admin-media.html`, enter the admin token, search and preview images. Choose a usage location, then approve or reject.

For local development, use an untracked `.dev.vars` file with the same variable names and configure a local D1 binding. Never commit `.dev.vars`. `.env.example` contains placeholders only.

## Unsplash API compliance
- API-sourced images use Unsplash-provided `photo.urls` hotlinked image URLs; they are not copied into site asset storage. Unsplash API guidelines require hotlinking.
- Photographer and Unsplash attribution links are displayed with `utm_source=mht_fresh&utm_medium=referral`.
- Approving an image triggers its `links.download_location` endpoint server-side before approval is recorded. Rejection does not trigger a download event. Repeated approval is idempotent.
- Source photo ID, URLs, photographer details, source page, decision and intended usage are stored in D1. A unique provider/source ID prevents duplicate rows.
- No image is automatically published to the homepage or fruit pages. Approval is a library decision only; a separate deliberate content update is required to place an image on a public page.
- The provider field and endpoint separation allow future Pixabay, Wikimedia Commons and Openverse adapters.

## Existing site notes
Fruit names, variety examples and indicative origins are an initial navigation catalogue, not confirmation of current supply or import eligibility. Fruit-specific Brix, firmness, calibre, storage and temperature values are not fabricated; verify them against supplier/technical specifications and destination-market requirements before commercial use.

The enquiry form opens the visitor's email application; it does not store or transmit form data to a server. Keep existing MX, SPF, DKIM, DMARC and mail-related DNS records intact when configuring the website domain.
