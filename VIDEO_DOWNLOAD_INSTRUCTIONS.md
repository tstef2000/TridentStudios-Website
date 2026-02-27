# Video Background Download Instructions

## Current Status
✅ **Logo**: Downloaded and integrated at `images/trident-logo.png`  
✅ **All HTML Pages**: Updated with video background elements  
✅ **CSS**: Configured for blurred video backgrounds  
❌ **Hero Video**: YouTube download blocked by authentication

## Manual Video Setup

The website expects a background video at: `/videos/hero-bg.mp4`

### Option 1: Manual YouTube Download (Recommended)
1. Visit: https://www.youtube.com/watch?v=jl7MXbWBig8
2. Use a YouTube downloader (e.g., SaveVideo, Y2Mate, or YouTube to MP3 converters)
3. Download as MP4 format
4. Trim to first 5 seconds if desired using:
   - Online tools: ezgif.com or similar
   - Desktop: HandBrake, CapCut, or ffmpeg
5. Place the file at: `/workspaces/TridentStudios-Website/videos/hero-bg.mp4`

### Option 2: Use a Sample Video
If manual download isn't preferred, place any MP4 video (5-10 seconds recommended) at `/videos/hero-bg.mp4`. The blurred effect will work with any video.

### Option 3: Create a Placeholder Video
You can create a simple colored video using online tools:
- ezgif.com (create gradient/color video)
- ffmpeg on your machine: `ffmpeg -f lavfi -i color=c=0c3a52:s=1920x1080:d=5 -pix_fmt yuv420p -y /videos/hero-bg.mp4`

## Verification

After placing `hero-bg.mp4`:
1. Refresh your browser
2. Check the Services, Portfolio, About, and Contact sections
3. You should see a subtle blurred ocean video behind the content

## Features Implemented

✅ Logo (Trident Studios) on all pages (index.html, artists.html, socials.html)  
✅ Credentials updated: `stefanowicz.trystan@gmail.com` / `Trystan1`  
✅ Blurred video backgrounds on:
   - Services section
   - Portfolio section  
   - About section
   - Contact section
✅ Original hero section remains unblurred (clear video background)
✅ All animations and editor functionality preserved

## Browser Testing

The website is currently running at: http://localhost:8000

- Main page: http://localhost:8000/
- Artists page: http://localhost:8000/artists.html
- Socials page: http://localhost:8000/socials.html

**Admin access:**
- Click lock icon (🔒) in top-right navbar
- Email: stefanowicz.trystan@gmail.com
- Password: Trystan1
- Full website editor panel enabled after login
