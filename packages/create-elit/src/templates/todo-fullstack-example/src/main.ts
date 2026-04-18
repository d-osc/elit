import { dom } from 'elit/dom';
import { injectStyles } from './styles';
import { App } from './web';

injectStyles();

dom.render('#app', App());
