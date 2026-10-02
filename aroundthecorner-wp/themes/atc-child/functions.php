<?php
/**
 * Around The Corner — child theme pentru Hello Elementor.
 *
 * - încarcă stilurile brandului după cele ale temei părinte și ale WooCommerce;
 * - „Cere ofertă” pentru echipamentele fără preț afișat;
 * - formulări pentru cursuri („Rezervă loc”, „X locuri disponibile”);
 * - shortcode-ul [atc_cursuri] care listează sesiunile viitoare cu locurile rămase.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ATC_CHILD_VERSION', '1.0.0' );

/** Slug-ul categoriei de produse pentru cursurile fizice (sesiuni cu dată). */
if ( ! defined( 'ATC_COURSE_CAT' ) ) {
	define( 'ATC_COURSE_CAT', 'cursuri' );
}

/** Pagina la care duc butoanele „Cere ofertă” (se poate schimba din wp-config.php). */
if ( ! defined( 'ATC_QUOTE_URL' ) ) {
	define( 'ATC_QUOTE_URL', '/contact/' );
}

add_action(
	'wp_enqueue_scripts',
	function () {
		$deps = array();
		foreach ( array( 'hello-elementor', 'hello-elementor-theme-style', 'woocommerce-general' ) as $h ) {
			if ( wp_style_is( $h, 'registered' ) ) {
				$deps[] = $h;
			}
		}
		wp_enqueue_style( 'atc-child', get_stylesheet_uri(), $deps, ATC_CHILD_VERSION );
	},
	20
);

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

function atc_is_course( $product ) {
	if ( ! $product ) {
		return false;
	}
	$id = $product->is_type( 'variation' ) ? $product->get_parent_id() : $product->get_id();
	return has_term( ATC_COURSE_CAT, 'product_cat', $id );
}

/** Echipament „la cerere”: fără preț sau în categoria „la-cerere”. */
function atc_is_quote_only( $product ) {
	if ( ! $product || atc_is_course( $product ) ) {
		return false;
	}
	$id = $product->is_type( 'variation' ) ? $product->get_parent_id() : $product->get_id();
	return '' === $product->get_price() || has_term( 'la-cerere', 'product_cat', $id );
}

function atc_quote_link( $product ) {
	return add_query_arg( 'produs', rawurlencode( $product->get_name() ), home_url( ATC_QUOTE_URL ) );
}

/**
 * Extrage data dintr-o valoare de atribut de tipul „15.11.2026 · București”.
 * Acceptă și formatul ISO „2026-11-15”. Întoarce timestamp sau null.
 */
function atc_parse_session_date( $label ) {
	if ( preg_match( '/(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/', $label, $m ) ) {
		return mktime( 0, 0, 0, (int) $m[2], (int) $m[1], (int) $m[3] );
	}
	if ( preg_match( '/(\d{4})-(\d{2})-(\d{2})/', $label, $m ) ) {
		return mktime( 0, 0, 0, (int) $m[2], (int) $m[3], (int) $m[1] );
	}
	return null;
}

function atc_month_ro( $ts ) {
	$months = array( 'ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec' );
	return $months[ (int) gmdate( 'n', $ts ) - 1 ] . ' ' . gmdate( 'Y', $ts );
}

/* ---------------------------------------------------------------------------
 * WooCommerce
 * ------------------------------------------------------------------------- */

add_action(
	'after_setup_theme',
	function () {
		add_theme_support( 'woocommerce' );
		add_theme_support( 'wc-product-gallery-zoom' );
		add_theme_support( 'wc-product-gallery-lightbox' );
		add_theme_support( 'wc-product-gallery-slider' );
	}
);

// Textul butonului: „Rezervă loc” la cursuri, „Cere ofertă” la echipamentele fără preț.
add_filter(
	'woocommerce_product_add_to_cart_text',
	function ( $text, $product ) {
		if ( atc_is_course( $product ) ) {
			return $product->is_type( 'variable' ) ? 'Alege data' : 'Rezervă loc';
		}
		if ( atc_is_quote_only( $product ) ) {
			return 'Cere ofertă';
		}
		return $text;
	},
	10,
	2
);

