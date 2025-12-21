import { div } from 'elit';
import type { Router } from 'elit';
import { Hero, Stats, Features, QuickStart, PerformanceBenchmark, WhyElit, CodeComparison, ElitVsNextjs, FrameworkComparison, FeaturedExamples, FeaturedBlogs, ApiOverview } from '../components';

export const HomePage = (router: Router) =>
  div(
    Hero(router),
    Stats(),
    Features(),
    QuickStart(router),
    PerformanceBenchmark(),
    CodeComparison(),
    ElitVsNextjs(),
    FrameworkComparison(),
    WhyElit(),
    FeaturedExamples(router),
    FeaturedBlogs(router),
    ApiOverview(router)
  );
