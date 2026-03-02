'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';

interface Testimonial {
  name: string;
  city: string;
  quote: string;
  rating: number;
}

const AVATAR_COLORS = ['bg-primary', 'bg-secondary', 'bg-primary/80'] as const;
const MAX_RATING = 5;
const HAS_TESTIMONIALS = true;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of ${MAX_RATING} stars`}>
      {Array.from({ length: MAX_RATING }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'fill-primary text-primary' : 'fill-none text-border'}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

function TestimonialCard({ item, index }: { item: Testimonial; index: number }) {
  const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <figure className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-card/80 p-6 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/35 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-border/60" />

      <div className="relative mb-4 flex items-center gap-3">
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-primary-foreground ${avatarBg}`}
        >
          {item.name?.charAt(0)}
        </div>
        <div className="min-w-0">
          <strong className="block truncate text-sm font-extrabold tracking-tight text-secondary">
            {item.name}
          </strong>
          {item.city && <p className="truncate text-xs text-muted-foreground">{item.city}</p>}
        </div>

        <div className="ms-auto flex items-center rounded-full border bg-background/60 px-3 py-1 shadow-sm">
          <StarRating rating={item.rating} />
        </div>
      </div>

      <blockquote className="relative flex-1 text-sm leading-relaxed text-foreground/80">
        <span className="pointer-events-none absolute -start-2 -top-3 text-4xl leading-none text-primary/15">
          &ldquo;
        </span>
        <span className="relative">&ldquo;{item.quote}&rdquo;</span>
      </blockquote>

      <div className="pointer-events-none absolute -bottom-12 -end-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity group-hover:opacity-100" />
    </figure>
  );
}

function BetaFallback({ label, cta }: { label: string; cta: string }) {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-primary/20 bg-card/80 p-8 text-center shadow-sm backdrop-blur">
      <div className="pointer-events-none absolute inset-0" />
      <div className="space-y-4">
        <h3 className="text-lg font-extrabold tracking-tight text-secondary">{label}</h3>
        <Button size="sm" className="h-10 rounded-full px-6 text-sm font-semibold shadow-sm" asChild>
          <Link href="mailto:feedback@readyroad.be">{cta}</Link>
        </Button>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();

  const testimonials: Testimonial[] = [1, 2, 3].map((n) => ({
    name: t(`home.testimonials.t${n}_name`),
    city: t(`home.testimonials.t${n}_city`),
    quote: t(`home.testimonials.t${n}_quote`),
    rating: n === 3 ? 4 : 5,
  }));

  const ctaHref = isAuthenticated ? '/dashboard' : '/register';
  const ctaLabel = isAuthenticated ? t('home.hero.cta_auth_primary') : t('home.testimonials.cta_text');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-muted/25 via-background to-background py-16 lg:py-20">
      <div className="pointer-events-none absolute -top-44 start-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="container mx-auto space-y-10 px-4">
        <div className="space-y-3 text-center">
          <h2 className="text-balance text-2xl font-extrabold tracking-tight text-secondary md:text-3xl lg:text-4xl">
            {t('home.testimonials.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {t('home.testimonials.subtitle')}
          </p>
        </div>

        {HAS_TESTIMONIALS ? (
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3 lg:gap-7">
            {testimonials.map((item, i) => (
              <TestimonialCard key={`${item.name}-${i}`} item={item} index={i} />
            ))}
          </div>
        ) : (
          <BetaFallback label={t('home.testimonials.beta_title')} cta={t('home.testimonials.beta_cta')} />
        )}

        <div className="text-center">
          {isLoading ? (
            <div className="mx-auto h-12 w-52 animate-pulse rounded-full bg-muted" />
          ) : (
            <Button
              size="lg"
              className="h-12 rounded-full px-8 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
              asChild
            >
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}