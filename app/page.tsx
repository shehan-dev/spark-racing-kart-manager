'use client'

import { useState, useEffect } from 'react'
import SessionList from '@/components/SessionList'
import CreateSession from '@/components/CreateSession'

export interface Driver {
  id: string
  name: string
  kartNumber: number | null
  category: 'above' | 'below'
}

export interface Session {
  id: string
  name: string
  drivers: Driver[]
  availableKartNumbers: number[]
  createdAt: number
}

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Load sessions from localStorage on mount
  useEffect(() => {
    const storedSessions = localStorage.getItem('kart-sessions')
    if (storedSessions) {
      try {
        const parsed = JSON.parse(storedSessions)
        // Migrate old sessions that don't have availableKartNumbers
        const migrated = parsed.map((session: Session) => {
          if (!session.availableKartNumbers) {
            return {
              ...session,
              availableKartNumbers: Array.from({ length: 10 }, (_, i) => i + 1)
            }
          }
          return session
        })
        setSessions(migrated)
      } catch (error) {
        console.error('Error loading sessions from localStorage:', error)
      }
    }
  }, [])

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0 || localStorage.getItem('kart-sessions')) {
      localStorage.setItem('kart-sessions', JSON.stringify(sessions))
    }
  }, [sessions])

  const handleCreateSession = (sessionName: string, driverNames: string[], category: 'above' | 'below', availableKartNumbers: number[]) => {
    const newSession: Session = {
      id: Date.now().toString(),
      name: sessionName,
      drivers: driverNames.map((name, index) => ({
        id: `${Date.now()}-${index}`,
        name: name.trim(),
        kartNumber: null,
        category,
      })),
      availableKartNumbers,
      createdAt: Date.now(),
    }

    // Allocate random kart numbers
    allocateKartNumbers(newSession)
    
    setSessions([...sessions, newSession])
    setShowCreateForm(false)
  }

  const allocateKartNumbers = (session: Session) => {
    // Use the session's available kart numbers, or default to 1-10
    const availableNumbers = session.availableKartNumbers && session.availableKartNumbers.length > 0
      ? [...session.availableKartNumbers]
      : Array.from({ length: 10 }, (_, i) => i + 1)
    
    const shuffled = [...availableNumbers].sort(() => Math.random() - 0.5)
    
    // Allocate numbers to drivers (only as many as there are drivers)
    // If there are more drivers than available numbers, some will remain unassigned
    session.drivers.forEach((driver, index) => {
      if (index < shuffled.length) {
        driver.kartNumber = shuffled[index]
      } else {
        driver.kartNumber = null
      }
    })
  }

  const handleDeleteSession = (sessionId: string) => {
    setSessions(sessions.filter(session => session.id !== sessionId))
  }

  const handleReallocateKartNumbers = (sessionId: string) => {
    setSessions(sessions.map(session => {
      if (session.id === sessionId) {
        const updatedSession = { ...session, drivers: [...session.drivers] }
        allocateKartNumbers(updatedSession)
        return updatedSession
      }
      return session
    }))
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
        </div>

        {!showCreateForm ? (
          <div className="mb-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200"
            >
              + Create New Session
            </button>
          </div>
        ) : (
          <CreateSession
            onCreate={handleCreateSession}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        <SessionList
          sessions={sessions}
          onDelete={handleDeleteSession}
          onReallocate={handleReallocateKartNumbers}
        />
      </div>
    </main>
  )
}

