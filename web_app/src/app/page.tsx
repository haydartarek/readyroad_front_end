import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl mb-6">
              <span className="text-4xl font-bold text-white">R</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
              Master Your <span className="text-primary">Belgian</span><br />
              Driving License
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive exam preparation with 50-question simulations, 
              intelligent practice modes, and advanced analytics to help you pass.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href={ROUTES.REGISTER}>Get Started Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8">
                <Link href={ROUTES.LOGIN}>Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose ReadyRoad?</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to pass your Belgian driving exam
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-xl font-semibold mb-2">Official Exam Simulation</h3>
                <p className="text-muted-foreground">
                  50 questions, 45 minutes, 82% pass rate - exactly like the real Belgian exam
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-2">Smart Practice Mode</h3>
                <p className="text-muted-foreground">
                  Target specific categories and difficulty levels for focused learning
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground">
                  Identify error patterns and weak areas with AI-powered insights
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-5xl mb-4">🚦</div>
                <h3 className="text-xl font-semibold mb-2">200+ Traffic Signs</h3>
                <p className="text-muted-foreground">
                  Complete Belgian traffic signs library with detailed explanations
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-xl font-semibold mb-2">31 Theory Lessons</h3>
                <p className="text-muted-foreground">
                  Comprehensive lessons covering all Belgian driving regulations
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-5xl mb-4">🌍</div>
                <h3 className="text-xl font-semibold mb-2">4 Languages</h3>
                <p className="text-muted-foreground">
                  Available in English, Arabic, Dutch, and French with RTL support
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-5xl font-bold text-primary mb-2">50</div>
              <div className="text-muted-foreground">Questions per Exam</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-primary mb-2">200+</div>
              <div className="text-muted-foreground">Traffic Signs</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-primary mb-2">31</div>
              <div className="text-muted-foreground">Theory Lessons</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-primary mb-2">82%</div>
              <div className="text-muted-foreground">Pass Score</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students preparing for their Belgian driving license
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link href={ROUTES.REGISTER}>Create Free Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ReadyRoad. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
