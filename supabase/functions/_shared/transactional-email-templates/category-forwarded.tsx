import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Hotel Der Heidehof'

interface CategoryForwardedProps {
  categoryLabel?: string
  summary?: string
}

const CategoryForwardedEmail = ({ categoryLabel, summary }: CategoryForwardedProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Neue Anfrage – {categoryLabel ?? 'Heidehof'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Neue Anfrage eingegangen</Heading>
        <Text style={text}>
          Im Bereich <strong>{categoryLabel ?? 'Heidehof'}</strong> ist eine neue Anfrage eingegangen.
        </Text>
        <Section style={card}>
          <pre style={pre}>{summary ?? ''}</pre>
        </Section>
        <Text style={footer}>Diese Nachricht wurde automatisch vom {SITE_NAME}-System gesendet.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CategoryForwardedEmail,
  subject: (data: Record<string, unknown>) =>
    `Neue Anfrage: ${(data.categoryLabel as string) ?? 'Heidehof'}`,
  displayName: 'Anfrage-Weiterleitung',
  previewData: {
    categoryLabel: 'Tagungsanfragen',
    summary: 'name: Frau Mustermann\nfirma: Muster GmbH\npersonen: 25\ndatum: 2026-06-15',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, serif' }
const container = { padding: '32px 28px', maxWidth: '600px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#444', lineHeight: '1.6', margin: '0 0 20px' }
const card = { backgroundColor: '#f7f3ec', padding: '16px 20px', borderLeft: '3px solid #b8964a', margin: '0 0 24px' }
const pre = { fontSize: '13px', color: '#1a1a1a', whiteSpace: 'pre-wrap' as const, fontFamily: 'monospace', margin: 0 }
const footer = { fontSize: '12px', color: '#888', margin: '32px 0 0' }
