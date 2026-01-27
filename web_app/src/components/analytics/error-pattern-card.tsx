'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorPatternCardProps {
  pattern: {
    id: string;
    patternType: string;
    description: string;
    frequency: number;
    severity: 'high' | 'medium' | 'low';
    affectedCategories: string[];
    recommendations: string[];
    exampleQuestions: Array<{
      id: string;
      text: string;
      yourAnswer: string;
      correctAnswer: string;
    }>;
  };
}

export function ErrorPatternCard({ pattern }: ErrorPatternCardProps) {
  const [showExamples, setShowExamples] = useState(false);

  const severityColors = {
    high: 'bg-red-100 border-red-300 text-red-800',
    medium: 'bg-orange-100 border-orange-300 text-orange-800',
    low: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{pattern.patternType}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{pattern.description}</p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${
              severityColors[pattern.severity]
            }`}
          >
            {pattern.severity.toUpperCase()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700">
            Frequency: <span className="font-bold">{pattern.frequency} times</span>
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Affected Categories:</p>
          <div className="flex flex-wrap gap-2">
            {pattern.affectedCategories.map((category) => (
              <span
                key={category}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                {category}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
          <ul className="space-y-2">
            {pattern.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-sm">
                <span className="text-primary mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExamples(!showExamples)}
            className="w-full"
          >
            {showExamples ? '▼ Hide Example Questions' : '▶ Show Example Questions'}
          </Button>

          {showExamples && (
            <div className="mt-4 space-y-4">
              {pattern.exampleQuestions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-[12px] border-2 border-gray-200 p-4 bg-gray-50"
                >
                  <p className="font-medium mb-3">{question.text}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-red-600 font-semibold">Your Answer:</span>
                      <span className="text-red-600">{question.yourAnswer}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600 font-semibold">Correct Answer:</span>
                      <span className="text-green-600">{question.correctAnswer}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
