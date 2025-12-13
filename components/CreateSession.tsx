'use client'

import { useState } from 'react'

interface CreateSessionProps {
  onCreate: (sessionName: string, driverNames: string[], category: 'above' | 'below', availableKartNumbers: number[]) => void
  onCancel: () => void
}

export default function CreateSession({ onCreate, onCancel }: CreateSessionProps) {
  const [sessionName, setSessionName] = useState('')
  const [category, setCategory] = useState<'above' | 'below'>('below')
  const [driverInput, setDriverInput] = useState('')
  const [driverNames, setDriverNames] = useState<string[]>([])
  const [kartNumbersInput, setKartNumbersInput] = useState('1,2,3,4,5,6,7,8,9,10')

  const handleAddDriver = () => {
    const trimmedName = driverInput.trim()
    if (trimmedName && !driverNames.includes(trimmedName)) {
      setDriverNames([...driverNames, trimmedName])
      setDriverInput('')
    }
  }

  const handleRemoveDriver = (index: number) => {
    setDriverNames(driverNames.filter((_, i) => i !== index))
  }

  const parseKartNumbers = (input: string): number[] => {
    // Parse comma-separated or space-separated numbers
    const numbers = input
      .split(/[,\s]+/)
      .map(num => parseInt(num.trim(), 10))
      .filter(num => !isNaN(num) && num > 0)
      .filter((num, index, arr) => arr.indexOf(num) === index) // Remove duplicates
    
    return numbers.sort((a, b) => a - b)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const availableKartNumbers = parseKartNumbers(kartNumbersInput)
    
    if (sessionName.trim() && driverNames.length > 0 && availableKartNumbers.length > 0) {
      onCreate(sessionName.trim(), driverNames, category, availableKartNumbers)
      // Reset form
      setSessionName('')
      setDriverNames([])
      setDriverInput('')
      setCategory('below')
      setKartNumbersInput('1,2,3,4,5,6,7,8,9,10')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddDriver()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Session</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="sessionName" className="block text-sm font-medium text-gray-700 mb-1">
            Session Name
          </label>
          <input
            type="text"
            id="sessionName"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., Session 1 - Below 70kg"
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as 'above' | 'below')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="below">Below 70kg</option>
            <option value="above">Above 70kg</option>
          </select>
        </div>

        <div>
          <label htmlFor="kartNumbers" className="block text-sm font-medium text-gray-700 mb-1">
            Available Kart Numbers
          </label>
          <input
            type="text"
            id="kartNumbers"
            value={kartNumbersInput}
            onChange={(e) => setKartNumbersInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., 1,2,3,4,5,6,7,8,9,10 or 5,7,12,15,20"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter comma or space-separated kart numbers (e.g., 1,2,3,4,5 or 5 7 12 15 20)
          </p>
          {kartNumbersInput && (
            <p className="text-xs text-indigo-600 mt-1">
              Parsed numbers: {parseKartNumbers(kartNumbersInput).join(', ') || 'None (please enter valid numbers)'}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="driverInput" className="block text-sm font-medium text-gray-700 mb-1">
            Add Drivers
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="driverInput"
              value={driverInput}
              onChange={(e) => setDriverInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter driver name and press Enter or click Add"
            />
            <button
              type="button"
              onClick={handleAddDriver}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
            >
              Add
            </button>
          </div>
        </div>

        {driverNames.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Drivers ({driverNames.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {driverNames.map((name, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => handleRemoveDriver(index)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={!sessionName.trim() || driverNames.length === 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Create Session & Allocate Kart Numbers
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

