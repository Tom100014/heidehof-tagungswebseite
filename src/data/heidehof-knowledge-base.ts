// Comprehensive knowledge base for Hotel Der Heidehof
export interface HeidehofKnowledgeBase {
  general: GeneralInfo;
  location: LocationInfo;
  accommodation: AccommodationInfo;
  gastronomy: GastronomyInfo;
  wellness: WellnessInfo;
  events: EventsInfo;
  services: ServicesInfo;
  sustainability: SustainabilityInfo;
  surroundings: SurroundingsInfo;
  emergency: EmergencyInfo;
}

export interface GeneralInfo {
  name: string;
  fullName: string;
  classification: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    state: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  management: {
    type: string;
    manager: string;
  };
  history: {
    built: number;
    renovations: number[];
  };
  policies: {
    smoking: string;
    pets: {
      allowed: boolean;
      fee: string;
      details: string;
    };
  };
  payment: {
    cashless: boolean;
    accepted: string[];
    restrictions: string;
  };
  languages: string[];
}

export interface LocationInfo {
  parking: {
    total: number;
    free: boolean;
    vipSpots: {
      count: number;
      location: string;
      price: string;
      reservation: boolean;
    };
    regularPrice: string;
    features: string[];
    liability: string;
  };
  accessibility: {
    disabledParking: boolean;
    elevators: number;
    wheelchairAccessible: string[];
  };
}

export interface AccommodationInfo {
  totalRooms: number;
  categories: {
    name: string;
    size: string;
    features: string[];
  }[];
  standardFeatures: string[];
  services: {
    cleaning: string;
    linens: string;
    allergies: boolean;
  };
  checkIn: string;
  checkOut: string;
  noShowPolicy: string;
}

export interface GastronomyInfo {
  restaurants: {
    name: string;
    type: string;
    hours: {
      [key: string]: string;
    };
    cuisine: string[];
    features: string[];
    externalGuests: {
      allowed: boolean;
      price?: string;
      reservation?: boolean;
    };
  }[];
  bar: {
    name: string;
    hours: string;
    offerings: string[];
    specialties: string[];
    sundaySpecial: string;
  };
  roomService: {
    warmFood: string;
    coldFood: string;
    orderMethod: string;
  };
}

export interface WellnessInfo {
  name: string;
  hours: string;
  access: {
    hotelGuests: string;
    daySpares: {
      hours: string;
      fee: string;
      reservation: boolean;
      holidays: string;
    };
  };
  ageRestrictions: {
    general: string;
    sauna: string;
  };
  equipment: {
    required: string[];
    rental: {
      price: string;
      includes: string[];
    };
    purchase: string[];
  };
  facilities: {
    water: string[];
    sauna: string[];
    relaxation: string[];
    extras: string[];
  };
  treatments: {
    brands: string[];
    categories: {
      name: string;
      treatments: {
        name: string;
        duration: string;
        price: string;
        description: string;
      }[];
    }[];
    policies: string[];
  };
}

export interface EventsInfo {
  special: {
    name: string;
    description: string;
    frequency: string;
    price?: string;
  }[];
  seasonal: {
    holiday: string;
    offerings: string[];
  }[];
  private: string[];
}

export interface ServicesInfo {
  wifi: {
    name: string;
    password: boolean;
    coverage: string;
  };
  children: {
    beds: {
      type: string;
      price: string;
      availability: string;
    }[];
    dining: string[];
  };
  additional: {
    name: string;
    type: string;
    price?: string;
    details: string;
  }[];
}

export interface SustainabilityInfo {
  initiatives: string[];
  energy: string[];
  water: string[];
  local: string[];
}

export interface SurroundingsInfo {
  radius: string;
  categories: {
    name: string;
    attractions: {
      name: string;
      distance: string;
      description: string;
      features?: string[];
    }[];
  }[];
}

export interface EmergencyInfo {
  internal: {
    reception: string[];
    hours: string;
  };
  external: {
    fire: string;
    police: string;
    medical: string;
  };
  safety: string[];
}

