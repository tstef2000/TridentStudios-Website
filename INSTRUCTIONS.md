# Trident Studios Website — Complete Instructions

## 1. Artist Profiles & Socials

### Editing Artist Info
- Open `artist-config.js` in a text editor.
- Update the `artistsPage` array for full profile cards (name, role, Discord, bio, avatar, socials).
- Update the `socialsPage` array for the Socials page (name, role, socials only).
- Save and refresh the site to see changes.

**Example:**
```js
{
  id: "5",
  name: "Ghoul",
  roleTitle: "Discord Planner/Designer & Digital Artist.",
  discordTag: "@ghoulpop",
  bio: "Specializing in Discord server planning/design & creating stunning discord banners.",
  avatarUrl: "https://i.postimg.cc/1zKRZPp6/IMG-0519.gif",
  socials: {
    discord: "https://discord.gg/tridentfx",
    youtube: "#",
    twitch: "https://twitch.tv/rizkyraccz",
    tiktok: "https://tiktok.com/@rizkyraccz",
    x: "#"
  }
}
```
- Use `#` for any empty/unused social link.
- Leave `avatarUrl` empty for the default icon.

## 2. Portfolio Showcase (Images & Videos)

### Editing Portfolio Items
- Open `data/portfolio-showcase.json`.
- Each item in the `items` array is a portfolio card.
- Example for an image:
```json
{
  "title": "Clan Branding Package",
  "description": "Complete visual identity for a 200+ member Rust clan",
  "mediaType": "image",
  "mediaUrl": "images/branding.jpg"
}
```
- Example for a video:
```json
{
  "title": "Server Launch Trailer",
  "description": "4K cinematic trailer for a Rust server launch",
  "mediaType": "video",
  "mediaUrl": "videos/trailer.mp4",
  "mimeType": "video/mp4"
}
```
- Example for a link:
```json
{
  "title": "External Project",
  "description": "See more on Behance",
  "mediaType": "link",
  "mediaUrl": "https://behance.net/yourproject"
}
```
- Save and refresh the site to see updates.

## 3. Video Background Setup
- Place your video file in the `videos/` folder as `hero-bg.mp4`.
- For best results: MP4, 5–10 seconds, under 5MB.
- The video will autoplay and loop in the hero section.
- To change the video, replace `videos/hero-bg.mp4` and refresh.

## 4. Deployment & Testing
- For local testing: `python3 -m http.server 8000` and visit http://localhost:8000
- For deployment: Use Netlify, Vercel, or GitHub Pages for static hosting.
- For Pterodactyl/Nginx: Follow your panel’s instructions and upload the site files.

## 5. Admin & Editor
- Admin login: Click the lock icon in the navbar.
- Use your admin credentials to access the live editor.
- The editor allows visual editing and publishing of site content.
- Backups are created automatically before each publish.

## 6. Troubleshooting
- If changes don’t show, hard refresh (Ctrl+F5) or clear browser cache.
- For portfolio: Only the JSON file is used (no database).
- For artist cards: Check for typos or missing commas in `artist-config.js`.
- For video: Ensure the file is named `hero-bg.mp4` and in the correct folder.

---

**For more details, see the comments in each config file.**

---

# Quick Reference
- Artist profiles: `artist-config.js`
- Portfolio items: `data/portfolio-showcase.json`
- Hero video: `videos/hero-bg.mp4`
- Main site: `index.html`, `artists.html`, `socials.html`
- Styles: `styles.css`
- Scripts: `script.js`

---

This file replaces all previous setup, customization, and deployment guides. Delete or archive the old .md files for a clean workspace.
