# Customization Guide - Trident Studios Website

## Quick Customization Steps

### 1. Update Your Business Information

#### Contact Email
**File:** `index.html`
**Find and Replace:**
```
contact@tridentstudios.gg
```
Replace with your actual email address

#### Discord Link
**File:** `index.html` (in Contact Section and Footer)
**Find:**
```html
<a href="#" title="Discord"><i class="fab fa-discord"></i></a>
```
**Replace with:**
```html
<a href="https://discord.gg/YOUR_DISCORD_INVITE" title="Discord"><i class="fab fa-discord"></i></a>
```

#### Social Media Links
**File:** `index.html` (Footer section)
Update these links:
```html
<a href="https://twitter.com/yourhandle" title="Twitter"><i class="fab fa-twitter"></i></a>
<a href="https://youtube.com/@yourhandle" title="YouTube"><i class="fab fa-youtube"></i></a>
```

---

### 2. Customize Services Section

**File:** `index.html`

The services are in cards. To modify:
- Update the `<h3>` for service titles
- Edit the `<p>` for descriptions
- Modify the `<ul>` for bullet points

**Example - Change Logo Design Service:**

Find:
```html
<div class="service-card">
    <div class="service-icon">
        <i class="fas fa-icons"></i>
    </div>
    <h3>Logo Design</h3>
    <p>Custom, professional logos for clans, servers, and communities.</p>
    <ul class="service-list">
        <li>✓ Clan Logos</li>
        <li>✓ Server Branding</li>
...
```

Customize the text as needed!

---

### 3. Customize Portfolio Items

**File:** `index.html` (Portfolio Section)

Replace placeholder portfolio items with your actual work:

```html
<div class="portfolio-item">
    <div class="portfolio-image">
        <i class="fas fa-image"></i>
    </div>
    <h3>Your Project Title</h3>
    <p>Description of your project</p>
</div>
```

To add actual images instead of icons:
```html
<div class="portfolio-image" style="background-image: url('path/to/image.jpg'); background-size: cover;">
</div>
```

---

### 4. Customize About Section

**File:** `index.html`

Update the company description and statistics:

```html
<p>Your custom about section text here...</p>
```

Update statistics in the `.stat` divs:
```html
<div class="stat">
    <h4>500+</h4>
    <p>Projects Completed</p>
</div>
```

---

### 5. Customize Colors & Branding

**File:** `styles.css`

Edit CSS variables at the top of the file:

```css
:root {
    --primary-color: #FF6B35;      /* Change this orange */
    --secondary-color: #1a1a1a;    /* Dark gray */
    --accent-color: #FFB627;       /* Gold accent */
    --text-light: #e0e0e0;         /* Light text */
    --text-dark: #1a1a1a;          /* Dark text */
    --bg-dark: #0d0d0d;           /* Dark background */
    --bg-darker: #050505;          /* Darker background */
    --border-color: #333;          /* Border color */
    --success-color: #4CAF50;      /* Success messages */
}
```

### Color Change Examples:

**For a more blue/purple gaming theme:**
```css
--primary-color: #00D9FF;      /* Cyan */
--accent-color: #9D4EDD;       /* Purple */
```

**For a green/lime theme:**
```css
--primary-color: #39FF14;      /* Neon Green */
--accent-color: #AFFF00;       /* Yellow-Green */
```

---

### 6. Add Portfolio Images

**Step 1:** Create an `images` folder in your project:
```
TridentStudios-Website/
├── images/
│   ├── portfolio-1.jpg
│   ├── portfolio-2.jpg
│   └── ...
├── index.html
└── ...
```

**Step 2:** Update portfolio items with images:

Replace:
```html
<div class="portfolio-image">
    <i class="fas fa-image"></i>
</div>
```

With:
```html
<div class="portfolio-image" style="background-image: url('images/portfolio-1.jpg'); background-size: cover; background-position: center;">
</div>
```

---

### 7. Add Hero Background Image

Optional: Add a background image to the hero section:

**File:** `styles.css`

Find the `.hero` class and modify:
```css
.hero {
    background: linear-gradient(135deg, var(--bg-darker) 0%, var(--secondary-color) 100%),
                url('images/hero-bg.jpg') center/cover no-repeat;
    background-blend-mode: overlay;
}
```

---

### 8. Customize Navigation

