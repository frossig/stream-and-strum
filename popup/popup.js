class StreamAndStrumPopup {
    constructor() {
      this.currentSong = null;
      this.init();
    }
  
    init() {
      this.setupTabNavigation();
      this.setupEventListeners();
      this.loadSettings();
      this.getCurrentSong();
      this.updateUI();
    }
  
    setupTabNavigation() {
      const tabButtons = document.querySelectorAll('.tab-btn');
      const tabPanels = document.querySelectorAll('.tab-panel');
  
      tabButtons.forEach(button => {
        button.addEventListener('click', () => {
          const targetTab = button.dataset.tab;
                    
          tabButtons.forEach(btn => btn.classList.remove('active'));
          tabPanels.forEach(panel => panel.classList.remove('active'));
          
          button.classList.add('active');
          document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
      });
    }
  
    setupEventListeners() {
      document.getElementById('search-btn').addEventListener('click', () => {
        this.searchCurrentSong();
      });
  
      const clearBtn = document.getElementById('clear-settings');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.resetToDefaults();
        });
      }
  
      const checkboxes = [
        'ultimate-guitar',
        'cifra-club', 
        'google',
        'auto-search',
        'open-background'
      ];
  
      checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
          checkbox.addEventListener('change', () => {
            this.saveSettings();
            this.updateUI();
          });
        }
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
        console.log('Error getting current song:', error);
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
          <span class="song-icon">🎵</span>
          <div class="song-info">
            <div class="song-title">${this.escapeHtml(songInfo.title)}</div>
            <div class="song-artist">${this.escapeHtml(songInfo.artist)}</div>
          </div>
        </div>
      `;
      
      const searchBtn = document.getElementById('search-btn');
      searchBtn.disabled = false;
      searchBtn.innerHTML = `
        <span class="btn-icon">🔍</span>
        <span class="btn-text">Buscar Acordes</span>
      `;
    }
  
    displayNoSong() {
      const songInfoEl = document.getElementById('song-info');
      songInfoEl.innerHTML = `
        <div class="no-song">
          <span class="status-icon">🎵</span>
          <div class="status-text">
            <div class="status-title">No se detectó ninguna canción</div>
            <div class="status-subtitle">Reproduce algo y vuelve a intentar</div>
          </div>
        </div>
      `;
      
      const searchBtn = document.getElementById('search-btn');
      searchBtn.disabled = true;
      searchBtn.innerHTML = `
        <span class="btn-icon">⚠️</span>
        <span class="btn-text">No hay canción</span>
      `;
    }
  
    displayUnsupportedSite() {
      const songInfoEl = document.getElementById('song-info');
      songInfoEl.innerHTML = `
        <div class="no-song">
          <span class="status-icon">📱</span>
          <div class="status-text">
            <div class="status-title">Sitio no compatible</div>
            <div class="status-subtitle">Funciona en YouTube Music y Spotify Web</div>
          </div>
        </div>
      `;
      
      const searchBtn = document.getElementById('search-btn');
      searchBtn.disabled = true;
      searchBtn.innerHTML = `
        <span class="btn-icon">🚫</span>
        <span class="btn-text">Sitio no compatible</span>
      `;
    }
  
    async searchCurrentSong() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.sendMessage(tab.id, { type: 'SEARCH_CHORDS_NOW' });
        
        const btn = document.getElementById('search-btn');
        const originalContent = btn.innerHTML;
        
        btn.innerHTML = `
          <span class="btn-icon">✨</span>
          <span class="btn-text">Buscando...</span>
        `;
        btn.disabled = true;
        
        setTimeout(() => {
          btn.innerHTML = `
            <span class="btn-icon">✅</span>
            <span class="btn-text">¡Listo!</span>
          `;
          
          setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.disabled = false;
          }, 1500);
        }, 1000);
        
      } catch (error) {
        console.log('Error searching chords:', error);
        
        const btn = document.getElementById('search-btn');
        btn.innerHTML = `
          <span class="btn-icon">❌</span>
          <span class="btn-text">Error</span>
        `;
        
        setTimeout(() => {
          this.getCurrentSong(); 
        }, 2000);
      }
    }
  
    async resetToDefaults() {
      const defaultSettings = {
        ultimateGuitar: true,
        cifraClub: true,
        google: true,
        autoSearch: false,
        openInBackground: true
      };
      
      await chrome.storage.sync.set({ streamStrumSettings: defaultSettings });
      await this.loadSettings();
      
      const btn = document.getElementById('clear-settings');
      const originalText = btn.innerHTML;
      
      btn.innerHTML = `
        <span class="btn-icon">✅</span>
        <span class="btn-text">Restaurado</span>
      `;
      
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    }
  
    async saveSettings() {
      const settings = {
        ultimateGuitar: document.getElementById('ultimate-guitar')?.checked || false,
        cifraClub: document.getElementById('cifra-club')?.checked || false,
        google: document.getElementById('google')?.checked || false,
        autoSearch: document.getElementById('auto-search')?.checked || false,
        openInBackground: document.getElementById('open-background')?.checked || false
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
  
      const checkboxMapping = {
        'ultimate-guitar': settings.ultimateGuitar,
        'cifra-club': settings.cifraClub,
        'google': settings.google,
        'auto-search': settings.autoSearch,
        'open-background': settings.openInBackground
      };
  
      Object.entries(checkboxMapping).forEach(([id, checked]) => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
          checkbox.checked = checked;
        }
      });
    }
  
    updateUI() {
      const hasSelectedSites = 
        document.getElementById('ultimate-guitar')?.checked ||
        document.getElementById('cifra-club')?.checked ||
        document.getElementById('google')?.checked;
  
      const searchBtn = document.getElementById('search-btn');
      
      // Deshabilitar búsqueda si no hay sitios seleccionados
      if (!hasSelectedSites) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = `
          <span class="btn-icon">⚠️</span>
          <span class="btn-text">Selecciona al menos un sitio</span>
        `;
      } else if (this.currentSong) {
        searchBtn.disabled = false;
        searchBtn.innerHTML = `
          <span class="btn-icon">🔍</span>
          <span class="btn-text">Buscar Acordes</span>
        `;
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