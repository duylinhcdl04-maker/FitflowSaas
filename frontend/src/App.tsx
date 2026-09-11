import { useLenis } from './hooks/useLenis'
import CustomCursor from './components/landing/CustomCursor'
import Navbar from './components/landing/Navbar'
import Hero from './components/landing/Hero'
import Marquee from './components/landing/Marquee'
import DifferenceSection from './components/landing/DifferenceSection'
import CorePillarsSection from './components/landing/CorePillarsSection'
import EcosystemSection from './components/landing/EcosystemSection'
import DashboardShowcase from './components/landing/DashboardShowcase'
import FeatureStory from './components/landing/FeatureStory'
import GymTypes from './components/landing/GymTypes'
import Pricing from './components/landing/Pricing'
import Testimonials from './components/landing/Testimonials'
import FinalCTA from './components/landing/FinalCTA'
import Footer from './components/landing/Footer'

function App() {
  // Initialize smooth scrolling with Lenis
  useLenis(true)

  return (
    <div className="font-['Manrope'] min-h-screen bg-[#070609] text-[#F5F3F7] antialiased selection:bg-purple-600 selection:text-white">
      <CustomCursor />
      <Navbar />
      <main className="relative">
        <Hero />
        <Marquee />
        <DifferenceSection />
        <CorePillarsSection />
        <EcosystemSection />
        <DashboardShowcase />
        <FeatureStory />
        <GymTypes />
        <Pricing />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}

export default App
