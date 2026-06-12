// Hotel footer information to be added to all outgoing messages
export const HOTEL_FOOTER = `

---
Hotel Der Heidehof – Conference & SPA Resort
Ingolstädter Straße 121 │ 85080 Gaimersheim / Ingolstadt │ Deutschland
Tel.: +49 8458 64-0 │ Fax: +49 8458 64-230
E-Mail: info@der-heidehof.de │ Web: www.der-heidehof.de`;

export const addHotelFooter = (message: string): string => {
  return `${message}${HOTEL_FOOTER}`;
};