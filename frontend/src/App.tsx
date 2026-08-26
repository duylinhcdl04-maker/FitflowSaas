import Nav from './sections/Nav'
import Hero from './sections/Hero'
import AudienceStrip from './sections/AudienceStrip'
import FeatureBranches from './sections/FeatureBranches'
import FeatureCheckin from './sections/FeatureCheckin'
import FeatureOperations from './sections/FeatureOperations'
import HowItWorks from './sections/HowItWorks'
import Pricing from './sections/Pricing'
import FinalCta from './sections/FinalCta'
import Footer from './sections/Footer'

function App() {
  return (
    <div className="font-sans min-h-dvh bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <Nav />
      <main>
        <Hero />
        <AudienceStrip />
        <FeatureBranches />
        <FeatureCheckin />
        <FeatureOperations />
        <HowItWorks />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}

export default App
