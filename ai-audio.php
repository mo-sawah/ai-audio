<?php
/**
 * Plugin Name: AI Audio
 * Description: Professional Text-to-Speech plugin using Google TTS and ChatGPT APIs to generate audio from article content
 * Version: 1.0.4
 * Author: Mohamed Sawah
 * Author URI: https://sawahsolutions.com
 * Text Domain: ai-audio
 * Domain Path: /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('AI_AUDIO_VERSION', '1.0.4');
define('AI_AUDIO_PLUGIN_URL', plugin_dir_url(__FILE__));
define('AI_AUDIO_PLUGIN_PATH', plugin_dir_path(__FILE__));

class AIAudioPlugin {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
    }
    
    public function init() {
        // Hook into WordPress
        add_action('admin_menu', array($this, 'admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'admin_scripts'));
        add_action('wp_enqueue_scripts', array($this, 'frontend_scripts'));
        add_action('add_meta_boxes', array($this, 'add_meta_boxes'));
        add_action('save_post', array($this, 'save_post_meta'));
        add_filter('the_content', array($this, 'add_audio_player'));
        add_action('wp_ajax_generate_audio', array($this, 'generate_audio'));
        add_action('wp_ajax_nopriv_generate_audio', array($this, 'generate_audio'));
        
        // Register settings
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    public function admin_menu() {
        add_options_page(
            'AI Audio Settings',
            'AI Audio',
            'manage_options',
            'ai-audio-settings',
            array($this, 'settings_page')
        );
    }
    
    public function register_settings() {
        register_setting('ai_audio_settings', 'ai_audio_options');
    }
    
    public function admin_scripts($hook) {
        if ($hook === 'settings_page_ai-audio-settings' || $hook === 'post.php' || $hook === 'post-new.php') {
            wp_enqueue_script('ai-audio-admin', AI_AUDIO_PLUGIN_URL . 'assets/admin.js', array('jquery'), AI_AUDIO_VERSION, true);
            wp_enqueue_style('ai-audio-admin', AI_AUDIO_PLUGIN_URL . 'assets/admin.css', array(), AI_AUDIO_VERSION);
        }
    }
    
    public function test_ajax() {
        // Add detailed debugging
        error_log('=== AI Audio Test AJAX Handler Called ===');
        error_log('Request method: ' . $_SERVER['REQUEST_METHOD']);
        error_log('Is AJAX: ' . (defined('DOING_AJAX') && DOING_AJAX ? 'YES' : 'NO'));
        error_log('POST data: ' . print_r($_POST, true));
        error_log('Action received: ' . ($_POST['action'] ?? 'NONE'));
        error_log('Nonce received: ' . ($_POST['nonce'] ?? 'NONE'));
        
        $nonce_check = isset($_POST['nonce']) ? wp_verify_nonce($_POST['nonce'], 'ai_audio_nonce') : false;
        error_log('Nonce verification: ' . ($nonce_check ? 'VALID' : 'INVALID'));
        
        // Send response without nonce check for testing
        $response = array(
            'message' => 'AJAX handler is working!',
            'timestamp' => current_time('mysql'),
            'user_id' => get_current_user_id(),
            'nonce_received' => $_POST['nonce'] ?? 'none',
            'expected_nonce' => wp_create_nonce('ai_audio_nonce'),
            'nonce_valid' => $nonce_check,
            'doing_ajax' => defined('DOING_AJAX') && DOING_AJAX,
            'request_method' => $_SERVER['REQUEST_METHOD'],
            'handler_called' => true
        );
        
        error_log('Sending response: ' . print_r($response, true));
        
        wp_send_json_success($response);
    }
    
    public function frontend_scripts() {
        wp_enqueue_script('ai-audio-player', AI_AUDIO_PLUGIN_URL . 'assets/player.js', array('jquery'), AI_AUDIO_VERSION, true);
        wp_enqueue_style('ai-audio-player', AI_AUDIO_PLUGIN_URL . 'assets/player.css', array(), AI_AUDIO_VERSION);
        
        wp_localize_script('ai-audio-player', 'aiAudio', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('ai_audio_nonce')
        ));
    }
    
    public function add_meta_boxes() {
        add_meta_box(
            'ai-audio-settings',
            'AI Audio Settings',
            array($this, 'meta_box_callback'),
            'post',
            'side',
            'high'
        );
    }
    
    public function meta_box_callback($post) {
        wp_nonce_field('ai_audio_meta_nonce', 'ai_audio_meta_nonce');
        
        $enabled = get_post_meta($post->ID, '_ai_audio_enabled', true);
        $ai_service = get_post_meta($post->ID, '_ai_audio_service', true);
        $voice = get_post_meta($post->ID, '_ai_audio_voice', true);
        $theme = get_post_meta($post->ID, '_ai_audio_theme', true);
        
        $options = get_option('ai_audio_options', array());
        ?>
        <div class="ai-audio-meta-box">
            <p>
                <label>
                    <input type="checkbox" name="ai_audio_enabled" value="1" <?php checked($enabled, '1'); ?>>
                    Enable AI Audio for this post
                </label>
            </p>
            
            <p>
                <label for="ai_audio_service">AI Service:</label>
                <select name="ai_audio_service" id="ai_audio_service">
                    <option value="">Use Global Setting</option>
                    <option value="google" <?php selected($ai_service, 'google'); ?>>Google TTS</option>
                    <option value="chatgpt" <?php selected($ai_service, 'chatgpt'); ?>>ChatGPT</option>
                </select>
            </p>
            
            <p>
                <label for="ai_audio_voice">Voice:</label>
                <select name="ai_audio_voice" id="ai_audio_voice">
                    <option value="">Use Global Setting</option>
                    <option value="en-US-Wavenet-D" <?php selected($voice, 'en-US-Wavenet-D'); ?>>Male Voice 1</option>
                    <option value="en-US-Wavenet-F" <?php selected($voice, 'en-US-Wavenet-F'); ?>>Female Voice 1</option>
                    <option value="en-US-Wavenet-A" <?php selected($voice, 'en-US-Wavenet-A'); ?>>Male Voice 2</option>
                    <option value="en-US-Wavenet-C" <?php selected($voice, 'en-US-Wavenet-C'); ?>>Female Voice 2</option>
                </select>
            </p>
            
            <p>
                <label for="ai_audio_theme">Theme:</label>
                <select name="ai_audio_theme" id="ai_audio_theme">
                    <option value="">Use Global Setting</option>
                    <option value="light" <?php selected($theme, 'light'); ?>>Light</option>
                    <option value="dark" <?php selected($theme, 'dark'); ?>>Dark</option>
                </select>
            </p>
        </div>
        <?php
    }
    
    public function save_post_meta($post_id) {
        if (!isset($_POST['ai_audio_meta_nonce']) || !wp_verify_nonce($_POST['ai_audio_meta_nonce'], 'ai_audio_meta_nonce')) {
            return;
        }
        
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }
        
        update_post_meta($post_id, '_ai_audio_enabled', isset($_POST['ai_audio_enabled']) ? '1' : '0');
        update_post_meta($post_id, '_ai_audio_service', sanitize_text_field($_POST['ai_audio_service']));
        update_post_meta($post_id, '_ai_audio_voice', sanitize_text_field($_POST['ai_audio_voice']));
        update_post_meta($post_id, '_ai_audio_theme', sanitize_text_field($_POST['ai_audio_theme']));
    }
    
    public function add_audio_player($content) {
        if (!is_single() || !is_main_query()) {
            return $content;
        }
        
        global $post;
        $options = get_option('ai_audio_options', array());
        
        // Check if enabled globally or for this specific post
        $global_enabled = isset($options['always_enable']) && $options['always_enable'];
        $post_enabled = get_post_meta($post->ID, '_ai_audio_enabled', true);
        
        if (!$global_enabled && !$post_enabled) {
            return $content;
        }
        
        // Get settings (post-specific overrides global)
        $ai_service = get_post_meta($post->ID, '_ai_audio_service', true) ?: ($options['default_ai'] ?? 'google');
        $voice = get_post_meta($post->ID, '_ai_audio_voice', true) ?: ($options['default_voice'] ?? 'en-US-Wavenet-D');
        $theme = get_post_meta($post->ID, '_ai_audio_theme', true) ?: ($options['default_theme'] ?? 'light');
        
        // Generate audio player HTML
        $player_html = $this->generate_player_html($post->ID, $ai_service, $voice, $theme);
        
        return $player_html . $content;
    }
    
    private function generate_player_html($post_id, $ai_service, $voice, $theme) {
        $options = get_option('ai_audio_options', array());
        
        // Get custom colors
        $primary_color = $options['primary_color'] ?? '#3B82F6';
        $background_color = $theme === 'dark' ? '#111827' : '#FFFFFF';
        $text_color = $theme === 'dark' ? '#FFFFFF' : '#111827';
        $border_color = $theme === 'dark' ? '#374151' : '#E5E7EB';
        
        ob_start();
        ?>
        <div class="ai-audio-player" 
             data-post-id="<?php echo esc_attr($post_id); ?>"
             data-ai-service="<?php echo esc_attr($ai_service); ?>"
             data-voice="<?php echo esc_attr($voice); ?>"
             data-theme="<?php echo esc_attr($theme); ?>"
             style="--ai-audio-primary: <?php echo esc_attr($primary_color); ?>; --ai-audio-bg: <?php echo esc_attr($background_color); ?>; --ai-audio-text: <?php echo esc_attr($text_color); ?>; --ai-audio-border: <?php echo esc_attr($border_color); ?>;">
            
            <div class="ai-audio-container">
                <div class="ai-audio-main">
                    <!-- Play/Pause Button -->
                    <button class="ai-audio-play-btn" data-state="play">
                        <svg class="ai-audio-icon ai-audio-play-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                        <svg class="ai-audio-icon ai-audio-pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                        </svg>
                        <svg class="ai-audio-icon ai-audio-loading-icon" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                            <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z">
                                <animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/>
                            </path>
                        </svg>
                    </button>
                    
                    <!-- Progress Section -->
                    <div class="ai-audio-progress-section">
                        <div class="ai-audio-info">
                            <span class="ai-audio-title">Listen to Article</span>
                            <span class="ai-audio-time">0:00 / 0:00</span>
                        </div>
                        <div class="ai-audio-progress-container">
                            <div class="ai-audio-progress-bar">
                                <div class="ai-audio-progress-fill"></div>
                                <div class="ai-audio-progress-handle"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Controls -->
                    <div class="ai-audio-controls">
                        <button class="ai-audio-skip-btn" data-skip="-10">
                            <svg class="ai-audio-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
                            </svg>
                        </button>
                        
                        <button class="ai-audio-skip-btn" data-skip="10">
                            <svg class="ai-audio-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
                            </svg>
                        </button>
                        
                        <div class="ai-audio-volume">
                            <svg class="ai-audio-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                            </svg>
                            <div class="ai-audio-volume-slider">
                                <div class="ai-audio-volume-fill"></div>
                            </div>
                        </div>
                        
                        <select class="ai-audio-speed">
                            <option value="0.5">0.5x</option>
                            <option value="0.75">0.75x</option>
                            <option value="1" selected>1x</option>
                            <option value="1.25">1.25x</option>
                            <option value="1.5">1.5x</option>
                            <option value="2">2x</option>
                        </select>
                        
                        <button class="ai-audio-settings-btn">
                            <svg class="ai-audio-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97L2.46 14.6c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="ai-audio-status" style="display: none;">
                    <div class="ai-audio-status-indicator"></div>
                    <span class="ai-audio-status-text">Ready to play</span>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    public function generate_audio() {
        check_ajax_referer('ai_audio_nonce', 'nonce');
        
        $post_id = intval($_POST['post_id']);
        $ai_service = sanitize_text_field($_POST['ai_service']);
        $voice = sanitize_text_field($_POST['voice']);
        
        $post = get_post($post_id);
        if (!$post) {
            wp_die('Invalid post ID');
        }
        
        $content = strip_tags($post->post_content);
        $content = wp_trim_words($content, 500); // Limit for demo
        
        $options = get_option('ai_audio_options', array());
        
        if ($ai_service === 'google') {
            $audio_url = $this->generate_google_tts($content, $voice, $options['google_api_key'] ?? '');
        } else {
            $audio_url = $this->generate_chatgpt_tts($content, $voice, $options['chatgpt_api_key'] ?? '');
        }
        
        if ($audio_url) {
            wp_send_json_success(array('audio_url' => $audio_url));
        } else {
            wp_send_json_error('Failed to generate audio');
        }
    }
    
    private function generate_google_tts($text, $voice, $api_key) {
        // Implement Google TTS API call
        // This is a simplified version - you'll need to implement the actual API call
        return 'https://example.com/generated-audio.mp3';
    }
    
    private function generate_chatgpt_tts($text, $voice, $api_key) {
        // Implement ChatGPT TTS API call
        // This is a simplified version - you'll need to implement the actual API call
        return 'https://example.com/generated-audio.mp3';
    }
    
    public function settings_page() {
        if (isset($_POST['submit'])) {
            $options = array(
                'google_api_key' => sanitize_text_field($_POST['google_api_key']),
                'chatgpt_api_key' => sanitize_text_field($_POST['chatgpt_api_key']),
                'always_enable' => isset($_POST['always_enable']),
                'default_ai' => sanitize_text_field($_POST['default_ai']),
                'default_voice' => sanitize_text_field($_POST['default_voice']),
                'default_theme' => sanitize_text_field($_POST['default_theme']),
                'primary_color' => sanitize_hex_color($_POST['primary_color']),
                'text_color' => sanitize_hex_color($_POST['text_color']),
                'background_color' => sanitize_hex_color($_POST['background_color']),
                'player_text' => sanitize_text_field($_POST['player_text'])
            );
            
            update_option('ai_audio_options', $options);
            echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
        }
        
        $options = get_option('ai_audio_options', array());
        ?>
        <div class="wrap ai-audio-settings">
            <h1>AI Audio Settings</h1>
            
            <form method="post" action="">
                <div class="ai-audio-tabs">
                    <nav class="ai-audio-tab-nav">
                        <button type="button" class="ai-audio-tab-btn active" data-tab="api">API Settings</button>
                        <button type="button" class="ai-audio-tab-btn" data-tab="general">General</button>
                        <button type="button" class="ai-audio-tab-btn" data-tab="appearance">Appearance</button>
                    </nav>
                    
                    <div class="ai-audio-tab-content">
                        <!-- API Settings Tab -->
                        <div class="ai-audio-tab-panel active" data-tab="api">
                            <div class="ai-audio-card">
                                <h3>Google TTS API</h3>
                                <table class="form-table">
                                    <tr>
                                        <th scope="row">API Key</th>
                                        <td>
                                            <input type="password" name="google_api_key" value="<?php echo esc_attr($options['google_api_key'] ?? ''); ?>" class="regular-text" />
                                            <p class="description">Enter your Google Cloud Text-to-Speech API key</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div class="ai-audio-card">
                                <h3>ChatGPT API</h3>
                                <table class="form-table">
                                    <tr>
                                        <th scope="row">API Key</th>
                                        <td>
                                            <input type="password" name="chatgpt_api_key" value="<?php echo esc_attr($options['chatgpt_api_key'] ?? ''); ?>" class="regular-text" />
                                            <p class="description">Enter your OpenAI API key</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                        
                        <!-- General Settings Tab -->
                        <div class="ai-audio-tab-panel" data-tab="general">
                            <div class="ai-audio-card">
                                <h3>Default Settings</h3>
                                <table class="form-table">
                                    <tr>
                                        <th scope="row">Always Enable</th>
                                        <td>
                                            <label>
                                                <input type="checkbox" name="always_enable" value="1" <?php checked(isset($options['always_enable']) && $options['always_enable']); ?> />
                                                Automatically enable AI Audio on all posts
                                            </label>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Default AI Service</th>
                                        <td>
                                            <select name="default_ai">
                                                <option value="google" <?php selected($options['default_ai'] ?? '', 'google'); ?>>Google TTS</option>
                                                <option value="chatgpt" <?php selected($options['default_ai'] ?? '', 'chatgpt'); ?>>ChatGPT</option>
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Default Voice</th>
                                        <td>
                                            <select name="default_voice">
                                                <option value="en-US-Wavenet-D" <?php selected($options['default_voice'] ?? '', 'en-US-Wavenet-D'); ?>>Male Voice 1</option>
                                                <option value="en-US-Wavenet-F" <?php selected($options['default_voice'] ?? '', 'en-US-Wavenet-F'); ?>>Female Voice 1</option>
                                                <option value="en-US-Wavenet-A" <?php selected($options['default_voice'] ?? '', 'en-US-Wavenet-A'); ?>>Male Voice 2</option>
                                                <option value="en-US-Wavenet-C" <?php selected($options['default_voice'] ?? '', 'en-US-Wavenet-C'); ?>>Female Voice 2</option>
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Default Theme</th>
                                        <td>
                                            <select name="default_theme">
                                                <option value="light" <?php selected($options['default_theme'] ?? '', 'light'); ?>>Light</option>
                                                <option value="dark" <?php selected($options['default_theme'] ?? '', 'dark'); ?>>Dark</option>
                                            </select>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                        
                        <!-- Appearance Tab -->
                        <div class="ai-audio-tab-panel" data-tab="appearance">
                            <div class="ai-audio-card">
                                <h3>Color Customization</h3>
                                <table class="form-table">
                                    <tr>
                                        <th scope="row">Primary Color</th>
                                        <td>
                                            <input type="color" name="primary_color" value="<?php echo esc_attr($options['primary_color'] ?? '#3B82F6'); ?>" />
                                            <p class="description">Color for buttons and progress bar</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Text Color (Light Mode)</th>
                                        <td>
                                            <input type="color" name="text_color" value="<?php echo esc_attr($options['text_color'] ?? '#111827'); ?>" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Background Color (Light Mode)</th>
                                        <td>
                                            <input type="color" name="background_color" value="<?php echo esc_attr($options['background_color'] ?? '#FFFFFF'); ?>" />
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div class="ai-audio-card">
                                <h3>Text Customization</h3>
                                <table class="form-table">
                                    <tr>
                                        <th scope="row">Player Text</th>
                                        <td>
                                            <input type="text" name="player_text" value="<?php echo esc_attr($options['player_text'] ?? 'Listen to Article'); ?>" class="regular-text" />
                                            <p class="description">Text displayed in the audio player</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
}

// Initialize the plugin
new AIAudioPlugin();