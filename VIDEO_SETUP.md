# Video Setup Guide

## Hero Background Video

The hero section is configured to use a video background. To set this up:

### Option 1: Using Your YouTube Video (Recommended)
1. Download the first 5 seconds of your video using a tool like:
   - [yt-dlp](https://github.com/yt-dlp/yt-dlp)
   - [4K Video Downloader](https://www.4kdownload.com/)
   - Online tools like [SaveTube](https://www.savetube.me/)

2. Convert/trim the video to MP4 format (5 seconds)

3. Place the video file in a `videos/` folder:
   ```
   TridentStudios-Website/
   ├── videos/
   │   ├── hero-bg.mp4
   │   └── hero-bg.webm (optional but recommended)
   ```

### Option 2: Create Your Video Locally
1. Use video editing software (OBS, DaVinci Resolve, Premiere) to create a 5-second video
2. Export as MP4
3. Place in `videos/` folder

### Video Specifications
- **Duration**: 5 seconds (or any length you prefer)
- **Format**: MP4 (h.264 codec) and optionally WebM
- **Resolution**: 1920x1080 or higher (4K recommended for quality)
- **File Size**: Keep under 5MB for optimal loading
- **Frame Rate**: 30fps or 60fps

### Optimize Video Size
Use tools like:
- [HandBrake](https://handbrake.fr/) - Free video converter
- [FFmpeg](https://ffmpeg.org/) - Command line tool

Example FFmpeg command to compress:
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -c:a aac -b:a 128k output.mp4
```

### Create Videos Folder
```bash
mkdir -p videos
```

### Update Video Sources (if needed)
The HTML is configured for:
- `videos/hero-bg.mp4` (primary)
- `videos/hero-bg.webm` (fallback for better compatibility)

If you use different filenames, update in `index.html`:
```html
<video class="hero-video" autoplay muted loop>
    <source src="videos/your-video.mp4" type="video/mp4">
    <source src="videos/your-video.webm" type="video/webm">
</video>
```

### Testing the Video
1. Start the local server: `python -m http.server 8000`
2. Visit `http://localhost:8000`
3. The hero video should autoplay and loop

### Troubleshooting

**Video not playing:**
- Check file path is correct
- Verify video format (MP4 recommended)
- Check browser console for errors (F12)
- Ensure video file is in the correct `videos/` folder

**Video looks distorted:**
- Use CSS object-fit: cover (already configured)
- Ensure video aspect ratio is 16:9

**Video is too large:**
- Compress using HandBrake or FFmpeg
- Reduce resolution if needed
- Consider shortening duration

### Video Background CSS
If you want to adjust the video appearance, edit `.hero-video` in `styles.css`:
```css
.hero-video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;  /* Fills container while maintaining aspect ratio */
    z-index: 1;
}
```

### WebM Format (Optional but Better)
WebM provides better compression. Convert using FFmpeg:
```bash
ffmpeg -i input.mp4 -c:v libvpx-vp9 -b:v 0 -crf 40 output.webm
```

---

**Note:** Don't commit large video files to Git. Consider using Git LFS or hosting videos separately if the file is larger than 100MB.
