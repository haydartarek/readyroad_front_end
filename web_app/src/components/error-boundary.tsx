'use client';

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Global error boundary to catch runtime errors and show safe fallback UI
 * Prevents raw stack traces from being shown to users in production
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console in development only
        if (process.env.NODE_ENV === 'development') {
            console.error('Error caught by boundary:', error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                    <Card className="max-w-lg w-full border-2">
                        <CardHeader>
                            <CardTitle className="text-2xl text-destructive">Something went wrong</CardTitle>
                            <CardDescription>
                                An unexpected error occurred. Please try again.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <Alert variant="destructive">
                                    <pre className="text-xs overflow-auto">
                                        {this.state.error.message}
                                    </pre>
                                </Alert>
                            )}
                            <div className="flex gap-3">
                                <Button onClick={this.handleReset} className="flex-1">
                                    Try Again
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.href = '/'}
                                    className="flex-1"
                                >
                                    Go Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
