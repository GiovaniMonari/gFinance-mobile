import { AppAlertHost } from './src/components/app'
import { AppNavigator } from './src/navigation/AppNavigator'

export default function App() {
  return (
    <>
      <AppNavigator />
      {/* Own window, not a sibling in the root layout — it overlays every screen. */}
      <AppAlertHost />
    </>
  )
}
