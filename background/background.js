class StreamAndStrumBackground {
    constructor() {
      this.setupMessageListener();
      this.setupInstallHandler();
      
      this.defaultSettings = {
        ultimateGuitar: true,
        cifraClub: true,
        google: true,
        autoSearch: false,
        openInBackground: true
      };
  
      this.chordSites = {
        ultimateGuitar: {
          name: 'Ultimate Guitar',
          url: 'https://www.ultimate-guitar.com/search.php?search_type=title&value=',
          format: (artist, title) => `${artist} ${title}`
        },
        cifraClub: {
          name: 'Cifra Club',
          url: 'https://www.cifraclub.com/?q=',
          format: (artist, title) => `${artist} ${title}`
        },
        google: {
          name: 'Google',
          url: 'https://www.google.com/search?q=',
          format: (artist, title) => `${artist} ${title} chords acordes`
        }
      };
    }
  
    setupInstallHandler() {
      chrome.runtime.onInstalled.addListener(() => {  
        chrome.storage.sync.set({ streamStrumSettings: this.defaultSettings });
      });
    }
  
    setupMessageListener() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
          case 'SEARCH_CHORDS':
            this.searchChords(message.songInfo);
            break;
          case 'NEW_SONG_DETECTED':
            this.handleNewSong(message.songInfo);
            break;
        }
      });
    }
  
    async handleNewSong(songInfo) {
      const settings = await this.getSettings();
      
      if (settings.autoSearch) {
        this.searchChords(songInfo);
      }
      
      this.updateBadge(songInfo);
    }
  
    async searchChords(songInfo) {
      const settings = await this.getSettings();
      const { artist, title } = songInfo;
      
      const cleanArtist = this.cleanForUrl(artist);
      const cleanTitle = this.cleanForUrl(title);
  
      const sitesToOpen = [];
      
      if (settings.ultimateGuitar) {
        sitesToOpen.push(this.chordSites.ultimateGuitar);
      }
      if (settings.cifraClub) {
        sitesToOpen.push(this.chordSites.cifraClub);
      }
      if (settings.google) {
        sitesToOpen.push(this.chordSites.google);
      }
  
      sitesToOpen.forEach((site, index) => {
        const query = site.format(cleanArtist, cleanTitle);
        const url = site.url + encodeURIComponent(query);
        
        setTimeout(() => {
          chrome.tabs.create({
            url: url,
            active: index === 0 && !settings.openInBackground
          });
        }, index * 100); 
      });
  
      this.showNotification(
        `Buscando acordes para "${artist} - ${title}"`,
        `Abriendo ${sitesToOpen.length} pestañas...`
      );
    }
  
    cleanForUrl(text) {
      return text
        .replace(/[^\w\sáéíóúñü]/gi, '') 
        .trim()
        .replace(/\s+/g, ' '); 
    }
  
    async getSettings() {
      return new Promise((resolve) => {
        chrome.storage.sync.get(['streamStrumSettings'], (result) => {
          resolve(result.streamStrumSettings || this.defaultSettings);
        });
      });
    }
  
    updateBadge(songInfo) {
      const firstLetter = songInfo.artist.charAt(0).toUpperCase();
      chrome.action.setBadgeText({ text: firstLetter });
      chrome.action.setBadgeBackgroundColor({ color: '#ff6b6b' });
      
      chrome.action.setTitle({ 
        title: `Stream & Strum\nAhora: ${songInfo.artist} - ${songInfo.title}` 
      });
    }
  
    showNotification(title, message) {
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: title,
          message: message
        });
      }
    }
  }
  
  new StreamAndStrumBackground();