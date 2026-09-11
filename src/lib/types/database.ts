export interface Profile {
  id: string;
  display_name: string;
  nickname?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Couple {
  id: string;
  name: string;
  anniversary_date: string;
  cover_image_url?: string;
  theme_preference?: string;
  invite_code?: string;
  creator_id?: string;
  member_count?: number;
  is_full?: boolean;
  created_at: string;
}

export interface CoupleMember {
  id: string;
  couple_id: string;
  user_id: string;
  role: 'creator' | 'partner';
  joined_at: string;
  profile?: Profile;
}

export interface Memory {
  id: string;
  couple_id: string;
  uploaded_by: string;
  image_url: string;
  thumbnail_url?: string;
  title: string;
  caption?: string;
  memory_date: string;
  location?: string;
  mood?: 'cozy' | 'magical' | 'silly' | 'romantic' | 'adventure';
  rotation_deg: number;
  tape_style: 'washi-pink' | 'washi-yellow' | 'washi-lavender' | 'washi-blue';
  created_at: string;
  comments?: MemoryComment[];
  reactions?: MemoryReaction[];
  uploader_name?: string;
}

export interface MemoryComment {
  id: string;
  memory_id: string;
  user_id: string;
  author_name: string;
  author_avatar?: string;
  comment: string;
  paper_color: 'yellow' | 'pink' | 'lavender';
  created_at: string;
}

export interface MemoryReaction {
  id: string;
  memory_id: string;
  user_id: string;
  reaction: 'heart' | 'sparkle' | 'hug' | 'kiss' | 'cry_happy' | 'laugh';
  created_at: string;
}

export interface ImportantDate {
  id: string;
  couple_id: string;
  title: string;
  date: string;
  description?: string;
  type: 'anniversary' | 'birthday' | 'trip' | 'first_date' | 'first_home' | 'special' | 'custom';
  icon?: string;
  created_by?: string;
  created_at: string;
}

export interface LoveNote {
  id: string;
  couple_id: string;
  author_id: string;
  author_name: string;
  content: string;
  paper_style: 'cream-ruled' | 'pink-blush' | 'lavender-grid' | 'kraft-vintage';
  sticker: 'heart' | 'star' | 'flower' | 'kiss' | 'sparkle';
  is_pinned: boolean;
  created_at: string;
}

export interface RelationshipEvent {
  id: string;
  couple_id: string;
  title: string;
  description?: string;
  event_date: string;
  event_type: 'milestone' | 'first_met' | 'first_date' | 'trip' | 'home' | 'proposal';
  icon: string;
  image_url?: string;
  associated_memory_id?: string;
  created_at: string;
}
