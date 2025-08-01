import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cross, Users, Heart, MessageCircle } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleGuestLogin = () => {
    // For now, redirect to login - can be enhanced later for true guest mode
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Cross className="text-primary text-2xl" />
              <h1 className="text-xl font-semibold text-gray-900">PrayOverUs</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleLogin}>
                Sign In
              </Button>
              <Button onClick={handleLogin}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Cross className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Pray with friends and the world around you
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join a caring community where prayers are shared, hearts are lifted, and faith grows stronger together.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" onClick={handleLogin} className="text-lg px-8 py-4">
              Sign In with Google
            </Button>
            <Button size="lg" variant="outline" onClick={handleGuestLogin} className="text-lg px-8 py-4">
              Continue as Guest
            </Button>
          </div>

          <p className="text-sm text-gray-500">
            Don't have an account? 
            <button onClick={handleLogin} className="text-primary hover:text-blue-700 ml-1 font-medium">
              Create one now
            </button>
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Connect Through Prayer
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Personal Prayer Space</h3>
                <p className="text-gray-600">
                  Create and track your personal prayers. Mark them as answered and celebrate God's faithfulness.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Community Prayer Wall</h3>
                <p className="text-gray-600">
                  Share prayer requests with the community and pray for others. Experience the power of unified prayer.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Prayer Groups</h3>
                <p className="text-gray-600">
                  Join or create prayer groups with friends, family, or others who share your faith journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Start Your Prayer Journey Today
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of believers connecting through prayer
          </p>
          <Button size="lg" onClick={handleLogin} className="text-lg px-8 py-4">
            Join PrayOverUs
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Cross className="text-primary text-xl" />
            <span className="text-lg font-semibold text-gray-900">PrayOverUs</span>
          </div>
          <p className="text-gray-600">
            Connecting hearts through prayer, one conversation with God at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}
