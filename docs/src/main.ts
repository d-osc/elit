import { domNode, div, main, reactive } from 'elit';
import { injectStyles } from './styles';
import { Header, Footer } from './components';
import { router, RouterView } from './router';

// Inject styles
injectStyles();

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
domNode.render('#app', App());
