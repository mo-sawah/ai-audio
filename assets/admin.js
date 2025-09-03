/**
 * AI Audio Admin JavaScript
 * Admin interface functionality
 */

jQuery(document).ready(function ($) {
  // Settings page tab functionality
  $(".ai-audio-tab-btn").on("click", function (e) {
    e.preventDefault();

    var targetTab = $(this).data("tab");

    // Update active tab button
    $(".ai-audio-tab-btn").removeClass("active");
    $(this).addClass("active");

    // Update active tab panel
    $(".ai-audio-tab-panel").removeClass("active");
    $('.ai-audio-tab-panel[data-tab="' + targetTab + '"]').addClass("active");
  });

  // Color picker live preview
  $('input[type="color"]').on("change", function () {
    updateColorPreview();
  });

  // API key toggle visibility
  $('input[type="password"]').each(function () {
    var $this = $(this);
    var $wrapper = $('<div class="ai-audio-password-wrapper"></div>');
    var $toggle = $(
      '<button type="button" class="ai-audio-password-toggle">Show</button>'
    );

    $this.wrap($wrapper);
    $this.after($toggle);

    $toggle.on("click", function () {
      if ($this.attr("type") === "password") {
        $this.attr("type", "text");
        $toggle.text("Hide");
      } else {
        $this.attr("type", "password");
        $toggle.text("Show");
      }
    });
  });

  // Test API connection
  $(".ai-audio-test-api").on("click", function (e) {
    e.preventDefault();

    var $btn = $(this);
    var service = $btn.data("service");
    var apiKey = $('input[name="' + service + '_api_key"]').val();

    if (!apiKey) {
      alert("Please enter an API key first.");
      return;
    }

    $btn.prop("disabled", true).text("Testing...");

    $.ajax({
      url: ajaxurl,
      type: "POST",
      data: {
        action: "ai_audio_test_api",
        service: service,
        api_key: apiKey,
        nonce: aiAudioAdmin.nonce,
      },
      success: function (response) {
        if (response.success) {
          $btn.after(
            '<span class="ai-audio-api-status success">✓ Connection successful</span>'
          );
        } else {
          $btn.after(
            '<span class="ai-audio-api-status error">✗ ' +
              response.data +
              "</span>"
          );
        }
      },
      error: function () {
        $btn.after(
          '<span class="ai-audio-api-status error">✗ Connection failed</span>'
        );
      },
      complete: function () {
        $btn.prop("disabled", false).text("Test Connection");

        // Remove status message after 5 seconds
        setTimeout(function () {
          $(".ai-audio-api-status").fadeOut(function () {
            $(this).remove();
          });
        }, 5000);
      },
    });
  });

  // Voice preview functionality
  $(".ai-audio-voice-preview").on("click", function (e) {
    e.preventDefault();

    var voice = $(this).data("voice");
    var service = $('select[name="default_ai"]').val();

    playVoicePreview(voice, service);
  });

  // Meta box conditional display
  $("#ai_audio_service").on("change", function () {
    var service = $(this).val();
    updateVoiceOptions(service);
  });

  // Import/Export settings
  $(".ai-audio-export-settings").on("click", function (e) {
    e.preventDefault();
    exportSettings();
  });

  $(".ai-audio-import-settings").on("change", function (e) {
    importSettings(e.target.files[0]);
  });

  // Functions
  function updateColorPreview() {
    var primaryColor = $('input[name="primary_color"]').val();
    var textColor = $('input[name="text_color"]').val();
    var backgroundColor = $('input[name="background_color"]').val();

    // Create or update preview
    var $preview = $(".ai-audio-color-preview");
    if ($preview.length === 0) {
      $preview = $('<div class="ai-audio-color-preview"></div>');
      $(".ai-audio-card:last").after($preview);
    }

    $preview.html(generatePreviewHTML()).css({
      "--ai-audio-primary": primaryColor,
      "--ai-audio-text": textColor,
      "--ai-audio-bg": backgroundColor,
      "--ai-audio-border": textColor + "20",
    });
  }

  function generatePreviewHTML() {
    return `
            <h4>Preview</h4>
            <div class="ai-audio-preview-player">
                <button class="ai-audio-preview-play-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </button>
                <div class="ai-audio-preview-info">
                    <div class="ai-audio-preview-title">Listen to Article</div>
                    <div class="ai-audio-preview-progress">
                        <div class="ai-audio-preview-progress-fill" style="width: 35%"></div>
                    </div>
                    <div class="ai-audio-preview-time">1:23 / 3:45</div>
                </div>
            </div>
        `;
  }

  function playVoicePreview(voice, service) {
    // This would play a sample audio with the selected voice
    console.log("Playing preview for voice:", voice, "service:", service);

    // In a real implementation, you would:
    // 1. Generate a short sample audio with the API
    // 2. Play it using HTML5 audio
    // 3. Show loading/playing states
  }

  function updateVoiceOptions(service) {
    var $voiceSelect = $("#ai_audio_voice");
    var voices = {
      google: [
        { value: "en-US-Wavenet-D", text: "Male Voice 1 (Wavenet-D)" },
        { value: "en-US-Wavenet-F", text: "Female Voice 1 (Wavenet-F)" },
        { value: "en-US-Wavenet-A", text: "Male Voice 2 (Wavenet-A)" },
        { value: "en-US-Wavenet-C", text: "Female Voice 2 (Wavenet-C)" },
        { value: "en-US-Neural2-D", text: "Male Voice 3 (Neural2-D)" },
        { value: "en-US-Neural2-F", text: "Female Voice 3 (Neural2-F)" },
      ],
      chatgpt: [
        { value: "alloy", text: "Alloy" },
        { value: "echo", text: "Echo" },
        { value: "fable", text: "Fable" },
        { value: "onyx", text: "Onyx" },
        { value: "nova", text: "Nova" },
        { value: "shimmer", text: "Shimmer" },
      ],
    };

    if (service && voices[service]) {
      $voiceSelect
        .empty()
        .append('<option value="">Use Global Setting</option>');

      voices[service].forEach(function (voice) {
        $voiceSelect.append(
          '<option value="' + voice.value + '">' + voice.text + "</option>"
        );
      });
    }
  }

  function exportSettings() {
    var settings = {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      settings: {},
    };

    // Collect all form data
    $("form input, form select, form textarea").each(function () {
      var $this = $(this);
      var name = $this.attr("name");

      if (name && name !== "submit") {
        if ($this.is(":checkbox")) {
          settings.settings[name] = $this.is(":checked");
        } else if ($this.attr("type") !== "password") {
          settings.settings[name] = $this.val();
        }
      }
    });

    // Download as JSON file
    var dataStr = JSON.stringify(settings, null, 2);
    var dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    var exportFileDefaultName =
      "ai-audio-settings-" + new Date().toISOString().slice(0, 10) + ".json";

    var linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }

  function importSettings(file) {
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var settings = JSON.parse(e.target.result);

        if (!settings.settings) {
          alert("Invalid settings file format.");
          return;
        }

        // Confirm import
        if (!confirm("This will overwrite your current settings. Continue?")) {
          return;
        }

        // Apply settings to form
        Object.keys(settings.settings).forEach(function (key) {
          var $field = $(
            'input[name="' +
              key +
              '"], select[name="' +
              key +
              '"], textarea[name="' +
              key +
              '"]'
          );

          if ($field.length) {
            if ($field.is(":checkbox")) {
              $field.prop("checked", settings.settings[key]);
            } else {
              $field.val(settings.settings[key]);
            }
          }
        });

        alert("Settings imported successfully! Don't forget to save.");
        updateColorPreview();
      } catch (error) {
        alert("Error reading settings file: " + error.message);
      }
    };

    reader.readAsText(file);
  }

  // Initialize color preview on page load
  if ($('input[name="primary_color"]').length) {
    updateColorPreview();
  }

  // Auto-save draft functionality
  var autoSaveTimeout;
  $("form input, form select, form textarea").on("input change", function () {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(function () {
      saveDraft();
    }, 2000);
  });

  function saveDraft() {
    var formData = $("form").serialize();

    $.ajax({
      url: ajaxurl,
      type: "POST",
      data: {
        action: "ai_audio_save_draft",
        form_data: formData,
        nonce: aiAudioAdmin.nonce,
      },
      success: function (response) {
        if (response.success) {
          showNotification("Settings draft saved automatically", "success");
        }
      },
    });
  }

  function showNotification(message, type) {
    var $notification = $(
      '<div class="ai-audio-notification ' + type + '">' + message + "</div>"
    );
    $("body").append($notification);

    setTimeout(function () {
      $notification.addClass("show");
    }, 100);

    setTimeout(function () {
      $notification.removeClass("show");
      setTimeout(function () {
        $notification.remove();
      }, 300);
    }, 3000);
  }

  // Bulk actions for posts
  $(".ai-audio-bulk-enable").on("click", function (e) {
    e.preventDefault();

    if (!confirm("Enable AI Audio for all published posts?")) {
      return;
    }

    var $btn = $(this);
    $btn.prop("disabled", true).text("Processing...");

    $.ajax({
      url: ajaxurl,
      type: "POST",
      data: {
        action: "ai_audio_bulk_enable",
        nonce: aiAudioAdmin.nonce,
      },
      success: function (response) {
        if (response.success) {
          alert("AI Audio enabled for " + response.data.count + " posts.");
        } else {
          alert("Error: " + response.data);
        }
      },
      complete: function () {
        $btn.prop("disabled", false).text("Enable for All Posts");
      },
    });
  });

  // Advanced settings toggle
  $(".ai-audio-advanced-toggle").on("click", function (e) {
    e.preventDefault();

    var $advanced = $(".ai-audio-advanced-settings");
    var $toggle = $(this);

    if ($advanced.is(":visible")) {
      $advanced.slideUp();
      $toggle.text("Show Advanced Settings");
    } else {
      $advanced.slideDown();
      $toggle.text("Hide Advanced Settings");
    }
  });

  // Usage statistics
  loadUsageStats();

  function loadUsageStats() {
    if (!$(".ai-audio-stats").length) return;

    $.ajax({
      url: ajaxurl,
      type: "POST",
      data: {
        action: "ai_audio_get_stats",
        nonce: aiAudioAdmin.nonce,
      },
      success: function (response) {
        if (response.success) {
          updateStatsDisplay(response.data);
        }
      },
    });
  }

  function updateStatsDisplay(stats) {
    $(".ai-audio-stat-total-audio").text(stats.total_audio || 0);
    $(".ai-audio-stat-total-plays").text(stats.total_plays || 0);
    $(".ai-audio-stat-avg-duration").text(stats.avg_duration || "0:00");
    $(".ai-audio-stat-popular-voice").text(stats.popular_voice || "N/A");
  }

  // Help tooltips
  $(".ai-audio-help-tooltip").each(function () {
    var $this = $(this);
    var content = $this.data("help");

    $this.on("mouseenter", function () {
      var $tooltip = $('<div class="ai-audio-tooltip">' + content + "</div>");
      $("body").append($tooltip);

      var offset = $this.offset();
      $tooltip.css({
        top: offset.top - $tooltip.outerHeight() - 10,
        left: offset.left + $this.outerWidth() / 2 - $tooltip.outerWidth() / 2,
      });
    });

    $this.on("mouseleave", function () {
      $(".ai-audio-tooltip").remove();
    });
  });
});

