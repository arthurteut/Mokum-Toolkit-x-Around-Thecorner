<?php
/**
 * Plugin Name:       ATC Motion
 * Plugin URI:        https://aroundthecorner.ro
 * Description:       Animații cinematice pentru aroundthecorner.ro (GSAP + ScrollTrigger + SplitText + Lenis). Se activează prin clase CSS puse pe elementele din Elementor. Vezi Setări → ATC Motion.
 * Version:           1.0.0
 * Requires at least: 6.2
 * Requires PHP:      7.4
 * Author:            Around The Corner
 * License:           GPL-2.0-or-later
 * Text Domain:       atc-motion
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ATC_MOTION_VERSION', '1.0.0' );
define( 'ATC_MOTION_URL', plugin_dir_url( __FILE__ ) );

/**
 * Opțiunile pluginului, cu valori implicite.
 */
function atc_motion_options() {
	$defaults = array(
		'smooth'    => 1,
		'progress'  => 1,
		'cursor'    => 0,
		'preloader'   => 0,
		'transitions' => 0,
		'markers'     => 0,
	);
	$saved = get_option( 'atc_motion', array() );
	return wp_parse_args( is_array( $saved ) ? $saved : array(), $defaults );
}

/**
 * Suntem în editorul / previzualizarea Elementor? Acolo nu animăm nimic.
 */
