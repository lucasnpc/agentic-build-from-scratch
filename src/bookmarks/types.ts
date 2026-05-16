export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NewBookmarkInput {
  url: string;
  title: string;
  description?: string | null;
  tags?: string[];
}

export interface BookmarkUpdate {
  url?: string;
  title?: string;
  description?: string | null;
  tags?: string[];
}
