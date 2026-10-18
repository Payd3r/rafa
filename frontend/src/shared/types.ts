import type { ProjectCategory } from "./categories";

export type ImageVariant = { src: string; width: number };
export type Photo = {
  id: string;
  src: string;
  srcSm?: string;
  originalUrl: string;
  alt: string;
  width?: number;
  height?: number;
  hash?: string;
  variants?: { avif: ImageVariant[]; webp: ImageVariant[] };
  srcset?: string;
  ratio?: number;
  placeholder?: string;
  isBest?: boolean;
  bestOrder?: number | null;
};
export type Project = {
  category: ProjectCategory;
  slug: string;
  title: string;
  description?: string;
  dateISO: string;
  type: 'photo' | 'video';
  cover: Photo;
  gallery: Photo[];
  video?: { src: string; thumbnail: string; alt: string };
  instagramUrl?: string;
};
