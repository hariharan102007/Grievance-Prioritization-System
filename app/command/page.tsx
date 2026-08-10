'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Zap, Globe, MapPin, ShieldCheck, TrendingUp } from 'lucide-react';

export default function CommandPage() {
  return (
    <div className="min-h-screen bg-mesh">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">
            AI Civic Command Center
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Real-time civic monitoring, prioritization, and routing intelligence.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            The AI Civic Command Center connects complaints, sensors, weather, and officer readiness into one decision engine that drives smarter assignments and better citizen outcomes.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              icon: Activity,
              title: 'AI Prediction',
              description: 'Forecast SLA risk and identify complaints that are likely to become overdue.',
            },
            {
              icon: Zap,
              title: 'Prioritization',
              description: 'Rank issues by urgency, potential impact, and officer availability.',
            },
            {
              icon: MapPin,
              title: 'Smart Routing',
              description: 'Recommend the most efficient field sequence based on distance, priority, and workload.',
            },
            {
              icon: Globe,
              title: 'Multimodal Input',
              description: 'Combine complaint text, location, weather, and sensor signals for better decisions.',
            },
            {
              icon: ShieldCheck,
              title: 'Emergency Mode',
              description: 'Automatically detect critical hazards and dispatch the nearest qualified officer.',
            },
            {
              icon: TrendingUp,
              title: 'Analytics',
              description: 'Surface officer performance patterns, skill profiles, and service-level insights.',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="border-border/60 bg-card/80 shadow-sm">
                <CardHeader>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-4 text-lg font-semibold">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground">
                    {card.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
