import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function LayerLegend() {
  const { layoutData, layerConfig, layerVisibility, toggleLayerVisibility, isLayerConfigLoading } =
    useWorkspace();

  return (
    <Card className="h-full border-0 shadow-none bg-transparent">
      <CardHeader className="px-3">
        <CardTitle className="text-sm font-semibold">Cell Layers</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 min-h-0">
        {isLayerConfigLoading ? (
          <div className="space-y-2 p-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/4 animate-pulse rounded bg-muted" />
          </div>
        ) : !layoutData || !layerConfig ? (
          <div className="flex h-full min-h-24 items-center justify-center text-center text-sm text-muted-foreground">
            No layout loaded yet.
          </div>
        ) : (
          <div className="h-full overflow-y-auto pr-1 space-y-4">
            {Object.entries(layerConfig).map(([category, layers]) => (
              <div key={category}>
                <h4 className="mb-2 text-xs font-semibold text-muted-foreground">{category}</h4>
                <div className="space-y-1">
                  {Object.entries(layers).map(([layerName, config]) => (
                    <div key={layerName} className="flex items-center space-x-2">
                      <Checkbox
                        id={`layer-${layerName}`}
                        checked={layerVisibility[layerName] ?? true}
                        onCheckedChange={() => toggleLayerVisibility(layerName)}
                      />
                      <div
                        className="h-3 w-3 rounded-sm border opacity-80"
                        style={{
                          backgroundColor: config.color,
                          borderColor: config.color,
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
        )}
      </CardContent>
    </Card>
  );
}
