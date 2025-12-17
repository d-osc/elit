import { div } from 'elit';
import type { Router } from 'elit';
import { Hero, Stats, Features, QuickStart, WhyElit, CodeComparison, FeaturedBlogs, ApiOverview } from '../components';

export const HomePage = (router: Router) =>
  div(
    Hero(router),
    Stats(),
    Features(),
    QuickStart(router),
    CodeComparison(),
    WhyElit(),
    FeaturedBlogs(router),
    ApiOverview(router)
  );
