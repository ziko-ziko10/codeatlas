# CodeAtlas Frontend

Enterprise-grade interactive architecture visualization platform built with Next.js, TypeScript, and React Flow.

## Features

- 🎨 **Modern Dark UI** - Glassmorphism design with smooth animations
- 📊 **Interactive Graph Visualization** - React Flow-powered dependency graphs
- 🎯 **Risk Analysis** - Color-coded nodes based on risk scores
- 📈 **Real-time Metrics** - Dashboard widgets showing key architecture metrics
- 🔍 **Detailed Node Inspection** - Click any node to see comprehensive details
- ⚡ **Fast & Responsive** - Optimized for performance and user experience

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **Graph Visualization**: React Flow
- **Icons**: Lucide React
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Backend API running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install --legacy-peer-deps
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main dashboard page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific components
│   │   ├── MetricCard.tsx
│   │   └── ScanForm.tsx
│   └── graph/             # Graph visualization components
│       ├── DependencyGraph.tsx
│       └── NodeDetailsPanel.tsx
├── lib/                   # Utility functions
│   ├── api.ts            # API client
│   └── utils.ts          # Helper functions
└── types/                 # TypeScript type definitions
    └── index.ts
```

## Usage

### Scanning a Repository

1. Enter the full path to your local repository
2. Click "Analyze Repository"
3. Wait for the scan to complete
4. Explore the interactive dependency graph

### Interacting with the Graph

- **Pan**: Click and drag the background
- **Zoom**: Use mouse wheel or controls
- **Select Node**: Click any node to view details
- **Navigate**: Use minimap for quick navigation

### Understanding Risk Levels

- 🟢 **Low Risk** (0-40%): Well-maintained, low complexity
- 🟡 **Medium Risk** (40-60%): Moderate attention needed
- 🟠 **High Risk** (60-80%): Requires refactoring
- 🔴 **Critical Risk** (80-100%): Urgent modernization needed

## API Integration

The frontend communicates with the backend API:

- `POST /scan` - Scan a repository
- `GET /graph` - Retrieve graph data

See `lib/api.ts` for implementation details.

## Customization

### Styling

Edit `app/globals.css` to customize:
- Color scheme
- Glassmorphism effects
- Animations
- Typography

### Graph Layout

Modify `components/graph/DependencyGraph.tsx` to adjust:
- Node positioning algorithm
- Edge styling
- Minimap settings
- Background patterns

## Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Dependencies Installation Issues

If you encounter peer dependency conflicts:
```bash
npm install --legacy-peer-deps
```

### API Connection Issues

1. Ensure backend is running on port 8000
2. Check CORS settings in backend
3. Verify `.env.local` configuration

## Performance Optimization

- Graph rendering is optimized for up to 1000 nodes
- Lazy loading for large codebases
- Memoized components for smooth interactions
- Debounced search and filters

## License

Part of the CodeAtlas project.
