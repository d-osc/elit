import styles from '../../../src/style';

const paper = styles.addVar('paper', '#f8f0e4');
const ink = styles.addVar('ink', '#261914');
const ember = styles.addVar('ember', '#d56e43');
const clay = styles.addVar('clay', '#b75a36');
const line = styles.addVar('line', 'rgba(38, 25, 20, 0.12)');

styles.addTag('*', {
    boxSizing: 'border-box',
    margin: 0,
    padding: 0,
});

styles.addTag('body', {
    fontFamily: '"Avenir Next", "Trebuchet MS", sans-serif',
    background: 'linear-gradient(180deg, #f7e7d2 0%, #f0d7ba 100%)',
    color: ink.toString(),
    minHeight: '100vh',
});

styles.addClass('page', {
    background: 'linear-gradient(180deg, #f7e7d2 0%, #f0d7ba 100%)',
    minHeight: '100vh',
    padding: '40px 24px 80px',
});

styles.addClass('shell', {
    maxWidth: '1080px',
    margin: '0 auto',
    display: 'grid',
    gap: '20px',
});

styles.addClass('hero', {
    padding: '32px',
    borderRadius: '28px',
    background: 'rgba(255, 252, 247, 0.82)',
    border: `1px solid ${line.toString()}`,
    boxShadow: '0 24px 80px rgba(102, 61, 35, 0.12)',
    backdropFilter: 'blur(18px)',
});

styles.addClass('hero-layout', {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
});

styles.addClass('hero-copy', {
    display: 'grid',
    gap: '12px',
    flex: 1,
});

styles.addClass('hero-mark', {
    width: '84px',
    height: '84px',
    borderRadius: '22px',
    flexShrink: 0,
    boxShadow: '0 18px 48px rgba(102, 61, 35, 0.18)',
});

styles.addTag('h1', {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 'clamp(2.4rem, 5vw, 4.4rem)',
    lineHeight: 1,
    marginBottom: '16px',
    color: ink.toString(),
});

styles.addTag('h2', {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '1.45rem',
    marginBottom: '14px',
    color: ink.toString(),
});

styles.addTag('p', {
    lineHeight: 1.7,
});

styles.child('.panel', 'h2', {
    color: ink.toString(),
    fontSize: '23px',
    fontWeight: 700,
});

styles.child('.field-label', 'span', {
    color: ink.toString(),
    fontWeight: 700,
});

styles.addClass('lede', {
    maxWidth: '720px',
    fontSize: '1.05rem',
    color: '#5d4335',
});

styles.addClass('surface-grid', {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
});

styles.addClass('surface-card', {
    padding: '20px',
    borderRadius: '22px',
    background: paper.toString(),
    border: `1px solid ${line.toString()}`,
});

styles.addClass('surface-id', {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    background: 'rgba(213, 110, 67, 0.12)',
    color: ember.toString(),
    marginBottom: '10px',
    fontSize: '0.78rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
});

styles.addClass('panel-grid', {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: '20px',
});

styles.addClass('panel', {
    padding: '24px',
    borderRadius: '24px',
    background: 'rgba(255, 249, 241, 0.92)',
    border: `1px solid ${line.toString()}`,
});

styles.addClass('meta-list', {
    listStyle: 'none',
    display: 'grid',
    gap: '10px',
});

styles.addClass('meta-item', {
    padding: '12px 14px',
    borderRadius: '16px',
    background: '#fff',
    border: `1px solid ${line.toString()}`,
});

styles.addClass('form-grid', {
    display: 'grid',
    gap: '14px',
});

styles.addClass('field-label', {
    display: 'grid',
    gap: '6px',
    fontWeight: 700,
    color: ink.toString(),
});

styles.multiple(['input', 'textarea'], {
    width: '100%',
    borderRadius: '16px',
    border: `1px solid ${line.toString()}`,
    background: '#fff',
    padding: '14px 16px',
    color: ink.toString(),
    font: 'inherit',
});

styles.addClass('toggle-row', {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#5d4335',
});

styles.addClass('button-row', {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
});

styles.addClass('btn', {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 18px',
    borderRadius: '999px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    font: 'inherit',
    lineHeight: 1.2,
    textDecoration: 'none',
});

styles.addClass('btn-primary', {
    background: `linear-gradient(135deg, ${ember.toString()} 0%, ${clay.toString()} 100%)`,
    color: '#fff6ee',
});

styles.addClass('btn-secondary', {
    background: '#fff',
    color: ink.toString(),
    border: `1px solid ${line.toString()}`,
});

styles.addPseudoClass('hover', {
    transform: 'translateY(-1px)',
    boxShadow: '0 10px 28px rgba(102, 61, 35, 0.15)',
}, '.btn');

styles.addClass('status', {
    padding: '14px 16px',
    borderRadius: '16px',
    background: 'rgba(213, 110, 67, 0.1)',
    color: '#6a412d',
});

styles.child('.toggle-row', 'input[type="checkbox"]', {
    width: '20px',
    minWidth: '20px',
    height: '20px',
    padding: 0,
});

styles.addClass('link', {
    color: clay.toString(),
    fontWeight: 700,
    textDecoration: 'none',
});

styles.addPseudoClass('hover', {
    textDecoration: 'underline',
}, '.link');

styles.mediaMaxWidth(800, {
    '.panel-grid': {
        gridTemplateColumns: '1fr',
    },
    '.page': {
        padding: '20px 16px 48px',
    },
    '.hero': {
        padding: '24px',
    },
    '.hero-layout': {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    '.hero-mark': {
        width: '72px',
        height: '72px',
    },
});

export const UNIVERSAL_APP_STYLE_ID = 'universal-app-styles';
export const universalAppCss = styles.render();

if (typeof document !== 'undefined' && !document.getElementById(UNIVERSAL_APP_STYLE_ID)) {
    styles.inject(UNIVERSAL_APP_STYLE_ID);
}
