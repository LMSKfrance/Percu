export interface SegmentedToggleOption {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
  title?: string;
  activeClass?: string;
}

export function SegmentedToggle({ options }: { options: SegmentedToggleOption[] }) {
  return (
    <div className="ui-seg" role="group">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`ui-seg__opt ${opt.active ? (opt.activeClass ?? 'is-active') : ''}`.trim()}
          onClick={opt.onClick}
          title={opt.title ?? opt.label}
          aria-pressed={opt.active}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
