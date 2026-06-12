
import { z } from 'zod';

// Input validation schemas and utilities
export const validationSchemas = {
  // Email validation
  email: z.string().email('Invalid email format').max(254),
  
  // Phone number validation (international format)
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format'),
  
  // Name validation (no special characters, reasonable length)
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-ZäöüÄÖÜß\s\-'\.]+$/, 'Invalid characters in name'),
  
  // Room number validation
  roomNumber: z.string()
    .min(1, 'Room number is required')
    .max(10, 'Room number too long')
    .regex(/^[0-9A-Za-z\-]+$/, 'Invalid room number format'),
  
  // General text input validation
  text: z.string().max(1000, 'Text too long'),
  
  // Notes/comments validation
  notes: z.string().max(2000, 'Notes too long'),
  
  // Status validation for orders
  orderStatus: z.enum(['pending', 'processing', 'completed', 'cancelled', 'new', 'neu', 'offen', 'in_bearbeitung', 'abgeschlossen']),
  
  // Contact type validation
  contactType: z.enum(['email', 'whatsapp', 'phone']),
  
  // Date validation
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  
  // Time validation
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
};

// Sanitization utilities
export const sanitizeInput = {
  // Remove potentially dangerous HTML/script content
  html: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  },
  
  // Sanitize text input
  text: (input: string): string => {
    return input
      .replace(/[<>'"&]/g, '')
      .trim()
      .substring(0, 1000);
  },
  
  // Sanitize name input
  name: (input: string): string => {
    return input
      .replace(/[^a-zA-ZäöüÄÖÜß\s\-'\.]/g, '')
      .trim()
      .substring(0, 100);
  },
  
  // Sanitize room number
  roomNumber: (input: string): string => {
    return input
      .replace(/[^0-9A-Za-z\-]/g, '')
      .trim()
      .substring(0, 10);
  },
  
  // Sanitize email
  email: (input: string): string => {
    return input
      .toLowerCase()
      .trim()
      .substring(0, 254);
  }
};

// Rate limiting helper (client-side basic implementation)
export const rateLimiter = {
  requests: new Map<string, number[]>(),
  
  // Check if request is allowed (max 10 requests per minute per key)
  isAllowed(key: string, maxRequests = 10, windowMs = 60000): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
};
