# Artist Configuration Guide

## Overview
The `artist-config.js` file is the central configuration file for managing all artist information across the Trident Studios website. This file replaces the buggy customization interface and provides a simple, reliable way to update artist information.

## What This File Controls

### 1. **Artists Page** (`artists.html`)
- Full artist profile cards
- Profile pictures
- Names, roles, and Discord tags
- Artist bios
- Social media links (Discord, YouTube)

### 2. **Socials Page** (`socials.html`)
- Simplified artist listings
- Artist names and roles
- Social media links

## How to Use

### Quick Edit
1. Open `artist-config.js` in a text editor
2. Find the section you want to edit:
   - `artistsPage` - For the Artists page
   - `socialsPage` - For the Socials page
3. Edit the information between the quotes
4. Save the file
5. Refresh the webpage to see changes

### Adding a New Artist

#### For Artists Page:
```javascript
{
    id: "5",  // Use the next available number
    name: "New Artist Name",
    roleTitle: "Artist Role/Specialty",
    discordTag: "@discordusername",
    bio: "A short bio about the artist.",
    avatarUrl: "https://image-url.com/avatar.png",  // Or leave empty for icon
    socials: {
        discord: "https://discord.gg/invite",
        youtube: "https://www.youtube.com/@channel"
    }
}
```

**Important:** Don't forget to add a comma after each artist entry (except the last one)!

#### For Socials Page:
```javascript
{
    name: "New Artist Name",
    roleTitle: "Artist Role",
    socials: {
        discord: "https://discord.gg/invite",
        youtube: "https://www.youtube.com/@channel"
    }
}
```

### Editing Existing Information

Simply change the text between the quotes:
- **Names:** `name: "Rose"` → `name: "New Name"`
- **Roles:** `roleTitle: "Logo Designer"` → `roleTitle: "3D Artist"`
- **Discord Tags:** `discordTag: "@user"` → `discordTag: "@newuser"`
- **Bios:** Change the text in the bio field
- **Links:** Replace the URL in quotes
- **Profile Pictures:** Replace the URL in `avatarUrl`

### Tips

1. **Empty Links:** Use `#` for placeholder/empty links
   ```javascript
   youtube: "#"
   ```

2. **No Profile Picture:** Leave `avatarUrl` empty to use default icon
   ```javascript
   avatarUrl: ""
   ```

3. **Keep Formatting:** 
   - Don't remove commas between properties
   - Keep all quotes and brackets in place
   - Make sure each entry has a comma after it (except the last one)

4. **Test Changes:** After saving, refresh the webpage with Ctrl+F5 (hard refresh)

## Global Settings

At the bottom of the config file, you can edit:
- **Official Discord:** The main Trident Studios Discord invite
- **Studio YouTube:** The main Trident Studios YouTube channel

## Troubleshooting

**Changes not showing?**
1. Make sure you saved the file
2. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
3. Check browser console for errors (F12)

**Syntax errors?**
- Make sure all quotes are closed
- Check that commas are in the right places
- Ensure brackets `{}` and `[]` are balanced

**Profile picture not showing?**
- Verify the image URL is correct and accessible
- Make sure the URL starts with `https://`
- Try opening the URL directly in a browser

## Benefits Over the Old System

✅ **Simple** - Edit just one file instead of using a complex interface  
✅ **Reliable** - No buggy forms or database issues  
✅ **Fast** - Changes take effect immediately on refresh  
✅ **Version Control** - Easy to track changes in Git  
✅ **Backup** - Simple to copy and restore  
✅ **Two Pages, One File** - Update both pages from a single location

## File Location

`/workspaces/TridentStudios-Website/artist-config.js`

---

**Need help?** Check the comments in the `artist-config.js` file for inline guidance.
