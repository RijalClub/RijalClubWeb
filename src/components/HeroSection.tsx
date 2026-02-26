import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProfileConfig } from "@/types/content";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

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
            <Badge key={value} variant="secondary">
              {value}
            </Badge>
          ))}
        </div>

        <div className="hero-actions">
          <Button asChild className="btn btn-solid">
            <a href={profile.primaryCta.url} target="_blank" rel="noopener noreferrer">
              {profile.primaryCta.label}
              <ArrowUpRight size={16} />
            </a>
          </Button>
          <Button asChild variant="outline" className="btn btn-ghost">
            <a href={profile.secondaryCta.url} target="_blank" rel="noopener noreferrer">
              {profile.secondaryCta.label}
            </a>
          </Button>
          <Button asChild variant="ghost" className="text-slate-200 hover:text-white">
            <Link to="/blog">Latest updates</Link>
          </Button>
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
