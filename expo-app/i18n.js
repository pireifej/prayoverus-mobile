const translations = {
  en: {
    // Bottom nav
    home: 'Home',
    community: 'Community',
    groups: 'Groups',
    profile: 'Profile',

    // Greeting
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    greetingFriend: 'Friend',

    // Home header
    logout: 'Logout',
    maxLevel: '👑 Max Level!',
    ptsLabel: 'pts',

    // Home feed filters
    hidePrayed: 'Hide prayed',
    filterAll: '🌍 All',
    filterMine: '✍️ Mine',
    filterChurch: '⛪ My Church',

    // Home screen
    dailyBreadPill: '🍞 Daily Bread',
    loadingPrayers: 'Loading prayers...',
    emptyMyPrayers: 'You haven\'t shared any prayer requests yet. Tap "Share a Prayer Request" above!',
    emptyChurchPrayers: 'No prayers from your church yet. Tap the church button to see all prayers.',
    emptyFeed: 'No prayers yet. Be the first to share!',
    pendingNudgeSingular: '1 prayer awaiting your testimony',
    pendingNudgePlural: (n) => `${n} prayers awaiting your testimony`,
    pendingNudgeSubtext: 'Tap ⋮ on any request below and choose "Prayer Answered 🙌" to share what God did.',
    prayerCountSingular: '🙏 1 person prayed',
    prayerCountPlural: (n) => `🙏 ${n} people prayed`,
    loadMore: 'Load more prayers',
    moreWaiting: (n) => `${n} more waiting`,
    newBadgeTitle: 'New Badge Unlocked!',
    praiseGod: 'Praise God! 🙏',

    // Faith Points guide
    howToEarnPoints: '💡 How to earn Faith Points',
    pointsRow1: '🙏 Pray for someone',
    pointsRow2: '✍️ Post a prayer request',
    pointsRow3: '📸 Post with a photo',
    pointsRow4: '🙌 Mark prayer answered',
    earnMorePoints: 'Earn more points to rise through the ranks! 🛡️',

    // Share prayer button
    sharePrayerRequest: 'Share a Prayer Request',

    // Prayer cards / actions
    prayForThis: '🙏 Pray for this',
    youPrayed: '✓ You Prayed',

    // Prayer options menu
    sharePrayerMenu: 'Share Prayer',
    copyRequestText: 'Copy Request Text',
    copyPrayerText: 'Copy Prayer Text',
    prayerAnsweredMenu: 'Prayer Answered',
    deleteMenuItem: 'Delete',
    cancelMenuItem: 'Cancel',
    deletePrayerTitle: 'Delete Prayer Request',
    deleteConfirmMsg: 'Are you sure you want to delete this prayer request? This cannot be undone.',

    // Prayer modal
    preparingPrayer: 'Preparing your prayer...',
    prayerHeader: 'Prayer',
    forAuthorPrefix: 'for',
    extendedPrayerLabel: '✨ Extended Prayer',
    generateExtended: '✨ Generate Extended Prayer',
    unlockExtended: '✨ Unlock Extended Prayer',
    amen: 'Amen',
    themePickerTitle: 'Prayer Themes',
    themesBtn: '🎨 Themes',

    // New / edit prayer form
    newPrayerHeader: 'New Prayer',
    editPrayerHeader: 'Edit Prayer',
    prayerPlaceholder: 'Share your prayer request...',
    cancelBack: '← Cancel',
    saveChanges: 'Save Changes',
    saving: 'Saving...',

    // Profile screen
    myProfile: 'My Profile',
    loadingProfile: 'Loading profile...',
    statRequests: 'Requests',
    statPrayers: 'Prayers',
    statRosaries: 'Rosaries',
    statPoints: 'Points',
    levelLabel: 'Level',
    aboutSection: 'About',
    churchSection: 'Church',
    faithProgressSection: 'Faith Progress',
    faithPointsSection: 'Faith Points',
    ptsToRank: (pts, rankName) => `${pts} pts to ${rankName}`,
    pointsLabel: (n) => `${n} points`,
    tellUsAboutYourself: 'Tell us about yourself',
    notSet: 'Not set',
    profileIconOptional: 'Profile icon (optional)',
    selectChurch: 'Select a church...',
    maxRankReached: 'Maximum rank achieved!',
    badgesLabel: (n) => `Badges (${n})`,
    earnBadges: 'Earn badges by praying, reading Daily Bread, and supporting others.',
    cancelBtn: 'Cancel',
    saveChangesBtn: 'Save Changes',
    answeredPrayers: '✅ Answered Prayers',
    noAnsweredPrayers: 'No answered prayers yet.\nWhen God answers your prayer, tap "Prayer Answered 🙌" from the ⋮ menu on any of your requests.',
    yourTestimony: 'Your Testimony',
    helpSupport: '❓ Help & Support',

    // Help & Support screen
    helpScreenTitle: 'Help & Support',
    helpContactUs: 'Contact Us',
    helpIntroText: 'Have questions or need support? Send us a message and we\'ll get back to you as soon as possible.',
    helpMessageLabel: 'Message',
    helpMessagePlaceholder: 'Your message...',
    helpNameLabel: 'Name',
    helpNamePlaceholder: 'Your name',
    helpEmailLabel: 'Email Address',
    helpEmailPlaceholder: 'Your email',
    helpPhoneLabel: 'Phone Number (Optional)',
    helpPhonePlaceholder: 'Your phone (optional)',
    helpSendButton: 'Send Message',

    // Settings screen
    settingsTitle: 'Settings',
    language: 'Language',
    security: 'Security',
    changePassword: 'Change Password',
    accountSection: 'Account',
    manageAccountDesc: 'Manage your account settings and data.',
    deleteAccount: 'Delete Account',
    deleteAccountTitle: 'Delete Account',
    deleteAccountMsg: 'This will permanently delete your account and all your data. This action cannot be undone. Are you absolutely sure?',

    // Groups screen
    groupsTitle: 'Groups',
    rosarySection: 'ROSARY',
    soloRosary: 'Solo Rosary',
    soloRosaryDesc: 'Guided through all 5 decades — manual or auto-play with music.',
    groupRosary: 'Group Rosary',
    groupRosaryDesc: 'Pray together in the same room — host leads, everyone stays in sync.',
    groupsSection: 'GROUPS',
    comingSoonTitle: 'Prayer Groups Coming Soon',
    comingSoonDesc: 'Join your church group, share a prayer feed, and pray the Rosary together in real time.',

    // Alerts
    copiedTitle: 'Copied',
    copiedRequest: 'Request text copied to clipboard',
    copiedPrayer: 'Prayer text copied to clipboard',
    errorTitle: 'Error',
    couldNotFetchPrayer: 'Could not fetch prayer text',
    unlockedTitle: 'Unlocked! 🙌',
    unlockedMsg: 'Thank you — enjoy your new feature.',
    purchaseFailed: 'Purchase failed',
    restoredTitle: 'Restored!',
    restoredMsg: 'Your purchases have been restored.',
    restoreFailed: 'Restore failed',
    signInRequired: 'Sign In Required',
    signInToView: 'Please sign in to view this prayer request.',
    adNotReady: 'Ad Not Ready',
    adNotReadyMsg: 'Please try again in a moment.',
    draftSaved: 'Draft Saved',
    draftSavedMsg: 'Your prayer request has been saved as a draft.',
    enterPrayerFirst: 'Please enter your prayer request',
    prayerSharedSuccess: 'Your prayer has been shared!',
    prayerUpdated: 'Prayer request updated successfully',
    failedUpdate: 'Failed to update prayer',
    failedDelete: 'Failed to delete prayer request',
    profileUpdated: 'Profile updated successfully!',
    failedUpdateProfile: 'Failed to update profile',
    pictureUpdated: 'Profile picture updated!',
    failedUploadPicture: 'Failed to upload profile picture',
    permissionRequired: 'Permission Required',
    grantCameraPermission: 'Please grant camera roll permissions to add an image.',
    networkError: 'Could not reach the server. Please check your connection.',
    failedLoadChurches: 'Failed to load churches',
    contactFormError: 'Please fill in message, name, and email fields',
    messageSent: 'Your message has been sent successfully!',
    failedSendMessage: 'Failed to send message. Please try again later.',
    extendedPrayerError: 'Could not load the extended prayer. Please try again.',
    tryAgain: 'Please try again.',
  },

  es: {
    // Bottom nav
    home: 'Inicio',
    community: 'Comunidad',
    groups: 'Grupos',
    profile: 'Perfil',

    // Greeting
    goodMorning: 'Buenos días',
    goodAfternoon: 'Buenas tardes',
    goodEvening: 'Buenas noches',
    greetingFriend: 'Amigo',

    // Home header
    logout: 'Salir',
    maxLevel: '👑 ¡Nivel Máx!',
    ptsLabel: 'pts',

    // Home feed filters
    hidePrayed: 'Ocultar oradas',
    filterAll: '🌍 Todas',
    filterMine: '✍️ Las mías',
    filterChurch: '⛪ Mi Iglesia',

    // Home screen
    dailyBreadPill: '🍞 Pan Diario',
    loadingPrayers: 'Cargando oraciones...',
    emptyMyPrayers: 'Aún no has compartido peticiones. ¡Toca "Compartir Petición" arriba!',
    emptyChurchPrayers: 'Aún no hay oraciones de tu iglesia. Toca el botón de iglesia para ver todas.',
    emptyFeed: 'Aún no hay oraciones. ¡Sé el primero en compartir!',
    pendingNudgeSingular: '1 oración esperando tu testimonio',
    pendingNudgePlural: (n) => `${n} oraciones esperando tu testimonio`,
    pendingNudgeSubtext: 'Toca ⋮ en cualquier petición y elige "Oración Contestada 🙌" para compartir lo que Dios hizo.',
    prayerCountSingular: '🙏 1 persona oró',
    prayerCountPlural: (n) => `🙏 ${n} personas oraron`,
    loadMore: 'Cargar más oraciones',
    moreWaiting: (n) => `${n} más esperando`,
    newBadgeTitle: '¡Nueva Insignia Desbloqueada!',
    praiseGod: '¡Gloria a Dios! 🙏',

    // Faith Points guide
    howToEarnPoints: '💡 Cómo ganar Puntos de Fe',
    pointsRow1: '🙏 Orar por alguien',
    pointsRow2: '✍️ Publicar una petición',
    pointsRow3: '📸 Publicar con foto',
    pointsRow4: '🙌 Marcar oración contestada',
    earnMorePoints: '¡Gana más puntos para subir de rango! 🛡️',

    // Share prayer button
    sharePrayerRequest: 'Compartir una Petición de Oración',

    // Prayer cards / actions
    prayForThis: '🙏 Orar por esto',
    youPrayed: '✓ Oraste',

    // Prayer options menu
    sharePrayerMenu: 'Compartir Oración',
    copyRequestText: 'Copiar Texto de Petición',
    copyPrayerText: 'Copiar Texto de Oración',
    prayerAnsweredMenu: 'Oración Contestada',
    deleteMenuItem: 'Eliminar',
    cancelMenuItem: 'Cancelar',
    deletePrayerTitle: 'Eliminar Petición de Oración',
    deleteConfirmMsg: '¿Estás seguro de que quieres eliminar esta petición? Esta acción no se puede deshacer.',

    // Prayer modal
    preparingPrayer: 'Preparando tu oración...',
    prayerHeader: 'Oración',
    forAuthorPrefix: 'para',
    extendedPrayerLabel: '✨ Oración Extendida',
    generateExtended: '✨ Generar Oración Extendida',
    unlockExtended: '✨ Desbloquear Oración Extendida',
    amen: 'Amén',
    themePickerTitle: 'Temas de Oración',
    themesBtn: '🎨 Temas',

    // New / edit prayer form
    newPrayerHeader: 'Nueva Oración',
    editPrayerHeader: 'Editar Oración',
    prayerPlaceholder: 'Comparte tu petición de oración...',
    cancelBack: '← Cancelar',
    saveChanges: 'Guardar Cambios',
    saving: 'Guardando...',

    // Profile screen
    myProfile: 'Mi Perfil',
    loadingProfile: 'Cargando perfil...',
    statRequests: 'Peticiones',
    statPrayers: 'Oraciones',
    statRosaries: 'Rosarios',
    statPoints: 'Puntos',
    levelLabel: 'Nivel',
    aboutSection: 'Acerca de',
    churchSection: 'Iglesia',
    faithProgressSection: 'Progreso de Fe',
    faithPointsSection: 'Puntos de Fe',
    ptsToRank: (pts, rankName) => `${pts} pts para ${rankName}`,
    pointsLabel: (n) => `${n} puntos`,
    tellUsAboutYourself: 'Cuéntanos sobre ti',
    notSet: 'No establecido',
    profileIconOptional: 'Ícono de perfil (opcional)',
    selectChurch: 'Selecciona una iglesia...',
    maxRankReached: '¡Rango máximo alcanzado!',
    badgesLabel: (n) => `Insignias (${n})`,
    earnBadges: 'Gana insignias orando, leyendo el Pan Diario y apoyando a otros.',
    cancelBtn: 'Cancelar',
    saveChangesBtn: 'Guardar Cambios',
    answeredPrayers: '✅ Oraciones Contestadas',
    noAnsweredPrayers: 'Aún no hay oraciones contestadas.\nCuando Dios conteste tu oración, toca "Oración Contestada 🙌" en el menú ⋮ de cualquier petición.',
    yourTestimony: 'Tu Testimonio',
    helpSupport: '❓ Ayuda y Soporte',

    // Help & Support screen
    helpScreenTitle: 'Ayuda y Soporte',
    helpContactUs: 'Contáctanos',
    helpIntroText: '¿Tienes preguntas o necesitas ayuda? Envíanos un mensaje y te responderemos lo antes posible.',
    helpMessageLabel: 'Mensaje',
    helpMessagePlaceholder: 'Tu mensaje...',
    helpNameLabel: 'Nombre',
    helpNamePlaceholder: 'Tu nombre',
    helpEmailLabel: 'Correo Electrónico',
    helpEmailPlaceholder: 'Tu correo',
    helpPhoneLabel: 'Número de Teléfono (Opcional)',
    helpPhonePlaceholder: 'Tu teléfono (opcional)',
    helpSendButton: 'Enviar Mensaje',

    // Settings screen
    settingsTitle: 'Configuración',
    language: 'Idioma',
    security: 'Seguridad',
    changePassword: 'Cambiar Contraseña',
    accountSection: 'Cuenta',
    manageAccountDesc: 'Administra tu cuenta y datos.',
    deleteAccount: 'Eliminar Cuenta',
    deleteAccountTitle: 'Eliminar Cuenta',
    deleteAccountMsg: 'Esto eliminará permanentemente tu cuenta y todos tus datos. Esta acción no se puede deshacer. ¿Estás absolutamente seguro?',

    // Groups screen
    groupsTitle: 'Grupos',
    rosarySection: 'ROSARIO',
    soloRosary: 'Rosario Individual',
    soloRosaryDesc: 'Guiado por las 5 décadas — manual o reproducción automática con música.',
    groupRosary: 'Rosario Grupal',
    groupRosaryDesc: 'Oren juntos en el mismo lugar — el anfitrión guía, todos permanecen sincronizados.',
    groupsSection: 'GRUPOS',
    comingSoonTitle: 'Grupos de Oración Próximamente',
    comingSoonDesc: 'Únete al grupo de tu iglesia, comparte oraciones y reza el Rosario juntos en tiempo real.',

    // Alerts
    copiedTitle: 'Copiado',
    copiedRequest: 'Texto de petición copiado al portapapeles',
    copiedPrayer: 'Texto de oración copiado al portapapeles',
    errorTitle: 'Error',
    couldNotFetchPrayer: 'No se pudo obtener el texto de la oración',
    unlockedTitle: '¡Desbloqueado! 🙌',
    unlockedMsg: 'Gracias — disfruta tu nueva función.',
    purchaseFailed: 'Compra fallida',
    restoredTitle: '¡Restaurado!',
    restoredMsg: 'Tus compras han sido restauradas.',
    restoreFailed: 'Restauración fallida',
    signInRequired: 'Inicio de Sesión Requerido',
    signInToView: 'Por favor inicia sesión para ver esta petición.',
    adNotReady: 'Anuncio No Disponible',
    adNotReadyMsg: 'Por favor intenta de nuevo en un momento.',
    draftSaved: 'Borrador Guardado',
    draftSavedMsg: 'Tu petición ha sido guardada como borrador.',
    enterPrayerFirst: 'Por favor escribe tu petición de oración',
    prayerSharedSuccess: '¡Tu oración ha sido compartida!',
    prayerUpdated: 'Petición de oración actualizada exitosamente',
    failedUpdate: 'Error al actualizar la oración',
    failedDelete: 'Error al eliminar la petición',
    profileUpdated: '¡Perfil actualizado exitosamente!',
    failedUpdateProfile: 'Error al actualizar el perfil',
    pictureUpdated: '¡Foto de perfil actualizada!',
    failedUploadPicture: 'Error al subir la foto de perfil',
    permissionRequired: 'Permiso Requerido',
    grantCameraPermission: 'Por favor concede permisos de galería para agregar una imagen.',
    networkError: 'No se pudo conectar al servidor. Verifica tu conexión.',
    failedLoadChurches: 'Error al cargar las iglesias',
    contactFormError: 'Por favor completa el mensaje, nombre y campos de correo',
    messageSent: '¡Tu mensaje ha sido enviado exitosamente!',
    failedSendMessage: 'Error al enviar el mensaje. Por favor intenta más tarde.',
    extendedPrayerError: 'No se pudo cargar la oración extendida. Por favor intenta de nuevo.',
    tryAgain: 'Por favor intenta de nuevo.',
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
  const val = strings[key] ?? translations.en[key];
  return val !== undefined ? val : key;
}

export default t;
