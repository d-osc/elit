import { dom, div, main, reactive } from 'elit';
import { injectStyles } from './styles';
import { Header, Footer } from './components';
import { router, RouterView } from './router';
import { setupSeo } from './seo';
import './index.css';

// Inject styles
injectStyles();
setupSeo(router);

// Main App
const App = () =>
  div(
    Header(router),
    main(
      reactive(router.currentRoute, () => RouterView())
    ),
    Footer()
  );

// Render
dom.render('#app', App());
