class StreamAndStrumPopup {
    constructor() {
      this.currentSong = null;
      this.init();
    }
  
    init() {
      this.setupEventListeners();
      this.loadSettings();
      this.getCurrentSong();
      this.updateUI();
    }
  
    setupEventListeners() {
      document.getElementById('search-btn').addEventListener('click', () => {
        this.searchCurrentSong();
      });
  
      const checkboxes = [
        'ultimate-guitar',
        'cifra-club', 
        'google',
        'auto-search',
        'open-background'
      ];
  
      checkboxes.forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
          this.saveSettings();
          this.updateUI();
        });
      });
    }
  
    async getCurrentSong() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (this.isSupportedSite(tab.url)) {
          const response = await chrome.tabs.sendMessage(tab.id, { 
            type: 'GET_CURRENT_SONG' 
          });
          
          if (response && response.songInfo) {
            this.currentSong = response.songInfo;
            this.displaySongInfo(response.songInfo);
          } else {
            this.displayNoSong();
          }
        } else {
          this.displayUnsupportedSite();
        }
      } catch (error) {
        console.error('Error getting current song:', error);
        this.displayNoSong();
      }
    }
  
    isSupportedSite(url) {
      return url && (
        url.includes('music.youtube.com') || 
        url.includes('open.spotify.com')
      );
    }
  
    displaySongInfo(songInfo) {
      const songInfoEl = document.getElementById('song-info');
      songInfoEl.innerHTML = `
        <div class="song-details">
          <div class="song-title">${this.escapeHtml(songInfo.title)}</div>
          <div class="song-artist">${this.escapeHtml(songInfo.artist)}</div>
        </div>
      `;
      
      document.getElementById('search-btn').disabled = false;
    }
  
    displayNoSong() {
      const songInfoEl = document.getElementById('song-info');
      songInfoEl.innerHTML = '<div class="no-song">No se detectó ninguna canción</div>';
      document.getElementById('search-btn').disabled = true;
    }
  
    displayUnsupportedSite() {
      const songInfoEl = document.getElementById('song-info');
      songInfoEl.innerHTML = '<div class="no-song">Sitio no compatible<br><small>Funciona en YouTube Music y Spotify Web</small></div>';
      document.getElementById('search-btn').disabled = true;
    }
  
    async searchCurrentSong() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.sendMessage(tab.id, { type: 'SEARCH_CHORDS_NOW' });
        
        const btn = document.getElementById('search-btn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Buscando...';
        btn.disabled = true;
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
        }, 2000);
        
      } catch (error) {
        console.error('Error searching chords:', error);
      }
    }
  
    async saveSettings() {
      const settings = {
        ultimateGuitar: document.getElementById('ultimate-guitar').checked,
        cifraClub: document.getElementById('cifra-club').checked,
        google: document.getElementById('google').checked,
        autoSearch: document.getElementById('auto-search').checked,
        openInBackground: document.getElementById('open-background').checked
      };
      
      await chrome.storage.sync.set({ streamStrumSettings: settings });
    }
  
    async loadSettings() {
      const result = await chrome.storage.sync.get(['streamStrumSettings']);
      const settings = result.streamStrumSettings || {
        ultimateGuitar: true,
        cifraClub: true,
        google: true,
        autoSearch: false,
        openInBackground: true
      };
  
      document.getElementById('ultimate-guitar').checked = settings.ultimateGuitar;
      document.getElementById('cifra-club').checked = settings.cifraClub;
      document.getElementById('google').checked = settings.google;
      document.getElementById('auto-search').checked = settings.autoSearch;
      document.getElementById('open-background').checked = settings.openInBackground;
    }
  
    updateUI() {
      const hasSelectedSites = 
        document.getElementById('ultimate-guitar').checked ||
        document.getElementById('cifra-club').checked ||
        document.getElementById('google').checked;
  
      if (!hasSelectedSites) {
        document.getElementById('search-btn').disabled = true;
        document.getElementById('search-btn').textContent = '⚠️ Selecciona al menos un sitio';
      } else if (this.currentSong) {
        document.getElementById('search-btn').disabled = false;
        document.getElementById('search-btn').textContent = '🔍 Buscar Acordes';
      }
    }
  
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    new StreamAndStrumPopup();
  });