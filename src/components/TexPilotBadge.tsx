import { TEX_PILOT_QUERY, setTexPilot, useTexPilot } from '../theme/texPilot'

/** Visible only for the `?texPilot=1` compare session. Click toggles maps vs procedural. */
export function TexPilotBadge() {
  const on = useTexPilot()
  if (!TEX_PILOT_QUERY) return null
  return (
    <button
      type="button"
      className="tex-pilot-chip"
      data-ui
      onClick={() => setTexPilot(!on)}
      aria-pressed={on}
    >
      {on ? 'Pilot texturas · Boogar + chão' : 'Pilot · silicone procedural'}
    </button>
  )
}
