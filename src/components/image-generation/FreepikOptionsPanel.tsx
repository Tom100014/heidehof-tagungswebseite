
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FreepikOptions {
  aspect_ratio: string;
  styling: string;
  lighting: string;
  framing: string;
}

interface FreepikOptionsPanelProps {
  options: FreepikOptions;
  onChange: (options: FreepikOptions) => void;
  disabled?: boolean;
}

const FreepikOptionsPanel: React.FC<FreepikOptionsPanelProps> = ({
  options,
  onChange,
  disabled = false
}) => {
  const updateOption = (key: keyof FreepikOptions, value: string) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm">Freepik Imagen3 Einstellungen</CardTitle>
        <CardDescription className="text-xs">
          Erweiterte Optionen für die Bildgenerierung
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="aspect-ratio">Seitenverhältnis</Label>
            <Select 
              value={options.aspect_ratio} 
              onValueChange={(value) => updateOption('aspect_ratio', value)}
              disabled={disabled}
            >
              <SelectTrigger id="aspect-ratio">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="square_1_1">Quadratisch (1:1)</SelectItem>
                <SelectItem value="landscape_4_3">Querformat (4:3)</SelectItem>
                <SelectItem value="landscape_3_2">Querformat (3:2)</SelectItem>
                <SelectItem value="landscape_16_9">Breitbild (16:9)</SelectItem>
                <SelectItem value="portrait_3_4">Hochformat (3:4)</SelectItem>
                <SelectItem value="portrait_2_3">Hochformat (2:3)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="styling">Stil</Label>
            <Select 
              value={options.styling} 
              onValueChange={(value) => updateOption('styling', value)}
              disabled={disabled}
            >
              <SelectTrigger id="styling">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatisch</SelectItem>
                <SelectItem value="photographic">Fotografisch</SelectItem>
                <SelectItem value="digital_art">Digital Art</SelectItem>
                <SelectItem value="comic_book">Comic</SelectItem>
                <SelectItem value="fantasy_art">Fantasy</SelectItem>
                <SelectItem value="line_art">Linienzeichnung</SelectItem>
                <SelectItem value="analog_film">Analog Film</SelectItem>
                <SelectItem value="neon_punk">Neon Punk</SelectItem>
                <SelectItem value="isometric">Isometrisch</SelectItem>
                <SelectItem value="low_poly">Low Poly</SelectItem>
                <SelectItem value="origami">Origami</SelectItem>
                <SelectItem value="modeling_compound">Modeling Compound</SelectItem>
                <SelectItem value="cinematic">Cinematisch</SelectItem>
                <SelectItem value="3d_model">3D Model</SelectItem>
                <SelectItem value="pixel_art">Pixel Art</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lighting">Beleuchtung</Label>
            <Select 
              value={options.lighting} 
              onValueChange={(value) => updateOption('lighting', value)}
              disabled={disabled}
            >
              <SelectTrigger id="lighting">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatisch</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Kalt</SelectItem>
                <SelectItem value="golden_hour">Goldene Stunde</SelectItem>
                <SelectItem value="blue_hour">Blaue Stunde</SelectItem>
                <SelectItem value="ambient">Umgebungslicht</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="neon">Neon</SelectItem>
                <SelectItem value="dramatic">Dramatisch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="framing">Bildausschnitt</Label>
            <Select 
              value={options.framing} 
              onValueChange={(value) => updateOption('framing', value)}
              disabled={disabled}
            >
              <SelectTrigger id="framing">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatisch</SelectItem>
                <SelectItem value="close_up">Nahaufnahme</SelectItem>
                <SelectItem value="medium_shot">Halbaufnahme</SelectItem>
                <SelectItem value="full_shot">Ganzaufnahme</SelectItem>
                <SelectItem value="long_shot">Totale</SelectItem>
                <SelectItem value="extreme_close_up">Extreme Nahaufnahme</SelectItem>
                <SelectItem value="bird_eye_view">Vogelperspektive</SelectItem>
                <SelectItem value="worm_eye_view">Froschperspektive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FreepikOptionsPanel;
