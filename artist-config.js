// ============================================================
// TRIDENT STUDIOS — ARTIST CONFIGURATION FILE
// ============================================================
// Edit this file to update artist information across the website.
// Changes here will automatically update both the Artists page and Socials page.
// ============================================================

const ARTIST_CONFIG = {
    
    // ========================================
    // SECTION 1: THE ARTISTS PAGE
    // ========================================
    // These artists appear on artists.html with full profile cards
    // Each artist gets a detailed card with profile picture, bio, and social links
    
    artistsPage: [
        {
            id: "1",
            name: "Rose",
            roleTitle: "Logo Designer & Branding",
            discordTag: "@boringrose",
            bio: "Specializing in custom quality graphics & cinematics.",
            avatarUrl: "https://i.postimg.cc/76jTH2cW/boringrose.png",
            socials: {
                discord: "https://discord.gg/dPj6S5Vc2A",
                youtube: "https://www.youtube.com/@boringrose123"
            }
        },
        {
            id: "2",
            name: "Moonkie",
            roleTitle: "Founder, Artist & Editor",
            discordTag: "@moonkiegfx",
            bio: "Specializing in high-quality graphics, video editing, and content creation.",
            avatarUrl: "https://i.postimg.cc/SsdtHmvN/Untitled.png", // Leave empty to use default icon
            socials: {
                discord: "https://discord.gg/dPj6S5Vc2A",
                youtube: "https://www.youtube.com/@MoonkieYT"
            }
        },
        {
            id: "3",
            name: "Krynn",
            roleTitle: "Founder & Artist",
            discordTag: "@itzkrynn",
            bio: "Specializes in creating quality graphics and visuals",
            avatarUrl: "https://i.postimg.cc/Hk8RjDrC/a-647352b9f67feb0c50cccc09903c4f17.gif",
            socials: {
                discord: "https://discord.gg/dPj6S5Vc2A",
                youtube: "https://www.youtube.com/@KrynnRust"
            }
        },
        {
            id: "4",
            name: "This could be you",
            roleTitle: "Future Artist?",
            discordTag: "@discordusername",
            bio: "Your specialties go here!",
            avatarUrl: "",
            socials: {
                discord: "https://discord.gg/dPj6S5Vc2A",
                youtube: "#"
            }
        }
    ],
    
    
    // ========================================
    // SECTION 2: THE SOCIALS PAGE
    // ========================================
    // These artists appear on socials.html in the "Follow Our Artists" section
    // This is a simplified view showing just name, role, and social links
    
    socialsPage: [
        {
            name: "Rose",
            roleTitle: "Senior Artist",
            socials: {
                discord: "https://discord.gg/dPj6S5Vc2A",
                youtube: "https://www.youtube.com/@boringrose123"
            }
        },
        {
            name: "Moonkie",
            roleTitle: "Founder, Artist & Editor",
            socials: {
                discord: "https://discord.gg/dPj6S5Vc2A",
                youtube: "https://www.youtube.com/@MoonkieYT"
            }
        },
        {
            name: "Krynn",
            roleTitle: "Founder & Artist",
            socials: {
                discord: "https://discord.gg/dPj6S5Vc2A",
                youtube: "https://www.youtube.com/@KrynnRust"
            }
        },
        {
            name: "This could be you",
            roleTitle: "Future Artist?",
            socials: {
                discord: "https://discord.gg/dPj6S5Vc2A",
                youtube: "#"
            }
        }
    ],
    
    
    // ========================================
    // GLOBAL SETTINGS
    // ========================================
    
    globalSettings: {
        // Official Trident Studios Discord (appears on socials page)
        officialDiscord: "https://discord.gg/dPj6S5Vc2A",
        
        // Studio YouTube channel (appears on socials page)
        studioYoutube: "https://www.youtube.com/@TridentGraphic",
        
        // Default placeholder for images
        defaultAvatarIcon: "fas fa-user-circle"
    }
};

// ============================================================
// HOW TO USE THIS FILE:
// ============================================================
// 1. Edit the information above between the quotes
// 2. Save this file
// 3. Refresh the Artists page or Socials page to see changes
// 
// TIPS:
// - Use # for empty/placeholder links
// - Leave avatarUrl empty ("") to use the default icon
// - Make sure to keep all the commas and quotes in place
// - Discord links should start with: https://discord.gg/
// - YouTube links should start with: https://www.youtube.com/
// ============================================================