add_filter(
	'woocommerce_product_single_add_to_cart_text',
	function ( $text, $product ) {
		return atc_is_course( $product ) ? 'Rezervă loc' : $text;
	},
	10,
	2
);

// În listă, butonul „Cere ofertă” duce direct la formularul de contact.
add_filter(
	'woocommerce_loop_add_to_cart_link',
	function ( $html, $product ) {
		if ( ! atc_is_quote_only( $product ) ) {
			return $html;
		}
		return sprintf(
			'<a href="%s" class="button atc-quote-btn">%s</a>',
			esc_url( atc_quote_link( $product ) ),
			esc_html__( 'Cere ofertă', 'atc-child' )
		);
	},
	10,
	2
);

// Produsele „la-cerere” nu pot fi cumpărate direct, chiar dacă au preț orientativ.
add_filter(
	'woocommerce_is_purchasable',
	function ( $purchasable, $product ) {
		$id = $product->is_type( 'variation' ) ? $product->get_parent_id() : $product->get_id();
		return has_term( 'la-cerere', 'product_cat', $id ) ? false : $purchasable;
	},
	10,
	2
);

// Pe pagina produsului: buton „Cere ofertă”.
add_action(
	'woocommerce_single_product_summary',
	function () {
		global $product;
		if ( ! atc_is_quote_only( $product ) ) {
			return;
		}
		printf(
			'<div class="atc-quote"><a class="atc-btn" href="%s">%s</a><p class="atc-quote__note">%s</p></div>',
			esc_url( atc_quote_link( $product ) ),
			esc_html__( 'Cere ofertă', 'atc-child' ),
			esc_html__( 'Preț de partener, leasing sau închiriere cu opțiune de cumpărare. Instalare, training și service incluse.', 'atc-child' )
		);
	},
	31
);

// Stocul cursurilor = locuri.
add_filter(
	'woocommerce_get_availability_text',
	function ( $text, $product ) {
		if ( ! atc_is_course( $product ) ) {
			return $text;
		}
		if ( ! $product->is_in_stock() ) {
			return 'Sesiune completă';
		}
		$q = $product->get_stock_quantity();
		if ( null === $q ) {
			return $text;
		}
		return 1 === (int) $q ? 'Ultimul loc disponibil' : sprintf( '%d locuri disponibile', (int) $q );
	},
	10,
	2
);

/* ---------------------------------------------------------------------------
 * [atc_cursuri] — sesiunile viitoare ale cursurilor fizice
 *
 * Fiecare curs = produs variabil din categoria „cursuri”, cu un atribut (ex. „Data”)
 * ale cărui valori sunt sesiunile: „15.11.2026 · București”. Stocul variației = locuri.
 *
 * Atribute shortcode:
 *   categorie="cursuri"  slug-ul categoriei
 *   limit="0"            câte sesiuni să afișeze (0 = toate)
 *   curs=""              ID-ul sau slug-ul unui singur curs
 *   trecute="nu"         „da” afișează și sesiunile trecute
 * ------------------------------------------------------------------------- */

