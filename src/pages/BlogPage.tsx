import './blog.css'
import type { BlogConfig } from "@/types/content";
import { CalendarDays, HeartPulse, Rss } from "lucide-react";

interface BlogPageProps {
  blog: BlogConfig;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function BlogPage({ blog }: BlogPageProps) {
  return (
    <main className="page-grid fitness-page">
      <section className="panel reveal fitness-hero">
        <p className="kicker">
          <Rss size={16} />
          {blog.kicker}
        </p>
        <h1>{blog.title}</h1>
        <p>{blog.description}</p>
      </section>

      <section className="panel reveal fitness-jump">
        <p className="kicker">
          <HeartPulse size={16} />
          Jump To Post
        </p>
        <div className="fitness-jump-row">
          {blog.posts.map((post) => (
            <a key={post.id} href={`#${post.id}`} className="social-pill">
              {post.title}
            </a>
          ))}
        </div>
      </section>

      <section className="fitness-post-list">
        {blog.posts.map((post) => (
          <article
            key={post.id}
            id={post.id}
            className="panel reveal fitness-post"
          >
            <div className="fitness-post-visual">
              <img src={post.coverImage} alt={post.coverAlt} loading="lazy" />
            </div>

            <div className="fitness-post-body">
              <div className="fitness-post-meta">
                <p className="kicker">
                  <CalendarDays size={14} />
                  {formatDate(post.publishedAt)}
                </p>
                <div className="fitness-tag-row">
                  {post.tags.map((tag) => (
                    <span key={`${post.id}-${tag}`} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <h2>{post.title}</h2>
              <p className="fitness-excerpt">{post.excerpt}</p>

              {post.html ? (
                <div
                  className="fitness-copy fitness-copy-html"
                  dangerouslySetInnerHTML={{ __html: post.html }}
                />
              ) : (
                <div className="fitness-copy">
                  {post.paragraphs.map((paragraph, index) => (
                    <p key={`${post.id}-paragraph-${index}`}>{paragraph}</p>
                  ))}
                </div>
              )}

              {post.checklist && post.checklist.length > 0 ? (
                <ul className="fitness-checklist">
                  {post.checklist.map((item, index) => (
                    <li key={`${post.id}-check-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
