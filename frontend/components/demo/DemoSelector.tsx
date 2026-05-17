'use client';

import { useState } from 'react';
import { Rocket, Zap, TrendingUp } from 'lucide-react';

interface DemoRepo {
  name: string;
  description: string;
  total_files: number;
  critical_modules: number;
}

interface DemoSelectorProps {
  onLoadDemo: (demoName: string) => void;
  isLoading: boolean;
}

export function DemoSelector({ onLoadDemo, isLoading }: DemoSelectorProps) {
  const demos: DemoRepo[] = [
    {
      name: 'enterprise-ecommerce',
      description: 'Legacy e-commerce platform with 500K+ LOC',
      total_files: 247,
      critical_modules: 3
    },
    {
      name: 'fintech-platform',
      description: 'Banking and investment platform with regulatory compliance',
      total_files: 189,
      critical_modules: 2
    },
    {
      name: 'social-media-app',
      description: 'Social networking platform with real-time features',
      total_files: 156,
      critical_modules: 1
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Demo Mode</span>
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          Experience CodeAtlas Intelligence
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore pre-loaded enterprise repositories to see how CodeAtlas analyzes
          complex architectures and identifies critical risks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {demos.map((demo) => (
          <DemoCard
            key={demo.name}
            demo={demo}
            onLoad={() => onLoadDemo(demo.name)}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}

interface DemoCardProps {
  demo: DemoRepo;
  onLoad: () => void;
  isLoading: boolean;
}

function DemoCard({ demo, onLoad, isLoading }: DemoCardProps) {
  const getIcon = () => {
    if (demo.name.includes('ecommerce')) return Rocket;
    if (demo.name.includes('fintech')) return TrendingUp;
    return Zap;
  };

  const Icon = getIcon();

  return (
    <div className="glass rounded-xl p-6 border border-white/10 hover:border-primary/50 transition-all duration-300 hover:scale-105 cursor-pointer group">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-xs rounded-full">
              {demo.critical_modules} Critical
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2 capitalize">
            {demo.name.replace(/-/g, ' ')}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {demo.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="text-sm text-muted-foreground">
            {demo.total_files} files
          </div>
          <button
            onClick={onLoad}
            disabled={isLoading}
            className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-smooth text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Load Demo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Made with Bob