add_shortcode(
	'atc_cursuri',
	function ( $atts ) {
		if ( ! function_exists( 'wc_get_products' ) ) {
			return '';
		}
		$a = shortcode_atts(
			array(
				'categorie' => ATC_COURSE_CAT,
				'limit'     => 0,
				'curs'      => '',
				'trecute'   => 'nu',
			),
			$atts,
			'atc_cursuri'
		);

		$args = array(
			'status'   => 'publish',
			'limit'    => -1,
			'category' => array( sanitize_title( $a['categorie'] ) ),
			'type'     => array( 'variable', 'simple' ),
		);
		if ( '' !== $a['curs'] ) {
			unset( $args['category'] );
			if ( is_numeric( $a['curs'] ) ) {
				$args['include'] = array( (int) $a['curs'] );
			} else {
				$args['slug'] = sanitize_title( $a['curs'] );
			}
		}

		$today    = strtotime( 'today', current_time( 'timestamp' ) );
		$sessions = array();

		foreach ( wc_get_products( $args ) as $course ) {
			$items = $course->is_type( 'variable' ) ? array_filter( array_map( 'wc_get_product', $course->get_children() ) ) : array( $course );
			foreach ( $items as $item ) {
				if ( 'publish' !== get_post_status( $item->get_id() ) ) {
					continue;
				}
				// Numele afișat al atributelor (nu slug-ul), ex. „15.11.2026 · București”.
				$label = $item->is_type( 'variation' ) ? wc_get_formatted_variation( $item, true, false, false ) : '';
				$ts = atc_parse_session_date( $label );
				if ( $ts && $ts < $today && 'da' !== $a['trecute'] ) {
					continue;
				}
				$sessions[] = array(
					'course' => $course,
					'item'   => $item,
					'label'  => $label,
					'ts'     => $ts ? $ts : PHP_INT_MAX,
				);
			}
		}

		usort(
			$sessions,
			function ( $x, $y ) {
				return $x['ts'] <=> $y['ts'];
			}
		);
		if ( (int) $a['limit'] > 0 ) {
			$sessions = array_slice( $sessions, 0, (int) $a['limit'] );
		}

		if ( ! $sessions ) {
			return '<p class="atc-sessions__empty">Următoarele sesiuni se anunță în curând. <a href="' . esc_url( home_url( ATC_QUOTE_URL ) ) . '">Scrie-ne</a> ca să te anunțăm primul.</p>';
		}

		ob_start();
		echo '<ul class="atc-sessions">';
		foreach ( $sessions as $s ) {
			$item   = $s['item'];
			$course = $s['course'];
			$ts     = PHP_INT_MAX === $s['ts'] ? null : $s['ts'];
			$place  = trim( preg_replace( '/^\s*(\d{1,2}[.\/]\d{1,2}[.\/]\d{4}|\d{4}-\d{2}-\d{2})\s*[·,\-–]?\s*/u', '', $s['label'] ) );
			$stock  = $item->managing_stock() ? (int) $item->get_stock_quantity() : null;
			$open   = $item->is_in_stock() && $item->is_purchasable();

			if ( ! $open ) {
				$seats = 'Sesiune completă';
			} elseif ( null === $stock ) {
				$seats = 'Locuri disponibile';
			} else {
				$seats = 1 === $stock ? 'Ultimul loc' : sprintf( '%d locuri rămase', $stock );
			}
			$low = $open && null !== $stock && $stock <= 3;
			?>
			<li class="atc-session atc-reveal">
				<div class="atc-session__date">
					<?php if ( $ts ) : ?>
						<span class="atc-session__day"><?php echo esc_html( gmdate( 'd', $ts ) ); ?></span>
						<span class="atc-session__month"><?php echo esc_html( atc_month_ro( $ts ) ); ?></span>
					<?php else : ?>
						<span class="atc-session__month">În curând</span>
					<?php endif; ?>
				</div>
				<div class="atc-session__body">
					<h3 class="atc-session__title"><a href="<?php echo esc_url( $course->get_permalink() ); ?>"><?php echo esc_html( $course->get_name() ); ?></a></h3>
					<p class="atc-session__meta">
						<?php if ( $place ) : ?>
							<?php echo esc_html( $place ); ?> ·
						<?php endif; ?>
						<span class="atc-session__seats<?php echo $low ? ' is-low' : ''; ?>"><?php echo esc_html( $seats ); ?></span>
					</p>
				</div>
				<div class="atc-session__side">
					<span class="atc-session__price"><?php echo wp_kses_post( $item->get_price_html() ); ?></span>
					<?php if ( $open ) : ?>
						<a class="atc-btn" href="<?php echo esc_url( $item->add_to_cart_url() ); ?>" rel="nofollow">Rezervă loc</a>
					<?php else : ?>
						<span class="atc-btn" aria-disabled="true">Complet</span>
					<?php endif; ?>
				</div>
			</li>
			<?php
		}
		echo '</ul>';
		return ob_get_clean();
	}
);
