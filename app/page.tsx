'use client'

import { useEffect, useState } from 'react'

type Category = 'above' | 'below'
type Round = 'setup' | 'qualification' | 'race1' | 'race2' | 'race3' | 'final'

const QUAL_POINTS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
const RACE_POINTS = [10, 7, 6, 5, 4, 3, 2, 1] // Race 1 & Race 2
const RACE3_POINTS = [15, 13, 10, 8, 6, 4, 2, 1]

interface RoundResult {
  position: number | null
  points: number
  kartNumber: number | null
}

export interface Driver {
  id: string
  name: string
  category: Category
  currentKartNumber: number | null
  results: {
    qualification?: RoundResult
    race1?: RoundResult
    race2?: RoundResult
    race3?: RoundResult
  }
  totalPoints: number
}

interface EventState {
  category: Category
  availableKartNumbers: number[]
  drivers: Driver[]
  currentRound: Round
}

function parseKartNumbers(input: string): number[] {
  const nums = input
    .split(/[,\\s]+/)
    .map((n) => parseInt(n.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n > 0)

  const unique = Array.from(new Set(nums))
  return unique.sort((a, b) => a - b)
}

function getPointsForRound(round: Exclude<Round, 'setup' | 'final'>, positionIndex: number): number {
  if (round === 'qualification') {
    return QUAL_POINTS[positionIndex] ?? 0
  }
  if (round === 'race3') {
    return RACE3_POINTS[positionIndex] ?? 0
  }
  return RACE_POINTS[positionIndex] ?? 0
}

function getNextKartNumber(availableKartNumbers: number[], current: number | null): number | null {
  if (!availableKartNumbers.length || current == null) return current
  const idx = availableKartNumbers.indexOf(current)
  if (idx === -1) return availableKartNumbers[0]
  const nextIdx = (idx + 1) % availableKartNumbers.length
  return availableKartNumbers[nextIdx]
}

function getGridSortKey(driver: Driver, state: EventState): number {
  const total = state.drivers.length

  switch (state.currentRound) {
    case 'qualification': {
      // For quali just keep grid roughly by current kart number
      return driver.currentKartNumber ?? Number.MAX_SAFE_INTEGER
    }
    case 'race1': {
      // Reverse official Qualifying results: slowest starts P1, fastest last
      const pos = driver.results.qualification?.position
      if (!pos) return total + 1
      return total - pos + 1
    }
    case 'race2': {
      // Reverse official Race 1 results
      const pos = driver.results.race1?.position
      if (!pos) return total + 1
      return total - pos + 1
    }
    case 'race3': {
      // Grid based on Race 2 official results (normal order)
      const pos = driver.results.race2?.position
      if (!pos) return total + 1
      return pos
    }
    default:
      return Number.MAX_SAFE_INTEGER
  }
}

export default function Home() {
  const [eventState, setEventState] = useState<EventState | null>(null)

  const [sessionName, setSessionName] = useState('Spark Racing Event')
  const [category, setCategory] = useState<Category>('below')
  const [driverInput, setDriverInput] = useState('')
  const [driverNames, setDriverNames] = useState<string[]>([])
  const [kartNumbersInput, setKartNumbersInput] = useState('1,2,3,4,5,6,7,8,9,10')

  const [positionsByDriver, setPositionsByDriver] = useState<Record<string, number | null>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/event', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as EventState | null
        if (data) {
          setEventState(data)
        }
      } catch (e) {
        console.error('Failed to load event from API', e)
      }
    }

    load()
  }, [])

  useEffect(() => {
    const save = async () => {
      try {
        await fetch('/api/event', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventState),
        })
      } catch (e) {
        console.error('Failed to save event to API', e)
      }
    }

    // Persist every valid state change (including null to clear)
    void save()
  }, [eventState])

  const handleAddDriver = () => {
    const trimmed = driverInput.trim()
    if (trimmed && !driverNames.includes(trimmed)) {
      setDriverNames([...driverNames, trimmed])
      setDriverInput('')
    }
  }

  const handleRemoveDriver = (index: number) => {
    setDriverNames(driverNames.filter((_, i) => i !== index))
  }

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const kartNumbers = parseKartNumbers(kartNumbersInput)
    if (!kartNumbers.length || driverNames.length === 0) return

    // Do not allow more drivers than available karts
    if (driverNames.length > kartNumbers.length) {
      alert(
        `Number of drivers (${driverNames.length}) cannot exceed number of karts (${kartNumbers.length}).\n` +
          'Please add more kart numbers or remove some drivers.',
      )
      return
    }

    const shuffled = [...kartNumbers].sort(() => Math.random() - 0.5)

    const drivers: Driver[] = driverNames.map((name, index) => ({
      id: `${Date.now()}-${index}`,
      name: name.trim(),
      category,
      // Each driver gets exactly one kart from the shuffled list
      currentKartNumber: shuffled[index] ?? null,
      results: {},
      totalPoints: 0,
    }))

    const initialState: EventState = {
      category,
      availableKartNumbers: kartNumbers,
      drivers,
      currentRound: 'qualification',
    }

    setEventState(initialState)
    setPositionsByDriver({})
  }

  const startOver = () => {
    setEventState(null)
    setPositionsByDriver({})
    // Inform API to clear stored event
    void fetch('/api/event', { method: 'DELETE' }).catch((e) =>
      console.error('Failed to reset event via API', e),
    )
  }

  const currentRoundTitle = (round: Round): string => {
    switch (round) {
      case 'qualification':
        return 'Qualification'
      case 'race1':
        return 'Race 1'
      case 'race2':
        return 'Race 2'
      case 'race3':
        return 'Race 3'
      case 'final':
        return 'Final Results'
      default:
        return 'Setup'
    }
  }

  const handlePositionChange = (driverId: string, value: string) => {
    const num = value ? parseInt(value, 10) : null
    setPositionsByDriver((prev) => ({
      ...prev,
      [driverId]: Number.isNaN(num as number) ? null : num,
    }))
  }

  const submitResultsForCurrentRound = () => {
    if (!eventState) return

    const round = eventState.currentRound
    if (round === 'setup' || round === 'final') return

    const numDrivers = eventState.drivers.length

    const positioned = eventState.drivers
      .map((d) => ({
        driver: d,
        position: positionsByDriver[d.id] ?? null,
      }))
      .filter((d) => d.position != null && d.position! >= 1 && d.position! <= numDrivers)
      .sort((a, b) => (a.position! - b.position!))

    if (positioned.length !== numDrivers) {
      alert('Please enter a unique finishing position (1 to number of drivers) for every driver.')
      return
    }

    const usedPositions = new Set(positioned.map((d) => d.position))
    if (usedPositions.size !== numDrivers) {
      alert('Each finishing position must be used exactly once.')
      return
    }

    const updatedDrivers: Driver[] = eventState.drivers.map((driver) => {
      const entry = positioned.find((p) => p.driver.id === driver.id)
      if (!entry) return driver
      const positionIndex = entry.position! - 1
      const points = getPointsForRound(round, positionIndex)

      const roundResult: RoundResult = {
        position: entry.position,
        points,
        kartNumber: driver.currentKartNumber,
      }

      const newResults = { ...driver.results, [round]: roundResult }
      const totalPoints =
        (newResults.qualification?.points ?? 0) +
        (newResults.race1?.points ?? 0) +
        (newResults.race2?.points ?? 0) +
        (newResults.race3?.points ?? 0)

      return {
        ...driver,
        results: newResults,
        totalPoints,
      }
    })

    let nextRound: Round = 'final'
    if (round === 'qualification') nextRound = 'race1'
    else if (round === 'race1') nextRound = 'race2'
    else if (round === 'race2') nextRound = 'race3'
    else if (round === 'race3') nextRound = 'final'

    const driversWithNextKart =
      nextRound === 'final'
        ? updatedDrivers
        : updatedDrivers.map((d) => ({
            ...d,
            currentKartNumber: getNextKartNumber(eventState.availableKartNumbers, d.currentKartNumber),
          }))

    setEventState({
      ...eventState,
      drivers: driversWithNextKart,
      currentRound: nextRound,
    })
    setPositionsByDriver({})
  }

  const renderSetup = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Event Setup</h2>
      <form onSubmit={handleSetupSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Name
          </label>
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., Spark Racing Club Race"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="below">Below 70kg</option>
            <option value="above">Above 70kg</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available Kart Numbers
          </label>
          <input
            type="text"
            value={kartNumbersInput}
            onChange={(e) => setKartNumbersInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., 1,2,3,4,5,6,7,8,9,10 or 5,7,12,15,20"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter comma or space-separated kart numbers.
          </p>
          {kartNumbersInput && (
            <p className="text-xs text-indigo-600 mt-1">
              Parsed numbers: {parseKartNumbers(kartNumbersInput).join(', ') || 'None'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Add Drivers
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={driverInput}
              onChange={(e) => setDriverInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddDriver()
                }
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter driver name and press Enter or click Add"
            />
            <button
              type="button"
              onClick={handleAddDriver}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors duration-200"
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
                    className="text-indigo-700 hover:text-indigo-900 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={driverNames.length === 0 || parseKartNumbers(kartNumbersInput).length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Start Qualification (Random Kart Allocation)
          </button>
        </div>
      </form>
    </div>
  )

  const renderDriversTable = () => {
    if (!eventState) return null
    const { drivers, currentRound } = eventState

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {currentRoundTitle(currentRound)} – Grid / Results
            </h2>
            <p className="text-sm text-gray-500">
              Category: {eventState.category === 'above' ? 'Above 70kg' : 'Below 70kg'} | Drivers: {drivers.length}
            </p>
          </div>
          <button
            type="button"
            onClick={startOver}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
          >
            Reset Event
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Driver
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                  Kart #
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                  Position
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                  Points
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                  Total Points
                </th>
              </tr>
            </thead>
            <tbody>
              {drivers
                .slice()
                .sort((a, b) => getGridSortKey(a, eventState) - getGridSortKey(b, eventState))
                .map((driver) => {
                  const roundResult =
                    eventState.currentRound === 'qualification'
                      ? driver.results.qualification
                      : eventState.currentRound === 'race1'
                      ? driver.results.race1
                      : eventState.currentRound === 'race2'
                      ? driver.results.race2
                      : eventState.currentRound === 'race3'
                      ? driver.results.race3
                      : undefined

                  const positionValue = positionsByDriver[driver.id] ?? roundResult?.position ?? null

                  return (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-gray-800">
                        {driver.name}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-indigo-500 text-white font-bold rounded-full">
                          {driver.currentKartNumber ?? '-'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {eventState.currentRound === 'final' ? (
                          roundResult?.position ?? '-'
                        ) : (
                          <input
                            type="number"
                            min={1}
                            max={drivers.length}
                            value={positionValue ?? ''}
                            onChange={(e) => handlePositionChange(driver.id, e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                        {roundResult?.points ?? 0}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">
                        {driver.totalPoints}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        {eventState.currentRound !== 'final' && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={submitResultsForCurrentRound}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Save {currentRoundTitle(eventState.currentRound)} Results & Continue
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderFinalResults = () => {
    if (!eventState) return null

    const sorted = [...eventState.drivers].sort((a, b) => b.totalPoints - a.totalPoints)

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Final Results</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Position
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Driver
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                  Quali Pts
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                  Race 1 Pts
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                  Race 2 Pts
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                  Race 3 Pts
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((driver, index) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 text-sm font-semibold">
                    P{index + 1}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-800">
                    {driver.name}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                    {driver.results.qualification?.points ?? 0}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                    {driver.results.race1?.points ?? 0}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                    {driver.results.race2?.points ?? 0}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                    {driver.results.race3?.points ?? 0}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">
                    {driver.totalPoints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Kart Number Manager
          </h1>
          <img
            src="/spark-logo.png"
            alt="Spark Racing Logo"
            className="h-24 md:h-32 w-auto object-contain mx-auto"
          />
          <p className="mt-2 text-sm text-gray-600">
            Qualification → Race 1 → Race 2 → Race 3 with rotating kart numbers and final points.
          </p>
        </div>

        {!eventState || eventState.currentRound === 'setup' ? (
          renderSetup()
        ) : (
          <>
            {renderDriversTable()}
            {eventState.currentRound === 'final' && renderFinalResults()}
          </>
        )}
      </div>
    </main>
  )
}


