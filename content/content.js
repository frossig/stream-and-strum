class StreamAndStrumDetector {
    constructor() {
      this.currentSong = null;
      this.observer = null;
      this.platform = this.detectPlatform();
      this.floatingButton = null;
      
      this.init();
    }
  
    detectPlatform() {
      if (window.location.hostname === 'music.youtube.com') {
        return 'youtube-music';
      } else if (window.location.hostname === 'open.spotify.com') {
        return 'spotify';
      }
      return 'unknown';
    }
  
    init() {
      this.createFloatingButton();
      this.startWatching();
      this.setupMessageListener();
    }
  
    setupMessageListener() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'GET_CURRENT_SONG') {
          const songInfo = this.extractSongInfo();
          sendResponse({ songInfo });
        } else if (message.type === 'SEARCH_CHORDS_NOW') {
          this.searchChords();
        }
      });
    }
  
    startWatching() {
      // Revisar cada 2 segundos por cambios de canción
      setInterval(() => {
        const songInfo = this.extractSongInfo();
        if (songInfo && this.isDifferentSong(songInfo)) {
          this.currentSong = songInfo;
          this.notifyNewSong(songInfo);
        }
      }, 2000);
    }
  
    extractSongInfo() {
      if (this.platform === 'youtube-music') {
        return this.extractFromYouTubeMusic();
      } else if (this.platform === 'spotify') {
        return this.extractFromSpotify();
      }
      return null;
    }
  
    extractFromYouTubeMusic() {
      // Selectores más específicos para YouTube Music
      const titleSelectors = [
        'yt-formatted-string.title.style-scope.ytmusic-player-bar',
        '.title.style-scope.ytmusic-player-bar'
      ];
      
      const artistSelectors = [
        '.ytmusic-player-bar .byline a.yt-simple-endpoint',
        '.byline.style-scope.ytmusic-player-bar a',
        '.ytmusic-player-bar a[href*="channel/"]'
      ];
    
      const title = this.findElementText(titleSelectors);
      const artist = this.findElementText(artistSelectors);
    
      // Debug info
      console.log('Stream & Strum - Título:', title, 'Artista:', artist);
    
      if (title && artist) {
        return {
          title: this.cleanText(title),
          artist: this.cleanText(artist),
          platform: 'youtube-music'
        };
      }
      return null;
    }
  
    extractFromSpotify() {
      // Selectores para Spotify Web
      const titleSelectors = [
        '[data-testid="now-playing-widget"] a[href*="/track/"]',
        '.now-playing .track-info__name a',
        '.Root__now-playing-bar .track-info__name a'
      ];
      
      const artistSelectors = [
        '[data-testid="now-playing-widget"] a[href*="/artist/"]',
        '.now-playing .track-info__artists a',
        '.Root__now-playing-bar .track-info__artists a'
      ];
  
      const title = this.findElementText(titleSelectors);
      const artist = this.findElementText(artistSelectors);
  
      if (title && artist) {
        return {
          title: this.cleanText(title),
          artist: this.cleanText(artist),
          platform: 'spotify'
        };
      }
      return null;
    }
  
    findElementText(selectors) {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          return element.textContent.trim();
        }
      }
      return null;
    }
  
    cleanText(text) {
      return text
        .replace(/^\s+|\s+$/g, '') // trim
        .replace(/\s+/g, ' ') // normalizar espacios
        .replace(/[""'']/g, '"') // normalizar comillas
        .trim();
    }
  
    isDifferentSong(newSong) {
      if (!this.currentSong) return true;
      return this.currentSong.title !== newSong.title || 
             this.currentSong.artist !== newSong.artist;
    }
  
    notifyNewSong(songInfo) {
      chrome.runtime.sendMessage({
        type: 'NEW_SONG_DETECTED',
        songInfo: songInfo
      });
    }
  
    searchChords() {
      const songInfo = this.extractSongInfo();
      if (songInfo) {
        chrome.runtime.sendMessage({
          type: 'SEARCH_CHORDS',
          songInfo: songInfo
        });
      } else {
        this.showNotification('No se pudo detectar la canción actual');
      }
    }
  
    createFloatingButton() {
      // Remover botón existente si existe
      if (this.floatingButton) {
        this.floatingButton.remove();
      }
  
      this.floatingButton = document.createElement('div');
      this.floatingButton.id = 'stream-strum-btn';
      this.floatingButton.innerHTML = '🎸';
      this.floatingButton.title = 'Buscar acordes - Stream & Strum';
      
      // Estilos del botón
      Object.assign(this.floatingButton.style, {
        position: 'fixed',
        top: '100px',
        right: '20px',
        width: '60px',
        height: '60px',
        background: 'linear-gradient(135deg,rgb(176, 76, 76),rgba(191, 43, 14, 0.66))',
        boxShadow: '0 6px 20px rgba(255, 107, 107, 0.4)',
        borderRadius: '50%',
        cursor: 'pointer',
        zIndex: '999999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        transition: 'all 0.6s ease',
        userSelect: 'none'
      });
  
      // Efectos hover
        this.floatingButton.addEventListener('mouseenter', () => {
          this.floatingButton.style.background = 'linear-gradient(135deg, #ff5252, #b33e00)';
          this.floatingButton.style.boxShadow = '0 8px 25px rgba(255, 82, 82, 0.5)';
          this.floatingButton.style.transform = 'scale(1.1)';
          this.floatingButton.style.transition = 'all 0.6s ease';
        });
    
        this.floatingButton.addEventListener('mouseleave', () => {
          this.floatingButton.style.background = 'linear-gradient(135deg, rgb(176, 76, 76), rgba(191, 43, 14, 0.66))';
          this.floatingButton.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
          this.floatingButton.style.transform = 'scale(1)';
          this.floatingButton.style.transition = 'all 0.6s ease';
        });
  
      this.floatingButton.addEventListener('click', () => {
        this.floatingButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
          this.floatingButton.style.transform = 'scale(1)';
        }, 150);
        this.searchChords();
      });
  
      document.body.appendChild(this.floatingButton);
    }
  
    showNotification(message) {
      const notification = document.createElement('div');
      notification.textContent = message;
      Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#333',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        zIndex: '999999',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      });
  
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
  }
  
  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new StreamAndStrumDetector();
    });
  } else {
    new StreamAndStrumDetector();
  }