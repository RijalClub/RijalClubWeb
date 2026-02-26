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
        <div className="flex items-center gap-2 text-lime font-bold text-[10px] uppercase tracking-[0.2em] mb-4">
          <Sparkles size={12} className="text-lime/80" />
          Knowledgehood Collective
        </div>
        
        <p className="text-primary font-bold text-sm tracking-wide uppercase mb-2">
          {profile.handle}
        </p>
        
        <h1>{profile.name}</h1>
        
        <p className="hero-description">{profile.description}</p>

        <div className="mt-8 flex flex-wrap gap-2">
          {profile.values.map((value) => (
            <Badge 
              key={value} 
              variant="secondary" 
              className="bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 transition-colors"
            >
              {value}
            </Badge>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Button asChild size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 font-bold">
            <a href={profile.primaryCta.url} target="_blank" rel="noopener noreferrer">
              {profile.primaryCta.label}
              <ArrowUpRight size={18} className="ml-1" />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all font-bold">
            <a href={profile.secondaryCta.url} target="_blank" rel="noopener noreferrer">
              {profile.secondaryCta.label}
            </a>
          </Button>
          <Button asChild variant="ghost" size="lg" className="rounded-full text-muted-foreground hover:text-white transition-all">
            <Link to="/blog">Latest updates</Link>
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-6 pt-10 border-t border-white/5">
          {profile.stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <span className="font-bebas text-3xl text-white tracking-wide">{stat.value}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hero-visual">
        <img src={profile.heroImage} alt="Rijal Club hero" className="reveal" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent mix-blend-overlay" />
      </div>
    </section>
  );
}
