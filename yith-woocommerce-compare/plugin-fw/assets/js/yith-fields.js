/* globals yith_framework_fw_fields, wp, yith, isRtl */
( function ( $ ) {

	/* Upload */
	var uploadHandler = {
		selectors         : {
			imgPreview  : '.yith-plugin-fw-upload-img-preview',
			uploadButton: '.yith-plugin-fw-upload-button',
			imgUrl      : '.yith-plugin-fw-upload-img-url',
			resetButton : '.yith-plugin-fw-upload-button-reset'
		},
		onImageChange     : function () {
			var url        = $( this ).val(),
				imageRegex = new RegExp( "(http|ftp|https)://[a-zA-Z0-9@?^=%&amp;:/~+#-_.]*.(gif|jpg|jpeg|png|ico|svg)" ),
				preview    = $( this ).parent().find( uploadHandler.selectors.imgPreview ).first();

			if ( preview.length < 1 ) {
				preview = $( this ).parent().parent().find( uploadHandler.selectors.imgPreview ).first();
			}

			if ( imageRegex.test( url ) ) {
				preview.html( '<img src="' + url + '" style="max-width:100px; max-height:100px;" />' );
			} else {
				preview.html( '' );
			}
		},
		onButtonClick     : function ( e ) {
			e.preventDefault();

			var button = $( this ),
				custom_uploader,
				id     = button.attr( 'id' ).replace( /-button$/, '' ).replace( /(\[|\])/g, '\\$1' );

			// If the uploader object has already been created, reopen the dialog
			if ( custom_uploader ) {
				custom_uploader.open();
				return;
			}

			var custom_uploader_states = [
				new wp.media.controller.Library(
					{
						library   : wp.media.query(),
						multiple  : false,
						title     : 'Choose Image',
						priority  : 20,
						filterable: 'uploaded'
					}
				)
			];

			// Create the media frame.
			custom_uploader = wp.media.frames.downloadable_file = wp.media(
				{
					// Set the title of the modal.
					title   : 'Choose Image',
					library : {
						type: ''
					},
					button  : {
						text: 'Choose Image'
					},
					multiple: false,
					states  : custom_uploader_states
				}
			);

			// When a file is selected, grab the URL and set it as the text field's value
			custom_uploader.on( 'select', function () {
				var attachment      = custom_uploader.state().get( 'selection' ).first().toJSON(),
					attachmentField = $( "#" + id + "-yith-attachment-id" );

				$( "#" + id ).val( attachment.url );
				// Save the id of the selected element to an element which name is the same with a suffix "-yith-attachment-id"
				if ( attachmentField.length ) {
					attachmentField.val( attachment.id );
				}
				uploadHandler.triggerImageChange();
			} );

			custom_uploader.open();
		},
		onResetClick      : function () {
			var button        = $( this ),
				id            = button.attr( 'id' ).replace( /(\[|\])/g, '\\$1' ),
				input_id      = button.attr( 'id' ).replace( /-button-reset$/, '' ).replace( /(\[|\])/g, '\\$1' ),
				default_value = $( '#' + id ).data( 'default' );

			$( "#" + input_id ).val( default_value );
			uploadHandler.triggerImageChange();
		},
		triggerImageChange: function () {
			$( uploadHandler.selectors.imgUrl ).trigger( 'change' );
		},
		initOnce          : function () {
			if ( typeof wp !== 'undefined' && typeof wp.media !== 'undefined' ) {
				$( document ).on( 'change', uploadHandler.selectors.imgUrl, uploadHandler.onImageChange );

				$( document ).on( 'click', uploadHandler.selectors.uploadButton, uploadHandler.onButtonClick );

				$( document ).on( 'click', uploadHandler.selectors.resetButton, uploadHandler.onResetClick );
			}
		}
	};

	$( function () {
		uploadHandler.initOnce();
	} );

	var imageGallery = {
		selectors: {
			gallery       : '.yith-plugin-fw-image-gallery',
			notInitGallery: '.yith-plugin-fw-image-gallery:not(.yith-plugin-fw-image-gallery--initialized)',
			button        : '.yith-plugin-fw-image-gallery .image-gallery-button',
			slideWrapper  : 'ul.slides-wrapper'
		},
		initOnce : function () {
			if ( typeof wp !== 'undefined' && typeof wp.media !== 'undefined' ) {
				$( document ).on( 'click', imageGallery.selectors.button, function ( e ) {
					var button               = $( this ),
						gallery              = button.closest( imageGallery.selectors.gallery ),
						imageGalleryIDsField = gallery.find( '.image_gallery_ids' ),
						attachmentIDs        = imageGalleryIDsField.val(),
						wrapper              = gallery.find( 'ul.slides-wrapper' );

					// Create the media frame.
					var imageGalleryFrame = wp.media.frames.image_gallery = wp.media(
						{
							// Set the title of the modal.
							title : button.data( 'choose' ),
							button: {
								text: button.data( 'update' )
							},
							states: [
								new wp.media.controller.Library(
									{
										title     : button.data( 'choose' ),
										filterable: 'all',
										multiple  : true
									}
								)
							]
						}
					);

					// When an image is selected, run a callback.
					imageGalleryFrame.on( 'select', function () {
						var selection = imageGalleryFrame.state().get( 'selection' );
						selection.map( function ( attachment ) {
							attachment = attachment.toJSON();

							if ( attachment.id ) {
								attachmentIDs           = attachmentIDs ? attachmentIDs + "," + attachment.id : attachment.id;
								var attachmentImageData = attachment.sizes.thumbnail || attachment.sizes.medium || attachment.sizes.large || attachment.sizes.full;
								wrapper.append( '<li class="image" data-attachment_id="' + attachment.id + '"><img src="' + attachmentImageData.url + '"/><i href="#" class="delete yith-icon yith-icon-trash" title="' + button.data( 'delete' ) + '"></i></li>' );
							}
						} );

						imageGalleryIDsField.val( attachmentIDs );
						imageGalleryIDsField.trigger( 'change' );
					} );

					imageGalleryFrame.open();

				} );
			}
		},
		init     : function () {
			if ( typeof wp !== 'undefined' && typeof wp.media !== 'undefined' ) {
				$( imageGallery.selectors.notInitGallery ).each( function () {
					$( this ).addClass( 'yith-plugin-fw-image-gallery--initialized' );
					var slideWrappers = $( this ).find( imageGallery.selectors.slideWrapper );

					// Image ordering
					slideWrappers.each( function () {
						var currentSlideWrapper = $( this );
						currentSlideWrapper.sortable( {
														  items               : 'li.image',
														  cursor              : 'move',
														  scrollSensitivity   : 40,
														  forcePlaceholderSize: true,
														  forceHelperSize     : false,
														  helper              : 'clone',
														  opacity             : 0.65,
														  start               : function ( event, ui ) {
															  ui.item.css( 'background-color', '#f6f6f6' );
														  },
														  stop                : function ( event, ui ) {
															  ui.item.removeAttr( 'style' );
														  },
														  update              : function ( event, ui ) {
															  var attachment_ids = '';

															  currentSlideWrapper.find( 'li.image' ).css( 'cursor', 'default' ).each( function () {
																  var attachment_id = $( this ).attr( 'data-attachment_id' );
																  attachment_ids    = attachment_ids + attachment_id + ',';
															  } );

															  currentSlideWrapper.closest( imageGallery.selectors.gallery ).find( '.image_gallery_ids' ).val( attachment_ids );
														  }
													  } );
					} );

					// Remove images
					slideWrappers.on( 'click', '.delete', function ( e ) {
						e.preventDefault();
						var _wrapper              = $( this ).closest( imageGallery.selectors.gallery ),
							_slideWrapper         = _wrapper.find( 'ul.slides-wrapper' ),
							_imageGalleryIDsField = _wrapper.find( '.image_gallery_ids' ),
							_attachmentIDs        = '';

						$( this ).closest( 'li.image' ).remove();

						_slideWrapper.find( 'li.image' ).css( 'cursor', 'default' ).each( function () {
							var attachment_id = $( this ).attr( 'data-attachment_id' );
							_attachmentIDs    = _attachmentIDs + attachment_id + ',';
						} );

						_imageGalleryIDsField.val( _attachmentIDs );
					} );
				} )
			}
		}
	};
	$( function () {
		imageGallery.initOnce();
	} );


	// Codemirror.
	$( function () {
		var codemirrorInit = function () {
			if ( typeof wp !== 'undefined' && typeof wp.codeEditor !== 'undefined' ) {
				$( '.codemirror:not(.codemirror--initialized)' ).each( function () {
					var settings = $( this ).data( 'settings' ),
						editor   = wp.codeEditor.initialize( $( this ), settings );

					$( this ).addClass( 'codemirror--initialized' );
					$( this ).data( 'codemirrorInstance', editor );
				} );
			}
		};
		$( document ).on( 'yith-plugin-fw-codemirror-init', codemirrorInit ).trigger( 'yith-plugin-fw-codemirror-init' );
	} );

	var yith_fields_init = function () {
		var $datepicker  = $( '.yith-plugin-fw-datepicker:not(.yith-plugin-fw-datepicker--initialized)' ),
			$colorpicker = $( '.yith-plugin-fw-colorpicker:not(.yith-plugin-fw-colorpicker--initialized)' ),
			$sidebars    = $( '.yith-plugin-fw-sidebar-layout:not(.yith-plugin-fw-sidebar-layout--initialized)' ),
			$slider      = $( '.yith-plugin-fw-slider-container:not(.yith-plugin-fw-slider-container--initialized)' ),
			$icons       = $( '.yit-icons-manager-wrapper:not(.yit-icons-manager-wrapper--initialized)' );

		/* Datepicker */
		$datepicker.each( function () {
			$( this ).addClass( 'yith-plugin-fw-datepicker--initialized' );

			var currentDatePicker = $( this ),
				args              = currentDatePicker.data(),
				icon              = currentDatePicker.next( '.yith-icon-calendar' );

			// set animation to false to prevent style 'glitches' when removing class on closing
			args.showAnim   = false;
			args.beforeShow = function ( input, instance ) {
				instance.dpDiv.addClass( 'yith-plugin-fw-datepicker-div' );
			};
			args.onClose    = function ( selectedDate, instance ) {
				instance.dpDiv.removeClass( 'yith-plugin-fw-datepicker-div' );
			};

			currentDatePicker.datepicker( args );
			if ( icon ) {
				icon.on( 'click', function () {
					currentDatePicker.datepicker( 'show' );
				} )
			}
		} );

		/* Colorpicker */
		$colorpicker.each( function () {
			$( this ).addClass( 'yith-plugin-fw-colorpicker--initialized' );

			$( this ).wpColorPicker(
				{
					palettes: false,
					width   : 200,
					mode    : 'hsl',
					clear   : function () {
						var input = $( this );
						input.val( input.data( 'default-color' ) );
						input.trigger( 'change' );
					}
				}
			);

			var select_label = $( this ).data( 'variations-label' ),
				wrap_main1   = $( this ).closest( '.yith-plugin-fw-colorpicker-field-wrapper' ),
				wrap_main2   = $( this ).closest( '.yith-single-colorpicker' ),
				wrap1        = wrap_main1.find( '.wp-picker-input-wrap' ),
				wrap2        = wrap_main2.find( '.wp-picker-input-wrap' );

			wrap1.length && wrap_main1.find( 'a.wp-color-result' ).attr( 'title', select_label );
			wrap_main2.length && wrap_main2.find( 'a.wp-color-result' ).attr( 'title', select_label );

			if ( ! wrap1.find( '.wp-picker-default-custom' ).length ) {
				var button = $( '<span/>' ).attr( {
													  class: 'wp-picker-default-custom'
												  } );
				wrap1.find( '.wp-picker-default' ).wrap( button );
			}

			if ( ! wrap2.find( '.wp-picker-default-custom' ).length ) {
				var button = $( '<span/>' ).attr( {
													  class: 'wp-picker-default-custom'
												  } );
				wrap2.find( '.wp-picker-default' ).wrap( button );
			}
		} );

		/* Sidebars */
		$sidebars.each( function () {
			$( this ).addClass( 'yith-plugin-fw-sidebar-layout--initialized' );
			var $images = $( this ).find( 'img' );
			$images.on( 'click', function () {
				var $container = $( this ).closest( '.yith-plugin-fw-sidebar-layout' ),
					$left      = $container.find( '.yith-plugin-fw-sidebar-layout-sidebar-left-container' ),
					$right     = $container.find( '.yith-plugin-fw-sidebar-layout-sidebar-right-container' ),
					type       = $( this ).data( 'type' );

				$( this ).parent().children( ':radio' ).attr( 'checked', false );
				$( this ).prev( ':radio' ).attr( 'checked', true );

				if ( typeof type != 'undefined' ) {
					switch ( type ) {
						case 'left':
							$left.show();
							$right.hide();
							break;
						case 'right':
							$right.show();
							$left.hide();
							break;
						case 'double':
							$left.show();
							$right.show();
							break;
						default:
							$left.hide();
							$right.hide();
							break;
					}
				}
			} );
		} );

		/* Slider */
		$slider.each( function () {
			$( this ).addClass( 'yith-plugin-fw-slider-container--initialized' );
			var theSlider = $( this ).find( '.ui-slider-horizontal' ),
				val       = theSlider.data( 'val' ),
				minValue  = theSlider.data( 'min' ),
				maxValue  = theSlider.data( 'max' ),
				step      = theSlider.data( 'step' ),
				labels    = theSlider.data( 'labels' );

			theSlider.slider( {
								  value: val,
								  min  : minValue,
								  max  : maxValue,
								  range: 'min',
								  step : step,

								  create: function () {
									  $( this ).find( '.ui-slider-handle' ).text( $( this ).slider( "value" ) );
								  },


								  slide: function ( event, ui ) {
									  $( this ).find( 'input' ).val( ui.value ).trigger( 'change' );
									  $( this ).find( '.ui-slider-handle' ).text( ui.value );
									  $( this ).siblings( '.feedback' ).find( 'strong' ).text( ui.value + labels );
								  }
							  } );
		} );

		$icons.each( function () {
			$( this ).addClass( 'yit-icons-manager-wrapper--initialized' );
			var $container = $( this ),
				$preview   = $container.find( '.yit-icons-manager-icon-preview' ).first(),
				$text      = $container.find( '.yit-icons-manager-icon-text' );

			$container.on( 'click', '.yit-icons-manager-list li', function ( event ) {
				var $target = $( event.target ).closest( 'li' ),
					font    = $target.data( 'font' ),
					icon    = $target.data( 'icon' ),
					key     = $target.data( 'key' ),
					name    = $target.data( 'name' );

				$preview.attr( 'data-font', font );
				$preview.attr( 'data-icon', icon );
				$preview.attr( 'data-key', key );
				$preview.attr( 'data-name', name );

				$text.val( font + ':' + name );

				$container.find( '.yit-icons-manager-list li' ).removeClass( 'active' );
				$target.addClass( 'active' );
			} );

			$container.on( 'click', '.yit-icons-manager-action-set-default', function () {
				$container.find( '.yit-icons-manager-list li.default' ).trigger( 'click' );
			} );
		} );

		$( document ).find( '.ui-sortable .yith-toggle-elements' ).sortable(
			{
				cursor              : 'move',
				axis                : 'y',
				scrollSensitivity   : 40,
				forcePlaceholderSize: true,
				helper              : 'clone',

				stop: function ( event, ui ) {
					var keys       = jQuery( '.ui-sortable-handle' ),
						i          = 0,
						array_keys = new Array();
					for ( i = 0; i < keys.length; i++ ) {
						array_keys[ i ] = $( keys[ i ] ).data( 'item_key' );
					}
					if ( array_keys.length > 0 ) {
						var toggle = $( this ).closest( '.toggle-element,.yith-plugin-fw__panel__option--toggle-element' );
						toggle.saveToggleElement( null, array_keys );
					}
				}
			}
		);

		$( document.body ).trigger( 'wc-enhanced-select-init' );
		$( document.body ).trigger( 'yith-framework-enhanced-select-init' );
		$( document ).trigger( 'yith-plugin-fw-codemirror-init' );
		uploadHandler.triggerImageChange();
		imageGallery.init();
	};

	$( document ).on( 'yith_fields_init', yith_fields_init ).trigger( 'yith_fields_init' );

	/** Select Images */
	$( document ).on( 'click', '.yith-plugin-fw-select-images__item', function () {
		var item    = $( this ),
			key     = item.data( 'key' ),
			wrapper = item.closest( '.yith-plugin-fw-select-images__wrapper' ),
			items   = wrapper.find( '.yith-plugin-fw-select-images__item' ),
			select  = wrapper.find( 'select' ).first();

		if ( select.length ) {
			select.val( key ).trigger( 'yith_select_images_value_changed' ).trigger( 'change' );
			items.removeClass( 'yith-plugin-fw-select-images__item--selected' );
			item.addClass( 'yith-plugin-fw-select-images__item--selected' );
		}
	} );

	/* Select All - Deselect All */
	$( document ).on( 'click', '.yith-plugin-fw-select-all', function () {
		var $targetSelect = $( '#' + $( this ).data( 'select-id' ) );
		$targetSelect.find( 'option' ).prop( 'selected', true ).trigger( 'change' );
	} );

	$( document ).on( 'click', '.yith-plugin-fw-deselect-all', function () {
		var $targetSelect = $( '#' + $( this ).data( 'select-id' ) );
		$targetSelect.find( 'option' ).prop( 'selected', false ).trigger( 'change' );
	} );

	/* on-off */
	$( document ).on( 'click', '.yith-plugin-fw-onoff-container span', function () {
		var input    = $( this ).prev( 'input' ),
			disabled = input.prop( 'disabled' );

		if ( disabled ) {
			return;
		}

		input.trigger( 'click' );
	} );

	// Useful for triggering deps when clicking on field label.
	$( document ).on( 'click', '.yith-plugin-fw-onoff-container input', function ( e ) {
		if ( $( this ).is( ':checked' ) ) {
			$( this ).attr( 'value', 'yes' ).addClass( 'onoffchecked' );
		} else {
			$( this ).attr( 'value', 'no' ).removeClass( 'onoffchecked' );
		}
	} );


	/** Toggle **/


	//TOGGLE ELEMENT
	$.fn.saveToggleElement = function ( spinner, array_keys ) {
		var toggle          = $( this ),
			action          = 'yith_plugin_fw_save_toggle_element',
			formdata        = toggle.serializeToggleElement(),
			wrapper         = toggle.find( '.yith-toggle_wrapper' ),
			id              = wrapper.attr( 'id' ),
			current_tab     = $.urlParam( 'tab' ),
			current_sub_tab = $.urlParam( 'sub_tab' );

		formdata.append( 'security', wrapper.data( 'nonce' ) );

		if ( typeof array_keys != 'undefined' && array_keys.length > 0 ) {
			formdata.append( 'yith_toggle_elements_order_keys', array_keys );
		}

		if ( toggle.closest( '.metaboxes-tab.yith-plugin-ui' ).length ) {
			action              = 'yith_plugin_fw_save_toggle_element_metabox';
			post_id             = $( this ).closest( 'form#post' ).find( '#post_ID' ).val();
			yit_metaboxes_nonce = $( this ).closest( 'form#post' ).find( '#yit_metaboxes_nonce' ).val();
			metabox_tab         = $( this ).closest( '.tabs-panel' ).attr( 'id' );
			url                 = yith_framework_fw_fields.ajax_url +
								  '?action=' + action +
								  "&post_ID=" + post_id +
								  '&yit_metaboxes_nonce=' + yit_metaboxes_nonce +
								  "&toggle_id=" + id +
								  "&metabox_tab=" + metabox_tab;
		} else {
			url = yith_framework_fw_fields.admin_url + '?action=' + action + '&tab=' + current_tab + '&sub_tab=' + current_sub_tab + "&toggle_id=" + id;
		}

		$.ajax( {
					type       : "POST",
					url        : url,
					data       : formdata,
					contentType: false,
					processData: false,
					success    : function ( result ) {
						if ( spinner ) {
							spinner.removeClass( 'show' );
						}

						$( document ).trigger( 'yith_save_toggle_element_done', [ result, toggle ] );
					}
				} );
	};

	$.fn.serializeToggleElement = function () {
		var obj = $( this );
		/* ADD FILE TO PARAM AJAX */
		var formData = new FormData();
		var params   = $( obj ).find( ":input" ).serializeArray();

		$.each( params, function ( i, val ) {
			el_name = val.name;
			formData.append( val.name, val.value );
		} );

		return formData;
	};

	$.fn.formatToggleTitle = function () {
		var toggle_el = $( this ),
			fields    = toggle_el.find( ':input' ),
			title     = toggle_el.find( 'span.title' ).data( 'title_format' ),
			subtitle  = toggle_el.find( '.subtitle' ).data( 'subtitle_format' ),
			regExp    = new RegExp( "[^%%]+(?=[%%])", 'g' );

		if ( typeof title != 'undefined' ) {
			var res = title.match( regExp );
		}

		if ( typeof subtitle != 'undefined' ) {
			var ressub = subtitle.match( regExp );
		}

		$.each( fields, function ( i, field ) {
			if ( typeof $( field ).attr( 'id' ) != 'undefined' ) {
				$field_id    = $( field ).attr( 'id' );
				$field_array = $field_id.split( '_' );
				$field_array.pop();
				$field_id  = $field_array.join( '_' );
				$field_val = $( field ).val();

				if ( res != null && typeof res != 'undefined' && res.indexOf( $field_id ) !== -1 ) {
					title = title.replace( '%%' + $field_id + '%%', $field_val );
				}
				if ( ressub != null && typeof ressub != 'undefined' && ressub.indexOf( $field_id ) !== -1 ) {
					subtitle = subtitle.replace( '%%' + $field_id + '%%', $field_val );
				}
			}
		} );

		if ( '' !== title ) {
			toggle_el.find( 'span.title' ).html( title );
		}

		if ( '' !== subtitle ) {
			toggle_el.find( '.subtitle' ).html( subtitle );
		}

		$( document ).trigger( 'yith-toggle-element-item-title', [ toggle_el ] );
	};

	$.urlParam = function ( name ) {
		var results = new RegExp( '[\?&]' + name + '=([^&#]*)' )
			.exec( window.location.search );

		return ( results !== null ) ? results[ 1 ] || 0 : false;
	};

	$( document ).on( 'click', '.yith-toggle-title', function ( event ) {
		var _toggle       = $( event.target ),
			_section      = _toggle.closest( '.yith-toggle-row' ),
			_content      = _section.find( '.yith-toggle-content' ),
			_isOnOffClick = !! _toggle.closest( '.yith-toggle-onoff' ).length;

		if ( _isOnOffClick || _toggle.hasClass( 'yith-icon-drag' ) ) {
			return false;
		}

		if ( _section.is( '.yith-toggle-row-opened' ) ) {
			_content.slideUp( 400 );
		} else {
			_content.slideDown( 400 );
		}
		_section.toggleClass( 'yith-toggle-row-opened' );
	} );

	/**Add new box toggle**/
	$( document ).on( 'click', '.yith-add-box-button', function ( event ) {
		event.preventDefault();
		var $this        = $( this ),
			target_id    = $this.data( 'box_id' ),
			closed_label = $this.data( 'closed_label' ),
			label        = $this.data( 'opened_label' ),
			id           = $this.closest( '.yith-toggle_wrapper' ).attr( 'id' ),
			template     = wp.template( 'yith-toggle-element-add-box-content-' + id );

		if ( '' !== target_id ) {
			$( '#' + target_id ).html( template( { index: 'box_id' } ) ).slideToggle();
			if ( closed_label !== '' ) {
				if ( $this.html() === closed_label ) {
					$this.html( label ).removeClass( 'closed' );
				} else {
					$this.html( closed_label ).addClass( 'closed' );
				}
			}

			$( document ).trigger( 'yith_fields_init' );
			$( document ).trigger( 'yith-add-box-button-toggle', [ $this ] );
		}
	} );

	$( document ).on( 'click', '.yith-add-box-buttons .yith-save-button', function ( event ) {

		event.preventDefault();
		var add_box        = $( this ).parents( '.yith-add-box' ),
			id             = $( this ).closest( '.yith-toggle_wrapper' ).attr( 'id' ),
			spinner        = add_box.find( '.spinner' ),
			toggle_element = $( this ).closest( '.toggle-element,.yith-plugin-fw__panel__option--toggle-element' ),
			fields         = add_box.find( ':input' ),
			counter        = 0,
			hidden_obj     = $( '<input type="hidden">' );

		toggle_element.find( '.yith-toggle-row' ).each( function () {
			var key = parseInt( $( this ).data( 'item_key' ) );
			if ( counter <= key ) {
				counter = key + 1;
			}
		} );

		hidden_obj.val( counter );

		$( document ).trigger( 'yith-toggle-change-counter', [ hidden_obj, add_box ] );

		counter       = hidden_obj.val();
		var template  = wp.template( 'yith-toggle-element-item-' + id ),
			toggle_el = $( template( { index: counter } ) );

		spinner.addClass( 'show' );

		$.each( fields, function ( i, field ) {
			if ( typeof $( field ).attr( 'id' ) !== 'undefined' ) {

				var _field_id  = $( field ).attr( 'id' ),
					_field_val = $( field ).val();

				if ( 'radio' === $( field ).attr( 'type' ) ) {
					_field_id = $( field ).closest( '.yith-plugin-fw-radio' ).attr( 'id' );
					_field_id = _field_id.replace( 'new_', '' ) + '_' + counter;
					_field_id = _field_id + '-' + _field_val;
				} else {
					_field_id = _field_id.replace( 'new_', '' ) + '_' + counter;
				}

				if ( $( field ).is( ':checked' ) ) {
					$( toggle_el ).find( '#' + _field_id ).prop( 'checked', true );
				}

				if ( $( field ).hasClass( 'yith-post-search' ) || $( field ).hasClass( 'yith-term-search' ) ) {
					$( toggle_el ).find( '#' + _field_id ).html( $( '#' + $( field ).attr( 'id' ) ).html() );
				}

				$( toggle_el ).find( '#' + _field_id ).val( _field_val );

			}

		} );

		$( toggle_el ).formatToggleTitle();
		var form_is_valid = $( '<input type="hidden">' ).val( 'yes' );
		$( document ).trigger( 'yith-toggle-element-item-before-add', [ add_box, toggle_el, form_is_valid ] );

		var delayInMilliseconds = 1000; //1 second
		setTimeout( function () {
			if ( form_is_valid.val() === 'yes' ) {
				$( toggle_element ).find( '.yith-toggle-elements' ).append( toggle_el );
				$( add_box ).find( '.yith-plugin-fw-datepicker' ).datepicker( 'destroy' );
				$( add_box ).html( '' );
				$( add_box ).prev( '.yith-add-box-button' ).trigger( 'click' );
				toggle_element.saveToggleElement();

				var delayInMilliseconds = 2000; //1 second
				setTimeout( function () {
					$( toggle_element ).find( '.highlight' ).removeClass( 'highlight' );
				}, delayInMilliseconds );


				$( document ).trigger( 'yith_fields_init' );
			}
		}, delayInMilliseconds );


	} );

	$( document ).on( 'click', '.yith-toggle-row .yith-save-button', function ( event ) {
		event.preventDefault();
		var toggle     = $( this ).closest( '.toggle-element,.yith-plugin-fw__panel__option--toggle-element' ),
			toggle_row = $( this ).closest( '.yith-toggle-row' ),
			spinner    = toggle_row.find( '.spinner' );
		toggle_row.formatToggleTitle();

		var form_is_valid = $( '<input type="hidden">' ).val( 'yes' );
		$( document ).trigger( 'yith-toggle-element-item-before-update', [ toggle, toggle_row, form_is_valid ] );
		if ( form_is_valid.val() === 'yes' ) {
			spinner.addClass( 'show' );
			toggle.saveToggleElement( spinner );
		}
	} );

	//register remove the dome and save the toggle
	$( document ).on( 'click', '.yith-toggle-row .yith-delete-button', function ( event ) {
		event.preventDefault();
		var toggle     = $( this ).closest( '.toggle-element,.yith-plugin-fw__panel__option--toggle-element' ),
			toggle_row = $( this ).closest( '.yith-toggle-row' );
		toggle_row.remove();
		toggle.saveToggleElement();
	} );

	//register onoff status
	$( document ).on( 'click', '.yith-toggle-onoff', function ( event ) {
		event.preventDefault();
		var toggle = $( this ).closest( '.toggle-element,.yith-plugin-fw__panel__option--toggle-element' );
		toggle.saveToggleElement();
	} );

	// Radio
	$( document ).on( 'click', '.yith-plugin-fw-radio input[type=radio]', function () {
		var _radioContainer = $( this ).closest( '.yith-plugin-fw-radio' ),
			_value          = $( this ).val();

		_radioContainer.val( _value ).data( 'value', _value ).trigger( 'change' );
	} );

	$( document.body ).on( 'yith-plugin-fw-init-radio', function () {
		$( '.yith-plugin-fw-radio:not(.yith-plugin-fw-radio--initialized)' ).each( function () {
			$( this ).find( 'input[type="radio"]' ).filter( '[value="' + $( this ).data( 'value' ) + '"]' ).click();
			$( this ).addClass( 'yith-plugin-fw-radio--initialized' );
		} );
	} ).trigger( 'yith-plugin-fw-init-radio' );

	// Password Eye field
	$( document ).on( 'click', '.yith-password-eye', function () {
		var $this = $( this ),
			inp   = $( this ).closest( '.yith-password-wrapper' ).find( 'input' );
		if ( inp.attr( 'type' ) === "password" ) {
			inp.attr( 'type', 'text' );
			$this.addClass( 'yith-password-eye-closed' );
		} else {
			inp.attr( 'type', 'password' );
			$this.removeClass( 'yith-password-eye-closed' );
		}
	} );

	/**
	 * Select2 - add class to stylize it with the new plugin-fw style
	 */
	$( document ).on( 'select2:open', function ( e ) {
		if ( $( e.target ).closest( '.yith-plugin-ui' ).length ) {
			$( '.select2-results' ).closest( '.select2-container' ).addClass( 'yith-plugin-fw-select2-container' );
		}
	} );

	/**
	 * Select2 - focus on search field when opened and the select is not multiple.
	 * For multiple select this is already handled by select2.
	 */
	$( document ).on( 'select2:open', function ( e ) {
		if ( ! e.target.multiple ) {
			setTimeout(
				function () {
					var select2SearchField = document.querySelector( '.yith-plugin-fw-select2-container .select2-search__field' );
					select2SearchField && select2SearchField.focus();
				},
				50
			);
		}
	} );


	/**
	 * Dimensions
	 */
	var fw_dimensions = {
		selectors   : {
			wrapper   : '.yith-plugin-fw-dimensions',
			units     : {
				wrapper      : '.yith-plugin-fw-dimensions__units',
				single       : '.yith-plugin-fw-dimensions__unit',
				value        : '.yith-plugin-fw-dimensions__unit__value',
				selectedClass: 'yith-plugin-fw-dimensions__unit--selected'
			},
			linked    : {
				button            : '.yith-plugin-fw-dimensions__linked',
				value             : '.yith-plugin-fw-dimensions__linked__value',
				wrapperActiveClass: 'yith-plugin-fw-dimensions--linked-active'
			},
			dimensions: {
				number: '.yith-plugin-fw-dimensions__dimension__number'
			}
		},
		init        : function () {
			var self = fw_dimensions;
			$( document ).on( 'click', self.selectors.units.single, self.unitChange );
			$( document ).on( 'click', self.selectors.linked.button, self.linkedChange );
			$( document ).on( 'change keyup', self.selectors.dimensions.number, self.numberChange );
		},
		unitChange  : function ( e ) {
			var unit       = $( this ).closest( fw_dimensions.selectors.units.single ),
				wrapper    = unit.closest( fw_dimensions.selectors.units.wrapper ),
				units      = wrapper.find( fw_dimensions.selectors.units.single ),
				valueField = wrapper.find( fw_dimensions.selectors.units.value ).first(),
				value      = unit.data( 'value' );

			units.removeClass( fw_dimensions.selectors.units.selectedClass );
			unit.addClass( fw_dimensions.selectors.units.selectedClass );
			valueField.val( value ).trigger( 'change' );
		},
		linkedChange: function () {
			var button      = $( this ).closest( fw_dimensions.selectors.linked.button ),
				mainWrapper = button.closest( fw_dimensions.selectors.wrapper ),
				valueField  = button.find( fw_dimensions.selectors.linked.value ),
				value       = valueField.val();

			if ( 'yes' === value ) {
				mainWrapper.removeClass( fw_dimensions.selectors.linked.wrapperActiveClass );
				valueField.val( 'no' );
			} else {
				mainWrapper.addClass( fw_dimensions.selectors.linked.wrapperActiveClass );
				valueField.val( 'yes' );

				mainWrapper.find( fw_dimensions.selectors.dimensions.number ).first().trigger( 'change' );
			}
		},
		numberChange: function ( e ) {
			var number      = $( this ).closest( fw_dimensions.selectors.dimensions.number ),
				mainWrapper = number.closest( fw_dimensions.selectors.wrapper );
			if ( mainWrapper.hasClass( fw_dimensions.selectors.linked.wrapperActiveClass ) ) {
				var numbers = mainWrapper.find( fw_dimensions.selectors.dimensions.number );

				numbers.val( number.val() );
			}
		}
	};
	fw_dimensions.init();

	/**
	 * Copy to clip-board
	 */
	var clearSelection = function () {
		var selection = 'getSelection' in window ? window.getSelection() : false;
		if ( selection ) {
			if ( 'empty' in selection ) {  // Chrome.
				selection.empty();
			} else if ( 'removeAllRanges' in selection ) {  // Firefox.
				selection.removeAllRanges();
			}
		} else if ( 'selection' in document ) {  // IE.
			document.selection.empty();
		}
	}

	$( document ).on( 'click', '.yith-plugin-fw-copy-to-clipboard__copy', function () {
		var wrap    = $( this ).closest( '.yith-plugin-fw-copy-to-clipboard' ),
			input   = wrap.find( '.yith-plugin-fw-copy-to-clipboard__field' ),
			tip     = wrap.find( '.yith-plugin-fw-copy-to-clipboard__tip' ),
			timeout = wrap.data( 'tip-timeout' );

		timeout && clearTimeout( timeout );

		input.select();
		document.execCommand( 'copy' );
		clearSelection();

		tip.fadeIn( 400 );

		// Use timeout instead of delay to prevent issues with multiple clicks.
		timeout = setTimeout( function () {
			tip.fadeOut( 400 );
		}, 1500 );
		wrap.data( 'tip-timeout', timeout );
	} );

	/**
	 * Action buttons
	 */
	var actionButtons = {
		observable        : {
			openedMenu: false,
			button    : false
		},
		init              : function () {
			$( document ).on( 'click', '.yith-plugin-fw__action-button--has-menu', actionButtons.open );
			$( document ).on( 'click', '.yith-plugin-fw__action-button__menu', actionButtons.stopPropagation );
			$( document ).on( 'click', actionButtons.closeAll );
			$( window ).on( 'scroll', actionButtons.handleScroll );
		},
		closeAll          : function () {
			actionButtons.observable.openedMenu = false;
			$( '.yith-plugin-fw__action-button--opened' ).removeClass( 'yith-plugin-fw__action-button--opened' );
		},
		updateMenuPosition: function () {
			if ( actionButtons.observable.openedMenu && actionButtons.observable.button ) {
				var buttonEl   = actionButtons.observable.button.get( 0 ),
					buttonRect = buttonEl.getBoundingClientRect(),
					leftOffset = isRtl ? 0 : buttonRect.width - actionButtons.observable.openedMenu.outerWidth(),
					props      = {
						top : buttonRect.top + buttonRect.height + 8,
						left: buttonRect.left + leftOffset
					};

				actionButtons.observable.openedMenu.css( props )
			}
		},
		open              : function ( e ) {
			var button    = $( this ).closest( '.yith-plugin-fw__action-button' ),
				menu      = button.find( '.yith-plugin-fw__action-button__menu' ),
				wasOpened = button.hasClass( 'yith-plugin-fw__action-button--opened' );
			e.preventDefault();
			e.stopPropagation();

			actionButtons.closeAll();

			if ( ! wasOpened ) {
				button.addClass( 'yith-plugin-fw__action-button--opened' );
				actionButtons.observable.openedMenu = menu;
				actionButtons.observable.button     = button;

				actionButtons.updateMenuPosition();
			}
		},
		stopPropagation   : function ( e ) {
			e.stopPropagation();
		},
		handleScroll      : function () {
			actionButtons.updateMenuPosition();
		}
	};
	actionButtons.init();

	/**
	 * Require confirmation link
	 */
	$( document ).on( 'click', 'a.yith-plugin-fw__require-confirmation-link', function ( e ) {
		var link = $( this ).closest( 'a.yith-plugin-fw__require-confirmation-link' ),
			url  = link.attr( 'href' );

		if ( url && '#' !== url ) {
			e.preventDefault();
			e.stopPropagation();
			if ( 'yith' in window && 'ui' in yith ) {
				var dataForOptions = [
						'title',
						'message',
						'confirmButtonType',
						'cancelButton',
						'confirmButton'
					],
					options        = {}, i;

				for ( i in dataForOptions ) {
					var key   = dataForOptions[ i ],
						value = link.data( key );

					if ( typeof value !== 'undefined' ) {
						options[ key ] = value;
					}
				}

				options.onConfirm = function () {
					window.location.href = url;
				};

				options.closeAfterConfirm                = false;
				options.confirmButtonLoadingAfterConfirm = true;

				yith.ui.confirm( options );

			}
		}

	} );

	/**
	 * Tips
	 */
	$( document ).on( 'yith-plugin-fw-tips-init', function () {
		$( '.yith-plugin-fw__tips' ).tipTip(
			{
				attribute: 'data-tip',
				fadeIn   : 50,
				fadeOut  : 50,
				delay    : 200
			}
		);
	} ).trigger( 'yith-plugin-fw-tips-init' );

	/**
	 * Tabs
	 */
	$( document ).on( 'yith-plugin-fw-tabs-init', function () {
		$( '.yith-plugin-fw__tabs:not(.yith-plugin-fw__tabs--initialized)' ).each( function () {
			var tabsContainer         = $( this ),
				additionalActiveClass = tabsContainer.data( 'tab-additional-active-class' ) || false,
				allHandlers           = tabsContainer.find( '.yith-plugin-fw__tab__handler' ),
				firstTabHandler       = tabsContainer.find( '.yith-plugin-fw__tab__handler' ).first(),
				allPanelIds           = allHandlers.get().map( function ( _current ) {
					return _current.getAttribute( 'href' );
				} ).filter( function ( _current ) {
					return !! _current;
				} ).join( ', ' ),
				allPanels             = $( allPanelIds ),
				showTab               = function ( tabHandler ) {
					var tab       = tabHandler.parent( '.yith-plugin-fw__tab' ),
						otherTabs = tab.siblings( '.yith-plugin-fw__tab' ),
						panelId   = tabHandler.attr( 'href' );

					tab.addClass( 'yith-plugin-fw__tab--active' );
					!! additionalActiveClass && tab.addClass( additionalActiveClass );
					otherTabs.removeClass( 'yith-plugin-fw__tab--active' );
					!! additionalActiveClass && otherTabs.removeClass( additionalActiveClass );

					allPanels.hide();
					$( panelId ).show();
				},
				handleTabClick        = function ( e ) {
					e.preventDefault();
					var currentTabHandler = $( this ),
						tab               = currentTabHandler.parent( '.yith-plugin-fw__tab' ),
						isActive          = tab.hasClass( 'yith-plugin-fw__tab--active' );

					if ( ! isActive ) {
						showTab( currentTabHandler );
					}
				};

			tabsContainer.addClass( 'yith-plugin-fw__tabs--initialized' );
			tabsContainer.on( 'click', '.yith-plugin-fw__tab__handler', handleTabClick );

			!! firstTabHandler.length && showTab( firstTabHandler );
		} );
	} ).trigger( 'yith-plugin-fw-tabs-init' );

	/**
	 * Dismissible Notices
	 */
	$( document ).on( 'click', '.yith-plugin-fw__notice__dismiss', function () {
		$( this ).closest( '.yith-plugin-fw__notice' ).fadeOut( 300 );
	} );

	/**
	 * Media field
	 */
	( function () {
		var isDragging = false,
			uploader   = {
				instance: null,
				wrapper : null,
				init    : function ( wrapper ) {
					uploader.wrapper = wrapper;

					if ( ! uploader.instance ) {
						var mediaUploaderStates = [
							new wp.media.controller.Library(
								{
									library   : wp.media.query(),
									multiple  : false,
									priority  : 20,
									filterable: 'uploaded'
								}
							)
						];

						uploader.instance = wp.media.frames.downloadable_file = wp.media(
							{
								library : { type: '' },
								multiple: false,
								states  : mediaUploaderStates
							}
						);

						// When a file is selected, grab the URL and set it as the text field's value.
						uploader.instance.on( 'select', function () {
							var attachment = uploader.instance.state().get( 'selection' ).first().toJSON();

							triggerMediaChange( uploader.wrapper, attachment );
						} );
					}
				},
				open    : function ( wrapper ) {
					uploader.init( wrapper );
					uploader.instance.open();
				},
				destroy : function () {
					uploader.instance = null;
				}
			};

		/**
		 * Get the wrapper of the media field.
		 * @param element JQuery element or dom element.
		 * @returns {*}
		 */
		function getWrapper( element ) {
			return $( element ).closest( '.yith-plugin-fw-media' );
		}

		/**
		 * Trigger the Media file change.
		 * @param wrapper
		 * @param media
		 */
		function triggerMediaChange( wrapper, media ) {
			var urlField = wrapper.find( '.yith-plugin-fw-media__url-value' ),
				idField  = wrapper.find( '.yith-plugin-fw-media__id-value' );

			if ( ! media ) {
				urlField.length && urlField.val( '' ).trigger( 'change' );
				idField.length && idField.val( '' ).trigger( 'change' );
				updatePreview( wrapper, '' );
			} else {
				if ( typeof media.url !== 'undefined' && urlField.length && media.url !== urlField.val() ) {
					urlField.val( media.url ).trigger( 'change' );
				}

				if ( typeof media.id !== 'undefined' && idField.length && media.id !== idField.val() ) {
					idField.val( media.id ).trigger( 'change' );
				}

				if ( typeof media.url !== 'undefined' ) {
					updatePreview( wrapper, media.url );
				}
			}
		}

		function updatePreview( wrapper, mediaUrl ) {
			var preview         = wrapper.find( '.yith-plugin-fw-media__preview' ),
				previewImage    = preview.find( '.yith-plugin-fw-media__preview__image' ),
				previewFileName = preview.find( '.yith-plugin-fw-media__preview__file__name' );

			if ( ! mediaUrl ) {
				previewImage.attr( 'src', '' );
				preview.attr( 'data-type', 'upload' );
			} else {
				var isImage   = new RegExp( '(jpg|jpeg|png|gif|ico|svg|jpe|webp)$' ).test( mediaUrl ),
					mediaType = isImage ? 'image' : 'file';

				preview.attr( 'data-type', mediaType );
				if ( 'image' === mediaType ) {
					previewImage.attr( 'src', mediaUrl );
				} else {
					var filename = mediaUrl.substring( mediaUrl.lastIndexOf( '/' ) + 1 );
					previewFileName.html( filename );
				}
			}
		}

		/**
		 * Handle click on tab handler to switch between tabs.
		 * @param event
		 */
		function onTabHandlerClick( event ) {
			var handler         = $( event.target ).closest( '.yith-plugin-fw-media__tab' ),
				wrapper         = getWrapper( handler ),
				tabs            = wrapper.find( '.yith-plugin-fw-media__tab' ),
				contentElements = wrapper.find( '.yith-plugin-fw-media__content > *' ),
				tabSelector     = handler.data( 'tab-selector' ),
				activeElement   = wrapper.find( tabSelector );

			tabs.removeClass( 'yith-plugin-fw-media__tab--active' );
			handler.addClass( 'yith-plugin-fw-media__tab--active' );

			contentElements.hide();
			activeElement.show();
		}

		/**
		 * Handler fired when clicking on the delete media icon.
		 * @param event
		 */
		function onDeleteMedia( event ) {
			var wrapper = getWrapper( event.target );
			triggerMediaChange( wrapper, false );
		}

		/**
		 * Handler fired when manually changing the file URL in the URL field.
		 * @param event
		 */
		function onImageChange( event ) {
			var field   = $( event.target ),
				wrapper = getWrapper( field );
			updatePreview( wrapper, field.val() );
		}

		function onDragEnter( event ) {
			event.preventDefault();

			if ( ! event.dataTransfer ) {
				event.dataTransfer = event.originalEvent.dataTransfer;
			}

			event.dataTransfer.dropEffect = "copy";
			$( this ).closest( '.yith-plugin-fw-media__preview' ).addClass( 'yith-plugin-fw--is-dragging' );
		}

		function onDragOver( event ) {
			event.preventDefault();
		}

		function onDragLeave() {
			$( this ).closest( '.yith-plugin-fw-media__preview' ).removeClass( 'yith-plugin-fw--is-dragging' );
		}

		/**
		 * Add error notice.
		 * @param wrapper
		 * @param message
		 */
		function addErrorNotice( wrapper, message ) {
			var errorNotice = $( '<div>' );
			errorNotice.addClass( [ 'yith-plugin-fw__notice', 'yith-plugin-fw__notice--error', 'yith-plugin-fw-animate__appear-from-top', 'yith-plugin-fw--inline' ] );
			errorNotice.html( message );
			errorNotice.append( $( '<span class="yith-plugin-fw__notice__dismiss"></span>' ) );

			wrapper.append( errorNotice );
		}

		function onDrop( event ) {
			event.preventDefault();

			var preview = $( this ).closest( '.yith-plugin-fw-media__preview' );

			preview.removeClass( 'yith-plugin-fw--is-dragging' );
			preview.addClass( 'yith-plugin-fw--is-loading' );

			if ( ! event.dataTransfer ) {
				event.dataTransfer = event.originalEvent.dataTransfer;
			}

			var files        = event.dataTransfer.files,
				wrapper      = getWrapper( event.target ),
				errorNotices = wrapper.find( '.yith-plugin-fw__notice' ),
				onFinish     = function () {
					preview.removeClass( 'yith-plugin-fw--is-loading' );
				};

			errorNotices.remove();

			if ( files.length > 1 ) {
				files = files[ 0 ];
			}

			if ( ! files.length ) {
				addErrorNotice( wrapper, yith_framework_fw_fields.i18n.noFileError );
				onFinish();
			} else if ( 'mediaUtils' in wp && 'uploadMedia' in wp.mediaUtils ) {
				wp.mediaUtils.uploadMedia(
					{
						filesList   : files,
						onFileChange: function ( data ) {
							// Check for the ID, since uploadMedia triggers onFileChange at the start with a temporary blob URL to allow previewing it before uploading.
							if ( data && data.length && data[ 0 ] && 'id' in data[ 0 ] ) {
								triggerMediaChange( wrapper, data[ 0 ] );
								onFinish();

								// To allow re-loading media files on the next opening of the uploader.
								uploader.destroy();
							}
						},
						onError     : function ( data ) {
							console.error( data );
							onFinish();
							addErrorNotice( wrapper, data.message );
						}
					}
				);
			} else {
				addErrorNotice( wrapper, yith_framework_fw_fields.i18n.cannotDropError );
				onFinish();
			}

			maybeDragEnd();
		}

		function onUploadClick( e ) {
			e.preventDefault();

			var button  = $( this ),
				wrapper = getWrapper( button );

			uploader.open( wrapper );
		}

		$( document )
			.on( 'change', '.yith-plugin-fw-media__url-value', onImageChange )
			.on( 'click', '.yith-plugin-fw-media__preview__upload__link, .yith-plugin-fw-media__preview__action--edit', onUploadClick )
			.on( 'click', '.yith-plugin-fw-media__preview__action--delete', onDeleteMedia )
			.on( 'click', '.yith-plugin-fw-media__tab', onTabHandlerClick )
			.on( 'dragenter', '.yith-plugin-fw-media__preview__dropzone', onDragEnter )
			.on( 'dragover', '.yith-plugin-fw-media__preview__dropzone', onDragOver )
			.on( 'dragleave', '.yith-plugin-fw-media__preview__dropzone', onDragLeave )
			.on( 'drop', '.yith-plugin-fw-media__preview__dropzone', onDrop );

		function maybeDragStart() {
			if ( isDragging ) {
				return;
			}

			isDragging = true;

			document.addEventListener( 'dragend', maybeDragEnd );
			document.addEventListener( 'mousemove', maybeDragEnd );

			document.body.classList.add( 'yith-plugin-fw--dropzone-active' );
		}

		function maybeDragEnd() {
			if ( ! isDragging ) {
				return;
			}

			isDragging = false;

			document.removeEventListener( 'dragend', maybeDragEnd );
			document.removeEventListener( 'mousemove', maybeDragEnd );

			document.body.classList.remove( 'yith-plugin-fw--dropzone-active' );
		}

		document.addEventListener( 'dragenter', maybeDragStart );

	} )();

	/**
	 * File field.
	 */
	( function () {
		/**
		 * Get the wrapper of the file field.
		 * @param element JQuery element or dom element.
		 * @returns {*}
		 */
		function getWrapper( element ) {
			return $( element ).closest( '.yith-plugin-fw-file' );
		}

		function onDragOver() {
			getWrapper( this ).addClass( 'yith-plugin-fw--is-dragging' );
		}

		function onDragLeave() {
			getWrapper( this ).addClass( 'yith-plugin-fw--is-dragging' );
		}

		function onChange() {
			var wrapper = getWrapper( this ),
				name    = wrapper.find( '.yith-plugin-fw-file__preview__name' ),
				file    = this.files.length ? this.files[ 0 ] : false;

			wrapper.removeClass( 'yith-plugin-fw--is-dragging' );
			if ( file ) {
				name.html( file.name );
				wrapper.addClass( 'yith-plugin-fw--filled' );
			} else {
				wrapper.removeClass( 'yith-plugin-fw--filled' );
			}
		}

		$( document )
			.on( 'dragover', '.yith-plugin-fw-file', onDragOver )
			.on( 'dragleave', '.yith-plugin-fw-file', onDragLeave )
			.on( 'change', '.yith-plugin-fw-file__field', onChange );
	} )();

	// WP List - Auto Horizontal Scroll
	( function () {
		var selectors = [
			'.yith-plugin-ui--wp-list-auto-h-scroll .wp-list-table:not(.yith-plugin-ui-wp-list-auto-h-scroll--initialized)',
			'.yith-plugin-ui__wp-list-auto-h-scroll:not(.yith-plugin-ui-wp-list-auto-h-scroll--initialized)'
		];
		$( selectors.join( ',' ) ).each(
			function () {
				var table = $( this );
				table.wrap( '<div class="yith-plugin-ui__wp-list-auto-h-scroll__wrapper"><div class="yith-plugin-ui__wp-list-auto-h-scroll__scrollable"></div></div>' );

				var scrollable = table.parent( '.yith-plugin-ui__wp-list-auto-h-scroll__scrollable' ),
					wrapper    = scrollable.parent( '.yith-plugin-ui__wp-list-auto-h-scroll__wrapper' ),
					thead      = table.find( 'thead' ).first(),
					update     = function () {
						table.addClass( 'yith-plugin-ui__wp-list-auto-h-scroll--initializing' );

						table.css( { position: 'absolute', tableLayout: 'auto', width: 'max-content', minWidth: '' } );
						var minWidth = table.outerWidth();

						table.css( { position: '', tableLayout: '', width: '', minWidth: minWidth + 'px' } );

						if ( minWidth > scrollable.innerWidth() ) {
							wrapper.addClass( 'yith-plugin-ui--has-scrolling' )
						} else {
							wrapper.removeClass( 'yith-plugin-ui--has-scrolling' )
						}

						table.removeClass( 'yith-plugin-ui__wp-list-auto-h-scroll--initializing' );
						table.addClass( 'yith-plugin-ui__wp-list-auto-h-scroll--initialized' );
					};

				if ( table.is( '.yith-plugin-fw__classic-table' ) ) {
					wrapper.addClass( 'yith-plugin-ui__wp-list-auto-h-scroll__wrapper--classic' )
				} else if ( table.is( '.yith-plugin-fw__boxed-table' ) ) {
					wrapper.addClass( 'yith-plugin-ui__wp-list-auto-h-scroll__wrapper--boxed' )
				}

				scrollable.on( 'scroll', function () {
					if ( scrollable.scrollLeft() > 0 ) {
						wrapper.addClass( 'yith-plugin-ui--is-scrolling' );
					} else {
						wrapper.removeClass( 'yith-plugin-ui--is-scrolling' );
					}

					if ( scrollable.scrollLeft() + scrollable.innerWidth() >= scrollable[ 0 ].scrollWidth ) {
						wrapper.addClass( 'yith-plugin-ui--is-scrolled' );
					} else {
						wrapper.removeClass( 'yith-plugin-ui--is-scrolled' );
					}
				} );

				if ( typeof MutationObserver !== 'undefined' ) {
					var observer = new MutationObserver( update );
					observer.observe( thead.get( 0 ), { attributes: true, childList: true, subtree: true } );
				}

				$( window ).on( 'resize', update );

				update();
			}
		);
	} )();

} )( jQuery );
