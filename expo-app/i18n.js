const translations = {
  en: {
    // Navigation
    home: 'Home',
    myPrayers: 'My Prayers',
    groups: 'Groups',
    profile: 'Profile',
    community: 'Community',

    // Home screen
    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening',
    dailyBread: 'Daily Bread',
    readToday: 'Read today\'s devotional',
    communityPrayers: 'Community Prayers',
    noPrayers: 'No prayers yet. Be the first to share!',
    loading: 'Loading...',
    refresh: 'Refresh',

    // Prayer actions
    pray: 'Pray',
    prayed: '✓ You Prayed',
    praying: 'Praying...',
    share: 'Share',
    comment: 'Comment',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    submit: 'Submit',
    close: 'Close',

    // Prayer form
    newPrayer: 'New Prayer Request',
    prayerTitle: 'Title (optional)',
    prayerContent: 'Share your prayer request...',
    churchOnly: 'My Church Only',
    addPhoto: 'Add Photo',
    submitPrayer: 'Share Prayer',
    prayerShared: 'Your prayer has been shared!',

    // Daily Bread
    todaysDevotional: 'Today\'s Devotional',
    bibleVerse: 'Bible Verse',
    copyPrayer: 'Copy Prayer',
    sharePrayer: 'Share Prayer',
    listenAudio: 'Listen',
    pastDevotionals: 'Past Devotionals',
    streakLabel: '🔥 Day Streak',

    // Prayer modal
    generatedPrayer: 'Prayer for You',
    extendedPrayer: 'Extended Prayer',
    unlockExtended: 'Unlock Extended Prayer',

    // Profile
    faithPoints: 'Faith Points',
    faithRank: 'Faith Rank',
    answeredPrayers: 'Answered Prayers',
    editProfile: 'Edit Profile',
    logout: 'Log Out',
    changePhoto: 'Change Photo',

    // Groups
    joinGroup: 'Join Group',
    createGroup: 'Create Group',
    members: 'Members',
    noGroups: 'No groups yet.',

    // Errors & alerts
    error: 'Error',
    success: 'Success',
    tryAgain: 'Please try again.',
    networkError: 'Network error. Please check your connection.',
    prayerError: 'Unable to generate a prayer at this time.',

    // Language
    language: 'Language',
    languageToggle: 'Switch to Spanish',
  },

  es: {
    // Navigation
    home: 'Inicio',
    myPrayers: 'Mis Oraciones',
    groups: 'Grupos',
    profile: 'Perfil',
    community: 'Comunidad',

    // Home screen
    goodMorning: 'Buenos Días',
    goodAfternoon: 'Buenas Tardes',
    goodEvening: 'Buenas Noches',
    dailyBread: 'Pan Diario',
    readToday: 'Lee el devocional de hoy',
    communityPrayers: 'Oraciones Comunitarias',
    noPrayers: 'Aún no hay oraciones. ¡Sé el primero en compartir!',
    loading: 'Cargando...',
    refresh: 'Actualizar',

    // Prayer actions
    pray: 'Orar',
    prayed: '✓ Oraste',
    praying: 'Orando...',
    share: 'Compartir',
    comment: 'Comentar',
    edit: 'Editar',
    delete: 'Eliminar',
    cancel: 'Cancelar',
    save: 'Guardar',
    submit: 'Enviar',
    close: 'Cerrar',

    // Prayer form
    newPrayer: 'Nueva Petición de Oración',
    prayerTitle: 'Título (opcional)',
    prayerContent: 'Comparte tu petición de oración...',
    churchOnly: 'Solo Mi Iglesia',
    addPhoto: 'Agregar Foto',
    submitPrayer: 'Compartir Oración',
    prayerShared: '¡Tu oración ha sido compartida!',

    // Daily Bread
    todaysDevotional: 'Devocional de Hoy',
    bibleVerse: 'Versículo Bíblico',
    copyPrayer: 'Copiar Oración',
    sharePrayer: 'Compartir Oración',
    listenAudio: 'Escuchar',
    pastDevotionals: 'Devocionales Anteriores',
    streakLabel: '🔥 Días Seguidos',

    // Prayer modal
    generatedPrayer: 'Oración Para Ti',
    extendedPrayer: 'Oración Extendida',
    unlockExtended: 'Desbloquear Oración Extendida',

    // Profile
    faithPoints: 'Puntos de Fe',
    faithRank: 'Rango de Fe',
    answeredPrayers: 'Oraciones Contestadas',
    editProfile: 'Editar Perfil',
    logout: 'Cerrar Sesión',
    changePhoto: 'Cambiar Foto',

    // Groups
    joinGroup: 'Unirse al Grupo',
    createGroup: 'Crear Grupo',
    members: 'Miembros',
    noGroups: 'Aún no hay grupos.',

    // Errors & alerts
    error: 'Error',
    success: 'Éxito',
    tryAgain: 'Por favor intenta de nuevo.',
    networkError: 'Error de red. Verifica tu conexión.',
    prayerError: 'No se pudo generar una oración en este momento.',

    // Language
    language: 'Idioma',
    languageToggle: 'Cambiar a Inglés',
  },
};

const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? 'en';
const deviceLang = locale.startsWith('es') ? 'es' : 'en';

export let lang = deviceLang;
let strings = translations[lang] || translations.en;

export function setLang(newLang) {
  if (translations[newLang]) {
    lang = newLang;
    strings = translations[newLang];
  }
}

export function t(key) {
  return strings[key] || translations.en[key] || key;
}

export default t;
