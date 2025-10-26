import { useState } from 'react';
import { Dices, X } from 'lucide-react';

const DICE_TYPES = [2, 3, 4, 6, 8, 10, 12, 20, 30, 100];

export function DiceRoller() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDie, setSelectedDie] = useState(20);
  const [numDice, setNumDice] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [result, setResult] = useState<{ rolls: number[]; total: number } | null>(null);

  const rollDice = () => {
    const rolls: number[] = [];
    for (let i = 0; i < numDice; i++) {
      rolls.push(Math.floor(Math.random() * selectedDie) + 1);
    }
    const sum = rolls.reduce((acc, roll) => acc + roll, 0);
    setResult({ rolls, total: sum + modifier });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Open dice roller"
      >
        <Dices size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 bg-slate-800 border-2 border-red-600 rounded-lg shadow-2xl p-6 w-80 z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Dices size={20} />
          Dice Roller
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close dice roller"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Dice Type</label>
          <div className="grid grid-cols-5 gap-2">
            {DICE_TYPES.map((die) => (
              <button
                key={die}
                onClick={() => setSelectedDie(die)}
                className={`py-2 px-1 rounded text-sm font-medium transition-colors ${
                  selectedDie === die
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                d{die}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Number of Dice</label>
          <input
            type="number"
            min="1"
            max="20"
            value={numDice}
            onChange={(e) => setNumDice(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Modifier</label>
          <input
            type="number"
            value={modifier}
            onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>

        <button
          onClick={rollDice}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition-colors"
        >
          Roll {numDice}d{selectedDie}
          {modifier !== 0 && (modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`)}
        </button>

        {result && (
          <div className="bg-slate-700 rounded p-4 space-y-2">
            <div className="text-sm text-gray-300">
              Rolls: {result.rolls.join(', ')}
            </div>
            <div className="text-2xl font-bold text-white text-center">
              Total: {result.total}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
