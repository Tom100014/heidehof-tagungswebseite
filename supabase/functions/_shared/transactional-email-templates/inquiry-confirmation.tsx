import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Hotel Der Heidehof'

interface InquiryConfirmationProps {
  name?: string
  company?: string
  eventDate?: string
  participants?: number
}

const InquiryConfirmationEmail = ({
  name,
  company,
  eventDate,
  participants,
}: InquiryConfirmationProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Ihre Anfrage bei {SITE_NAME} ist eingegangen</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {name ? `Vielen Dank, ${name}!` : 'Vielen Dank für Ihre Anfrage!'}
        </Heading>
        <Text style={text}>
          Wir haben Ihre Anfrage erhalten und melden uns in Kürze persönlich bei Ihnen.
        </Text>
        {(company || eventDate || participants) && (
          <Section style={card}>
            {company && <Text style={detail}><strong>Firma:</strong> {company}</Text>}
            {eventDate && <Text style={detail}><strong>Datum:</strong> {eventDate}</Text>}
            {participants && <Text style={detail}><strong>Teilnehmer:</strong> {participants}</Text>}
          </Section>
        )}
        <Text style={text}>
          Bei Rückfragen erreichen Sie uns jederzeit per E-Mail oder Telefon.
        </Text>
        <Text style={footer}>Herzliche Grüße,<br />Ihr Team vom {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InquiryConfirmationEmail,
  subject: 'Ihre Anfrage bei Hotel Der Heidehof',
  displayName: 'Anfrage-Bestätigung',
  previewData: {
    name: 'Frau Mustermann',
    company: 'Muster GmbH',
    eventDate: '15.06.2026',
    participants: 25,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, serif' }
const container = { padding: '32px 28px', maxWidth: '600px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#444444', lineHeight: '1.6', margin: '0 0 20px' }
const card = { backgroundColor: '#f7f3ec', padding: '16px 20px', borderLeft: '3px solid #b8964a', margin: '0 0 24px' }
const detail = { fontSize: '14px', color: '#1a1a1a', margin: '4px 0' }
const footer = { fontSize: '13px', color: '#888888', margin: '32px 0 0' }
