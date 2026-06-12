
CREATE TABLE public.partner_logos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  storage_path TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_logos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read partner logos"
  ON public.partner_logos FOR SELECT
  USING (true);

CREATE POLICY "admins manage partner logos"
  ON public.partner_logos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_partner_logos_updated
  BEFORE UPDATE ON public.partner_logos
  FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

INSERT INTO public.partner_logos (name, logo_url, target_url, sort_order) VALUES
  ('Audi AG', 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg', 'https://www.audi.de', 10),
  ('MediaMarktSaturn', 'https://upload.wikimedia.org/wikipedia/commons/b/be/Media_Markt_logo.svg', 'https://www.mediamarktsaturn.com', 20),
  ('Ingolstadt Village', 'https://upload.wikimedia.org/wikipedia/de/d/d3/Ingolstadt_Village_Logo.svg', 'https://www.thebicestercollection.com/ingolstadt-village/', 30),
  ('Le Petit Chef', 'https://lepetitchef.com/themes/custom/lepetitchef/logo.svg', 'https://lepetitchef.com/ingolstadt', 40),
  ('Ligne St. Barth', 'https://www.lignestbarth.com/media/logo/default/logo_lsb.png', 'https://www.lignestbarth.com', 50),
  ('Continental', 'https://upload.wikimedia.org/wikipedia/commons/2/22/Continental_AG_logo.svg', 'https://www.continental.com', 60),
  ('Airbus', 'https://upload.wikimedia.org/wikipedia/commons/d/db/Airbus_Logo.svg', 'https://www.airbus.com', 70),
  ('Westpark Ingolstadt', 'https://www.westpark-center.de/wp-content/themes/westpark/assets/img/logo.svg', 'https://www.westpark-center.de', 80),
  ('Hotelstars Union', 'https://www.hotelstars.eu/fileadmin/templates/hotelstars/img/hsu_logo.png', 'https://www.hotelstars.eu', 90),
  ('Clevertouch', 'https://www.clevertouch.com/themes/custom/clevertouch/logo.svg', 'https://www.clevertouch.com', 100),
  ('EDAG Engineering', 'https://upload.wikimedia.org/wikipedia/commons/b/b5/EDAG_Engineering_Logo.svg', 'https://www.edag.com', 110),
  ('Technogym', 'https://upload.wikimedia.org/wikipedia/commons/6/66/Technogym_logo.svg', 'https://www.technogym.com', 120),
  ('Booking.com', 'https://upload.wikimedia.org/wikipedia/commons/b/be/Booking.com_logo.svg', 'https://www.booking.com', 130),
  ('TripAdvisor', 'https://upload.wikimedia.org/wikipedia/commons/0/02/TripAdvisor_Logo.svg', 'https://www.tripadvisor.de', 140),
  ('HolidayCheck', 'https://upload.wikimedia.org/wikipedia/commons/d/df/HolidayCheck_Logo_2016.svg', 'https://www.holidaycheck.de', 150),
  ('American Express', 'https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg', 'https://www.americanexpress.com', 160),
  ('Klapp Cosmetics', 'https://klapp-cosmetics.com/media/logo/default/Logo_KLAPP_Group_Black.png', 'https://klapp-cosmetics.com', 170),
  ('Ingolstadt Tourismus', 'https://www.ingolstadt-tourismus.de/typo3conf/ext/itg_template/Resources/Public/Images/logo-itg.png', 'https://www.ingolstadt-tourismus.de', 180),
  ('HRS', 'https://upload.wikimedia.org/wikipedia/commons/b/b9/HRS_Logo_2016.svg', 'https://www.hrs.de', 190),
  ('Schutterhof Ingolstadt', '', 'https://www.schutterhof.de', 200);
