export type AppTopic =
  | 'love'    // Valentine's Day
  | 'reyes'   // Three Kings Day
  | 'mom'     // Mother's Day
  | 'dad'     // Father's Day
  | 'bday'    // Birthday
  | 'xmas'    // Christmas
  | string    // extensible

export interface AppTheme {
  primary: string      // hex color
  secondary: string    // hex color
  accent: string       // hex color
  background: string   // hex color
  font: string         // Google Font name
  emoji: string        // main emoji for the topic
  gradient: string[]   // gradient colors array
}

export interface AppConfig {
  id: string           // unique app slug
  topic: AppTopic
  name: string         // display name
  slug: string         // url slug
  theme: AppTheme
  features: AppFeature[]
  status: 'draft' | 'active' | 'archived'
  createdAt: string    // ISO date
  updatedAt: string    // ISO date
  ownerId?: string
  domain?: string      // custom domain
  metadata: {
    title: string
    description: string
    ogImage?: string
  }
}

export type AppFeature =
  | 'hero'
  | 'timeline'
  | 'gallery'
  | 'letter'
  | 'feed'
  | 'moments'
  | 'music'
  | 'countdown'
  | 'closing'

export const FEATURE_LABELS: Record<AppFeature, string> = {
  hero: 'Hero Section',
  timeline: 'Timeline',
  gallery: 'Photo Gallery',
  letter: 'Personal Letter',
  feed: 'Social Feed',
  moments: 'Moments',
  music: 'Music Player',
  countdown: 'Countdown Timer',
  closing: 'Closing Section',
}

export const TOPIC_PRESETS: Record<string, Partial<AppTheme> & { name: string; emoji: string }> = {
  love: {
    name: "Valentine's Day",
    emoji: '❤️',
    primary: '#e11d48',
    secondary: '#fda4af',
    accent: '#fb7185',
    background: '#fff1f2',
    font: 'Playfair Display',
    gradient: ['#fda4af', '#e11d48'],
  },
  reyes: {
    name: 'Reyes Magos',
    emoji: '⭐',
    primary: '#7c3aed',
    secondary: '#c4b5fd',
    accent: '#f59e0b',
    background: '#1e1b4b',
    font: 'Cinzel',
    gradient: ['#7c3aed', '#f59e0b'],
  },
  mom: {
    name: "Mother's Day",
    emoji: '🌸',
    primary: '#db2777',
    secondary: '#fbcfe8',
    accent: '#86efac',
    background: '#fdf2f8',
    font: 'Lora',
    gradient: ['#fbcfe8', '#db2777'],
  },
  dad: {
    name: "Father's Day",
    emoji: '👔',
    primary: '#1d4ed8',
    secondary: '#bfdbfe',
    accent: '#64748b',
    background: '#eff6ff',
    font: 'Merriweather',
    gradient: ['#bfdbfe', '#1d4ed8'],
  },
  bday: {
    name: 'Birthday',
    emoji: '🎂',
    primary: '#7c3aed',
    secondary: '#ddd6fe',
    accent: '#f59e0b',
    background: '#faf5ff',
    font: 'Nunito',
    gradient: ['#ddd6fe', '#f59e0b'],
  },
  xmas: {
    name: 'Christmas',
    emoji: '🎄',
    primary: '#15803d',
    secondary: '#bbf7d0',
    accent: '#ef4444',
    background: '#f0fdf4',
    font: 'Mountains of Christmas',
    gradient: ['#15803d', '#ef4444'],
  },
}
