import React from 'react';
import { useLanguage } from '../../../shared/i18n';
import AboutHero from '../components/AboutHero';
import CompanyOverview from '../components/CompanyOverview';
import MissionVision from '../components/MissionVision';
import WhyChooseUs from '../components/WhyChooseUs';
import PlatformStats from '../components/PlatformStats';
import PartnerSection from '../components/PartnerSection';
import AboutFaq from '../components/AboutFaq';
import ContactCta from '../components/ContactCta';
import { useDocumentMetadata } from '../../../hooks/useDocumentMetadata';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  const { language } = useLanguage();

  useDocumentMetadata({
    title: language === 'en' ? 'About Us' : 'Tentang Kami',
    description: language === 'en' 
      ? 'Learn more about StayEase, our mission, vision, and how we deliver premium hotel, villa, and property booking experiences.'
      : 'Pelajari lebih lanjut tentang StayEase, misi, visi, dan bagaimana kami menghadirkan pengalaman pemesanan hotel, vila, dan properti premium.'
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 animate-fade-in text-slate-800">
      {/* Hero Section */}
      <AboutHero language={language} />

      {/* Company Overview */}
      <CompanyOverview language={language} />

      {/* Mission & Vision */}
      <MissionVision language={language} />

      {/* Why Choose StayEase */}
      <WhyChooseUs language={language} />

      {/* Platform Statistics */}
      <PlatformStats language={language} />

      {/* Partner Section */}
      <PartnerSection language={language} />

      {/* FAQ Section */}
      <AboutFaq language={language} />

      {/* Contact CTA */}
      <ContactCta onNavigate={onNavigate} language={language} />
    </div>
  );
}
