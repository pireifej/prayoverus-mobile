// Shared types for the React Native mobile app
// These should match the backend schema types

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Prayer {
  id: string;
  userId: string;
  title: string;
  content: string;
  status: 'ongoing' | 'answered';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  answeredAt?: string;
}

export interface PrayerWithUser extends Prayer {
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  supportCount: number;
  commentCount: number;
}

export interface PrayerGroup {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  createdBy: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface PrayerSupport {
  id: string;
  prayerId: string;
  userId: string;
  type: 'prayer' | 'heart';
  createdAt: string;
}

export interface PrayerComment {
  id: string;
  prayerId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

// Form types for creating new entities
export interface CreatePrayerRequest {
  title: string;
  content: string;
  isPublic: boolean;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  isPublic: boolean;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdatePrayerStatusRequest {
  status: 'ongoing' | 'answered';
}

export interface AddSupportRequest {
  type: 'prayer' | 'heart';
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
}