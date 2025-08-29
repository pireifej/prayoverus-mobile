import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://your-api-base-url.com'; // Replace with your actual API URL

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
  memberCount: number;
  createdAt: string;
}

export interface PrayerComment {
  id: string;
  prayerId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

class ApiService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Prayer API methods
  async getUserPrayers(): Promise<Prayer[]> {
    return this.request('/api/prayers/mine');
  }

  async getPublicPrayers(): Promise<PrayerWithUser[]> {
    return this.request('/api/prayers/public');
  }

  async createPrayer(prayer: {
    title: string;
    content: string;
    isPublic: boolean;
  }): Promise<Prayer> {
    return this.request('/api/prayers', {
      method: 'POST',
      body: JSON.stringify(prayer),
    });
  }

  async updatePrayerStatus(
    prayerId: string,
    status: 'ongoing' | 'answered'
  ): Promise<Prayer> {
    return this.request(`/api/prayers/${prayerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deletePrayer(prayerId: string): Promise<void> {
    return this.request(`/api/prayers/${prayerId}`, {
      method: 'DELETE',
    });
  }

  // Prayer support methods
  async addPrayerSupport(
    prayerId: string,
    type: 'prayer' | 'heart'
  ): Promise<void> {
    return this.request(`/api/prayers/${prayerId}/support`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  async removePrayerSupport(
    prayerId: string,
    type: 'prayer' | 'heart'
  ): Promise<void> {
    return this.request(`/api/prayers/${prayerId}/support/${type}`, {
      method: 'DELETE',
    });
  }

  // Prayer comments methods
  async getPrayerComments(prayerId: string): Promise<PrayerComment[]> {
    return this.request(`/api/prayers/${prayerId}/comments`);
  }

  async addPrayerComment(
    prayerId: string,
    content: string
  ): Promise<PrayerComment> {
    return this.request(`/api/prayers/${prayerId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Prayer groups methods
  async getUserGroups(): Promise<PrayerGroup[]> {
    return this.request('/api/groups/mine');
  }

  async getPublicGroups(): Promise<PrayerGroup[]> {
    return this.request('/api/groups/public');
  }

  async createPrayerGroup(group: {
    name: string;
    description?: string;
    imageUrl?: string;
    isPublic: boolean;
  }): Promise<PrayerGroup> {
    return this.request('/api/groups', {
      method: 'POST',
      body: JSON.stringify(group),
    });
  }

  async joinGroup(groupId: string): Promise<void> {
    return this.request(`/api/groups/${groupId}/join`, {
      method: 'POST',
    });
  }

  async leaveGroup(groupId: string): Promise<void> {
    return this.request(`/api/groups/${groupId}/leave`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();