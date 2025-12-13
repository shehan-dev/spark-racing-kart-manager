# Kart Number Manager - Spark Racing

A Next.js application for managing kart number assignments for racing sessions.

## Features

- Create multiple racing sessions with custom names
- Support for two categories: Above 70kg and Below 70kg
- Add drivers to sessions
- Random allocation of kart numbers (1-10) to drivers
- Reallocate kart numbers for any session
- Delete sessions
- Local storage persistence - all data is saved automatically

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Click "Create New Session" to start
2. Enter a session name (e.g., "Session 1 - Below 70kg")
3. Select the category (Above 70kg or Below 70kg)
4. Add driver names one by one
5. Click "Create Session & Allocate Kart Numbers" to create the session with randomly assigned kart numbers
6. Use "Reallocate Numbers" to randomly reassign kart numbers
7. Use "Delete Session" to remove a session

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Local Storage API

