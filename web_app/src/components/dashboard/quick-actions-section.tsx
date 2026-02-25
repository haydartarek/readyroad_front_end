'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export function QuickActionsSection() {
  const actions = [
    {
      title: 'Take Exam',
      description: 'Official 50-question driving test',
      icon: '📝',
      href: '/exam',
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    },
    {
      title: 'Practice',
      description: 'Practice by category or difficulty',
      icon: '🎯',
      href: '/practice',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    },
    {
      title: 'View Analytics',
      description: 'See your error patterns & weak areas',
      icon: '📊',
      href: '/analytics/error-patterns',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map((action) => (
        <Link key={action.href} href={action.href}>
          <Card className={`transition-colors ${action.color} border-2`}>
            <CardContent className="flex items-start space-x-4 p-6">
              <div className="text-4xl">{action.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{action.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