function atc_motion_is_editor() {
	if ( isset( $_GET['elementor-preview'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		return true;
	}
	if ( did_action( 'elementor/loaded' ) && class_exists( '\Elementor\Plugin' ) ) {
		$el = \Elementor\Plugin::$instance;
		if ( isset( $el->preview ) && $el->preview->is_preview_mode() ) {
			return true;
		}
	}
	return false;
}

/**
 * Pe paginile de coș / checkout / cont păstrăm scroll-ul nativ (formulare, dropdown-uri).
 */
function atc_motion_is_commerce_page() {
	if ( function_exists( 'is_cart' ) && ( is_cart() || is_checkout() || is_account_page() ) ) {
		return true;
	}
	return false;
}

add_action(
	'wp_enqueue_scripts',
	function () {
		if ( atc_motion_is_editor() ) {
			return;
		}
		$o   = atc_motion_options();
		$url = ATC_MOTION_URL . 'assets/';
		$v   = ATC_MOTION_VERSION;

		wp_enqueue_style( 'atc-motion', $url . 'atc-motion.css', array(), $v );

		wp_register_script( 'atc-gsap', $url . 'vendor/gsap.min.js', array(), '3.15.0', true );
		wp_register_script( 'atc-scrolltrigger', $url . 'vendor/ScrollTrigger.min.js', array( 'atc-gsap' ), '3.15.0', true );
		wp_register_script( 'atc-splittext', $url . 'vendor/SplitText.min.js', array( 'atc-gsap' ), '3.15.0', true );
		$deps = array( 'atc-gsap', 'atc-scrolltrigger', 'atc-splittext' );

		$smooth = $o['smooth'] && ! atc_motion_is_commerce_page();
		if ( $smooth ) {
			wp_enqueue_style( 'atc-lenis', $url . 'vendor/lenis.css', array(), '1.3.26' );
			wp_register_script( 'atc-lenis', $url . 'vendor/lenis.min.js', array(), '1.3.26', true );
			$deps[] = 'atc-lenis';
		}

		wp_enqueue_script( 'atc-motion', $url . 'atc-motion.js', $deps, $v, true );
		wp_add_inline_script(
			'atc-motion',
			'window.ATC_MOTION_CONFIG = ' . wp_json_encode(
				array(
					'smooth'    => (bool) $smooth,
					'progress'  => (bool) $o['progress'],
					'cursor'    => (bool) $o['cursor'],
					'preloader'   => (bool) $o['preloader'],
					'transitions' => (bool) $o['transitions'],
					'markers'     => (bool) $o['markers'] && current_user_can( 'manage_options' ),
				)
			) . ';',
			'before'
		);
	}
);

/**
 * Script minuscul în <head>: ascunde elementele ce urmează să fie animate, înainte de prima afișare.
 * Dacă motorul nu pornește în 4 secunde, totul redevine vizibil.
 */
add_action(
	'wp_head',
	function () {
		if ( atc_motion_is_editor() ) {
			return;
		}
		?>
<script id="atc-motion-head">(function(d){if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;var h=d.documentElement;h.classList.add('atc-js');try{if(sessionStorage.getItem('atcPreloaded'))h.classList.add('atc-no-preload');if(sessionStorage.getItem('atcPT'))h.classList.add('atc-pt-in','atc-no-preload')}catch(e){}window.__atcFailsafe=setTimeout(function(){h.classList.remove('atc-js')},4000)})(document);</script>
		<?php
	},
	1
);

add_action(
	'wp_body_open',
	function () {
		$o = atc_motion_options();
		if ( ! $o['preloader'] || atc_motion_is_editor() || atc_motion_is_commerce_page() ) {
			return;
		}
		?>
<div class="atc-preloader" aria-hidden="true">
	<div class="atc-preloader__brand"><span>Around</span><span>The</span><span>Corner</span></div>
	<div class="atc-preloader__count">0</div>
</div>
		<?php
	}
);

/* ---------------------------------------------------------------------------
 * Setări → ATC Motion
 * ------------------------------------------------------------------------- */

add_action(
	'admin_init',
	function () {
		register_setting(
			'atc_motion',
			'atc_motion',
			array(
				'type'              => 'array',
				'sanitize_callback' => function ( $in ) {
					$out = array();
					foreach ( array( 'smooth', 'progress', 'cursor', 'preloader', 'transitions', 'markers' ) as $k ) {
						$out[ $k ] = empty( $in[ $k ] ) ? 0 : 1;
					}
					return $out;
				},
			)
		);
	}
);

add_action(
	'admin_menu',
	function () {
		add_options_page( 'ATC Motion', 'ATC Motion', 'manage_options', 'atc-motion', 'atc_motion_settings_page' );
	}
);

add_filter(
	'plugin_action_links_' . plugin_basename( __FILE__ ),
	function ( $links ) {
		array_unshift( $links, '<a href="' . esc_url( admin_url( 'options-general.php?page=atc-motion' ) ) . '">Setări</a>' );
		return $links;
	}
);

function atc_motion_settings_page() {
	$o      = atc_motion_options();
	$fields = array(
		'smooth'    => array( 'Scroll fin (Lenis)', 'Derulare fluidă, „cinematică”. Dezactivat automat pe coș, checkout și contul clientului.' ),
		'progress'  => array( 'Bară de progres', 'Linie aurie subțire, sus, care arată cât ai derulat din pagină.' ),
		'cursor'    => array( 'Cursor custom', 'Punct auriu care crește peste linkuri; doar pe desktop.' ),
		'preloader'   => array( 'Preloader', 'Ecran de intrare cu numărătoare 0→100, o singură dată pe sesiune.' ),
		'transitions' => array( 'Tranziții între pagini', 'La click pe un link intern, trei benzi verzi închid pagina și se deschid pe următoarea. Scoate scriptul vechi de fade-in/fade-out din Elementor dacă îl activezi.' ),
		'markers'   => array( 'Markeri de depanare', 'Arată (doar administratorilor) unde încep și se termină animațiile la scroll.' ),
	);
	$classes = array(
		array( 'atc-curtain', 'Trei benzi verzi se ridică pe rând și dezvăluie secțiunea (intro).', 'data-atc-strips|3, --alt (benzile alternează sus/jos)' ),
		array( 'atc-bg-zoom', 'Fundalul secțiunii intră cu zoom-out și se mișcă lent la scroll.', '--focus (pornește încețoșat), --drift (urmărește mouse-ul), data-atc-blur|2' ),
		array( 'atc-tiles', 'Grilă de plăci: intră cu rotire 3D, iconițele sar, lumină aurie după mouse.', 'pe secțiunea interioară / containerul plăcilor' ),
		array( 'atc-spotlight', 'Lumină aurie care urmărește mouse-ul pe un card.', '' ),
		array( 'atc-reveal', 'Elementul apare cu fade + glisare de jos.', '--left, --right, --scale, atc-delay-1…9' ),
		array( 'atc-stagger', 'Pe un container: copiii apar pe rând.', 'atribut data-atc-stagger|0.15' ),
		array( 'atc-split', 'Titlu dezvăluit linie cu linie (mască).', '--words, --chars, --instant (fără scroll, pt. hero)' ),
		array( 'atc-scrub-text', 'Paragraf ale cărui cuvinte se „aprind” pe măsură ce derulezi.', '' ),
		array( 'atc-mask', 'Imagine dezvăluită printr-o cortină + zoom-out.', '--left' ),
		array( 'atc-parallax', 'Imaginea / elementul se mișcă mai lent decât pagina.', '--slow, --fast, --self (mișcă tot blocul, nu doar poza), data-atc-speed|0.3' ),
		array( 'atc-zoom', 'Imaginea face zoom-out cât traversează ecranul.', 'data-atc-from|1.3' ),
		array( 'atc-hero-out', 'Secțiunea se micșorează și se estompează când o părăsești.', '' ),
		array( 'atc-pin', 'Secțiune fixată; elementele .atc-pin-step din ea apar pe rând.', '--replace (fiecare pas îl înlocuiește pe precedent)' ),
		array( 'atc-expand', 'Secțiune fixată în care imaginea crește din card până pe tot ecranul; .atc-expand__text apare la final.', 'data-atc-inset|18, data-atc-length|140' ),
		array( 'atc-hscroll', 'Galerie orizontală fixată. Containerul interior primește atc-hscroll__track.', 'pe mobil devine bandă cu swipe' ),
		array( 'atc-stack', 'Carduri care se suprapun la scroll (copiii containerului sau .atc-stack__card).', 'data-atc-top|90' ),
		array( 'atc-counter', 'Cifra din text se numără de la 0 („200+”, „25%”, „±1 g”).', 'data-atc-duration|2' ),
		array( 'atc-marquee', 'Bandă infinită (ex. logo-uri parteneri), reacționează la scroll.', '--reverse, data-atc-duration|30' ),
		array( 'atc-draw', 'Liniile unui SVG se desenează la scroll.', '' ),
		array( 'atc-magnetic', 'Butonul e „atras” de cursor.', 'data-atc-strength|0.35' ),
		array( 'atc-tilt', 'Card care se înclină 3D după mouse.', 'data-atc-tilt|7' ),
		array( 'atc-steam', 'Abur animat peste imagine (ceașcă, espressor).', 'data-atc-steam-x|0.5, data-atc-steam-y|0.75' ),
		array( 'data-atc-bg', '(atribut) Fundalul paginii trece lin la această culoare.', 'data-atc-bg|#25332c' ),
		array( 'data-atc-cursor', '(atribut) Cursorul afișează un text peste element.', 'data-atc-cursor|Vezi' ),
	);
	?>
	<div class="wrap">
		<h1>ATC Motion</h1>
		<p>Animațiile se pornesc punând <strong>clase CSS</strong> pe elemente în Elementor: <em>Advanced → CSS Classes</em>. Opțiunile cu <code>data-atc-…</code> se pun în <em>Advanced → Attributes</em> (Elementor Pro), în formatul <code>cheie|valoare</code>, câte unul pe rând.</p>
		<form method="post" action="options.php">
			<?php settings_fields( 'atc_motion' ); ?>
			<table class="form-table" role="presentation">
				<?php foreach ( $fields as $key => $f ) : ?>
					<tr>
						<th scope="row"><?php echo esc_html( $f[0] ); ?></th>
						<td>
							<label><input type="checkbox" name="atc_motion[<?php echo esc_attr( $key ); ?>]" value="1" <?php checked( $o[ $key ], 1 ); ?>> <?php echo esc_html( $f[1] ); ?></label>
						</td>
					</tr>
				<?php endforeach; ?>
			</table>
			<?php submit_button( 'Salvează' ); ?>
		</form>

		<h2>Clase disponibile</h2>
		<table class="widefat striped" style="max-width:1100px">
			<thead><tr><th>Clasă / atribut</th><th>Ce face</th><th>Variante</th></tr></thead>
			<tbody>
			<?php foreach ( $classes as $c ) : ?>
				<tr><td><code><?php echo esc_html( $c[0] ); ?></code></td><td><?php echo esc_html( $c[1] ); ?></td><td><?php echo esc_html( $c[2] ); ?></td></tr>
			<?php endforeach; ?>
			</tbody>
		</table>
		<p style="margin-top:16px">În editorul Elementor animațiile sunt oprite, ca să poți edita liniștit; le vezi pe pagina publicată. Vizitatorii care au activat „reduce motion” în sistem văd pagina statică.</p>
	</div>
	<?php
}
