import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface LayerConfig {
  color: string;
}

const MOCK_CONFIG: Record<string, Record<string, LayerConfig>> = {
  Boundboxes: {
    scell: { color: "royalblue" }, // edgecolor
    module: { color: "red" },
    abstractModule: { color: "purple" },
  },
  CellPolygons: {
    "Oxide Diffusion": { color: "olive" },
    "Gate Poly": { color: "fuchsia" },
    Contact: { color: "salmon" },
    "N Implant": { color: "mediumaquamarine" },
    "P Implant": { color: "thistle" },
    "N Well": { color: "slategrey" },
    "P Well": { color: "indianred" },
    "N High VT": { color: "darkgreen" },
    "N Low VT": { color: "plum" },
    "P High VT": { color: "indigo" },
    "P Low VT": { color: "darkgoldenrod" },
  },
  Metals: {
    Metal1: { color: "khaki" },
    Metal2: { color: "turquoise" },
    Metal3: { color: "limegreen" },
    Metal4: { color: "darkorange" },
    Metal5: { color: "purple" },
    Metal6: { color: "cornflowerblue" },
    Metal7: { color: "red" },
    Metal8: { color: "peru" },
    Metal9: { color: "olivedrab" },
    Metal10: { color: "gray" },
    Metal11: { color: "black" },
    Metal12: { color: "black" },
  },
  VIAS: {
    VIA1: { color: "sandybrown" },
    VIA2: { color: "rosybrown" },
    VIA3: { color: "navy" },
    VIA4: { color: "darkslategray" },
    VIA5: { color: "plum" },
    VIA6: { color: "teal" },
    VIA7: { color: "thistle" },
    VIA8: { color: "darkgray" },
    VIA9: { color: "black" },
    VIA10: { color: "black" },
    VIA11: { color: "black" },
  },
};

interface LayerLegendProps {
  config?: Record<string, Record<string, { color: string }>>;
  visibility?: Record<string, boolean>;
  onToggleLayer?: (layerName: string) => void;
}

export function LayerLegend({
  config = MOCK_CONFIG,
  visibility,
  onToggleLayer,
}: LayerLegendProps) {
  return (
    <Card className="h-full border-0 shadow-none bg-transparent">
      <CardHeader className="px-3">
        <CardTitle className="text-sm font-semibold">Cell Layers</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 min-h-0">
        <div className="h-full overflow-y-auto pr-1 space-y-4">
          {Object.entries(config).map(([category, layers]) => (
            <div key={category}>
              <h4 className="mb-2 text-xs font-semibold text-muted-foreground">
                {category}
              </h4>
              <div className="space-y-1">
                {Object.entries(layers).map(([layerName, layerConfig]) => (
                  <div key={layerName} className="flex items-center space-x-2">
                    <Checkbox
                      id={`layer-${layerName}`}
                      checked={visibility?.[layerName] ?? true}
                      onCheckedChange={() => onToggleLayer?.(layerName)}
                    />
                    <div
                      className="h-3 w-3 rounded-sm border opacity-80"
                      style={{
                        backgroundColor: layerConfig.color,
                        borderColor: layerConfig.color,
                      }}
                    />
                    <Label
                      htmlFor={`layer-${layerName}`}
                      className="text-xs font-normal cursor-pointer whitespace-nowrap"
                    >
                      {layerName}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
