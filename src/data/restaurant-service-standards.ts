// ═══════════════════════════════════════════════════════════════
// RESTAURANT MAXWELL - SERVICE STANDARDS FÜR SERVICEPERSONAL
// ═══════════════════════════════════════════════════════════════
//
// Diese Datei enthält PROFESSIONELLE SERVICE-ANWEISUNGEN für das
// Servicepersonal - NICHT Koch-Rezepte!
//
// Fokus: Wie servieren? Wie präsentieren? Wie mit Gast sprechen?
// ═══════════════════════════════════════════════════════════════

export interface RestaurantServiceStandard {
  id: string;
  name: string;
  category: string;
  
  // Service-Präsentation
  servicePresentation: string;
  plateDescription: string;
  servingProcedure: string;
  
  // Gast-Kommunikation
  guestCommunication: string;
  
  // Kritische Service-Punkte
  criticalServicePoints: string[];
  
  // 4-Sterne-Standards
  fourStarStandards: string[];
  
  // Temperatur & Timing
  servingTemperature: string;
  timingNotes: string;
}

export const restaurantServiceStandards: RestaurantServiceStandard[] = [
  // ═══════════════════════════════════════════════════════════════
  // VORSPEISEN
  // ═══════════════════════════════════════════════════════════════
  {
    id: "maxwell-v1",
    name: "Rindercarpaccio mit Parmesanhobel",
    category: "Vorspeisen",
    servicePresentation: "Auf gekühltem, flachem Teller (6°C) von rechts servieren",
    plateDescription: "Carpaccio-Scheiben fächerförmig angeordnet, Parmesanhobel mittig, Rucola als dezente Garnitur rechts oben, Balsamico-Reduktion als Dekoration am Tellerrand",
    servingProcedure: "Teller mit rechter Hand von rechts servieren, leicht schräg zum Gast. Ansage: 'Ihr Rindercarpaccio, frisch zubereitet mit italienischem Parmesan'",
    guestCommunication: "Höflich darauf hinweisen: 'Der Parmesan wurde frisch gehobelt, das Carpaccio ist roh und kommt direkt aus dem Kühlschrank - perfekt zum Genießen'",
    criticalServicePoints: [
      "WICHTIG: Teller muss gekühlt sein (6-8°C)!",
      "Carpaccio darf NICHT warm werden - sofort servieren",
      "Parmesan darf nicht verrutschen beim Servieren",
      "Gast auf rohen Zustand hinweisen (manche erwarten gebratenes Fleisch)"
    ],
    fourStarStandards: [
      "Tellerrand absolut sauber wischen vor Service",
      "Keine Fingerabdrücke auf Teller",
      "Balsamico-Dekoration muss akkurat sein",
      "Servieren mit weißer Stoffserviette über Unterarm"
    ],
    servingTemperature: "6-8°C (gekühlt)",
    timingNotes: "Maximal 2 Minuten nach Anrichte servieren, sonst wird Fleisch warm"
  },
  
  {
    id: "maxwell-v2",
    name: "Burrata mit Tomaten und Basilikum-Pesto",
    category: "Vorspeisen",
    servicePresentation: "Auf weißem, flachem Teller bei Zimmertemperatur von rechts servieren",
    plateDescription: "Burrata mittig platziert, Tomaten-Scheiben kreisförmig um Burrata arrangiert, Pesto-Klecks bei 2-Uhr-Position, frisches Basilikum als Garnitur",
    servingProcedure: "Teller vorsichtig von rechts servieren (Burrata ist fragil!). Ansage: 'Ihre Burrata mit hausmachtem Basilikum-Pesto'",
    guestCommunication: "Hinweis: 'Die Burrata ist besonders cremig und sollte am besten warm genossen werden - das Pesto ist hausgemacht'",
    criticalServicePoints: [
      "Burrata ist SEHR FRAGIL - vorsichtig tragen!",
      "Nicht im Kühlschrank lagern - Zimmertemperatur!",
      "Pesto darf nicht mit Burrata vermischt sein (Gast macht das selbst)",
      "Teller nicht kippen beim Servieren"
    ],
    fourStarStandards: [
      "Burrata muss perfekt rund und unversehrt sein",
      "Tomaten exakt geschnitten und symmetrisch angeordnet",
      "Pesto-Menge exakt dosiert (1 Esslöffel)",
      "Basilikum-Blätter müssen frisch und grün sein (keine braunen Stellen)"
    ],
    servingTemperature: "18-20°C (Zimmertemperatur)",
    timingNotes: "Burrata muss Zimmertemperatur haben - 30 Min vorher aus Kühlschrank nehmen"
  },

  {
    id: "maxwell-v3",
    name: "Caesars Salat mit gegrillten Garnelen",
    category: "Vorspeisen",
    servicePresentation: "In tiefer Schale von rechts servieren, Garnelen sichtbar oben",
    plateDescription: "Römersalat als Basis, Garnelen (4 Stück) dekorativ oben platziert, Parmesan-Späne darüber gestreut, Croutons seitlich, Dressing darunter",
    servingProcedure: "Schale von rechts servieren. Ansage: 'Ihr Caesars Salat mit frisch gegrillten Garnelen und hausgemachtem Dressing'",
    guestCommunication: "Optional: 'Das Dressing ist bereits unter dem Salat - Sie können gerne nachbestellen falls gewünscht'",
    criticalServicePoints: [
      "Garnelen müssen WARM sein (direkt vom Grill)!",
      "Salat darf NICHT welk sein - frisch halten",
      "Dressing vorher gut durchmischen",
      "Parmesan frisch hobeln (nicht vorbereitet)"
    ],
    fourStarStandards: [
      "Garnelen perfekt gegrillt (keine verbrannten Stellen)",
      "Salat knackig und frisch gewaschen",
      "Croutons knusprig (nicht weich)",
      "Parmesan-Späne gleichmäßig verteilt"
    ],
    servingTemperature: "Garnelen: 65°C, Salat: 12-15°C",
    timingNotes: "Sofort nach Garnelen-Grill servieren (max 1 Minute)"
  },

  // ═══════════════════════════════════════════════════════════════
  // HAUPTGERICHTE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "maxwell-h1",
    name: "Rindersteak (250g) mit Pfeffersauce",
    category: "Hauptgänge",
    servicePresentation: "Auf vorgewärmtem Teller (60°C) von rechts servieren, Steak mittig",
    plateDescription: "Steak mittig auf Teller, Pfeffersauce in separater Saucière rechts daneben, Beilage (Kartoffeln/Gemüse) auf 3-Uhr-Position, frischer Thymian als Garnitur",
    servingProcedure: "Teller und Saucière gleichzeitig von rechts servieren. Ansage: 'Ihr Rindersteak medium mit Pfeffersauce - guten Appetit!'",
    guestCommunication: "WICHTIG: Immer nach Gargrad fragen BEVOR serviert wird: 'Ihr Steak wurde medium zubereitet - ist das so in Ordnung?' Falls nicht: sofort zurück zur Küche!",
    criticalServicePoints: [
      "KRITISCH: Gargrad VOR Service prüfen (Medium = rosa Kern)!",
      "Teller MUSS vorgewärmt sein (60°C) - sonst wird Steak kalt",
      "Sauce in SEPARATER Saucière servieren (nicht über Steak gießen!)",
      "Steak darf NICHT geschnitten serviert werden (Gast schneidet selbst)"
    ],
    fourStarStandards: [
      "Steakmesser mit scharfer Klinge bereitstellen",
      "Sauce muss dampfend heiß sein (85°C)",
      "Fleisch darf nicht 'bluten' auf dem Teller",
      "Teller-Rand absolut sauber (keine Sauce-Spritzer)"
    ],
    servingTemperature: "Steak: 52-55°C (Medium-Kern), Teller: 60°C, Sauce: 85°C",
    timingNotes: "Maximal 30 Sekunden nach Anrichte servieren - Steak kühlt schnell ab!"
  },

  {
    id: "maxwell-h2",
    name: "Wiener Schnitzel vom Kalb mit Preiselbeeren",
    category: "Hauptgänge",
    servicePresentation: "Auf SEHR GROßEM vorgewärmten Teller (60°C), Schnitzel nimmt 70% der Fläche ein",
    plateDescription: "Schnitzel schräg auf Teller legen (nimmt fast ganzen Teller ein), Zitronenscheibe direkt auf Schnitzel, Preiselbeeren in kleiner Schale bei 1-Uhr-Position, Beilage separat servieren",
    servingProcedure: "Teller vorsichtig von rechts servieren (groß und schwer!). Ansage: 'Ihr Wiener Schnitzel vom Kalb - frisch aus der Pfanne!' Beilage separat in Schale servieren.",
    guestCommunication: "Höflich darauf hinweisen: 'Das Schnitzel ist sehr heiß und knusprig - genießen Sie es am besten sofort. Die Preiselbeeren passen perfekt dazu!'",
    criticalServicePoints: [
      "ABSOLUT KRITISCH: Schnitzel SOFORT nach Frittieren servieren (max 45 Sekunden)!",
      "Panade darf NICHT durchweichen - Schnitzel nie abdecken oder stapeln",
      "Schnitzel darf NICHT mit Sauce oder Beilage in Kontakt kommen",
      "Teller muss HEISS sein (60°C) - sonst wird Panade weich"
    ],
    fourStarStandards: [
      "Panade muss goldbraun und knusprig sein (nicht fettig)",
      "Zitronenscheibe perfekt geschnitten (keine Kerne!)",
      "Fleisch darf nicht aus Panade herausragen",
      "Keine Öl-Pfützen auf Teller - Schnitzel muss 'trocken' sein"
    ],
    servingTemperature: "Schnitzel: 72°C innen, Panade: knusprig und heiß",
    timingNotes: "EXTREM zeitkritisch! Max 45 Sekunden nach Frittieren - sonst Panade durchweicht!"
  },

  {
    id: "maxwell-h3",
    name: "Gegrillter Lachs mit Zitronen-Butter-Sauce",
    category: "Hauptgänge",
    servicePresentation: "Auf vorgewärmtem Teller (55°C) von rechts, Lachs nimmt 50% der Fläche",
    plateDescription: "Lachs-Filet mittig schräg platziert (zeigt Grillstreifen), Sauce dezent neben Fisch (nicht darüber!), Gemüse auf 9-Uhr-Position, Zitronenscheibe auf Fisch",
    servingProcedure: "Teller von rechts servieren. Ansage: 'Ihr gegrillter Lachs mit hausgemachter Zitronen-Butter-Sauce'",
    guestCommunication: "Optional: 'Der Lachs ist medium gegrillt - außen knusprig, innen saftig. Die Sauce harmoniert perfekt mit dem Fisch'",
    criticalServicePoints: [
      "Lachs darf NICHT trocken sein - Kerntemperatur 48-52°C!",
      "Sauce NICHT über Fisch gießen (zerstört knusprige Haut)",
      "Grillstreifen müssen sichtbar sein (zeigt Professionalität)",
      "Fisch darf nicht zerfallen beim Servieren"
    ],
    fourStarStandards: [
      "Fischhaut muss knusprig sein (nicht glibberig)",
      "Sauce in perfekter Konsistenz (nicht zu dick, nicht zu dünn)",
      "Gemüse al dente und farblich ansprechend",
      "Keine Gräten im Filet (vorher prüfen!)"
    ],
    servingTemperature: "Lachs-Kern: 48-52°C, Sauce: 70°C",
    timingNotes: "Direkt nach Grill servieren - Fischhaut wird sonst weich (max 1 Minute)"
  },

  {
    id: "maxwell-h4",
    name: "Risotto mit Steinpilzen",
    category: "Hauptgänge",
    servicePresentation: "In tiefer, vorgewärmter Schale (50°C) von rechts servieren",
    plateDescription: "Risotto mittig in Schale, Steinpilze sichtbar oben arrangiert, Parmesan-Späne darüber, frischer Petersilien-Zweig als Garnitur, Olivenöl-Spirale als Deko",
    servingProcedure: "Schale vorsichtig von rechts servieren (HEISS!). Ansage: 'Ihr Steinpilz-Risotto - frisch aus der Pfanne zubereitet'",
    guestCommunication: "Hinweis: 'Das Risotto ist sehr heiß und hat die perfekte cremige Konsistenz - genießen Sie es warm!'",
    criticalServicePoints: [
      "KRITISCH: Risotto muss 'wellig' fließen - nicht fest oder zu flüssig!",
      "Schale muss heiß sein (50°C) - Risotto wird sonst sofort kalt",
      "SOFORT servieren nach Zubereitung (max 2 Minuten) - Risotto dickt ein!",
      "Parmesan frisch hobeln (nicht vorbereitet)"
    ],
    fourStarStandards: [
      "Risotto-Konsistenz perfekt: 'all'onda' (wellig fließend)",
      "Steinpilze gleichmäßig verteilt und sichtbar",
      "Parmesan-Späne dünn und gleichmäßig",
      "Schalen-Rand absolut sauber"
    ],
    servingTemperature: "Risotto: 75-80°C",
    timingNotes: "EXTREM zeitkritisch! Max 2 Minuten nach Zubereitung - Risotto wird sonst zu fest"
  },

  {
    id: "maxwell-h5",
    name: "Rinderfilet mit Rotwein-Jus",
    category: "Hauptgänge",
    servicePresentation: "Auf vorgewärmtem Teller (65°C), Filet mittig, Jus separat in Saucière",
    plateDescription: "Rinderfilet-Medaillons (2-3 Stück) mittig auf Teller, leicht überlappend, Jus in Saucière rechts, Gemüse-Garnitur auf 9-Uhr-Position, Kräuterzweig oben",
    servingProcedure: "Teller und Saucière gleichzeitig servieren. Ansage: 'Ihr Rinderfilet medium-rare mit Rotwein-Jus'",
    guestCommunication: "WICHTIG: Gargrad bestätigen: 'Das Filet wurde medium-rare zubereitet - rosa Kern, warmes Zentrum. Passt das für Sie?'",
    criticalServicePoints: [
      "ABSOLUT KRITISCH: Gargrad exakt prüfen (Medium-Rare = 52-55°C Kern)",
      "Filet DARF NICHT ruhen auf kaltem Teller - Teller muss heiß sein!",
      "Jus NIEMALS direkt über Fleisch gießen (Gast entscheidet)",
      "Fleisch darf nicht 'nachziehen' - sofort servieren!"
    ],
    fourStarStandards: [
      "Fleisch perfekt angeschnitten - rosa Kern sichtbar",
      "Jus dampfend heiß und glänzend",
      "Keine Fleischsäfte auf Teller (Fleisch muss 'ruhen' VOR Service)",
      "Steakmesser bereitstellen"
    ],
    servingTemperature: "Filet-Kern: 52-55°C, Teller: 65°C, Jus: 85°C",
    timingNotes: "Filet 3 Minuten ruhen lassen nach Braten, dann SOFORT servieren (max 30 Sek)"
  },

  {
    id: "maxwell-h6",
    name: "Tagliatelle mit Trüffel-Sahne-Sauce",
    category: "Hauptgänge",
    servicePresentation: "In tiefer, vorgewärmter Pasta-Schale (55°C) von rechts servieren",
    plateDescription: "Tagliatelle mittig in Schale, Sauce gleichmäßig verteilt, frischer Trüffel wird am Tisch gehobelt, Parmesan optional, Basilikum als Garnitur",
    servingProcedure: "Schale servieren, dann AM TISCH frischen Trüffel hobeln (Show-Element!). Ansage: 'Ihre Trüffel-Tagliatelle - ich hoble jetzt den frischen Trüffel für Sie'",
    guestCommunication: "Trüffel-Hobeln ankündigen: 'Darf ich Ihnen frischen Trüffel über die Pasta hobeln? Sagen Sie bitte Stopp, wenn genug ist.' (Gast entscheidet Menge)",
    criticalServicePoints: [
      "SHOW-ELEMENT: Trüffel MUSS am Tisch gehobelt werden (nicht in Küche)!",
      "Pasta muss 'al dente' sein - nicht verkocht",
      "Sauce darf NICHT zu dick sein (Pasta muss 'gleiten')",
      "Schale muss heiß sein - Pasta kühlt schnell ab"
    ],
    fourStarStandards: [
      "Trüffel-Hobel sauber und professionell präsentieren",
      "Trüffel in dünnen, gleichmäßigen Scheiben hobeln",
      "Pasta perfekt al dente (leichter Biss)",
      "Sauce cremig und glänzend (nicht ölig oder wässrig)"
    ],
    servingTemperature: "Pasta: 75°C, Schale: 55°C",
    timingNotes: "Pasta max 1 Minute nach Kochen servieren - wird sonst matschig"
  },

  {
    id: "maxwell-h7",
    name: "Gebratene Entenbrust mit Orangen-Sauce",
    category: "Hauptgänge",
    servicePresentation: "Auf vorgewärmtem Teller (60°C), Entenbrust in Scheiben geschnitten fächerförmig",
    plateDescription: "Entenbrust-Scheiben fächerförmig mittig, Hautseite nach oben (zeigt knusprige Haut), Orangen-Sauce separat in Saucière, Beilage auf 3-Uhr-Position, Orangenscheibe als Garnitur",
    servingProcedure: "Teller und Saucière von rechts servieren. Ansage: 'Ihre rosa gebratene Entenbrust mit Orangen-Sauce'",
    guestCommunication: "Hinweis: 'Die Entenbrust ist rosa gebraten - die Haut ist schön knusprig. Die Orangen-Sauce harmoniert perfekt dazu.'",
    criticalServicePoints: [
      "Entenbrust MUSS rosa sein (nicht durchgebraten!) - Kerntemperatur 58-62°C",
      "Haut muss knusprig sein - NIEMALS Sauce über Haut gießen!",
      "Fleisch vor Service 3 Minuten ruhen lassen (sonst blutet es)",
      "Scheiben gleichmäßig dick schneiden (in Küche!)"
    ],
    fourStarStandards: [
      "Haut perfekt knusprig und goldbraun",
      "Fleisch rosa ohne rohes Blut",
      "Schnitte gleichmäßig und akkurat",
      "Sauce glänzend und aromatisch"
    ],
    servingTemperature: "Entenbrust-Kern: 58-62°C, Haut: knusprig",
    timingNotes: "3 Min ruhen nach Braten, dann schneiden und SOFORT servieren (max 1 Min)"
  },

  {
    id: "maxwell-h8",
    name: "Lammkarree mit Kräuterkruste",
    category: "Hauptgänge",
    servicePresentation: "Auf vorgewärmtem Teller (65°C), Lammkarree in 3 Stücke geschnitten",
    plateDescription: "Lammkarree-Stücke mittig angeordnet, Kräuterkruste nach oben, Knochen sichtbar (elegant!), Jus separat, Gemüse auf 9-Uhr-Position, Rosmarin-Zweig als Deko",
    servingProcedure: "Teller und Jus-Saucière von rechts servieren. Ansage: 'Ihr Lammkarree medium mit Kräuterkruste und Rotwein-Jus'",
    guestCommunication: "Gargrad bestätigen: 'Das Lamm ist medium gebraten - rosa und saftig. Die Kräuterkruste ist knusprig. Passt das für Sie?'",
    criticalServicePoints: [
      "KRITISCH: Lamm MUSS rosa sein (Medium 55-60°C) - nie durchgebraten!",
      "Kräuterkruste darf NICHT abfallen beim Schneiden",
      "Knochen müssen sauber und präsentabel sein",
      "Jus NIEMALS über Kruste gießen (zerstört Knusprigkeit)"
    ],
    fourStarStandards: [
      "Kräuterkruste gleichmäßig und knusprig",
      "Knochen sauber 'geputzt' (French Trimmed)",
      "Fleisch rosa ohne Blut auf Teller",
      "Schnitte akkurat und professionell"
    ],
    servingTemperature: "Lamm-Kern: 55-60°C, Kruste: knusprig",
    timingNotes: "3 Min ruhen nach Ofen, dann schneiden und SOFORT servieren"
  },

  {
    id: "maxwell-h9",
    name: "Vegetarisches Curry mit Basmatireis",
    category: "Hauptgänge",
    servicePresentation: "In tiefer Schale vorgewärmt (50°C), Reis separat in kleiner Schale",
    plateDescription: "Curry in Hauptschale mit sichtbarem Gemüse oben, Reis in separater Schale rechts daneben, frischer Koriander als Garnitur, Limettenscheibe am Rand",
    servingProcedure: "Beide Schalen gleichzeitig von rechts servieren. Ansage: 'Ihr vegetarisches Curry mit Basmatireis - frisch und aromatisch'",
    guestCommunication: "Optional: 'Das Curry ist medium-scharf - der Reis ist separat, damit Sie selbst dosieren können. Genießen Sie!'",
    criticalServicePoints: [
      "Curry muss dampfend heiß sein (80°C)",
      "Reis separat servieren (nicht vermischen!)",
      "Gemüse muss al dente sein (nicht verkocht)",
      "Koriander frisch (nicht welk)"
    ],
    fourStarStandards: [
      "Gemüse farblich ansprechend und bissfest",
      "Reis locker und nicht klebrig",
      "Curry-Konsistenz perfekt (nicht wässrig)",
      "Schalen-Rand absolut sauber"
    ],
    servingTemperature: "Curry: 80°C, Reis: 75°C",
    timingNotes: "Curry sofort nach Zubereitung servieren (max 2 Min) - Gemüse wird sonst matschig"
  },

  {
    id: "maxwell-h10",
    name: "Gegrilltes Gemüse-Teller mit Halloumi",
    category: "Hauptgänge",
    servicePresentation: "Auf großem, vorgewärmtem Teller (55°C), farblich arrangiert",
    plateDescription: "Gemüse in Reihen angeordnet (jede Gemüsesorte separat), Halloumi-Scheiben mittig, Balsamico-Reduktion als Dekoration, Kräuter-Öl in kleiner Schale separat",
    servingProcedure: "Teller und Öl-Schale von rechts servieren. Ansage: 'Ihr gegrilltes Gemüse mit Halloumi-Käse und Kräuteröl'",
    guestCommunication: "Hinweis: 'Das Gemüse kommt frisch vom Grill, der Halloumi ist noch warm und leicht knusprig. Das Kräuteröl können Sie nach Belieben darüber träufeln.'",
    criticalServicePoints: [
      "Gemüse muss Grillstreifen zeigen (optisch wichtig!)",
      "Halloumi MUSS warm sein (wird kalt sehr fest)",
      "Gemüse al dente - NICHT verkocht oder matschig",
      "Farben müssen leuchten (nicht grau oder braun)"
    ],
    fourStarStandards: [
      "Jede Gemüsesorte perfekt gegrillt",
      "Halloumi goldbraun mit Grillmuster",
      "Arrangement symmetrisch und farbenfroh",
      "Kräuteröl aromatisch und frisch"
    ],
    servingTemperature: "Gemüse: 65-70°C, Halloumi: 60°C",
    timingNotes: "Direkt nach Grill servieren (max 2 Min) - Halloumi wird sonst kalt und fest"
  },

  // ═══════════════════════════════════════════════════════════════
  // DESSERTS
  // ═══════════════════════════════════════════════════════════════
  {
    id: "maxwell-d1",
    name: "Crème Brûlée",
    category: "Desserts",
    servicePresentation: "In flacher Keramik-Form gekühlt (8°C), auf kleinem Teller mit Serviette",
    plateDescription: "Crème Brûlée in Form, karamellisierte Zuckerkruste oben, Beeren-Garnitur separat auf Teller, Minzblatt als Deko",
    servingProcedure: "Vorsichtig von rechts servieren (Kruste ist fragil!). Ansage: 'Ihre Crème Brûlée mit karamellisierter Zuckerkruste'",
    guestCommunication: "Hinweis: 'Die Zuckerkruste wurde frisch karamellisiert - knacken Sie sie mit dem Löffel auf. Darunter ist die cremige Vanille-Creme.'",
    criticalServicePoints: [
      "KRITISCH: Kruste muss frisch karamellisiert sein (max 5 Min vorher)!",
      "Creme muss gekühlt sein (8°C) - Kontrast zur warmen Kruste",
      "NIEMALS Kruste antippen oder berühren (bricht sofort)",
      "Form muss sauber sein (keine Karamell-Spritzer außen)"
    ],
    fourStarStandards: [
      "Kruste perfekt karamellisiert (goldbraun, nicht verbrannt)",
      "Creme gleichmäßig und glatt unter Kruste",
      "Form elegant und sauber",
      "Dessertlöffel bereitstellen (kein normaler Löffel!)"
    ],
    servingTemperature: "Creme: 8°C, Kruste: frisch karamellisiert",
    timingNotes: "Max 5 Min nach Karamellisieren servieren - Kruste wird sonst weich!"
  },

  {
    id: "maxwell-d2",
    name: "Tiramisu",
    category: "Desserts",
    servicePresentation: "In Glas oder auf gekühltem Teller (10°C) von rechts servieren",
    plateDescription: "Tiramisu geschichtet sichtbar (wenn Glas), Kakaopulver frisch darüber gesiebt, Amaretti-Keks separat auf Teller, Minzblatt als Garnitur",
    servingProcedure: "Vorsichtig von rechts servieren (schwer!). Ansage: 'Ihr hausgemachtes Tiramisu - klassisch italienisch'",
    guestCommunication: "Optional: 'Das Tiramisu wurde heute frisch zubereitet und hat die perfekte Konsistenz - genießen Sie es gekühlt!'",
    criticalServicePoints: [
      "Tiramisu muss gekühlt sein (10°C) - mindestens 4h im Kühlschrank",
      "Kakaopulver FRISCH sieben (direkt vor Service) - nicht vorab!",
      "Schichtung muss sichtbar sein (optisch wichtig)",
      "Nicht kippen beim Servieren (Creme verläuft)"
    ],
    fourStarStandards: [
      "Schichtung perfekt und gleichmäßig",
      "Kakaopulver gleichmäßig verteilt (nicht klumpig)",
      "Mascarpone-Creme luftig und cremig (nicht fest)",
      "Glas/Teller absolut sauber (keine Fingerabdrücke)"
    ],
    servingTemperature: "10°C (gut gekühlt)",
    timingNotes: "Kakaopulver erst unmittelbar vor Service sieben (max 30 Sek vorher)"
  },

  {
    id: "maxwell-d3",
    name: "Panna Cotta mit Beerensauce",
    category: "Desserts",
    servicePresentation: "Gestürzt auf gekühltem Teller (8°C) oder in Form, von rechts servieren",
    plateDescription: "Panna Cotta mittig auf Teller (gestürzt) oder in Form, Beerensauce kreisförmig um Panna Cotta, frische Beeren als Garnitur oben, Minzblatt",
    servingProcedure: "Vorsichtig von rechts servieren (sehr wackelig!). Ansage: 'Ihre Panna Cotta mit hausgemachter Beerensauce'",
    guestCommunication: "Hinweis: 'Die Panna Cotta ist perfekt cremig und die Beerensauce ist frisch zubereitet - genießen Sie!'",
    criticalServicePoints: [
      "KRITISCH: Panna Cotta darf NICHT zu fest sein (muss 'wackeln')!",
      "Falls gestürzt: SEHR vorsichtig tragen (fällt leicht um)",
      "Gekühlt servieren (8°C) - wird sonst zu weich",
      "Beerensauce NICHT über Panna Cotta gießen (Gast entscheidet)"
    ],
    fourStarStandards: [
      "Panna Cotta muss perfekt 'wackeln' (nicht fest wie Pudding)",
      "Oberfläche glatt und glänzend",
      "Beerensauce frisch und aromatisch",
      "Wenn gestürzt: Form perfekt und unversehrt"
    ],
    servingTemperature: "8°C (gut gekühlt)",
    timingNotes: "Mindestens 4h vorher im Kühlschrank - muss durchziehen"
  },

  {
    id: "maxwell-d4",
    name: "Schokoladen-Fondant mit Vanille-Eis",
    category: "Desserts",
    servicePresentation: "Auf vorgewärmtem Teller (45°C), Fondant mittig, Eis separat",
    plateDescription: "Fondant mittig auf Teller, Vanille-Eis-Kugel daneben (9-Uhr), Schokoladen-Sauce dekorativ auf Teller, Puderzucker leicht darüber gesiebt, Minzblatt",
    servingProcedure: "Sofort von rechts servieren (zeitkritisch!). Ansage: 'Ihr Schokoladen-Fondant mit flüssigem Kern und Vanille-Eis - genießen Sie es warm!'",
    guestCommunication: "WICHTIG: Gast informieren: 'Der Fondant hat einen flüssigen Schokoladen-Kern - schneiden Sie ihn am besten mittig auf. Das Eis schmilzt perfekt dazu.'",
    criticalServicePoints: [
      "EXTREM ZEITKRITISCH: SOFORT nach Ofen servieren (max 30 Sek)!",
      "Kern MUSS flüssig sein - Fondant darf nicht zu lange backen",
      "Eis separat servieren (schmilzt sonst zu schnell)",
      "Teller vorwärmen (sonst wird Fondant zu schnell kalt)"
    ],
    fourStarStandards: [
      "Fondant außen fest, innen flüssig",
      "Eis perfekt rund und fest (nicht angeschmolzen)",
      "Schokoladen-Sauce glänzend und warm",
      "Puderzucker frisch gesiebt (nicht klumpig)"
    ],
    servingTemperature: "Fondant: 65°C außen, Kern: flüssig, Eis: -12°C",
    timingNotes: "ABSOLUT KRITISCH: Max 30 Sek nach Ofen servieren - Kern erstarrt sonst!"
  },

  {
    id: "maxwell-d5",
    name: "Apfelstrudel mit Vanillesauce",
    category: "Desserts",
    servicePresentation: "Auf vorgewärmtem Teller (50°C), Strudel schräg angeschnitten",
    plateDescription: "Strudel-Stück schräg auf Teller (zeigt Füllung), Vanillesauce separat in Saucière oder dekorativ auf Teller, Puderzucker darüber, Minzblatt, optional Vanille-Eis",
    servingProcedure: "Teller und Sauce von rechts servieren. Ansage: 'Ihr hausgemachter Apfelstrudel mit Vanillesauce - warm und knusprig'",
    guestCommunication: "Hinweis: 'Der Strudel kommt frisch aus dem Ofen - die Vanillesauce ist separat, damit der Teig knusprig bleibt. Genießen Sie!'",
    criticalServicePoints: [
      "Strudel muss WARM sein (direkt aus Ofen)",
      "Teig muss knusprig sein - NIEMALS Sauce über Strudel gießen!",
      "Anschnitt muss Füllung zeigen (optisch wichtig)",
      "Puderzucker erst unmittelbar vor Service sieben"
    ],
    fourStarStandards: [
      "Teig goldbraun und knusprig (nicht verbrannt)",
      "Füllung saftig und aromatisch (nicht trocken)",
      "Vanillesauce cremig und warm",
      "Schnitt akkurat und professionell"
    ],
    servingTemperature: "Strudel: 70°C, Sauce: 60°C",
    timingNotes: "Max 2 Min nach Ofen servieren - Teig wird sonst weich"
  },

  {
    id: "maxwell-d6",
    name: "Obstsalat mit Minz-Limetten-Dressing",
    category: "Desserts",
    servicePresentation: "In gekühlter Glasschale (8°C) oder auf gekühltem Teller von rechts servieren",
    plateDescription: "Obstsalat farbenfroh arrangiert, Minz-Limetten-Dressing darüber, frische Minzblätter als Garnitur, optional Sorbet-Kugel daneben",
    servingProcedure: "Vorsichtig von rechts servieren. Ansage: 'Ihr frischer Obstsalat mit Minz-Limetten-Dressing - leicht und erfrischend'",
    guestCommunication: "Optional: 'Alle Früchte sind frisch geschnitten und das Dressing ist hausgemacht - perfekt als leichter Abschluss!'",
    criticalServicePoints: [
      "Obst muss FRISCH geschnitten sein (max 2h vorher)",
      "Früchte dürfen NICHT braun oder matschig sein",
      "Dressing erst kurz vor Service darüber (sonst wird Obst wässrig)",
      "Gekühlt servieren (8°C)"
    ],
    fourStarStandards: [
      "Früchte perfekt geschnitten und farbenfroh",
      "Keine braunen Stellen (besonders Apfel/Banane)",
      "Dressing frisch und aromatisch",
      "Arrangement ästhetisch und appetitlich"
    ],
    servingTemperature: "8°C (gut gekühlt)",
    timingNotes: "Dressing max 2 Min vor Service darüber - Obst wird sonst wässrig"
  },

  {
    id: "maxwell-d7",
    name: "Käseplatte mit Trauben und Feigen",
    category: "Desserts",
    servicePresentation: "Auf großem Holzbrett oder Schieferplatte, Zimmertemperatur",
    plateDescription: "3-5 Käsesorten arrangiert (mild → kräftig), Trauben und Feigen dekorativ dazwischen, Walnüsse, Feigen-Senf in kleiner Schale, Brot/Cracker separat",
    servingProcedure: "Brett/Platte von rechts servieren, Käse-Besteck bereitlegen. Ansage: 'Ihre Käseauswahl mit frischen Früchten und Feigen-Senf'",
    guestCommunication: "WICHTIG: Käsesorten kurz vorstellen: 'Von mild nach kräftig: [Namen nennen]. Der Feigen-Senf passt besonders zum [Käsename]. Genießen Sie!'",
    criticalServicePoints: [
      "KRITISCH: Käse muss Zimmertemperatur haben (mind 1h aus Kühlschrank)!",
      "Anordnung: Von mild zu kräftig (links → rechts)",
      "Käse NIEMALS kalt servieren (verliert Aroma)",
      "Jeder Käse braucht eigenes Besteck (keine Geschmacksvermischung)"
    ],
    fourStarStandards: [
      "Käse perfekt temperiert (Zimmertemperatur)",
      "Früchte frisch und dekorativ",
      "Brett/Platte rustikal-elegant",
      "Käse-Namen auf kleiner Karte erklären (optional)"
    ],
    servingTemperature: "Zimmertemperatur (18-20°C)",
    timingNotes: "Käse mind 1h vorher aus Kühlschrank nehmen - Aroma entwickelt sich"
  },

  {
    id: "maxwell-d8",
    name: "Mousse au Chocolat",
    category: "Desserts",
    servicePresentation: "In Glas oder gekühltem Schälchen (8°C) von rechts servieren",
    plateDescription: "Mousse im Glas geschichtet, Schlagsahne-Tupfer oben, Schokoladen-Raspel darüber, Keks oder Hippe separat auf Unterteller, Minzblatt",
    servingProcedure: "Vorsichtig von rechts servieren. Ansage: 'Ihre hausgemachte Mousse au Chocolat - cremig und schokoladig'",
    guestCommunication: "Optional: 'Die Mousse wurde heute frisch zubereitet und ist besonders luftig - genießen Sie sie gekühlt!'",
    criticalServicePoints: [
      "Mousse muss luftig sein (nicht fest wie Pudding)",
      "Gekühlt servieren (8°C) - mindestens 3h durchziehen lassen",
      "Schlagsahne frisch aufschlagen (nicht aus Sprühflasche!)",
      "Schokoladen-Raspel erst vor Service darüber (nicht vorab)"
    ],
    fourStarStandards: [
      "Mousse perfekt luftig und cremig",
      "Schlagsahne fest und frisch",
      "Schokoladen-Raspel gleichmäßig und dünn",
      "Glas/Schale absolut sauber (keine Fingerabdrücke)"
    ],
    servingTemperature: "8°C (gut gekühlt)",
    timingNotes: "Mind 3h im Kühlschrank - Mousse muss durchziehen und fest werden"
  },

  {
    id: "maxwell-d9",
    name: "Sorbet-Variation (3 Sorten)",
    category: "Desserts",
    servicePresentation: "Auf gekühltem Teller oder in gekühlter Schale (-5°C) von rechts servieren",
    plateDescription: "3 Sorbet-Kugeln nebeneinander, frische Früchte als Garnitur (passend zu Sorbet-Sorten), Minzblatt, optional Frucht-Coulis dekorativ auf Teller",
    servingProcedure: "Schnell von rechts servieren (schmilzt!). Ansage: 'Ihre Sorbet-Variation: [Sorten nennen] - frisch und erfrischend'",
    guestCommunication: "Kurz Sorten vorstellen: 'Sie haben [Sorte 1], [Sorte 2] und [Sorte 3] - alle hausgemacht und ohne Milch, rein fruchtig!'",
    criticalServicePoints: [
      "EXTREM ZEITKRITISCH: Sorbet schmilzt sehr schnell!",
      "Teller/Schale muss gekühlt sein (-5°C)",
      "Kugeln gleichmäßig formen (Kugelformer!)",
      "SOFORT servieren nach Portionieren (max 30 Sek)"
    ],
    fourStarStandards: [
      "Kugeln perfekt rund und gleichmäßig",
      "Sorbet fest und nicht angeschmolzen",
      "Früchte frisch und farbenfroh",
      "Sorten geschmacklich harmonisch kombiniert"
    ],
    servingTemperature: "-12°C (sehr kalt)",
    timingNotes: "SOFORT nach Portionieren servieren (max 30 Sek) - schmilzt extrem schnell!"
  },

  {
    id: "maxwell-d10",
    name: "Crêpes Suzette",
    category: "Desserts",
    servicePresentation: "Auf vorgewärmtem Teller (50°C), flambiert am Tisch (Show-Element!)",
    plateDescription: "Crêpes gefaltet auf Teller, Orangen-Sauce darüber, optional Vanille-Eis daneben, Orangenzeste als Garnitur",
    servingProcedure: "SHOW-ELEMENT: Am Tisch flambieren! Ansage: 'Ihre Crêpes Suzette - ich flambiere sie jetzt frisch für Sie!'",
    guestCommunication: "WICHTIG: Flambieren ankündigen: 'Ich bereite jetzt Ihre Crêpes Suzette am Tisch zu - das ist ein klassisches französisches Dessert mit Orangen-Likör flambiert. Einen Moment bitte!'",
    criticalServicePoints: [
      "SHOW-ELEMENT: IMMER am Tisch flambieren (nicht in Küche)!",
      "Sicherheit: Gast vorwarnen, Abstand halten",
      "Crêpes müssen warm sein (nicht kalt)",
      "Flambe-Pfanne sauber und professionell"
    ],
    fourStarStandards: [
      "Flambieren elegant und sicher durchführen",
      "Crêpes perfekt dünn und gleichmäßig",
      "Orangen-Sauce aromatisch und nicht zu süß",
      "Service-Ritual perfekt beherrschen"
    ],
    servingTemperature: "Crêpes: 70°C, flambiert",
    timingNotes: "Am Tisch zubereiten - Show-Element! Etwa 2-3 Min Zubereitungszeit am Tisch"
  }
];