// Add some additional admin styles
var adminStyles = `
<style>
.ai-audio-password-wrapper {
    position: relative;
    display: inline-block;
}

.ai-audio-password-toggle {
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 12px;
    color: #666;
    cursor: pointer;
    padding: 2px 4px;
}

.ai-audio-api-status {
    margin-left: 10px;
    padding: 4px 8px;
    border-radius: 3px;
    font-size: 12px;
}

.ai-audio-api-status.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.ai-audio-api-status.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.ai-audio-color-preview {
    margin-top: 20px;
    padding: 15px;
    background: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.ai-audio-preview-player {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--ai-audio-bg, #fff);
    border: 1px solid var(--ai-audio-border, #ddd);
    border-radius: 8px;
    padding: 12px;
    color: var(--ai-audio-text, #333);
}

.ai-audio-preview-play-btn {
    width: 32px;
    height: 32px;
    background: var(--ai-audio-primary, #3b82f6);
    border: none;
    border-radius: 50%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ai-audio-preview-play-btn svg {
    width: 12px;
    height: 12px;
}

.ai-audio-preview-info {
    flex: 1;
}

.ai-audio-preview-title {
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 4px;
}

.ai-audio-preview-progress {
    height: 4px;
    background: rgba(0,0,0,0.1);
    border-radius: 2px;
    margin-bottom: 4px;
    overflow: hidden;
}

.ai-audio-preview-progress-fill {
    height: 100%;
    background: var(--ai-audio-primary, #3b82f6);
    border-radius: 2px;
    transition: width 0.3s ease;
}

.ai-audio-preview-time {
    font-size: 11px;
    opacity: 0.7;
}

.ai-audio-notification {
    position: fixed;
    top: 32px;
    right: 20px;
    background: white;
    border-left: 4px solid #00a0d2;
    box-shadow: 0 1px 1px rgba(0,0,0,0.04);
    padding: 12px 16px;
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
}

.ai-audio-notification.success {
    border-left-color: #46b450;
}

.ai-audio-notification.show {
    transform: translateX(0);
}

.ai-audio-advanced-settings {
    display: none;
    margin-top: 20px;
    padding: 15px;
    background: #fafafa;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.ai-audio-tooltip {
    position: absolute;
    background: #333;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 1000;
    max-width: 200px;
    text-align: center;
}

.ai-audio-tooltip:after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #333 transparent transparent transparent;
}
</style>
`;

document.head.insertAdjacentHTML("beforeend", adminStyles);
