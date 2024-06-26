<?php
/**
 * Template for displaying the text-array field
 *
 * @var array $field The field.
 * @package YITH\PluginFramework\Templates\Fields
 */

defined( 'ABSPATH' ) || exit; // Exit if accessed directly.

list ( $field_id, $name, $value, $fields, $size, $columns, $inline ) = yith_plugin_fw_extract( $field, 'id', 'name', 'value', 'fields', 'size', 'columns', 'inline' );

if ( empty( $fields ) ) {
	return;
}

$value        = isset( $value ) && is_array( $value ) ? $value : array();
$gap          = 16;
$columns      = max( 1, absint( $columns ?? 2 ) );
$default_size = absint( ( 400 - ( $gap * ( $columns - 1 ) ) ) / $columns );
$size         = max( 122, absint( $size ?? $default_size ) );
$max_width    = $size * $columns + ( $gap * ( $columns - 1 ) );

// Let's build the text array!
$text_array = array();
foreach ( $fields as $field_name => $single_field ) {
	$text_array[ $field_name ]['label'] = $single_field;
	$text_array[ $field_name ]['name']  = "{$name}[{$field_name}]";
	$text_array[ $field_name ]['id']    = "{$field_id}_{$field_name}";
	$text_array[ $field_name ]['value'] = isset( $value[ $field_name ] ) ? $value[ $field_name ] : '';
}

if ( empty( $inline ) ) : ?>

	<table id="<?php echo esc_attr( $field_id ); ?>" class="yith-plugin-fw-text-array-table">
		<?php foreach ( $text_array as $key => $single ) : ?>
			<tr>
				<td><?php echo esc_html( $single['label'] ); ?></td>
				<td>
					<input type="text" id="<?php echo esc_attr( $single['id'] ); ?>"
							name="<?php echo esc_attr( $single['name'] ); ?>"
							value="<?php echo esc_attr( $single['value'] ); ?>"
						<?php if ( isset( $size ) ) : ?>
							style="width: <?php echo absint( $size ); ?>px"
						<?php endif; ?>
					/>
				</td>
			</tr>
		<?php endforeach ?>
	</table>

<?php else : ?>
	<div
			id="<?php echo esc_attr( $field_id ); ?>"
			class="yith-plugin-fw-text-array-inline"
			style="max-width: <?php echo absint( $max_width ); ?>px; grid-template-columns : repeat( auto-fit, <?php echo absint( $size ); ?>px ); gap: <?php echo absint( $gap ); ?>px"
	>
		<?php foreach ( $text_array as $key => $single ) : ?>
			<div class="yith-single-text">
				<label for="<?php echo esc_attr( $single['id'] ); ?>"><?php echo esc_html( $single['label'] ); ?></label>
				<input type="text" id="<?php echo esc_attr( $single['id'] ); ?>"
						name="<?php echo esc_attr( $single['name'] ); ?>"
						value="<?php echo esc_attr( $single['value'] ); ?>"
				/>
			</div>
		<?php endforeach ?>
	</div>

<?php endif; ?>
