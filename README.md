# VIBEVAULT ticketing prototype

Clickable prototype of the VIBEVAULT ticket marketplace, built from the Developer Brief (v1, 15 Nov 2026).

Static site: HTML, CSS and JavaScript only. Data is stored in the browser (localStorage). Paystack payments, ticket emails and server checks are simulated.

## Run locally
Open `index.html` in a browser, or run `python3 -m http.server` in this folder.

## Pages
Home, Explore, City pages, Event page (tabs, gender tiers, 4 ticket limit, live fee), Checkout with stock hold timer, simulated Paystack, Success with QR tickets, My Tickets and Recover Tickets, Host dashboard, Create and edit event, Door scanner with offline queue, Admin (approvals, refunds, fee setting, flags), Vendors, FAQ, Support, Terms, Privacy, Refunds, Host agreement.

## Demo access
Use the View as menu in the top bar to switch between Guest, Host and Admin. Door PIN for Vault Opening Night is 4821. Recover code is 123456.

## Before going live
- Replace the text wordmark and favicon with the supplied logo files.
- Replace placeholder WhatsApp number and support email in `app.js`.
- Build the real backend described in the brief (Paystack webhook, database, email, scanner API). Functions in `app.js` marked SERVER show the logic to move server side.
- Legal pages are draft wording and need lawyer review.

## Deploy
GitHub Pages: Settings, Pages, deploy from the main branch root. Later, point the custom domain at it.
