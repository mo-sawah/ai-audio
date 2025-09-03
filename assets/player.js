/**
 * AI Audio Player JavaScript
 * Professional Text-to-Speech Player
 */

class AIAudioPlayer {
  constructor(container) {
    this.container = container;
    this.audio = null;
    this.isPlaying = false;
    this.isLoading = false;
    this.currentTime = 0;
    this.duration = 0;
    this.volume = 0.8;
    this.playbackRate = 1;

    this.init();
  }

  init() {
    this.bindElements();
    this.bindEvents();
    this.updateUI();
  }

  bindElements() {
    this.playBtn = this.container.querySelector(".ai-audio-play-btn");
    this.playIcon = this.container.querySelector(".ai-audio-play-icon");
    this.pauseIcon = this.container.querySelector(".ai-audio-pause-icon");
    this.loadingIcon = this.container.querySelector(".ai-audio-loading-icon");
    this.progressBar = this.container.querySelector(".ai-audio-progress-bar");
    this.progressFill = this.container.querySelector(".ai-audio-progress-fill");
    this.timeDisplay = this.container.querySelector(".ai-audio-time");
    this.skipBtns = this.container.querySelectorAll(".ai-audio-skip-btn");
    this.volumeSlider = this.container.querySelector(".ai-audio-volume-slider");
    this.volumeFill = this.container.querySelector(".ai-audio-volume-fill");
    this.speedSelect = this.container.querySelector(".ai-audio-speed");
    this.statusEl = this.container.querySelector(".ai-audio-status");
    this.statusText = this.container.querySelector(".ai-audio-status-text");
  }

