import React from 'react';

const GLYPH_MAP: Record<string, number> = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '/': 10,
};

interface SpriteNumbersProps {
  value: string;
  showLv?: boolean;
  className?: string;
}

export const SpriteNumbers: React.FC<SpriteNumbersProps> = ({
  value,
  showLv = false,
  className = '',
}) => {
  const chars = value.split('');

  return (
    <div className={`inline-flex items-center pixelated ${className}`}>
      {showLv && (
        <span
          className="inline-block shrink-0 pixelated"
          style={{
            width: '22px',
            height: '14px',
            backgroundImage: 'url(/battle-ui/ui/overlay_lv.png)',
            backgroundRepeat: 'no-repeat',
            marginRight: '1px',
          }}
        />
      )}
      {chars.map((ch, idx) => {
        const glyphIdx = GLYPH_MAP[ch];
        if (glyphIdx === undefined) {
          return <span key={idx} style={{ width: '6px', display: 'inline-block' }} />;
        }
        return (
          <span
            key={idx}
            className="inline-block shrink-0 pixelated"
            style={{
              width: '12px',
              height: '14px',
              backgroundImage: 'url(/battle-ui/ui/icon_numbers.png)',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: `-${glyphIdx * 16 + 2}px 0px`,
            }}
          />
        );
      })}
    </div>
  );
};
