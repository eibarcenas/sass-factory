export default defineAppConfig({
  // Default app config values — overridden by Firestore at runtime
  sass: {
    slug: '',
    name: 'My Themed App',
    topic: 'love',
    theme: {
      primary: '#e11d48',
      secondary: '#fda4af',
      accent: '#fb7185',
      background: '#fff1f2',
      font: 'Playfair Display',
      emoji: '❤️',
      gradient: ['#fda4af', '#e11d48'],
    },
    features: ['hero', 'closing'],
    metadata: {
      title: 'My App',
      description: 'A special themed experience.',
    },
  },
})
