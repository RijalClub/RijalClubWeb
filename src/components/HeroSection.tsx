import type { ProfileConfig } from "@/types/content";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface HeroSectionProps {
  profile: ProfileConfig;
}

export function HeroSection({ profile }: HeroSectionProps) {
  return (
    <section className="panel hero reveal">
      <div className="hero-copy">
        <p className="kicker">
          <Sparkles size={16} />
          Knowledgehood Collective
        </p>
        <h1>{profile.name}</h1>
        <p className="hero-tagline">{profile.handle}</p>
        <p className="hero-description">{profile.description}</p>

        <div className="value-chips">
          {profile.values.map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>

        <div className="hero-actions">
          <a
            href={profile.primaryCta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-solid"
          >
            {profile.primaryCta.label}
            <ArrowUpRight size={16} />
          </a>
          <a
            href={profile.secondaryCta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
          >
            {profile.secondaryCta.label}
          </a>
        </div>

        <div className="hero-stats">
          {profile.stats.map((stat) => (
            <article key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </div>

      <div className="hero-visual">
        <img src={profile.heroImage} alt="Rijal Club hero" />
      </div>
    </section>
  );
}
