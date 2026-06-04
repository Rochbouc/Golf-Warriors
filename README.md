[README.md](https://github.com/user-attachments/files/28599503/README.md)
# ⛳ Golf Warriors — Tee Time Planner

A mobile-friendly web app for organizing golf tee times, inviting players, and tracking RSVPs.

## Features

- 🔐 Invite-only login (players must be added by admin)
- 📅 Book tee times and invite players
- ✅ Players confirm IN or OUT (max 4 per tee time)
- 📆 Calendar view with click-to-book
- ✉️ Email invitations via EmailJS
- 👤 Player profiles with photos
- 📱 Mobile friendly

## Setup on GitHub Pages

### 1. Create the repository
1. Go to [github.com](https://github.com) and sign in
2. Click **New repository**
3. Name it `golf-warriors` (or anything you like)
4. Set it to **Public**
5. Click **Create repository**

### 2. Upload the files
Upload these 3 files to the root of your repository:
- `index.html`
- `styles.css`
- `app.js`

You can drag and drop them directly on GitHub.

### 3. Enable GitHub Pages
1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **Deploy from a branch**
3. Choose **main** branch, **/ (root)** folder
4. Click **Save**

Your app will be live at:
```
https://YOUR-USERNAME.github.io/golf-warriors
```

### 4. Configure the app
Once live, open the app and click **⚙️ Settings** (top nav, admin only):

- **App URL** — paste your GitHub Pages URL (e.g. `https://roch.github.io/golf-warriors`)
- **EmailJS** — add your Public Key, Service ID, and Template ID

## Default Login Credentials

| Name | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@golfwarriors.com | golf | Admin |
| Roch Boucher | boucher.roch@gmail.com | golf | Manager |
| Stéphane Lagacé | stephane.lagace@gmail.com | golf | Manager |
| Chris Leger | legerchris83@gmail.com | golf | Player |
| Jules Melanson | jules_18melanson@hotmail.com | golf | Player |
| Stef Audet | stephane.france@rogers.com | golf | Player |
| PP | pierrepaul.lanteigne@gmail.com | golf | Player |
| Dr Rhé | rheal.boudreau@hotmail.com | golf | Player |
| Dave | divadocan@gmail.com | golf | Player |
| Marc LeBlanc | marc@jomaeng.com | golf | Player |
| Lagace | stefgolf72@gmail.com | golf | Player |

> All players should change their password after first login under **Profile**.

## EmailJS Setup

1. Sign up at [emailjs.com](https://www.emailjs.com) (free — 200 emails/month)
2. Add an **Email Service** (Gmail, Outlook, etc.)
3. Create an **Email Template** with:
   - **To:** `{{to_email}}`
   - **Subject:** `{{subject}}`
   - **Body:** `{{message}}` — enable **HTML mode**
4. In the app ⚙️ Settings, enter:
   - Public Key (Account → API Keys)
   - Service ID
   - Template ID
   - App URL (your GitHub Pages URL)

## Roles

| Role | Can Book | Can Invite | Manage Players | Settings |
|------|----------|-----------|----------------|----------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ✅ |
| Player | ✅ | ✅ | ❌ | ❌ |

## Tee Time Rules

- Maximum **4 players** per tee time (confirmed IN)
- Tee times are automatically deleted after the play date/time passes
- Players can change their IN/OUT status anytime before the tee time
