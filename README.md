# The Daily Grind: Coffee Business News with Purpose

A one-click newsletter tool for Biola University. Click **Generate & Send Newsletter** and the server:

1. Pulls the latest coffee news from Google News RSS (coffee industry, fair trade, coffee farmers, sustainable coffee, ethical sourcing), sorts by newest, removes duplicates, and keeps the top 6.
2. Builds a Biola-branded HTML email (inline CSS, table layout for Gmail).
3. Sends it to you through Gmail SMTP with Nodemailer.

## Setup

```bash
npm install
cp .env.example .env   # then fill in GMAIL_USER and GMAIL_APP_PASSWORD
npm start
```

Open http://localhost:3000. Visit `/preview` to see the newsletter without sending it.

Gmail requires an **App Password** (2-Step Verification must be on): https://myaccount.google.com/apppasswords
