# DRTime - Real-Time Transit Tracking

DRTime is a modern public transportation tracking application that provides real-time information about bus routes, stops, and weather conditions to help commuters plan their journeys effectively.

## Features

- 🚌 Live bus tracking
- 📍 Comprehensive route listings and details
- ⏰ Real-time arrival predictions
- 🌤️ Integrated weather information
- 📱 Responsive design for all devices
- 🔍 Smart route search and filtering

## Tech Stack

- **Frontend Framework**: Next.js with React
- **UI Library**: Material-UI (MUI)
- **Language**: TypeScript
- **Styling**: MUI Theme Provider & CSS-in-JS
- **State Management**: React Hooks
- **API Integration**: RESTful APIs

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/CortAuger/Hack-A-Thon.git
cd drtime
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add necessary environment variables.

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
drtime/
├── src/
│   ├── app/          # Next.js app directory
│   ├── components/   # React components
│   ├── theme/        # MUI theme configuration
│   └── types/        # TypeScript type definitions
├── public/           # Static assets
└── package.json      # Project dependencies
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments

- Durham Region Transit for inspiration
- Material-UI team for the amazing component library
- All contributors who helped make this project possible
