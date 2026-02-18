export type RackModule =
  | 'IDEA'
  | 'SEQ'
  | 'MIX'
  | 'CHORD'
  | 'SPACE'
  | 'MASTER'
  | 'RUMBLE';

export interface RackBarProps {
  activeModule: RackModule;
  onModuleChange: (m: RackModule) => void;
  detailOpen: boolean;
  onDetailToggle: () => void;
  contextualControls?: React.ReactNode;
}

const MODULES: RackModule[] = [
  'IDEA',
  'SEQ',
  'MIX',
  'CHORD',
  'SPACE',
  'MASTER',
  'RUMBLE',
];

export function RackBar({
  activeModule,
  onModuleChange,
  detailOpen,
  onDetailToggle,
  contextualControls,
}: RackBarProps) {
  return (
    <>
      <div className="su-tabs">
        {MODULES.map((m) => (
          <button
            key={m}
            type="button"
            className={`su-tab ${activeModule === m ? 'is-active' : ''}`}
            onClick={() => onModuleChange(m)}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="su-rackCenter">
        {contextualControls ?? (
          <span className="su-rackCenter-placeholder">{activeModule}</span>
        )}
      </div>
      <button
        type="button"
        className={`su-btn ${detailOpen ? 'su-btn--primary' : ''}`}
        onClick={onDetailToggle}
      >
        DETAIL
      </button>
    </>
  );
}
