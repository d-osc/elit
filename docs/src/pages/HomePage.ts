import { div } from 'elit';
import type { Router } from 'elit';
import { Hero, Stats, Features, QuickStart, WhyElit, CodeComparison, ElitVsNextjs, FeaturedBlogs, ApiOverview } from '../components';

export const HomePage = (router: Router) =>
  div(
    Hero(router),
    Stats(),
    Features(),
    QuickStart(router),
    CodeComparison(),
    ElitVsNextjs(),
    WhyElit(),
    FeaturedBlogs(router),
    ApiOverview(router)
  );
