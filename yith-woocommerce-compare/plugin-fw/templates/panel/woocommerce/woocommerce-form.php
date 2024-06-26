<?php
/**
 * The Template for displaying the WooCommerce form.
 *
 * @var YIT_Plugin_Panel_WooCommerce $panel      The YITH WooCommerce Panel.
 * @var string                       $option_key The current option key ( see YIT_Plugin_Panel::get_current_option_key() ).
 * @package    YITH\PluginFramework\Templates
 */

defined( 'ABSPATH' ) || exit; // Exit if accessed directly.

$form_method   = apply_filters( 'yit_admin_panel_form_method', 'POST', $option_key );
$content_class = apply_filters( 'yit_admin_panel_content_class', 'yit-admin-panel-content-wrap', $option_key );
$container_id  = $panel->settings['page'] . '_' . $option_key;
?>

<div id="<?php echo esc_attr( $container_id ); ?>" class="yith-plugin-fw  yit-admin-panel-container">

	<?php do_action( 'yit_framework_before_print_wc_panel_content', $option_key ); ?>

	<div class="<?php echo esc_attr( $content_class ); ?>">
		<form id="plugin-fw-wc" method="<?php echo esc_attr( $form_method ); ?>">
			<?php $panel->add_fields(); ?>

			<p class="submit" style="float: left;margin: 0 10px 0 0;">
				<?php wp_nonce_field( 'yit_panel_wc_options_' . $panel->settings['page'], 'yit_panel_wc_options_nonce' ); ?>
				<input class="button-primary" id="main-save-button" type="submit" value="<?php esc_html_e( 'Save Options', 'yith-plugin-fw' ); ?>"/>
			</p>

			<?php if ( apply_filters( 'yit_framework_show_float_save_button', true ) ) : ?>
				<button id="yith-plugin-fw-float-save-button" class="button button-primary yith-plugin-fw-animate__appear-from-bottom" data-default-label="<?php esc_attr_e( 'Save Options', 'yith-plugin-fw' ); ?>" data-saved-label="<?php esc_attr_e( 'Options Saved', 'yith-plugin-fw' ); ?>"><?php esc_html_e( 'Save Options', 'yith-plugin-fw' ); ?></button>
			<?php endif; ?>

			<input type="hidden" name="page" value="<?php echo esc_attr( $panel->settings['page'] ); ?>"/>
			<input type="hidden" name="tab" value="<?php echo esc_attr( $panel->get_current_tab() ); ?>"/>
			<input type="hidden" name="sub_tab" value="<?php echo esc_attr( $panel->get_current_sub_tab() ); ?>"/>
		</form>
		<form id="plugin-fw-wc-reset" method="post">
			<input type="hidden" name="yit-action" value="wc-options-reset"/>
			<?php wp_nonce_field( 'yith_wc_reset_options_' . $panel->settings['page'], 'yith_wc_reset_options_nonce' ); ?>
			<input type="submit" name="yit-reset" class="button-secondary" value="<?php esc_html_e( 'Reset Defaults', 'yith-plugin-fw' ); ?>"/>
		</form>
	</div>

	<?php do_action( 'yit_framework_after_print_wc_panel_content', $option_key ); ?>

</div>
