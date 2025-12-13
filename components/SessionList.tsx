'use client'

import { Session } from '@/app/page'

interface SessionListProps {
  sessions: Session[]
  onDelete: (sessionId: string) => void
  onReallocate: (sessionId: string) => void
}

export default function SessionList({ sessions, onDelete, onReallocate }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-500 text-lg">No sessions created yet. Create your first session to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sessions.map((session) => (
        <div key={session.id} className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{session.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Category: {session.drivers[0]?.category === 'above' ? 'Above 70kg' : 'Below 70kg'} | 
                Drivers: {session.drivers.length} | 
                Available Kart Numbers: {session.availableKartNumbers?.join(', ') || '1-10 (default)'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onReallocate(session.id)}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                Reallocate Numbers
              </button>
              <button
                onClick={() => onDelete(session.id)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                Delete Session
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                    Driver Name
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700">
                    Kart Number
                  </th>
                </tr>
              </thead>
              <tbody>
                {session.drivers
                  .sort((a, b) => (a.kartNumber || 0) - (b.kartNumber || 0))
                  .map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-gray-800">
                        {driver.name}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-indigo-500 text-white font-bold rounded-full">
                          {driver.kartNumber || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