export const heidehofKnowledgeBase: HeidehofKnowledgeBase = {
  general: {
    name: "Hotel Der Heidehof",
    fullName: "Hotel Der Heidehof Conference & Spa Resort",
    classification: "4-Sterne-Superior",
    address: {
      street: "Ingolstädter Straße 121",
      postalCode: "85080",
      city: "Gaimersheim",
      state: "Bayern",
      country: "Deutschland"
    },
    contact: {
      phone: "+49 (0) 8458 / 64-0",
      email: "info@der-heidehof.de",
      website: "www.der-heidehof.de"
    },
    management: {
      type: "Familiär geführt",
      manager: "Stefan Sengl"
    },
    history: {
      built: 1975,
      renovations: [2023, 2024]
    },
    policies: {
      smoking: "Reines Nichtraucherhotel",
      pets: {
        allowed: true,
        fee: "20 € pro Nacht",
        details: "Hunde auf Anfrage erlaubt (ohne Futter)"
      }
    },
    payment: {
      cashless: true,
      accepted: ["American Express", "Visa", "MasterCard", "EC-Karte (Girocard)"],
      restrictions: "Keine Kostenübernahmen durch Dritte"
    },
    languages: ["Deutsch", "Englisch"]
  },
  location: {
    parking: {
      total: 100,
      free: true,
      vipSpots: {
        count: 3,
        location: "Direkt vor dem Eingang",
        price: "20 € pro Tag",
        reservation: true
      },
      regularPrice: "6,50 € pro Tag",
      features: ["Behindertenparkplätze", "E-Ladesäulen"],
      liability: "Keine Haftung bei Diebstahl oder Beschädigung"
    },
    accessibility: {
      disabledParking: true,
      elevators: 2,
      wheelchairAccessible: ["Alle Bereiche außer Tagungsräume Feuer/Wasser/Holz"]
    }
  },
  accommodation: {
    totalRooms: 115,
    categories: [
      {
        name: "Classic",
        size: "20–25 m²",
        features: ["Doppelbett", "Bad (Dusche)", "Flachbild-TV", "Minibar"]
      },
      {
        name: "Business/Deluxe",
        size: "25–30 m²",
        features: ["Klimaanlage", "Balkon", "Safe"]
      },
      {
        name: "Juniorsuiten",
        size: "Ab 30 m²",
        features: ["Getrennter Wohn-/Schlafbereich", "Bad (Dusche/Badewanne)", "Balkon"]
      }
    ],
    standardFeatures: [
      "WLAN",
      "Flachbild-TV",
      "Minibar",
      "Haartrockner",
      "Kosmetikspiegel",
      "Pflegeprodukte",
      "Kissenmenü",
      "Leih-Badetasche"
    ],
    services: {
      cleaning: "Täglich",
      linens: "Wechsel alle 3 Tage (auf Wunsch häufiger)",
      allergies: true
    },
    checkIn: "Ab 15:00 Uhr",
    checkOut: "Bis 11:00 Uhr",
    noShowPolicy: "Buchungen verfallen um 05:00 Uhr als No-Show"
  },
  gastronomy: {
    restaurants: [
      {
        name: "Restaurant Maxwell",
        type: "International/Mediterranean/Regional",
        hours: {
          "breakfast": "Mo–Sa: 06:00–10:00, So/Feiertage: 06:00–11:00",
          "dinner": "Mo–Sa: 18:00–22:00 (Küche bis 21:00), Sonntags geschlossen"
        },
        cuisine: ["Internationale", "Mediterrane", "Regionale Küche"],
        features: ["Frontcooking", "Saisonale Menüs", "Vegane/vegetarische Optionen"],
        externalGuests: {
          allowed: true,
          price: "22 € pro Person",
          reservation: true
        }
      },
      {
        name: "Fine-Dining-Lounge",
        type: "Fine Dining",
        hours: {
          "dinner": "Mo–Sa 18:00–22:00 (Küche bis 21:00)"
        },
        cuisine: ["Hochwertige Küche", "Regionale Zutaten"],
        features: ["Reservierung empfohlen"],
        externalGuests: {
          allowed: true,
          reservation: true
        }
      },
      {
        name: "Le Petit Chef",
        type: "Immersive Dining Experience",
        hours: {
          "event": "Start: 19:00 Uhr, ab September 19:30 Uhr"
        },
        cuisine: ["6-Gänge-Menü"],
        features: ["3D-Tischprojektion", "Animierter Koch", "Do–So verfügbar"],
        externalGuests: {
          allowed: true,
          price: "Standard: 139 €, Junior: 69 €",
          reservation: true
        }
      }
    ],
    bar: {
      name: "Hotelbar Mäx",
      hours: "Täglich 17:00–00:00 Uhr",
      offerings: ["Cocktails", "Spirituosen", "Weine", "Biere", "Softdrinks", "Kaffeespezialitäten"],
      specialties: ["Signature Cocktails", "Regionale Destillate", "Herrnbräu Ingolstadt"],
      sundaySpecial: "Warme Speisen 18:00–21:30 Uhr"
    },
    roomService: {
      warmFood: "Mo–Sa 18:00–21:00, So 18:00–21:30",
      coldFood: "Bis ca. 00:00 Uhr",
      orderMethod: "Zimmertelefon (Symbol: Tablett/Besteck)"
    }
  },
  wellness: {
    name: "Oriental Spa",
    hours: "Täglich 07:00–22:00 Uhr",
    access: {
      hotelGuests: "Ab Check-in bis Abreisetag 10:00–12:00",
      daySpares: {
        hours: "Mo–Do 10:00–22:00, So 12:00–22:00",
        fee: "49 €",
        reservation: true,
        holidays: "Ab 12:00 Uhr, Reservierung erforderlich"
      }
    },
    ageRestrictions: {
      general: "Nur Erwachsene, Kinder unter 18 mit Erziehungsberechtigten",
      sauna: "Ab 16 Jahren"
    },
    equipment: {
      required: ["Badeschuhe", "Bademantel", "Saunatücher"],
      rental: {
        price: "30 € pro Set",
        includes: ["Bademantel", "Saunatuch", "Slipper"]
      },
      purchase: ["Badeslipper: 4 €"]
    },
    facilities: {
      water: ["Innenpool mit Grotte", "Außenpool beheizt", "Whirlpool 36°C", "Kneippgang"],
      sauna: ["Finnische Sauna 85–95°C", "Himalaya-Salz-Sauna 60°C", "Aroma-Dampfbad 45°C", "Tepidarium 37–39°C"],
      relaxation: ["Asiatischer Ruheraum", "Erlebnisduschen", "Solenebel-Inhalationskabine"],
      extras: ["Teebar/Wasserstation kostenfrei", "Solarium kostenpflichtig"]
    },
    treatments: {
      brands: ["Klapp Cosmetics", "Ligne St. Barth"],
      categories: [
        {
          name: "Gesichtsbehandlungen",
          treatments: [
            { name: "Hyaluronic Multiple Effect", duration: "60 Min.", price: "~95 €", description: "Feuchtigkeit, Anti-Aging, Hyaluronsäure-Maske" },
            { name: "C Pure", duration: "60 Min.", price: "~99 €", description: "Vitamin-C-Behandlung für Hautstraffung" },
            { name: "ASA Peel", duration: "75 Min.", price: "~115 €", description: "Fruchtsäure-Peeling für Hauterneuerung" }
          ]
        },
        {
          name: "Massagen",
          treatments: [
            { name: "Klassische Rückenmassage", duration: "25 Min.", price: "~45 €", description: "Verspannungen lösen" },
            { name: "Ganzkörpermassage", duration: "50 Min.", price: "~80 €", description: "Entspannung für den ganzen Körper" },
            { name: "Hot-Stone-Massage", duration: "60 Min.", price: "~95 €", description: "Warme Basaltsteine, Muskelentspannung" }
          ]
        }
      ],
      policies: ["Keine Paarmassagen", "Terminvereinbarung erforderlich", "August: Keine Behandlungen"]
    }
  },
  events: {
    special: [
      {
        name: "Le Petit Chef",
        description: "Immersives 3D-Dinner-Erlebnis",
        frequency: "Do–So",
        price: "Ab 139 € pro Person"
      },
      {
        name: "Romeo & Julia",
        description: "Romantisches 4-Gänge-Menü",
        frequency: "Ausgewählte Freitage",
        price: "59 € pro Person"
      }
    ],
    seasonal: [
      { holiday: "Weihnachten", offerings: ["Festliche Buffets", "Glühwein-Ecke"] },
      { holiday: "Silvester", offerings: ["Gala mit Musik", "Buffet", "Neujahrssuppe"] },
      { holiday: "Ostern/Muttertag/Valentinstag", offerings: ["Brunch", "Spezielle Menüs"] }
    ],
    private: ["Hochzeiten", "Geburtstage", "Firmenevents", "Bankett-Team-Unterstützung"]
  },
  services: {
    wifi: {
      name: "heidehof free",
      password: false,
      coverage: "Gesamtes Hotel"
    },
    children: {
      beds: [
        { type: "Baby-/Kinderbetten", price: "20 € pro Tag", availability: "Nach Verfügbarkeit" },
        { type: "Zustellbett (ab 6 Jahre)", price: "65 € pro Tag", availability: "Nach Verfügbarkeit" }
      ],
      dining: ["Hochstühle im Restaurant", "Kindermenü verfügbar"]
    },
    additional: [
      { name: "Fahrradverleih", type: "Kostenpflichtig", details: "City-Bikes/E-Bikes, Helme/Schlösser inklusive" },
      { name: "Gepäckaufbewahrung", type: "Kostenfrei", details: "Vor/nach Check-in/out" },
      { name: "Wäsche-/Reinigungsservice", type: "Kostenpflichtig", details: "Rückgabe meist am nächsten Werktag" },
      { name: "Business-Services", type: "Kostenpflichtig", details: "Kopieren/Drucken an der Rezeption" }
    ]
  },
  sustainability: {
    initiatives: ["E-Ladesäulen für Elektroautos", "Regionale Produkte in der Gastronomie"],
    energy: ["Energiesparende Beleuchtung"],
    water: ["Wassermanagement", "Handtuchwechsel nur bei Bedarf"],
    local: ["Regionale Lieferanten", "Lokale Produkte"]
  },
  surroundings: {
    radius: "15 km",
    categories: [
      {
        name: "Automobil/Technik",
        attractions: [
          {
            name: "Audi Forum Ingolstadt",
            distance: "3 km",
            description: "museum mobile, Werksführungen, Fahrzeugausstellung"
          }
        ]
      },
      {
        name: "Kultur/Geschichte",
        attractions: [
          {
            name: "Ingolstadt Altstadt",
            distance: "5–6 km",
            description: "Neues Schloss, Asamkirche, Münster, Kreuztor",
            features: ["Bayerisches Armeemuseum", "Medizinhistorisches Museum"]
          }
        ]
      },
      {
        name: "Shopping",
        attractions: [
          {
            name: "Ingolstadt Village",
            distance: "10 km",
            description: "Luxus-Outlet mit 110 Boutiquen"
          },
          {
            name: "Westpark Einkaufszentrum",
            distance: "3 km",
            description: "140 Geschäfte, Kino"
          }
        ]
      },
      {
        name: "Natur/Freizeit",
        attractions: [
          {
            name: "Baggersee Ingolstadt",
            distance: "8 km",
            description: "Badesee mit Rundweg und Beachvolleyball"
          },
          {
            name: "Naturpark Altmühltal",
            distance: "15 km",
            description: "Wander-/Radwege, Limes"
          }
        ]
      }
    ]
  },
  emergency: {
    internal: {
      reception: ["-555", "Kurzwahl 9"],
      hours: "24/7"
    },
    external: {
      fire: "0-112",
      police: "0-110",
      medical: "0-116117"
    },
    safety: ["Rauchmelder", "Fluchtpläne in Zimmern", "Gesicherte Zugänge"]
  }
};

