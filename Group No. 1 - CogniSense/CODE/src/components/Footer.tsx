import React from 'react';

interface FooterProps {
  pageType?: 'dashboard' | 'cognitive' | 'fatigue' | 'clusters' | 'privacy' | 'loadplanner' | 'settings';
}

const footerContent = {
  dashboard: {
    title: "CogniSense™ Analytics Dashboard",
    description: "Real-time cognitive load monitoring and team performance analytics",
    research: "Built for Comparative Research — integrates real-time performance analytics and cognitive scoring"
  },
  cognitive: {
    title: "Cognitive Load Analysis",
    description: "Advanced mental workload assessment and pattern recognition algorithms",
    research: "Built for Comparative Research — integrates cognitive workload algorithms and pattern recognition scoring"
  },
  fatigue: {
    title: "Fatigue Reconstruction System",
    description: "AI-powered fatigue prediction and recovery optimization models",
    research: "Built for Comparative Research — integrates fatigue prediction models and recovery optimization scoring"
  },
  clusters: {
    title: "Team Clustering Analysis",
    description: "Dynamic team grouping based on cognitive patterns and performance metrics",
    research: "Built for Comparative Research — integrates team clustering algorithms and performance metrics scoring"
  },
  privacy: {
    title: "Privacy Protection Framework",
    description: "Differential privacy and secure data handling with algorithmic scoring",
    research: "Built for Comparative Research — integrates differential privacy algorithms and data protection scoring"
  },
  loadplanner: {
    title: "Intelligent Load Planner",
    description: "ML-driven task scheduling and resource optimization algorithms",
    research: "Built for Comparative Research — integrates task scheduling algorithms and resource optimization scoring"
  },
  settings: {
    title: "System Configuration",
    description: "Customize your CogniSense™ experience and algorithm parameters",
    research: "Built for Comparative Research — integrates system configuration algorithms and parameter optimization scoring"
  }
};

export default function Footer({ pageType = 'dashboard' }: FooterProps) {
  const content = footerContent[pageType] || footerContent.dashboard;
  
  return (
    <footer className="bg-muted/10 border-t border-border/30 mt-8">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">{content.title}</h3>
            <p className="text-xs text-muted-foreground">{content.description}</p>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">
              {content.research}
            </p>
            <p className="text-xs font-medium text-foreground">
              © 2026 TE-DS-B-GRP-2. ALL RIGHTS RESERVED.
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Contact: <span className="font-mono">1234567890</span></p>
              <p>Email: <span className="font-mono text-xs">apsit.teds.grp1@gmail.com</span></p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
