<?php
/**
 * YITH System Status Class
 * handle System Status panel
 *
 * @class   YITH_System_Status
 * @package YITH\PluginFramework\Classes
 */

defined( 'ABSPATH' ) || exit; // Exit if accessed directly.

if ( ! class_exists( 'YITH_System_Status' ) ) {
	/**
	 * YITH_System_Status class.
	 *
	 * @author     YITH <plugins@yithemes.com>
	 */
	class YITH_System_Status {
		/**
		 * The page slug
		 *
		 * @var string
		 */
		protected $page = 'yith_system_info';

		/**
		 * Plugins requirements list
		 *
		 * @var array
		 */
		protected $plugins_requirements = array();

		/**
		 * Plugins tables list
		 *
		 * @var array
		 */
		protected $plugins_tables = array();

		/**
		 * Requirements labels
		 *
		 * @var array
		 */
		public $requirement_labels = array();

		/**
		 * Recommended memory amount 134217728 = 128M
		 *
		 * @var integer
		 */
		private $recommended_memory = 134217728;

		/**
		 * Single instance of the class
		 *
		 * @since 1.0.0
		 * @var YITH_System_Status
		 */
		protected static $instance = null;

		/**
		 * Main plugin Instance
		 *
		 * @return YITH_System_Status
		 * @since  1.0.0
		 */
		public static function instance() {
			if ( is_null( self::$instance ) ) {
				self::$instance = new self();
			}

			return self::$instance;
		}

		/**
		 * Constructor
		 *
		 * @return void
		 * @since  1.0.0
		 */
		public function __construct() {

			if ( ! is_admin() ) {
				return;
			}

			/**
			 * Add to prevent trigger admin_init called directly
			 * wp-admin/admin-post.php?page=yith_system_info
			 */
			if ( ! is_user_logged_in() ) {
				return;
			}
			add_filter( 'admin_body_class', array( $this, 'add_body_class' ) );
			add_action( 'admin_menu', array( $this, 'add_submenu_page' ), 99 );
			add_action( 'admin_init', array( $this, 'check_system_status' ) );
			add_action( 'admin_notices', array( $this, 'activate_system_notice' ), 15 );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ), 20 );
			add_action( 'init', array( $this, 'set_requirements_labels' ) );
			add_action( 'wp_ajax_yith_create_log_file', array( $this, 'create_log_file' ) );
		}

		/**
		 * Add body classes in Panel pages
		 *
		 * @param string $classes Body classes.
		 *
		 * @return string
		 * @since  1.0.0
		 */
		public function add_body_class( $classes ) {
			global $pagenow;

			if ( ( 'admin.php' === $pagenow && strpos( get_current_screen()->id, $this->page ) !== false ) ) {
				$to_add = array( 'yith-plugin-fw-panel', 'yith-plugin-fw-panel--version-2' );
				foreach ( $to_add as $class_to_add ) {
					$classes = ! substr_count( $classes, " $class_to_add " ) ? $classes . " $class_to_add " : $classes;
				}
			}

			return $classes;
		}

		/**
		 * Set requirements labels
		 *
		 * @return void
		 * @since  1.0.0
		 */
		public function set_requirements_labels() {

			$this->requirement_labels = array(
				'min_wp_version'    => esc_html__( 'WordPress Version', 'yith-plugin-fw' ),
				'min_wc_version'    => esc_html__( 'WooCommerce Version', 'yith-plugin-fw' ),
				'wp_memory_limit'   => esc_html__( 'Available Memory', 'yith-plugin-fw' ),
				'min_php_version'   => esc_html__( 'PHP Version', 'yith-plugin-fw' ),
				'min_tls_version'   => esc_html__( 'TLS Version', 'yith-plugin-fw' ),
				'wp_cron_enabled'   => esc_html__( 'WordPress Cron', 'yith-plugin-fw' ),
				'simplexml_enabled' => esc_html__( 'SimpleXML', 'yith-plugin-fw' ),
				'mbstring_enabled'  => esc_html__( 'MultiByte String', 'yith-plugin-fw' ),
				'imagick_version'   => esc_html__( 'ImageMagick Version', 'yith-plugin-fw' ),
				'gd_enabled'        => esc_html__( 'GD Library', 'yith-plugin-fw' ),
				'iconv_enabled'     => esc_html__( 'Iconv Module', 'yith-plugin-fw' ),
				'opcache_enabled'   => esc_html__( 'OPCache Save Comments', 'yith-plugin-fw' ),
				'url_fopen_enabled' => esc_html__( 'URL FOpen', 'yith-plugin-fw' ),
			);
		}

		/**
		 * Add "System Information" submenu page under YITH Plugins
		 *
		 * @return void
		 * @since  1.0.0
		 */
		public function add_submenu_page() {
			$system_info  = get_option( 'yith_system_info', array() );
			$error_notice = ( isset( $system_info['errors'] ) && true === $system_info['errors'] ? ' <span class="yith-system-info-menu update-plugins">!</span>' : '' );
			$settings     = array(
				'parent_page' => 'yith_plugin_panel',
				'page_title'  => esc_html__( 'System Status', 'yith-plugin-fw' ),
				'menu_title'  => esc_html__( 'System Status', 'yith-plugin-fw' ) . $error_notice,
				'capability'  => 'manage_options',
				'page'        => $this->page,
			);

			add_submenu_page(
				$settings['parent_page'],
				$settings['page_title'],
				$settings['menu_title'],
				$settings['capability'],
				$settings['page'],
				array( $this, 'show_information_panel' )
			);
		}

		/**
		 * Add "System Information" page template under YITH Plugins
		 *
		 * @return void
		 * @since  1.0.0
		 */
		public function show_information_panel() {
			$path = defined( 'YIT_CORE_PLUGIN_PATH' ) ? YIT_CORE_PLUGIN_PATH : get_template_directory() . '/core/plugin-fw/';
			$tabs = array(
				'main'      => array(
					'title' => esc_html__( 'System Status', 'yith-plugin-fw' ),
					'icon'  => '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"></path></svg>',
				),
				'php-info'  => array(
					'title' => esc_html__( 'PHPInfo', 'yith-plugin-fw' ),
					'icon'  => '<svg fill="currentColor" data-slot="icon" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>PHP</title><path d="M7.01 10.207h-.944l-.515 2.648h.838c.556 0 .97-.105 1.242-.314.272-.21.455-.559.55-1.049.092-.47.05-.802-.124-.995-.175-.193-.523-.29-1.047-.29zM12 5.688C5.373 5.688 0 8.514 0 12s5.373 6.313 12 6.313S24 15.486 24 12c0-3.486-5.373-6.312-12-6.312zm-3.26 7.451c-.261.25-.575.438-.917.551-.336.108-.765.164-1.285.164H5.357l-.327 1.681H3.652l1.23-6.326h2.65c.797 0 1.378.209 1.744.628.366.418.476 1.002.33 1.752a2.836 2.836 0 0 1-.305.847c-.143.255-.33.49-.561.703zm4.024.715l.543-2.799c.063-.318.039-.536-.068-.651-.107-.116-.336-.174-.687-.174H11.46l-.704 3.625H9.388l1.23-6.327h1.367l-.327 1.682h1.218c.767 0 1.295.134 1.586.401s.378.7.263 1.299l-.572 2.944h-1.389zm7.597-2.265a2.782 2.782 0 0 1-.305.847c-.143.255-.33.49-.561.703a2.44 2.44 0 0 1-.917.551c-.336.108-.765.164-1.286.164h-1.18l-.327 1.682h-1.378l1.23-6.326h2.649c.797 0 1.378.209 1.744.628.366.417.477 1.001.331 1.751zM17.766 10.207h-.943l-.516 2.648h.838c.557 0 .971-.105 1.242-.314.272-.21.455-.559.551-1.049.092-.47.049-.802-.125-.995s-.524-.29-1.047-.29z"/></svg>',
				),
				'db-info'   => array(
					'title' => esc_html__( 'Database', 'yith-plugin-fw' ),
					'icon'  => '<svg data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 0 0-.12-1.03l-2.268-9.64a3.375 3.375 0 0 0-3.285-2.602H7.923a3.375 3.375 0 0 0-3.285 2.602l-2.268 9.64a4.5 4.5 0 0 0-.12 1.03v.228m19.5 0a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3m19.5 0a3 3 0 0 0-3-3H5.25a3 3 0 0 0-3 3m16.5 0h.008v.008h-.008v-.008Zm-3 0h.008v.008h-.008v-.008Z"></path></svg>',
				),
				'error-log' => array(
					'title' => esc_html__( 'Log Files', 'yith-plugin-fw' ),
					'icon'  => '<svg data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"></path></svg>',
				),
			);
			require_once $path . '/templates/sysinfo/system-information-panel.php';
		}

		/**
		 * Perform system status check
		 *
		 * @return void
		 * @since  1.0.0
		 */
		public function check_system_status() {

			if ( '' === get_option( 'yith_system_info' ) || ( isset( $_GET['page'] ) && $_GET['page'] === $this->page ) ) { //phpcs:ignore WordPress.Security.NonceVerification.Recommended

				$this->add_requirements(
					esc_html__( 'YITH Plugins', 'yith-plugin-fw' ),
					array(
						'min_wp_version'  => '6.2',
						'min_wc_version'  => '8.5',
						'min_php_version' => '7.4',
					)
				);
				$this->add_requirements(
					esc_html__( 'WooCommerce', 'yith-plugin-fw' ),
					array(
						'wp_memory_limit' => '64M',
					)
				);

				$system_info   = $this->get_system_info();
				$check_results = array();
				$table_check   = array();
				$errors        = 0;

				foreach ( $system_info as $key => $value ) {
					$check_results[ $key ] = array( 'value' => $value );

					if ( isset( $this->plugins_requirements[ $key ] ) ) {
						foreach ( $this->plugins_requirements[ $key ] as $plugin_name => $required_value ) {
							switch ( $key ) {
								case 'wp_cron_enabled':
								case 'mbstring_enabled':
								case 'simplexml_enabled':
								case 'gd_enabled':
								case 'iconv_enabled':
								case 'url_fopen_enabled':
								case 'opcache_enabled':
									if ( ! $value ) {
										$check_results[ $key ]['errors'][ $plugin_name ] = $required_value;
										++$errors;
									}
									break;
								case 'wp_memory_limit':
									$required_memory = $this->memory_size_to_num( $required_value );

									if ( $required_memory > $value ) {
										$check_results[ $key ]['errors'][ $plugin_name ] = $required_value;
										++$errors;

									} elseif ( $this->recommended_memory > $value && $value > $required_value ) {
										$check_results[ $key ]['warnings'] = 'yes';
									}
									break;
								default:
									if ( 'imagick_version' === $key ) {
										if ( ! version_compare( $value, $required_value, '>=' ) ) {
											$check_results[ $key ]['errors'][ $plugin_name ] = $required_value;
											++$errors;
										}
									} else {
										if ( 'n/a' !== $value ) {
											if ( ! version_compare( $value, $required_value, '>=' ) ) {
												$check_results[ $key ]['errors'][ $plugin_name ] = $required_value;
												++$errors;
											}
										} else {
											if ( 'min_wc_version' !== $key ) {
												$check_results[ $key ]['warnings'][ $plugin_name ] = $required_value;
											}
										}
									}
							}
						}
					}
				}

				update_option(
					'yith_system_info',
					array(
						'system_info' => $check_results,
						'errors'      => $errors > 0,
						'tables'      => $table_check,
					)
				);

			}
		}

		/**
		 * Handle plugin requirements
		 *
		 * @param string $plugin_name  The name of the plugin.
		 * @param array  $requirements Array of plugin requirements.
		 *
		 * @return void
		 * @since  1.0.0
		 */
		public function add_requirements( $plugin_name, $requirements = array() ) {
			if ( ! empty( $requirements ) ) {
				$allowed_requirements = array_keys( $this->requirement_labels );

				foreach ( $requirements as $requirement => $value ) {
					if ( in_array( $requirement, $allowed_requirements, true ) ) {
						$this->plugins_requirements[ $requirement ][ $plugin_name ] = $value;
					}
				}
			}
		}

		/**
		 * Manages notice dismissing
		 *
		 * @return  void
		 * @since   1.0.0
		 */
		public function enqueue_scripts() {
			$script_path = defined( 'YIT_CORE_PLUGIN_URL' ) ? YIT_CORE_PLUGIN_URL : get_template_directory_uri() . '/core/plugin-fw';
			wp_register_script( 'yith-system-info', yit_load_js_file( $script_path . '/assets/js/yith-system-info.js' ), array( 'jquery' ), '1.0.0', true );

			if ( isset( $_GET['page'] ) && 'yith_system_info' === $_GET['page'] ) { //phpcs:ignore WordPress.Security.NonceVerification.Recommended
				wp_enqueue_style( 'yith-plugin-panel' );
				wp_enqueue_style( 'yith-plugin-fw-fields' );
				wp_enqueue_script( 'yith-system-info' );

				$params = array(
					'ajax_url' => admin_url( 'admin-ajax.php' ),
				);

				wp_localize_script( 'yith-system-info', 'yith_sysinfo', $params );

			}
		}

		/**
		 * Show system notice
		 *
		 * @return  void
		 * @since   1.0.0
		 */
		public function activate_system_notice() {

			$system_info = get_option( 'yith_system_info', '' );

			if ( ( isset( $_GET['page'] ) && $_GET['page'] === $this->page ) || ( ! empty( $_COOKIE['hide_yith_system_alert'] ) && 'yes' === $_COOKIE['hide_yith_system_alert'] ) || ( '' === $system_info ) || ( '' !== $system_info && false === $system_info['errors'] ) ) { //phpcs:ignore WordPress.Security.NonceVerification.Recommended
				return;
			}

			$show_notice = true;

			if ( true === $show_notice ) {
				wp_enqueue_script( 'yith-system-info' );
				?>
				<div id="yith-system-alert" class="notice notice-error is-dismissible" style="position: relative;">
					<p>
						<span class="yith-logo"><img src="<?php echo esc_attr( yith_plugin_fw_get_default_logo() ); ?>"/></span>
						<b>
							<?php esc_html_e( 'Warning!', 'yith-plugin-fw' ); ?>
						</b><br/>
						<?php
						/* translators: %1$s open link tag, %2$s open link tag*/
						printf( esc_html__( 'The system check has detected some compatibility issues on your installation.%1$sClick here%2$s to know more', 'yith-plugin-fw' ), '<a href="' . esc_url( add_query_arg( array( 'page' => $this->page ), admin_url( 'admin.php' ) ) ) . '">', '</a>' );
						?>
					</p>
					<span class="notice-dismiss"></span>

				</div>
				<?php
			}
		}

		/**
		 * Get system information
		 *
		 * @return  array
		 * @since   1.0.0
		 */
		public function get_system_info() {
			$tls             = $this->get_tls_version();
			$imagick_version = 'n/a';

			// Get PHP version.
			preg_match( '#^\d+(\.\d+)*#', PHP_VERSION, $match );
			$php_version = $match[0];

			// WP memory limit.
			$wp_memory_limit = $this->memory_size_to_num( WP_MEMORY_LIMIT );
			if ( function_exists( 'memory_get_usage' ) ) {
				$wp_memory_limit = max( $wp_memory_limit, $this->memory_size_to_num( @ini_get( 'memory_limit' ) ) ); //phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			}

			if ( class_exists( 'Imagick' ) && is_callable( array( 'Imagick', 'getVersion' ) ) ) {
				preg_match( '/([0-9]+\.[0-9]+\.[0-9]+)/', Imagick::getVersion()['versionString'], $imatch );
				$imagick_version = $imatch[0];
			}

			return apply_filters(
				'yith_system_additional_check',
				array(
					'min_wp_version'    => get_bloginfo( 'version' ),
					'min_wc_version'    => function_exists( 'WC' ) ? WC()->version : 'n/a',
					'wp_memory_limit'   => $wp_memory_limit,
					'min_php_version'   => $php_version,
					'min_tls_version'   => $tls,
					'imagick_version'   => $imagick_version,
					'wp_cron_enabled'   => ( ! ( defined( 'DISABLE_WP_CRON' ) && DISABLE_WP_CRON ) || apply_filters( 'yith_system_status_server_cron', false ) ),
					'mbstring_enabled'  => extension_loaded( 'mbstring' ),
					'simplexml_enabled' => extension_loaded( 'simplexml' ),
					'gd_enabled'        => extension_loaded( 'gd' ) && function_exists( 'gd_info' ),
					'iconv_enabled'     => extension_loaded( 'iconv' ),
					'opcache_enabled'   => ini_get( 'opcache.save_comments' ),
					'url_fopen_enabled' => ini_get( 'allow_url_fopen' ),
				)
			);
		}

		/**
		 * Get log file
		 *
		 * @return  void
		 * @since   1.0.0
		 */
		public function create_log_file() {
			if ( ! current_user_can( 'manage_options' ) || ! isset( $_POST['nonce'], $_POST['file'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'yith-export-log' ) ) {
				wp_send_json( array( 'file' => false ) );
				exit;
			}

			try {

				global $wp_filesystem;

				if ( empty( $wp_filesystem ) ) {
					require_once ABSPATH . '/wp-admin/includes/file.php';
					WP_Filesystem();
				}

				$download_file  = false;
				$file_content   = '';
				$requested_file = sanitize_text_field( wp_unslash( $_POST['file'] ) );

				switch ( $requested_file ) {
					case 'error_log':
						$file_content = $wp_filesystem->get_contents( ABSPATH . 'error_log' );
						break;
					case 'debug.log':
						$file_content = $wp_filesystem->get_contents( WP_CONTENT_DIR . '/debug.log' );
						break;
				}

				if ( '' !== $file_content ) {
					$domain        = str_replace( array( 'http://', 'https://' ), '', network_site_url() );
					$hash          = substr( wp_hash( $domain ), 0, 16 );
					$file          = wp_upload_dir()['basedir'] . '/log-' . $hash . '.txt';
					$download_file = wp_upload_dir()['baseurl'] . '/log-' . $hash . '.txt';

					$r = $wp_filesystem->put_contents( $file, $file_content );
				}

				wp_send_json( array( 'file' => $download_file ) );
			} catch ( Exception $e ) {
				wp_send_json( array( 'file' => false ) );
			}
		}

		/**
		 * Convert size into number
		 *
		 * @param string $memory_size Memory size to convert.
		 *
		 * @return  integer
		 * @since   1.0.0
		 */
		public function memory_size_to_num( $memory_size ) {
			$unit = strtoupper( substr( $memory_size, -1 ) );
			$size = substr( $memory_size, 0, -1 );

			$multiplier = array(
				'P' => 5,
				'T' => 4,
				'G' => 3,
				'M' => 2,
				'K' => 1,
			);

			if ( isset( $multiplier[ $unit ] ) ) {
				for ( $i = 1; $i <= $multiplier[ $unit ]; $i++ ) {
					$size *= 1024;
				}
			}

			return $size;
		}

		/**
		 * Format requirement value
		 *
		 * @param string $key   Requirement Key.
		 * @param mixed  $value Requirement value.
		 * @param string $icon  Icon to display.
		 *
		 * @return  string
		 * @since   1.0.0
		 */
		public function format_requirement_value( $key, $value, $icon ) {

			if ( strpos( $key, '_enabled' ) !== false ) {
				$output = esc_attr( $value ) ? esc_html__( 'Enabled', 'yith-plugin-fw' ) : esc_html__( 'Disabled', 'yith-plugin-fw' );
			} elseif ( 'wp_memory_limit' === $key ) {
				$output = esc_html( size_format( $value ) );
			} else {
				$output = ( 'n/a' === $value ) ? esc_html__( 'N/A', 'yith-plugin-fw' ) : esc_attr( $value );
			}

			return '<span class="dashicons dashicons-' . $icon . '"></span> ' . $output;
		}

		/**
		 * Print error messages
		 *
		 * @param string $key   Requirement key.
		 * @param array  $item  Requirement item.
		 * @param string $label Requirement label.
		 *
		 * @return  string
		 * @since   1.0.0
		 */
		public function print_error_messages( $key, $item, $label ) {
			$errors = array();
			foreach ( $item['errors'] as $plugin => $requirement ) {
				if ( strpos( $key, '_enabled' ) !== false ) {
					/* translators: %1$s plugin name, %2$s requirement name */
					$errors[] = sprintf( esc_html__( '%1$s needs %2$s enabled', 'yith-plugin-fw' ), '<b>' . esc_attr( $plugin ) . '</b>', '<b>' . esc_attr( $label ) . '</b>' );
				} elseif ( 'wp_memory_limit' === $key ) {
					/* translators: %1$s plugin name, %2$s required memory amount */
					$errors[] = sprintf( esc_html__( '%1$s needs at least %2$s of available memory', 'yith-plugin-fw' ), '<b>' . esc_attr( $plugin ) . '</b>', '<b>' . esc_html( size_format( $this->memory_size_to_num( $requirement ) ) ) . '</b>' );
				} else {
					/* translators: %1$s plugin name, %2$s version number */
					$errors[] = sprintf( esc_html__( '%1$s needs at least %2$s version', 'yith-plugin-fw' ), '<b>' . esc_attr( $plugin ) . '</b>', '<b>' . esc_attr( $requirement ) . '</b>' );
				}
			}
			switch ( $key ) {
				case 'min_wp_version':
				case 'min_wc_version':
					$solution = esc_html__( 'Update it to the latest version in order to benefit of all new features and security updates.', 'yith-plugin-fw' );
					break;
				case 'min_php_version':
				case 'min_tls_version':
					$solution = esc_html__( 'Contact your hosting company in order to update it.', 'yith-plugin-fw' );
					break;
				case 'imagick_version':
					if ( 'n/a' === $item['value'] ) {
						$solution = esc_html__( 'Contact your hosting company in order to install it.', 'yith-plugin-fw' );
					} else {
						$solution = esc_html__( 'Contact your hosting company in order to update it.', 'yith-plugin-fw' );
					}
					break;
				case 'wp_cron_enabled':
					/* translators: %1$s code, %2$s file name */
					$solution = sprintf( esc_html__( 'Remove %1$s from %2$s file', 'yith-plugin-fw' ), '<code>define( \'DISABLE_WP_CRON\', true );</code>', '<b>wp-config.php</b>' );
					break;
				case 'mbstring_enabled':
				case 'simplexml_enabled':
				case 'gd_enabled':
				case 'iconv_enabled':
				case 'opcache_enabled':
				case 'url_fopen_enabled':
					$solution = esc_html__( 'Contact your hosting company in order to enable it.', 'yith-plugin-fw' );
					break;
				case 'wp_memory_limit':
					/* translators: %1$s opening link tag, %2$s closing link tag */
					$solution = sprintf( esc_html__( 'Read more %1$shere%2$s or contact your hosting company in order to increase it.', 'yith-plugin-fw' ), '<a href="https://codex.wordpress.org/Editing_wp-config.php#Increasing_memory_allocated_to_PHP" target="_blank">', '</a>' );
					break;
				default:
					$solution = esc_attr( apply_filters( 'yith_system_generic_message', '', $key, $item, $label ) );
			}
			ob_start()
			?>
			<div class="yith-system-info__info-error">
				<?php echo wp_kses_post( implode( '<br />', $errors ) ); ?>
				<div class="yith-system-info__info-solution">
					<?php echo wp_kses_post( $solution ); ?>
				</div>
			</div>
			<?php

			return ob_get_clean();
		}

		/**
		 * Print warning messages
		 *
		 * @param string $key Requirement Key.
		 *
		 * @return  string
		 * @since   1.0.0
		 */
		public function print_warning_messages( $key ) {
			$warning = '';
			switch ( $key ) {
				case 'wp_memory_limit':
					/* translators: %s recommended memory amount */
					$warning .= sprintf( esc_html__( 'For optimal functioning of our plugins, we suggest setting at least %s of available memory', 'yith-plugin-fw' ), '<span class="warning">' . esc_html( size_format( $this->recommended_memory ) ) . '</span>' );
					$warning .= '<br/>';
					/* translators: %1$s opening link tag, %2$s closing link tag */
					$warning .= sprintf( esc_html__( 'Read more %1$shere%2$s or contact your hosting company in order to increase it.', 'yith-plugin-fw' ), '<a href="https://codex.wordpress.org/Editing_wp-config.php#Increasing_memory_allocated_to_PHP" target="_blank">', '</a>' );
					break;
				case 'min_tls_version':
					if ( ! function_exists( 'curl_init' ) ) {
						/* translators: %1$s TLS label, %2$s cURL label */
						$warning = sprintf( esc_html__( 'The system check cannot determine which %1$s version is installed because %2$s module is disabled. Ask your hosting company to enable it.', 'yith-plugin-fw' ), '<b>TLS</b>', '<b>cURL</b>' );
					} else {
						/* translators: %1$s TLS label */
						$warning = sprintf( esc_html__( 'The system check cannot determine which %1$s version is installed due to a connection issue between your site and our server.', 'yith-plugin-fw' ), '<b>TLS</b>' );
					}
					break;
			}

			return $warning;
		}

		/**
		 * Retrieve the TLS Version
		 *
		 * @return string
		 * @since 3.5
		 */
		public function get_tls_version() {
			$tls = get_transient( 'yith-plugin-fw-system-status-tls-version' );

			if ( ! $tls && apply_filters( 'yith_system_status_check_ssl', true ) ) {
				$services = array(
					array(
						'url'              => 'https://www.howsmyssl.com/a/check',
						'string_to_remove' => 'TLS ',
						'prop'             => 'tls_version',
					),
					array(
						'url'              => 'https://ttl-version.yithemes.workers.dev/',
						'string_to_remove' => 'TLSv',
						'prop'             => 'tlsVersion',
					),
				);
				$params   = array(
					'sslverify' => false,
					'timeout'   => 60,
					'headers'   => array( 'Content-Type' => 'application/json' ),
				);

				foreach ( $services as $service ) {
					$url              = $service['url'];
					$string_to_remove = $service['string_to_remove'];
					$prop             = $service['prop'];

					$response = wp_remote_get( $url, $params );

					if ( ! is_wp_error( $response ) && 200 === absint( $response['response']['code'] ) && 'OK' === $response['response']['message'] ) {
						$body    = json_decode( $response['body'] );
						$version = $body && is_object( $body ) && property_exists( $body, $prop ) ? $body->{$prop} : false;
						if ( $version ) {
							$tls = str_replace( $string_to_remove, '', $version );
							break;
						}
					}
				}
				$tls = ! ! $tls ? $tls : 'n/a';

				set_transient( 'yith-plugin-fw-system-status-tls-version', $tls, 300 );
			}

			return ! ! $tls ? $tls : 'n/a';
		}

		/**
		 * Retrieve the output IP Address.
		 *
		 * @return string
		 * @since 3.5
		 */
		public function get_output_ip() {
			$ip = get_transient( 'yith-plugin-fw-system-status-output-ip' );

			if ( ! $ip && apply_filters( 'yith_system_status_check_ip', true ) ) {
				$url    = 'https://ifconfig.co/ip';
				$params = array(
					'sslverify' => false,
					'timeout'   => 60,
				);

				$response = wp_remote_get( $url, $params );

				if ( ! is_wp_error( $response ) && 200 === absint( $response['response']['code'] ) && 'OK' === $response['response']['message'] ) {
					$body = $response['body'];

					// Check for IPv4.
					preg_match( '/((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])/', $body, $matches );
					// Check for IPv6.
					if ( empty( $matches ) ) {
						preg_match( '/(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/', $body, $matches );
					}

					$ip = ! empty( $matches ) ? $matches[0] : 'n/a';
				}

				$ip = ! ! $ip ? $ip : 'n/a';

				set_transient( 'yith-plugin-fw-system-status-output-ip', $ip, 300 );
			}

			return ! ! $ip ? $ip : 'n/a';
		}

		/**
		 * Retrieve plugin-fw info, such as version and loaded-by.
		 *
		 * @return array
		 */
		public function get_plugin_fw_info() {
			$version        = yith_plugin_fw_get_version();
			$loaded_by      = basename( dirname( YIT_CORE_PLUGIN_PATH ) );
			$loaded_by_init = trailingslashit( dirname( YIT_CORE_PLUGIN_PATH ) ) . 'init.php';
			if ( file_exists( $loaded_by_init ) ) {
				$plugin_data = get_plugin_data( $loaded_by_init );
				$loaded_by   = $plugin_data['Name'] ?? $loaded_by;
			}

			return compact( 'version', 'loaded_by' );
		}

		/**
		 * Retrieve database info, such as MySQL version and database size.
		 *
		 * @return array
		 */
		public function get_database_info() {

			global $wpdb;

			$database_version = $wpdb->get_row( //phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
				'SELECT
						@@GLOBAL.version_comment AS string,
						@@GLOBAL.version AS number',
				ARRAY_A
			);

			$tables        = array();
			$database_size = array();

			// It is not possible to get the database name from some classes that replace wpdb (e.g., HyperDB)
			// and that is why this if condition is needed.
			if ( defined( 'DB_NAME' ) ) {
				$database_table_information = $wpdb->get_results( //phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
					$wpdb->prepare(
						"SELECT
					    table_name AS 'name',
						engine AS 'engine',
					    round( ( data_length / 1024 / 1024 ), 2 ) 'data',
					    round( ( index_length / 1024 / 1024 ), 2 ) 'index',
       					round( ( data_free / 1024 / 1024 ), 2 ) 'free'
					FROM information_schema.TABLES
					WHERE table_schema = %s
					ORDER BY name ASC;",
						DB_NAME
					)
				);

				$database_size = array(
					'data'  => 0,
					'index' => 0,
					'free'  => 0,
				);

				$site_tables_prefix = $wpdb->get_blog_prefix( get_current_blog_id() );
				$global_tables      = $wpdb->tables( 'global', true );
				foreach ( $database_table_information as $table ) {
					// Only include tables matching the prefix of the current site, this is to prevent displaying all tables on a MS install not relating to the current.
					if ( is_multisite() && 0 !== strpos( $table->name, $site_tables_prefix ) && ! in_array( $table->name, $global_tables, true ) ) {
						continue;
					}

					$tables[ $table->name ] = array(
						'data'   => $table->data,
						'index'  => $table->index,
						'free'   => $table->free,
						'engine' => $table->engine,
					);

					$database_size['data']  += $table->data;
					$database_size['index'] += $table->index;
					$database_size['free']  += $table->free;
				}
			}

			return apply_filters(
				'yith_database_info',
				array(
					'mysql_version'        => $database_version['number'],
					'mysql_version_string' => $database_version['string'],
					'database_tables'      => $tables,
					'database_size'        => $database_size,
				)
			);
		}
	}
}

if ( ! function_exists( 'YITH_System_Status' ) ) {
	/**
	 * Single instance of YITH_System_Status
	 *
	 * @return YITH_System_Status
	 * @since  1.0
	 */
	function YITH_System_Status() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid, Universal.Files.SeparateFunctionsFromOO.Mixed
		return YITH_System_Status::instance();
	}
}

YITH_System_Status();
