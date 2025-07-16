# Puzzle Alarm Clock

A smart alarm clock mobile application built with React Native that ensures you're fully awake by requiring you to solve puzzles to dismiss alarms. Features include memory games, wake-up verification checks, and customizable alarms.

## Features

- **Multiple Alarm Management**: Create and manage multiple alarms with custom settings
- **Puzzle Challenges**: Solve puzzles to dismiss alarms (currently features Memory Game)
- **Wake-Up Check**: Optional follow-up notification to ensure you stay awake
- **Recurring Alarms**: Set alarms for specific days of the week
- **Custom Labels**: Label your alarms for easy identification

## Technical Stack

- React Native
- TypeScript
- SQLite (via react-native-sqlite-storage)
- Native Modules (Android)
- Hardware integration (vibration, sound, step counter)

## Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Android Studio (for Android development)
- React Native CLI

## Getting Started

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/2004-Nikhil/PuzzleAlarmClock.git
   cd PuzzleAlarmClock
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

### Running the App

#### Android
```
npx react-native run-android
```

## Project Structure

```
PuzzleAlarmClock/
├── android/               # Android native code
├── src/
│   ├── components/        # Reusable React components
│   ├── database/          # Database configuration and operations
│   ├── navigation/        # Navigation setup and routes
│   ├── native/            # Native module interfaces
│   ├── screens/           # App screens
│   ├── services/          # Service layers
│   └── App.tsx            # Main app component
├── types/                 # TypeScript type definitions
```

## How to Use

### Creating a New Alarm

1. Launch the app and tap "Add New Alarm"
2. Set the desired time
3. Add an optional label
4. Select repeat days (if any)
5. Choose a dismiss method:
   - Standard: Simple dismiss button
   - Memory Game: Match pairs of cards to dismiss
6. Toggle "Wake-Up Check" if you want a follow-up notification
7. Tap "Save Alarm"

### Managing Alarms

- Toggle an alarm on/off using the switch in the alarm list
- Tap an alarm to edit its settings
- Within the edit screen, tap "Delete Alarm" to remove

## How It Works

When an alarm triggers:

1. The app plays sound and vibration through a foreground service
2. The screen displays the alarm screen with the configured challenge
3. Once the challenge is completed, the alarm is dismissed
4. If "Wake-Up Check" is enabled, a notification will appear after a few minutes to verify you're still awake

## Permissions

The app requires the following permissions:

- Alarm scheduling
- Notification display
- Vibration control
- Wake lock (to ensure alarms trigger while device is asleep)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