  bindEvents() {
    // Play/Pause button
    this.playBtn.addEventListener("click", () => {
      if (this.isLoading) return;

      if (this.audio && !this.audio.paused) {
        this.pause();
      } else {
        this.play();
      }
    });

    // Progress bar
    this.progressBar.addEventListener("click", (e) => {
      if (!this.audio) return;

      const rect = this.progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = this.duration * percent;

      this.seek(newTime);
    });

    // Skip buttons
    this.skipBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const skipAmount = parseInt(btn.dataset.skip);
        this.skip(skipAmount);
      });
    });

    // Volume slider
    this.volumeSlider.addEventListener("click", (e) => {
      const rect = this.volumeSlider.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      this.setVolume(percent);
    });

    // Speed control
    this.speedSelect.addEventListener("change", (e) => {
      this.setPlaybackRate(parseFloat(e.target.value));
    });
  }

  async play() {
    if (!this.audio) {
      await this.loadAudio();
    }

    if (this.audio) {
      try {
        await this.audio.play();
        this.isPlaying = true;
        this.updateUI();
        this.showStatus("Playing...");
      } catch (error) {
        console.error("Error playing audio:", error);
        this.showStatus("Error playing audio");
      }
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
      this.updateUI();
      this.showStatus("Paused");
    }
  }

  async loadAudio() {
    this.setLoading(true);
    this.showStatus("Generating audio...");

    const postId = this.container.dataset.postId;
    const aiService = this.container.dataset.aiService;
    const voice = this.container.dataset.voice;

    if (aiAudio.debug) {
      console.log(
        "AI Audio: Loading audio for post",
        postId,
        "with service",
        aiService,
        "and voice",
        voice
      );
    }

    try {
      // First check if audio already exists
      const checkResponse = await fetch(aiAudio.ajaxUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          action: "check_existing_audio",
          post_id: postId,
          ai_service: aiService,
          voice: voice,
          nonce: aiAudio.nonce,
        }),
      });

      if (!checkResponse.ok) {
        throw new Error(`HTTP error! status: ${checkResponse.status}`);
      }

      const checkData = await checkResponse.json();

      if (aiAudio.debug) {
        console.log("AI Audio: Check existing response", checkData);
      }

      let audioUrl = null;

      if (checkData.success && checkData.data.audio_url) {
        // Audio already exists
        audioUrl = checkData.data.audio_url;
        this.showStatus("Loading existing audio...");
      } else {
        // Generate new audio
        this.showStatus("Generating new audio...");

        const response = await fetch(aiAudio.ajaxUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            action: "generate_audio",
            post_id: postId,
            ai_service: aiService,
            voice: voice,
            nonce: aiAudio.nonce,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (aiAudio.debug) {
          console.log("AI Audio: Generate response", data);
        }

        if (data.success && data.data.audio_url) {
          audioUrl = data.data.audio_url;
        } else {
          throw new Error(data.data || "Failed to generate audio");
        }
      }

      if (audioUrl) {
        if (aiAudio.debug) {
          console.log("AI Audio: Creating audio element with URL", audioUrl);
        }

        this.audio = new Audio(audioUrl);
        this.setupAudioEvents();

        // Wait for audio to be ready
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Audio loading timeout"));
          }, 30000);

          this.audio.addEventListener(
            "canplaythrough",
            () => {
              clearTimeout(timeout);
              resolve();
            },
            { once: true }
          );

          this.audio.addEventListener(
            "error",
            (e) => {
              clearTimeout(timeout);
              console.error("Audio loading error:", e);
              reject(new Error("Audio failed to load"));
            },
            { once: true }
          );

          this.audio.load();
        });

        this.showStatus("Ready to play");
      }
    } catch (error) {
      console.error("Error loading audio:", error);
      this.showStatus("Failed to generate audio: " + error.message);
    }

    this.setLoading(false);
  }

  setupAudioEvents() {
    if (!this.audio) return;

    this.audio.addEventListener("loadedmetadata", () => {
      this.duration = this.audio.duration || 0;
      this.updateUI();
    });

    this.audio.addEventListener("timeupdate", () => {
      this.currentTime = this.audio.currentTime || 0;
      this.updateUI();
    });

    this.audio.addEventListener("ended", () => {
      this.isPlaying = false;
      this.currentTime = 0;
      this.updateUI();
      this.showStatus("Finished");
    });

    this.audio.addEventListener("error", (e) => {
      console.error("Audio error:", e);
      this.showStatus("Audio error");
      this.setLoading(false);
    });

    this.audio.addEventListener("canplaythrough", () => {
      this.setLoading(false);
      this.showStatus("Ready to play");
    });

    // Set initial volume and playback rate
    this.audio.volume = this.volume;
    this.audio.playbackRate = this.playbackRate;
  }

  seek(time) {
    if (this.audio) {
      this.audio.currentTime = Math.max(0, Math.min(time, this.duration));
      this.currentTime = this.audio.currentTime;
      this.updateUI();
    }
  }

  skip(seconds) {
    if (this.audio) {
      const newTime = this.currentTime + seconds;
      this.seek(newTime);
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));

    if (this.audio) {
      this.audio.volume = this.volume;
    }

    this.updateUI();
  }

  setPlaybackRate(rate) {
    this.playbackRate = rate;

    if (this.audio) {
      this.audio.playbackRate = rate;
    }

    this.speedSelect.value = rate;
  }

  setLoading(loading) {
    this.isLoading = loading;
    this.updateUI();

    if (loading) {
      this.statusEl.classList.add("loading");
    } else {
      this.statusEl.classList.remove("loading");
    }
  }

  updateUI() {
    // Update play/pause button
    if (this.isLoading) {
      this.showIcon("loading");
    } else if (this.isPlaying) {
      this.showIcon("pause");
    } else {
      this.showIcon("play");
    }

    // Update progress
    if (this.duration > 0) {
      const percent = (this.currentTime / this.duration) * 100;
      this.progressFill.style.width = `${percent}%`;
    }

    // Update time display
    const currentFormatted = this.formatTime(this.currentTime);
    const durationFormatted = this.formatTime(this.duration);
    this.timeDisplay.textContent = `${currentFormatted} / ${durationFormatted}`;

    // Update volume display
    this.volumeFill.style.width = `${this.volume * 100}%`;

    // Update button states
    this.playBtn.disabled = this.isLoading;
  }

  showIcon(type) {
    this.playIcon.style.display = type === "play" ? "block" : "none";
    this.pauseIcon.style.display = type === "pause" ? "block" : "none";
    this.loadingIcon.style.display = type === "loading" ? "block" : "none";
  }

  showStatus(text) {
    this.statusText.textContent = text;

    if (this.isPlaying || this.isLoading) {
      this.statusEl.style.display = "flex";
    } else {
      // Hide status after a delay
      setTimeout(() => {
        if (!this.isPlaying && !this.isLoading) {
          this.statusEl.style.display = "none";
        }
      }, 3000);
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) {
      return "0:00";
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
}

// Admin Settings JavaScript
class AIAudioAdmin {
  constructor() {
    this.init();
  }

  init() {
    // Tab switching
    const tabBtns = document.querySelectorAll(".ai-audio-tab-btn");
    const tabPanels = document.querySelectorAll(".ai-audio-tab-panel");

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const targetTab = btn.dataset.tab;

        // Update active tab button
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        // Update active tab panel
        tabPanels.forEach((panel) => {
          if (panel.dataset.tab === targetTab) {
            panel.classList.add("active");
          } else {
            panel.classList.remove("active");
          }
        });
      });
    });

    // Color picker preview
    const colorInputs = document.querySelectorAll('input[type="color"]');
    colorInputs.forEach((input) => {
      input.addEventListener("change", () => {
        this.updatePreview();
      });
    });
  }

  updatePreview() {
    // This could show a live preview of the player with updated colors
    console.log("Preview updated");
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Initialize audio players
  const players = document.querySelectorAll(".ai-audio-player");
  players.forEach((player) => {
    new AIAudioPlayer(player);
  });

  // Initialize admin interface if on settings page
  if (document.querySelector(".ai-audio-settings")) {
    new AIAudioAdmin();
  }
});

// Export for potential external use
window.AIAudioPlayer = AIAudioPlayer;
window.AIAudioAdmin = AIAudioAdmin;
