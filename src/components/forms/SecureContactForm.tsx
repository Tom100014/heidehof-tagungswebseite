// @ts-nocheck

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { validationSchemas, sanitizeInput, rateLimiter } from '@/utils/input-validation';
import { supabase } from '@/integrations/supabase/client';

interface SecureContactFormProps {
  onSubmit?: (data: any) => void;
  defaultValues?: any;
}

export const SecureContactForm = ({ onSubmit, defaultValues }: SecureContactFormProps) => {
  const [formData, setFormData] = useState({
    name: defaultValues?.name || '',
    contactType: defaultValues?.contactType || 'email',
    contactValue: defaultValues?.contactValue || '',
    roomNumber: defaultValues?.roomNumber || '',
    message: defaultValues?.message || ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate name
    try {
      validationSchemas.name.parse(formData.name);
    } catch (error: any) {
      newErrors.name = error.errors[0]?.message || 'Invalid name';
    }

    // Validate contact value based on type
    try {
      if (formData.contactType === 'email') {
        validationSchemas.email.parse(formData.contactValue);
      } else if (formData.contactType === 'phone' || formData.contactType === 'whatsapp') {
        validationSchemas.phone.parse(formData.contactValue);
      }
    } catch (error: any) {
      newErrors.contactValue = error.errors[0]?.message || 'Invalid contact information';
    }

    // Validate room number if provided
    if (formData.roomNumber) {
      try {
        validationSchemas.roomNumber.parse(formData.roomNumber);
      } catch (error: any) {
        newErrors.roomNumber = error.errors[0]?.message || 'Invalid room number';
      }
    }

    // Validate message
    try {
      validationSchemas.text.parse(formData.message);
    } catch (error: any) {
      newErrors.message = error.errors[0]?.message || 'Message too long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    const clientId = `contact_form_${navigator.userAgent}`;
    if (!rateLimiter.isAllowed(clientId, 5, 300000)) { // 5 requests per 5 minutes
      toast.error('Zu viele Anfragen', {
        description: 'Bitte warten Sie 5 Minuten bevor Sie erneut versuchen.'
      });
      return;
    }

    if (!validateForm()) {
      toast.error('Bitte korrigieren Sie die Eingabefehler');
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitize all inputs
      const sanitizedData = {
        name: sanitizeInput.name(formData.name),
        contact_type: formData.contactType,
        contact_value: formData.contactType === 'email' 
          ? sanitizeInput.email(formData.contactValue)
          : sanitizeInput.text(formData.contactValue),
        room_number: formData.roomNumber ? sanitizeInput.roomNumber(formData.roomNumber) : null,
        service_context: {
          message: sanitizeInput.text(formData.message),
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent.substring(0, 200) // Limit user agent length
        }
      };

      const { data, error } = await supabase
        .from('contact_requests')
        .insert(sanitizedData)
        .select()
        .single();

      if (error) {
        console.error('Contact form submission error:', error);
        toast.error('Fehler beim Senden', {
          description: 'Ihre Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.'
        });
        return;
      }

      toast.success('Anfrage gesendet', {
        description: 'Ihre Nachricht wurde erfolgreich übermittelt.'
      });

      // Reset form
      setFormData({
        name: '',
        contactType: 'email',
        contactValue: '',
        roomNumber: '',
        message: ''
      });

      if (onSubmit) {
        onSubmit(data);
      }

    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Unerwarteter Fehler', {
        description: 'Ein unerwarteter Fehler ist aufgetreten.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          maxLength={100}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="contactType">Kontakt-Art *</Label>
        <select
          id="contactType"
          value={formData.contactType}
          onChange={(e) => handleInputChange('contactType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="email">E-Mail</option>
          <option value="phone">Telefon</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </div>

      <div>
        <Label htmlFor="contactValue">
          {formData.contactType === 'email' ? 'E-Mail-Adresse' : 'Telefonnummer'} *
        </Label>
        <Input
          id="contactValue"
          type={formData.contactType === 'email' ? 'email' : 'tel'}
          value={formData.contactValue}
          onChange={(e) => handleInputChange('contactValue', e.target.value)}
          maxLength={254}
          className={errors.contactValue ? 'border-red-500' : ''}
        />
        {errors.contactValue && <p className="text-sm text-red-500 mt-1">{errors.contactValue}</p>}
      </div>

      <div>
        <Label htmlFor="roomNumber">Zimmernummer</Label>
        <Input
          id="roomNumber"
          value={formData.roomNumber}
          onChange={(e) => handleInputChange('roomNumber', e.target.value)}
          maxLength={10}
          className={errors.roomNumber ? 'border-red-500' : ''}
        />
        {errors.roomNumber && <p className="text-sm text-red-500 mt-1">{errors.roomNumber}</p>}
      </div>

      <div>
        <Label htmlFor="message">Nachricht *</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          maxLength={1000}
          className={errors.message ? 'border-red-500' : ''}
          rows={4}
        />
        {errors.message && <p className="text-sm text-red-500 mt-1">{errors.message}</p>}
        <p className="text-xs text-gray-500 mt-1">
          {formData.message.length}/1000 Zeichen
        </p>
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Wird gesendet...' : 'Nachricht senden'}
      </Button>
    </form>
  );
};
