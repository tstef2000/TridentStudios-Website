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

### 4. Traditional Hosting (Godaddy, Bluehost, etc.)

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
