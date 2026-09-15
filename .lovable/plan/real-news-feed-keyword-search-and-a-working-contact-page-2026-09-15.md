# Real news feed, keyword search, and a working contact page

## What you get

- Real headlines instead of example articles, pulled from live news services.
- A choice of source in the feed: GNews, NewsAPI, or Hacker News (Hacker News needs no key and always works).
- A settings panel in the app where you can paste your news key yourself, plus a safe place to store it so it is not exposed on the published site.
- A search box that asks the news service for matching headlines, not just filtering what is already on screen.
- A contact page whose messages are saved in the app and emailed to you.

## How news will work

1. Source picker in the feed toolbar: Hacker News (no key), GNews, NewsAPI.
2. Keys are stored securely in Lovable Cloud. A small in-app settings page lets you paste or update a key without editing code; keys are never shown back or exposed to visitors.
3. If a chosen source has no key yet, the feed says so and offers the key form, falling back to Hacker News so the page is never empty.
4. Category, source filter, sorting, paging, and the voting buttons keep working with real articles.

## Search

- Typing in the search box (with a short pause before it fires) sends the keywords to the selected service and shows matching stories.
- Hacker News uses its free search endpoint; GNews and NewsAPI use their search endpoints.
- Clearing the box returns to top headlines.

## Contact page

- New `/contact` page with name, email, and message, linked from the "Contact Us" item in the sidebar.
- Each message is saved so you can read it in the app, and also emailed to an address you nominate.
- Basic validation and spam-length limits; a confirmation message after sending.

## What I need from you

- Your GNews and/or NewsAPI keys — paste them into the in-app key form once the build is done (free at gnews.io and newsapi.org).
- The email address that should receive contact messages.
- Note: NewsAPI's free plan blocks requests from published sites, so it will work in the editor preview but not on a live site. GNews and Hacker News work everywhere.
- Sending email needs a domain you own; I will walk you through that step when we get there.

## Technical notes

- Enable Lovable Cloud (database, secrets, edge functions).
- Edge function `news` proxies requests to the selected provider server-side using secrets `GNEWS_API_KEY` / `NEWSAPI_KEY`, normalising each provider's response into the existing article shape (title, description, content, url, urlToImage, publishedAt, source.name). Hacker News via Algolia HN search API, no key.
- Edge function `save-api-key` (admin-guarded) so keys can be set from the in-app settings page; values write to the secret store, never returned to the client.
- `NewsFeed.jsx`: replace the axios call to newsapi.org with a call to the `news` function; debounce search; keep scoring, sorting, feedback, pagination. Remove `sampleArticles` fallback except as last-resort when all providers fail.
- Table `contact_messages` (name, email, message, created_at) with RLS: anonymous insert allowed, read restricted to admins; grants for `anon` insert and `authenticated` select.
- Edge function `send-contact-message` validates input, inserts the row, and sends the notification email via Lovable's built-in email.
- Routing: add `/contact` route in `App.jsx`, plus a settings route for the key form.
- Set a real page title and description in `index.html`.