// ═══════════════════════════════════════════════════════════════
// HELPER-FUNKTIONEN
// ═══════════════════════════════════════════════════════════════

/**
 * Findet Service-Standards für ein Gericht anhand ID oder Name
 */
export const findRestaurantServiceStandard = (
  itemIdOrName: string
): RestaurantServiceStandard | undefined => {
  return restaurantServiceStandards.find(
    (standard) =>
      standard.id === itemIdOrName ||
      standard.name.toLowerCase().includes(itemIdOrName.toLowerCase())
  );
};

/**
 * Formatiert Service-Standards als Text für Admin-Anzeige
 */
export const formatRestaurantServiceInstructions = (
  standard: RestaurantServiceStandard
): string => {
  return `
═══════════════════════════════════════════════════════════════
🍽️ SERVICE-ANWEISUNG: ${standard.name.toUpperCase()}
═══════════════════════════════════════════════════════════════

📋 SERVICE-PRÄSENTATION:
${standard.servicePresentation}

🎨 TELLER-BESCHREIBUNG:
${standard.plateDescription}

👔 SERVICE-ABLAUF:
${standard.servingProcedure}

💬 GAST-KOMMUNIKATION:
${standard.guestCommunication}

⚠️ KRITISCHE SERVICE-PUNKTE:
${standard.criticalServicePoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

⭐ 4-STERNE-STANDARDS:
${standard.fourStarStandards.map((std, i) => `${i + 1}. ${std}`).join('\n')}

🌡️ TEMPERATUR & TIMING:
Temperatur: ${standard.servingTemperature}
Timing: ${standard.timingNotes}

═══════════════════════════════════════════════════════════════
`;
};