**File:** `index.html`

Change logo text:
```html
<div class="logo">
    <i class="fas fa-trident"></i>
    <span>YOUR STUDIO NAME</span>
</div>
```

Change icon: Use [Font Awesome Icons](https://fontawesome.com/icons)

---

### 9. Update Footer

**File:** `index.html`

Change footer company info:
```html
<div class="footer-section">
    <h4>YOUR STUDIO NAME</h4>
    <p>Your description here</p>
</div>
```

Update footer links and quick links section.

---

### 10. Add/Remove Sections

### To Remove a Section:
1. Find the section in `index.html`
2. Delete the entire `<section>` tag and its contents
3. Remove the navigation link (in `.nav-menu`)

### To Add a New Section:
1. Add new section HTML after an existing one
2. Add navigation link
3. Create CSS for styling (follow existing patterns)

---

## Advanced Customizations

### Change Fonts

**Option 1:** Using Google Fonts

Add to `<head>` in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=YOUR_FONT_FAMILY&display=swap" rel="stylesheet">
```

Update in `styles.css`:
```css
body {
    font-family: 'Your Font Family', sans-serif;
}
```

### Modify Animation Speed

**File:** `styles.css`

Search for `transition:` or `animation:` to adjust speeds

Example:
```css
/* Slower animations */
transition: all 0.5s ease;  /* Changed from 0.3s */
animation: slideInUp 1.5s ease;  /* Changed from 1s */
```

### Change Button Styles

**File:** `styles.css`

Modify `.cta-button` or `.submit-button` classes:
```css
.cta-button {
    padding: 15px 50px;
    border-radius: 50px;      /* Change border radius */
    font-size: 16px;          /* Change size */
    /* ... other properties */
}
```

### Add Dark/Light Mode Toggle

See [Dark Mode Guide](#) (advanced feature)

---

## Configuration Checklist

- [ ] Updated email address
- [ ] Added Discord link
- [ ] Updated social media links
- [ ] Customized business description
- [ ] Updated services descriptions
- [ ] Added portfolio images or updated descriptions
- [ ] Changed colors to match brand
- [ ] Updated statistics
- [ ] Verified all links work
- [ ] Tested on mobile devices

---

## Common Issues & Solutions

### Images not showing
- **Problem:** Image path incorrect
- **Solution:** Use relative paths, e.g., `images/photo.jpg`
- **Check:** Folder structure and file names (case-sensitive on Linux)

### Styles not updating
- **Problem:** Browser cache
- **Solution:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- **Or:** Clear browser cache

### Form not working
- **Problem:** No backend configured
- **Solution:** Use Netlify Forms, Formspree, or your email service
- **See:** DEPLOYMENT.md for integration guides

### Colors not matching
- **Problem:** Wrong color codes
- **Solution:** Use color picker tool or [ColorHexa](https://www.colorhexa.com/)
- **Format:** Use HEX format (#RRGGBB)

---

## Tools for Customization

### Color Tools
- [Color Picker](https://www.colorpicker.com/)
- [Coolors.co](https://coolors.co/)
- [Adobe Color](https://color.adobe.com/)

### Icon Tools
- [Font Awesome Icons](https://fontawesome.com/icons)
- [Feather Icons](https://feathericons.com/)

### Image Tools
- [TinyPNG](https://tinypng.com/) - Compress images
- [Canva](https://canva.com/) - Design graphics
- [Unsplash](https://unsplash.com/) - Free images

### Code Editors
- VS Code (Recommended)
- Sublime Text
- Notepad++
- Online: [CodePen](https://codepen.io/), [Replit](https://replit.com/)

---

## File Reference

| File | Purpose | Easy to Customize |
|------|---------|------------------|
| `index.html` | Structure & content | ✅ Yes |
| `styles.css` | Colors & design | ✅ Yes |
| `script.js` | Interactions | 🟡 Medium |
| `README.md` | Documentation | ✅ Yes |
| `DEPLOYMENT.md` | Deployment guide | ✅ Yes |

---

## Next Steps

1. **Backup** - Save a copy of original files
2. **Customize** - Update with your information
3. **Test** - Check all features work
4. **Deploy** - Follow DEPLOYMENT.md guide
5. **Monitor** - Keep content fresh

---

**Need help? Check the README.md and DEPLOYMENT.md files for more information!**
