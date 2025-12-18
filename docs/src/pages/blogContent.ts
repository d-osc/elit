// Blog post full content type
export interface BlogPostDetail {
  id: string;
  title: { en: string; th: string };
  date: string;
  author: string;
  tags: string[];
  content: { en: any; th: any }; // VNode content
}

// Import individual blog posts
import { blog1, blog2, blog3, blog4, blog5, blog6, blog7, blog8, blog9, blog10, blog11, blog12, blog13, blog14, blog15, blog16, blog17, blog18 } from './blogs/index.ts';

// Export all blog posts
export const blogPostsDetail: BlogPostDetail[] = [
  blog1,
  blog2,
  blog3,
  blog4,
  blog5,
  blog6,
  blog7,
  blog8,
  blog9,
  blog10,
  blog11,
  blog12,
  blog13,
  blog14,
  blog15,
  blog16,
  blog17,
  blog18
];
