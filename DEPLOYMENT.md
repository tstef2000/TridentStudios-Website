# Deployment Guide for Trident Studios Website

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

### 4. Pterodactyl Panel with Nginx Egg v3

**Perfect for:** Users with access to a Pterodactyl panel who want to host static websites

**Requirements:**
- Access to a Pterodactyl panel with the Nginx Egg v3 installed
- SFTP client (FileZilla, WinSCP, or command line)
- Panel credentials

**Steps:**

1. **Create New Server**
   - Log into your Pterodactyl panel
   - Click "Create Server" or navigate to server creation
   - Select **"Nginx"** as the egg (Nginx Egg v3)
   - Configure server name and allocations
   - Set memory/disk space (1GB RAM recommended, 1GB disk minimum)
   
   **Certbot Domain Configuration:**
   - **If you have a domain:** Enter your domain name (e.g., `tridentstudios.com` or `www.tridentstudios.com`)
     - Make sure your domain's DNS A record points to your server's IP BEFORE starting the server
     - Certbot will automatically generate a free SSL certificate from Let's Encrypt
     - Your site will be accessible via HTTPS (e.g., `https://tridentstudios.com`)
   
   - **If you DON'T have a domain:** Leave the Certbot Domain field **EMPTY**
     - Your site will be accessible via HTTP only (e.g., `http://123.45.67.89:8080`)
     - No SSL certificate will be generated
     - You can add a domain and SSL later by reconfiguring
   
   - Click "Create Server"

2. **Upload Website Files via SFTP**
   
   **Connection Details (found in your server's file management tab):**
   - Host: Your panel's domain (e.g., `panel.example.com`)
   - Port: Usually `2022` or shown in panel
   - Username: Shown in panel (format: `user.identifier`)
   - Password: Your panel password (or SFTP password if different)
   
   **Using FileZilla or WinSCP:**
   - Connect using the credentials above
   - Navigate to the server root directory
   - Upload all website files and folders:
     - `index.html`
     - `styles.css`
     - `script.js`
     - `auth.js`
     - `nav-auth.js`
     - `oauth-config.js`
     - `editor.js`
     - `admin-panel.js`
     - All HTML files
     - `images/` folder
     - `videos/` folder
   - Ensure `index.html` is in the root directory
   
   **Using Command Line (Linux/Mac):**
   ```bash
   # Navigate to your project directory
   cd /workspaces/TridentStudios-Website
   
   # Upload all files (replace with your credentials)
   sftp -P 2022 user.identifier@panel.example.com
   
   # Once connected:
   put -r *
   ```

3. **Configure Nginx (if needed)**
   - Most Nginx Egg v3 installations work out of the box
   - Default configuration serves `index.html` automatically
   - If you need custom configuration, edit `nginx.conf` via SFTP
   - Typical location: `/home/container/nginx.conf`

4. **Start the Server**
   - Go to your Pterodactyl panel
   - Navigate to your server's console
   - Click the "Start" button
   - Wait for Nginx to start (usually takes 5-10 seconds)
   - Check console for "Nginx started successfully" message

5. **Access Your Website**
   - Your website will be available at: `http://your-server-ip:port`
   - IP and port are shown in the server's "Network" section
   - Example: `http://123.45.67.89:8080`

**Custom Domain Setup:**
- **Option 1: Using Certbot (Recommended for SSL)**
  - Point your domain's DNS A record to your server's IP address
  - Enter the domain in the "Certbot Domain" field when creating the server
  - Nginx will automatically obtain and configure a free SSL certificate
  - Access your site at `https://yourdomain.com`
  - Certificate auto-renews every 90 days
  
- **Option 2: Manual/Without Certbot**
  - Point your domain's DNS A record to your server's IP
  - Leave Certbot Domain empty
  - Configure reverse proxy separately if needed
  - Or use Cloudflare Tunnel/Proxy for SSL and port routing

**Benefits:**
- Full control over server configuration
- Good for existing Pterodactyl infrastructure
- Easy file management via SFTP
- Resource monitoring included

**Troubleshooting:**
- If website doesn't load, check Nginx logs in console
- Ensure all file paths are correct and case-sensitive
- Verify `index.html` is in the root directory (not in a subdirectory)
- Check that the server is running and port is accessible
- Verify firewall allows traffic on the allocated port

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
3. Enable HTTPS (automatic on Netlify/Vercel)

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