// SEO Keywords and phrases for Hotel Heidehof
export const heidehofSeoKeywords = {
  primary: [
    "Hotel Der Heidehof",
    "Conference & Spa Resort",
    "Gaimersheim",
    "Ingolstadt",
    "Bayern"
  ],
  services: [
    "Oriental Spa",
    "Wellness",
    "Tagungsräume",
    "Fine Dining",
    "Le Petit Chef",
    "4-Sterne-Superior"
  ],
  location: [
    "Ingolstadt Hotel",
    "Gaimersheim Hotel",
    "Bayern Hotel",
    "Audi Forum nähe",
    "Ingolstadt Village nähe"
  ],
  amenities: [
    "Spa Hotel",
    "Wellness Hotel",
    "Conference Hotel",
    "Business Hotel",
    "Familienhotel"
  ]
};

// Common hotel queries and information
export const heidehofFaq = [
  {
    question: "Wo befindet sich das Hotel Der Heidehof?",
    answer: "Das Hotel Der Heidehof befindet sich in der Ingolstädter Straße 121, 85080 Gaimersheim bei Ingolstadt in Bayern."
  },
  {
    question: "Welche Ausstattung bietet das Oriental Spa?",
    answer: "Das Oriental Spa verfügt über Innen- und Außenpool, Whirlpool, Finnische Sauna, Himalaya-Salz-Sauna, Aroma-Dampfbad, Tepidarium und verschiedene Wellness-Behandlungen."
  },
  {
    question: "Gibt es kostenlose Parkplätze?",
    answer: "Ja, das Hotel bietet über 100 kostenfreie Parkplätze vor dem Haus. Zusätzlich gibt es 3 VIP-Parkplätze direkt am Eingang für 20 € pro Tag."
  },
  {
    question: "Welche Restaurants gibt es im Hotel?",
    answer: "Das Hotel verfügt über das Restaurant Maxwell, die Fine-Dining-Lounge, Le Petit Chef (immersives Dining) und die Hotelbar Mäx."
  },
  {
    question: "Ist das Hotel familienfreundlich?",
    answer: "Ja, das Hotel bietet Baby-/Kinderbetten, Hochstühle, Kindermenüs und erlaubt Hunde auf Anfrage (20 € pro Nacht)."
  }
];