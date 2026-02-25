// Gotchi Battler type system: dominant trait = max deviation from 50 across NRG/AGG/SPK/BRN
// Indices: [0]=NRG  [1]=AGG  [2]=SPK  [3]=BRN  ([4]=EYS [5]=EYC not used for type)

export interface GotchiType {
  abbr: string
  color: string   // background hex
  text: string    // text color hex (white for most, dark for yellow/black)
}

const TRAIT_MAP: [high: GotchiType, low: GotchiType][] = [
  // NRG
  [
    { abbr: 'NIN', color: '#3b82f6', text: '#ffffff' },  // blue
    { abbr: 'HEA', color: '#eab308', text: '#1a1a1a' },  // yellow, dark text
  ],
  // AGG
  [
    { abbr: 'CLE', color: '#ef4444', text: '#ffffff' },  // red
    { abbr: 'TAN', color: '#f97316', text: '#ffffff' },  // orange
  ],
  // SPK
  [
    { abbr: 'CUR', color: '#111827', text: '#ffffff' },  // black
    { abbr: 'ENL', color: '#ec4899', text: '#ffffff' },  // pink
  ],
  // BRN
  [
    { abbr: 'MAG', color: '#7c3aed', text: '#ffffff' },  // violet
    { abbr: 'TRO', color: '#22c55e', text: '#ffffff' },  // green
  ],
]

export function getGotchiTypes(traits: number[]): GotchiType[] {
  const core = traits.slice(0, 4)
  const deviations = core.map(t => Math.abs(t - 50))
  const maxDev = Math.max(...deviations)
  if (maxDev === 0) return []

  return core.flatMap((t, i) => {
    if (deviations[i] !== maxDev) return []
    return [t > 50 ? TRAIT_MAP[i][0] : TRAIT_MAP[i][1]]
  })
}
