import { useState } from 'react';
import { Dices, X, Plus, Minus } from 'lucide-react';

const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100];

type SelectedDie = {
  sides: number;
  count: number;
};

type RollResult = {
  sides: number;
  rolls: number[];
  subtotal: number;
};

export default function EnhancedDiceRoller() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDice, setSelectedDice] = useState<Map<number, number>>(new Map([[20, 1]]));
  const [modifier, setModifier] = useState(0);
  const [results, setResults] = useState<RollResult[]>([]);
  const [lastTap, setLastTap] = useState<{ sides: number; time: number } | null>(null);

  const handleDiceClick = (sides: number, isCtrlKey: boolean) => {
    const newSelected = new Map(selectedDice);
    
    if (isCtrlKey || selectedDice.size > 0) {
      // Multi-select mode
      if (newSelected.has(sides)) {
        newSelected.delete(sides);
      } else {
        newSelected.set(sides, 1);
      }
    } else {
      // Single select
      newSelected.clear();
      newSelected.set(sides, 1);
    }
    
    // Keep at least one die selected
    if (newSelected.size === 0) {
      newSelected.set(sides, 1);
    }
    
    setSelectedDice(newSelected);
  };

  const handleDoubleTap = (sides: number) => {
    const now = Date.now();
    
    if (lastTap && lastTap.sides === sides && now - lastTap.time < 300) {
      // Double tap detected - toggle selection
      const newSelected = new Map(selectedDice);
      if (newSelected.has(sides)) {
        newSelected.delete(sides);
        if (newSelected.size === 0) {
          newSelected.set(sides, 1); // Keep at least one
        }
      } else {
        newSelected.set(sides, 1);
      }
      setSelectedDice(newSelected);
      setLastTap(null);
    } else {
      // First tap - just select if not already selected
      if (!selectedDice.has(sides)) {
        const newSelected = new Map(selectedDice);
        newSelected.set(sides, 1);
        setSelectedDice(newSelected);
      }
      setLastTap({ sides, time: now });
    }
  };

  const updateDiceCount = (sides: number, change: number) => {
    const newSelected = new Map(selectedDice);
    const current = newSelected.get(sides) || 1;
    const newCount = Math.max(1, Math.min(99, current + change));
    newSelected.set(sides, newCount);
    setSelectedDice(newSelected);
  };

  const rollAll = () => {
    const newResults: RollResult[] = [];
    
    selectedDice.forEach((count, sides) => {
      const rolls: number[] = [];
      for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
      }
      const subtotal = rolls.reduce((sum, roll) => sum + roll, 0);
      newResults.push({ sides, rolls, subtotal });
    });
    
    // Sort by dice size for better readability
    newResults.sort((a, b) => b.sides - a.sides);
    setResults(newResults);
  };

  const grandTotal = results.reduce((sum, r) => sum + r.subtotal, 0) + modifier;

  // Generate formula display
  const formula = Array.from(selectedDice.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([sides, count]) => `${count}d${sides}`)
    .join(' + ') + (modifier !== 0 ? (modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`) : '');

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-50"
        aria-label="Open dice roller"
      >
        <Dices size={28} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-slate-900 border-t-4 sm:border-2 border-red-600 sm:rounded-lg shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Dices size={24} />
            Dice Roller
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors p-2"
            aria-label="Close dice roller"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Instructions */}
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 text-sm text-blue-300">
            <p className="font-medium mb-1">💡 Multi-Select Tips:</p>
            <p className="text-xs text-blue-400">
              <span className="hidden sm:inline">• Hold Ctrl/Cmd + Click to select multiple dice</span>
              <span className="sm:hidden">• Double-tap dice to add/remove from selection</span>
            </p>
          </div>

          {/* Dice Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Select Dice Types</label>
            <div className="grid grid-cols-4 gap-3">
              {DICE_TYPES.map((sides) => {
                const isSelected = selectedDice.has(sides);
                return (
                  <button
                    key={sides}
                    onClick={(e) => handleDiceClick(sides, e.ctrlKey || e.metaKey)}
                    onTouchEnd={() => handleDoubleTap(sides)}
                    className={`relative py-4 px-2 rounded-lg text-base font-bold transition-all ${
                      isSelected
                        ? 'bg-red-600 text-white scale-105 shadow-lg ring-2 ring-red-400'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600 active:scale-95'
                    }`}
                  >
                    d{sides}
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Dice Counts */}
          {selectedDice.size > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">Dice Counts</label>
              <div className="grid grid-cols-4 gap-2">
                {Array.from(selectedDice.entries())
                  .sort((a, b) => b[0] - a[0])
                  .map(([sides, count]) => (
                    <div key={sides} className="bg-slate-800 border border-slate-700 rounded-lg p-1.5">
                      <div className="text-white font-bold text-xs text-center mb-1">d{sides}</div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => updateDiceCount(sides, 1)}
                          className="bg-slate-700 hover:bg-slate-600 active:scale-95 text-white p-1 rounded transition-all"
                          aria-label="Increase count"
                        >
                          <Plus size={12} />
                        </button>
                        <div className="bg-slate-700 text-white text-center rounded py-1 text-sm font-bold">
                          {count}
                        </div>
                        <button
                          onClick={() => updateDiceCount(sides, -1)}
                          className="bg-slate-700 hover:bg-slate-600 active:scale-95 text-white p-1 rounded transition-all"
                          aria-label="Decrease count"
                        >
                          <Minus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Modifier */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Modifier</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setModifier(modifier - 1)}
                className="bg-slate-700 hover:bg-slate-600 active:scale-95 text-white p-3 rounded-lg transition-all"
                aria-label="Decrease modifier"
              >
                <Minus size={20} />
              </button>
              <input
                type="number"
                value={modifier}
                onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                className="flex-1 bg-slate-700 border border-slate-600 text-white text-center rounded-lg px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-red-600"
              />
              <button
                onClick={() => setModifier(modifier + 1)}
                className="bg-slate-700 hover:bg-slate-600 active:scale-95 text-white p-3 rounded-lg transition-all"
                aria-label="Increase modifier"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Formula Display */}
          <div className="text-center py-3 px-4 bg-slate-800 border border-slate-700 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Rolling:</div>
            <div className="text-white font-mono text-lg font-bold">{formula}</div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-slate-800 border-2 border-green-600 rounded-lg p-4 space-y-3">
              <h4 className="text-lg font-bold text-white">Results</h4>
              {results.map((result) => (
                <div key={result.sides} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">
                      {result.rolls.length}d{result.sides}
                    </span>
                    <span className="text-white font-bold text-lg">{result.subtotal}</span>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    [{result.rolls.join(', ')}]
                  </div>
                </div>
              ))}
              {modifier !== 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Modifier</span>
                  <span className="text-white font-bold">{modifier > 0 ? '+' : ''}{modifier}</span>
                </div>
              )}
              <div className="border-t-2 border-green-600 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-lg">Total:</span>
                  <span className="text-green-400 font-bold text-3xl">{grandTotal}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Roll Button */}
        <div className="p-4 border-t border-slate-700 bg-slate-800">
          <button
            onClick={rollAll}
            className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 text-lg shadow-lg"
          >
            <Dices size={24} />
            Roll {formula}
          </button>
        </div>
      </div>
    </div>
  );
}
