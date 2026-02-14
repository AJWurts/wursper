import Navbar from '@/components/Navbar'
import Hero from '@/components/sections/Hero'
import Features from '@/components/sections/Features'
import VideoSection from '@/components/sections/VideoSection'
import Reviews from '@/components/sections/Reviews'
import OpenSource from '@/components/sections/OpenSource'
import Pricing from '@/components/sections/Pricing'
import FAQ from '@/components/sections/FAQ'
import Footer from '@/components/sections/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <VideoSection />
        <Reviews />
        <OpenSource />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
