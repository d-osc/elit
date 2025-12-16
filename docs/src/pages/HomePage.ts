import { div } from 'elit';
import type { Router } from 'elit';
import { Hero, Stats, Features, QuickStart, WhyElit, CodeComparison, ApiOverview } from '../components';

export const HomePage = (router: Router) =>
  div(
    Hero(router),
    Stats(),
    Features(),
    QuickStart(router),
    CodeComparison(),
    WhyElit(),
    ApiOverview(router)
  );
