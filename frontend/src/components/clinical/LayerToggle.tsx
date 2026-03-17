type LayerState = {
  vitals: boolean;
  events: boolean;
  alerts: boolean;
};

type Props = {
  layers: LayerState;
  onToggle: (layer: keyof LayerState) => void;
};

export default function LayerToggle({ layers, onToggle }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(layers) as Array<keyof LayerState>).map((layer) => (
        <button
          key={layer}
          type="button"
          onClick={() => onToggle(layer)}
          className="rounded-full px-3 py-1.5 text-xs font-semibold transition"
          style={{
            backgroundColor: layers[layer] ? "rgba(59, 130, 246, 0.16)" : "var(--color-surface-muted)",
            color: layers[layer] ? "var(--color-accent)" : "var(--color-text-muted)",
          }}
        >
          {layer[0].toUpperCase() + layer.slice(1)}
        </button>
      ))}
    </div>
  );
}
