import { div, h1, section, p, span } from 'elit';
import { reactive, routerLink } from 'elit';
import type { Router } from 'elit';
import { currentLang } from '../i18n';
import { blogPostsDetail } from './blogContent';

// Format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Blog detail page component
export const BlogDetailPage = (router: Router, blogId: string) => {
  const post = blogPostsDetail.find(p => p.id === blogId);

  if (!post) {
    return section({ className: 'container', style: 'padding-top: 6rem;' },
      div({ className: 'blog-detail' },
        h1('404 - Blog Post Not Found'),
        p('The blog post you\'re looking for doesn\'t exist.'),
        routerLink(router, { to: '/blog', className: 'btn btn-primary', style: 'margin-top: 2rem;' }, '← Back to Blog')
      )
    );
  }

  return section({ className: 'container', style: 'padding-top: 6rem;' },
    reactive(currentLang, () =>
      div({ className: 'blog-detail' },
        routerLink(router, { to: '/blog', className: 'blog-back-link' },
          currentLang.value === 'th' ? '← กลับไปบล็อก' : '← Back to Blog'
        ),

        h1({ className: 'blog-detail-title' },
          currentLang.value === 'th' ? post.title.th : post.title.en
        ),

        div({ className: 'blog-detail-meta' },
          span({ className: 'blog-detail-date' }, formatDate(post.date)),
          span({ className: 'blog-detail-separator' }, '•'),
          span({ className: 'blog-detail-author' }, post.author)
        ),

        div({ className: 'blog-detail-tags' },
          ...post.tags.map(tag => span({ className: 'blog-tag' }, tag))
        ),

        div({ className: 'blog-detail-content' },
          currentLang.value === 'th' ? post.content.th : post.content.en
        )
      )
    )
  );
};
