import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

type LegalSection = {
  id: string;
  title: string;
  children: ReactNode;
};

type LegalPageProps = {
  title: string;
  description: string;
  lastUpdated: string;
  kind: 'privacy' | 'terms';
  sections: LegalSection[];
};

export function LegalPage({ title, description, lastUpdated, kind, sections }: LegalPageProps) {
  const Icon = kind === 'privacy' ? ShieldCheck : FileText;

  return (
    <div className="container legal-page">
      <Link href="/" className="legal-back">
        <ArrowLeft size={16} /> Back to shop
      </Link>

      <header className="legal-hero">
        <span className="legal-hero__icon"><Icon size={22} aria-hidden="true" /></span>
        <div>
          <span className="eyebrow">GlobaCart GH</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <span className="legal-updated">Last updated: {lastUpdated}</span>
        </div>
      </header>

      <div className="legal-layout">
        <nav className="legal-nav" aria-label={`${title} sections`}>
          <strong>On this page</strong>
          <ol>
            {sections.map((section) => (
              <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>
            ))}
          </ol>
        </nav>

        <article className="legal-content">
          {sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2>{section.title}</h2>
              {section.children}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
