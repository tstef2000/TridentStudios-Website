# Deployment Guide for Trident Studios Website

> **No server-side language needed!** This is a pure static HTML/CSS/JavaScript site. You do **not** need Node.js, PHP, Python, or any other backend language to run or host it. If a hosting service asks you to pick a language or framework, choose **"Static"** or **"HTML"** (or leave it blank — they all work).

## Quick Start - Local Development

### Option 1: Direct Browser
1. Simply double-click `index.html` to open in your default browser

### Option 2: Python Server (Recommended for Development)
```bash
# Navigate to the project directory
cd /workspaces/TridentStudios-Website

# Start a simple HTTP server
python -m http.server 8000

# Open http://localhost:8000 in your browser
```

### Option 3: VS Code Live Server
1. Install the Live Server extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

---

## Deployment Options

### 1. Netlify (Recommended - Free & Easy)

**Steps:**
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub/Google/Email
3. Click "New site from Git" or drag and drop your folder
4. Deploy instantly
5. Get free HTTPS and custom domain options

**Benefits:**
- Free hosting
- Automatic HTTPS
- CDN included
- Easy custom domain setup
- Continuous deployment from Git

### 2. Vercel (Alternative - Free & Fast)

**Steps:**
1. Go to [vercel.com](https://vercel.com)
2. Sign up and import your Git repository
3. Click Deploy
4. Get instant global CDN

**Benefits:**
- Fast performance
- Automatic deployments
- Free tier includes unlimited bandwidth
- Easy domain configuration

### 3. GitHub Pages (Free)

**Steps:**
1. Push your code to a GitHub repository
2. Go to Settings → Pages
3. Select "Deploy from branch"
4. Choose main branch and /root folder
5. Save and wait for deployment

**Benefits:**
- Completely free
- Integrated with Git
- GitHub domain included

**Custom Domain:**
- Add DNS records pointing to GitHub
- Or use GitHub's name servers

### 4. Pterodactyl Panel

Pterodactyl is a game-server management panel that uses **eggs** as server templates.
Because this site is pure static HTML/CSS/JS, you need an egg that runs a **web server** — not a game server or a Node.js app egg.

#### ✅ Recommended Egg: Nginx (best choice for static sites)

1. **Get the Nginx egg** from the community eggs repository:
   [https://github.com/pterodactyl-community/eggs/tree/master/webservers/nginx](https://github.com/pterodactyl-community/eggs/tree/master/webservers/nginx)
   - Download `egg-nginx.json` and import it in your Pterodactyl admin panel under **Nests → Import Egg**.
2. **Create a new server** using the Nginx egg.
3. **Set the port** (e.g. `80` or any port your host assigns).
4. Once the server is created, **upload all website files** (HTML, CSS, JS, images, videos) to the server's `/home/container/` directory via SFTP or the file manager.
5. Ensure `index.html` is in the root of that directory.
6. Start the server — Nginx will serve your site on the assigned port.

#### 🔄 Alternative Egg: Node.js (if Nginx egg is unavailable)

If your panel only has a Node.js egg available, you can use it to run a simple static file server:

1. **Create a new server** using the **Node.js** egg.
2. **Set the startup command** to:
   ```
   npx serve -s . -p {{SERVER_PORT}}
   ```
3. Upload all website files to the server's home directory via SFTP.
4. Start the server — it will serve your static files on the assigned port.

> **Note:** Pterodactyl is primarily designed for game servers. For production websites, a dedicated static host like **Netlify** or **GitHub Pages** (free options above) will be more reliable and easier to maintain.

#### 🔒 Adding HTTPS to your Pterodactyl-hosted site
See the [Certbot / Let's Encrypt (HTTPS)](#-certbot--lets-encrypt-https) section below for step-by-step instructions on obtaining a free SSL certificate for your domain.

### 5. Traditional Hosting (Godaddy, Bluehost, etc.)

**Steps:**
1. Upload files via FTP/SFTP to public_html folder
2. Ensure index.html is in the root
3. Access via your domain

---

## Pre-Deployment Checklist

- [ ] Update contact email in HTML
- [ ] Add Discord server link
- [ ] Add social media links in footer
- [ ] Update actual portfolio images
- [ ] Customize service descriptions
- [ ] Add your business information
- [ ] Test all links work
- [ ] Test mobile responsiveness
- [ ] Test contact form
- [ ] Check browser compatibility

---

## Post-Deployment

### Domain Setup
1. Register domain (Namecheap, GoDaddy, Google Domains)
2. Configure DNS records for your hosting service
3. Enable HTTPS (automatic on Netlify/Vercel, or use Certbot — see below)

### 🔒 Certbot / Let's Encrypt (HTTPS)

Certbot issues a **free SSL/TLS certificate** from Let's Encrypt so your site is served over `https://`.

#### What domain do I enter?

Use **your own registered domain name** — the same domain whose DNS `A` record points to the server's IP address.

| Scenario | What to enter |
|---|---|
| You own `example.com` | `example.com` |
| You also want `www` to work | `example.com www.example.com` (both) |
| Pterodactyl sub-domain (e.g. a domain your host gave you) | That full hostname, e.g. `mysite.mypanel.net` |

> ⚠️ **The domain must already point to your server's IP before you run Certbot.**
> Set an `A` record in your domain registrar / DNS provider: `A @ <your server IP>` (and optionally `A www <your server IP>`).
> Certbot will fail if the DNS hasn't propagated yet.

#### Prerequisites

- A Linux server you have SSH / root access to (or a VPS; **not** inside a Pterodactyl container — see note below)
- Nginx or Apache already installed and running
- Port `80` open in your firewall (Certbot's HTTP challenge needs it)

#### Install Certbot

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y certbot python3-certbot-nginx

# CentOS / RHEL / AlmaLinux
sudo dnf install -y certbot python3-certbot-nginx
```

#### Obtain your certificate

Replace `example.com` with your actual domain:

```bash
# For a single domain
sudo certbot --nginx -d example.com

# For a domain + www subdomain
sudo certbot --nginx -d example.com -d www.example.com
```

Certbot will ask for your **email address** (used for renewal reminders) and prompt you to agree to the Terms of Service. It will then automatically edit your Nginx config to enable HTTPS and redirect HTTP → HTTPS.

#### Auto-renewal

Certificates expire after 90 days. Certbot installs a cron job / systemd timer that renews automatically. Test it with:

```bash
sudo certbot renew --dry-run
```

#### Pterodactyl-specific note

Pterodactyl containers **do not have root access**, so Certbot must be run on the **host machine** (the server running the Wings daemon), not inside the container. After obtaining the certificate on the host, configure your reverse proxy (Nginx/Caddy on the host) to terminate SSL and forward traffic to the container's port.

Example Nginx reverse-proxy snippet on the **host** (after running Certbot):

```nginx
server {
    listen 443 ssl;
    server_name example.com www.example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:<CONTAINER_PORT>;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$host$request_uri;
}
```

Replace `<CONTAINER_PORT>` with the port Pterodactyl assigned to your server.

### Email Setup
1. Set up business email (Gmail, Zoho, your host provider)
2. Update contact email in website
3. Consider adding email forwarding

### Analytics (Optional)
Add Google Analytics to track visitors:
```html
<!-- Add before closing </head> tag -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

### Contact Form Integration (Optional)
To make the contact form functional:

**Option A: Formspree**
1. Go to [formspree.io](https://formspree.io)
2. Create account and new form
3. Update form action to Formspree endpoint

**Option B: Netlify Forms**
1. Add `netlify` attribute to form
2. Form submissions appear in Netlify dashboard

**Option C: Email Service (SendGrid, Mailchimp)**
1. Set up API account
2. Create backend script to handle submissions
3. Or use third-party form service

---

## Performance Optimization

### Images
1. Optimize portfolio images (compress to <200KB each)
2. Use modern formats (WebP)
3. Implement lazy loading if adding many images

### Caching
1. Enable browser caching in hosting settings
2. Set appropriate cache headers

### CDN
- Netlify/Vercel provide free CDN globally
- Faster delivery for all users worldwide

---

## Maintenance

### Regular Updates
- Update portfolio with new projects
- Refresh service descriptions
- Update testimonials/stats
- Check for broken links

### Backup
- Keep local copy of all files
- Consider version control with Git
- Regular backups of any database (if added later)

### Monitoring
- Check website uptime
- Monitor analytics
- Test contact form regularly
- Check for JavaScript errors in console

---

## Troubleshooting

### Website not loading
- Check all file paths in HTML
- Ensure index.html is in root directory
- Clear browser cache (Ctrl+Shift+Delete)

### Images not showing
- Verify image file paths
- Check file names match exactly (case-sensitive)
- Ensure images are in accessible directory

### Form not working
- Check browser console for errors (F12)
- Ensure form submission service is configured
- Test with different browser

### Performance issues
- Optimize images
- Enable gzip compression
- Reduce JavaScript file size
- Consider caching headers

---

## Support Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Pages Guide](https://pages.github.com/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

## Next Steps

1. **Customize** - Update all content with your actual business info
2. **Test** - Thoroughly test all features on desktop and mobile
3. **Deploy** - Choose your preferred hosting platform
4. **Promote** - Share on social media and with your community
5. **Maintain** - Keep content fresh and monitor performance

---

**Happy deploying! Your Rust design studio website is ready! 🚀**
