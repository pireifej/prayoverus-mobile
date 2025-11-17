# Catholic Prayer Community App - Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing from Facebook/Instagram feed patterns for familiarity, combined with Calm/Headspace peaceful aesthetics for spiritual resonance. Strong card-based architecture with generous spacing creates contemplative, meditative experience.

**Core Principle**: Each prayer request is a sacred, individual moment deserving visual respect and clear boundaries.

---

## Typography System

**Font Stack**: 
- Primary: Inter (clean, modern readability)
- Headings: Crimson Text or Lora (adds spiritual warmth without being ornate)

**Scale**:
- Prayer content: text-base (16px)
- User names: text-sm font-semibold (14px)
- Timestamps/metadata: text-xs (12px)
- Prayer count: text-lg font-bold (18px)
- Section headers: text-2xl font-semibold (24px)

---

## Layout & Spacing System

**Tailwind Units**: Consistently use 3, 4, 6, 8, 12, 16 for all spacing
- Card padding: p-4
- Card gaps: space-y-4
- Inter-section spacing: py-8
- Component internal spacing: space-y-3

**Container Structure**:
- Full-width feed with max-w-2xl mx-auto (optimal reading/mobile width)
- Edge padding: px-4
- Safe area respect for iOS notch/Android navigation

---

## Component Library

### Prayer Request Cards

**Card Architecture** (Strong Visual Boundaries):
- Solid white/light background with shadow-lg for elevation
- Rounded corners: rounded-2xl
- Border: 2px solid in subtle neutral (creates definitive boundary)
- Spacing between cards: mb-6 (creates clear separation)
- Each card is a complete, self-contained unit

**Card Internal Structure** (Top to Bottom):

1. **Header Section** (flex items-center justify-between p-4)
   - User avatar (w-10 h-10 rounded-full)
   - User name + timestamp (flex-1 ml-3)
   - Menu dots (3-dot overflow menu)

2. **Prayer Content Section** (px-4 py-3)
   - Prayer text (leading-relaxed for readability)
   - Read more link if truncated (text-sm)

3. **Media Section** (if present)
   - Full-width images (rounded-none within card, or rounded-lg if inset)
   - Image gallery grid (grid-cols-2 gap-1 for multiple images)

4. **Engagement Stats Bar** (flex items-center px-4 py-2 border-t border-b)
   - Prayer count badge (flex items-center space-x-2)
   - Badge icon + count (text-lg font-bold)
   - Comment count (text-sm)

5. **Action Buttons Row** (flex justify-around py-3 px-4)
   - Three equal-width buttons: "Pray", "Comment", "Share"
   - Each: flex-1 flex items-center justify-center space-x-2
   - Icon + label pattern
   - Minimum touch target: py-2

### Navigation

**Bottom Tab Bar** (Fixed position, shadow-up):
- 4-5 primary tabs: Feed, Pray, Create, Community, Profile
- Icon + label pattern
- Active state: bold text + accent color
- Height: h-16 with safe-area padding

**Top Header** (Sticky):
- App logo/title centered
- Notification bell (right)
- Profile quick-access (left)
- Subtle shadow-md when scrolled

### Prayer Count Badge

**Visual Treatment**:
- Pill-shaped (rounded-full)
- Padding: px-3 py-1
- Combines icon (praying hands) + number
- Prominent placement in stats bar
- Use accent color background with white text

### Create Prayer Request Flow

**Floating Action Button** (if used):
- Large circular button: w-14 h-14
- Fixed bottom-right: bottom-20 right-4
- Shadow-2xl for elevation
- Plus icon centered

**Composer Card** (Alternative):
- Same card styling as prayer requests
- Placeholder text: "Share a prayer request..."
- Avatar + text input area
- Expands on tap to full composer

### Comments Section

**Thread Design**:
- Nested within expanded card or slide-up modal
- Each comment: smaller card (shadow-sm, p-3)
- Avatar (w-8 h-8) + name + comment
- Reply/Like micro-interactions
- Indented replies: ml-10

### User Profile Elements

**Profile Header**:
- Large avatar (w-24 h-24)
- Name: text-xl font-bold
- Prayer stats row: grid-cols-3 (Prayers Shared, Prayers Said, Community)
- Bio section: max-w-md mx-auto text-center

---

## Animations

**Minimal, Purposeful**:
- Card entrance: Gentle fade-up on initial load (stagger by 50ms)
- Prayer button: Scale feedback (scale-95) on press, return to normal
- Pull-to-refresh: Standard native spinner
- No scroll-triggered animations (maintains peace/focus)

---

## Images

**Hero Image**: NO large hero - this is a feed-first app. Immediate content display.

**Profile Avatars**: 
- Circular user photos throughout
- Default: Soft gradient or saint iconography placeholder
- Sizes: 40px (cards), 32px (comments), 96px (profiles)

**Prayer Request Images**:
- User-uploaded photos attached to prayers (landscapes, candles, religious imagery)
- Display: Full-width within cards or grid layout for multiple
- Aspect ratio: Flexible, but optimize for 4:3 or 16:9

**Icon Library**: Heroicons (spiritual symbols: praying hands, heart, cross, candle)

**Background Treatment**: 
- Subtle gradient or texture in app background (behind cards)
- Very light, doesn't compete with card content
- Creates peaceful ambient context

---

## Mobile-Specific Patterns

- Thumb-zone optimization: Primary actions in bottom 40% of screen
- Swipe gestures: Swipe card for quick "Pray" action
- Large tap targets: Minimum 44px height for all interactive elements
- One-handed use: Navigation and core actions within thumb reach
- Generous spacing prevents mis-taps (min 8px between interactive elements)

---

**Quality Mandate**: Every card is a complete, beautiful prayer moment. Rich with detail - user context, engagement metrics, clear actions - creating an immersive spiritual community experience.