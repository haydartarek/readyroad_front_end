import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SignImage } from '@/components/traffic-signs/sign-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrafficSign } from '@/lib/types';
import { API_CONFIG } from '@/lib/constants';

interface Props {
  params: { signCode: string };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { signCode } = await params;
  const sign = await getTrafficSign(signCode);

  if (!sign) {
    return {
      title: 'Sign Not Found | ReadyRoad',
    };
  }

  return {
    title: `${sign.nameEn} - Belgian Traffic Sign | ReadyRoad`,
    description: sign.descriptionEn,
    openGraph: {
      title: sign.nameEn,
      description: sign.descriptionEn,
      images: [sign.imageUrl],
    },
  };
}

// Generate static params for all signs (ISR)
export async function generateStaticParams() {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/traffic-signs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch traffic signs for static params:', response.status);
      return [];
    }

    const data = await response.json();
    const signs = Array.isArray(data) ? data : (data.signs || []);
    return signs.map((sign: { signCode: string }) => ({
      signCode: sign.signCode,
    }));
  } catch (error) {
    console.error('Error fetching traffic signs for static params:', error);
    return [];
  }
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600; // 1 hour

// Map category codes to display names
function getCategoryName(code: string): string {
  const categoryMap: Record<string, string> = {
    'A': 'DANGER',
    'B': 'PRIORITY',
    'C': 'PROHIBITION',
    'D': 'MANDATORY',
    'E': 'PARKING',
    'F': 'INFORMATION',
    'G': 'ADDITIONAL',
    'M': 'BICYCLE',
    'Z': 'ZONE',
  };
  return categoryMap[code] || code;
}

async function getTrafficSign(signCode: string): Promise<TrafficSign | null> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/traffic-signs/${signCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error('Failed to fetch traffic sign:', response.status);
      return null;
    }

    const sign = await response.json();

    // Map backend response to frontend format (categoryCode → category name)
    return {
      ...sign,
      category: getCategoryName(sign.categoryCode) || sign.category || 'UNKNOWN',
    };
  } catch (error) {
    console.error('Error fetching traffic sign:', error);
    return null;
  }
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'DANGER': 'bg-red-100 text-red-800 border-red-200',
    'PROHIBITION': 'bg-red-100 text-red-800 border-red-200',
    'MANDATORY': 'bg-blue-100 text-blue-800 border-blue-200',
    'PRIORITY': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'INFORMATION': 'bg-green-100 text-green-800 border-green-200',
    'PARKING': 'bg-purple-100 text-purple-800 border-purple-200',
    'BICYCLE': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  };
  return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export default async function TrafficSignDetailPage({ params }: Props) {
  const { signCode } = await params;
  const sign = await getTrafficSign(signCode);

  if (!sign) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Back button */}
        <Link href="/traffic-signs">
          <Button variant="ghost" className="mb-6">
            ← Back to all signs
          </Button>
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Sign image card */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl">{sign.nameEn}</CardTitle>
                    <Badge className={`mt-2 ${getCategoryColor(sign.category)}`}>
                      {sign.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center rounded-lg bg-white p-8">
                  <div className="relative h-64 w-64">
                    <SignImage
                      src={sign.imageUrl}
                      alt={sign.nameEn}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Multi-language descriptions */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="en" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
                    <TabsTrigger value="ar">🇸🇦 العربية</TabsTrigger>
                    <TabsTrigger value="nl">🇳🇱 Nederlands</TabsTrigger>
                    <TabsTrigger value="fr">🇫🇷 Français</TabsTrigger>
                  </TabsList>

                  <TabsContent value="en" className="space-y-4">
                    <div>
                      <h3 className="mb-2 font-semibold">Name</h3>
                      <p className="text-gray-700">{sign.nameEn}</p>
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold">Description</h3>
                      <p className="text-gray-700">{sign.descriptionEn}</p>
                    </div>
                    {sign.meaning && (
                      <div>
                        <h3 className="mb-2 font-semibold">Meaning</h3>
                        <p className="text-gray-700">{sign.meaning}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="ar" className="space-y-4" dir="rtl">
                    <div>
                      <h3 className="mb-2 font-semibold">الاسم</h3>
                      <p className="text-gray-700">{sign.nameAr}</p>
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold">الوصف</h3>
                      <p className="text-gray-700">{sign.descriptionAr}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="nl" className="space-y-4">
                    <div>
                      <h3 className="mb-2 font-semibold">Naam</h3>
                      <p className="text-gray-700">{sign.nameNl}</p>
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold">Beschrijving</h3>
                      <p className="text-gray-700">{sign.descriptionNl}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="fr" className="space-y-4">
                    <div>
                      <h3 className="mb-2 font-semibold">Nom</h3>
                      <p className="text-gray-700">{sign.nameFr}</p>
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold">Description</h3>
                      <p className="text-gray-700">{sign.descriptionFr}</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Penalties warning */}
            {sign.penalties && (
              <Alert variant="destructive" className="mt-6">
                <AlertDescription>
                  <strong>⚠️ Penalties:</strong> {sign.penalties}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick info */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Sign Code</p>
                  <p className="font-mono font-semibold">{sign.signCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-semibold">{sign.category}</p>
                </div>
              </CardContent>
            </Card>

            {/* Study tips */}
            <Card>
              <CardHeader>
                <CardTitle>Study Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>✅ Memorize the sign shape and colors</p>
                <p>✅ Understand what action it requires</p>
                <p>✅ Know when and where it applies</p>
                <p>✅ Practice with exam questions</p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Link href="/practice">
                <Button className="w-full" variant="default">
                  Practice Questions
                </Button>
              </Link>
              <Link href="/exam">
                <Button className="w-full" variant="outline">
                  Take Full Exam
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
