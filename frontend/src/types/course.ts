export interface CourseReview {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
}

export interface CourseSpecification {
  label: string;
  value: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  price: number;
  rating: number;
  reviews: number;
  duration: string;
  level: string;
  location: string;
  updatedAt: string;
  instructor: string;
  image: string;
  gallery: string[];
  overview: string;
  highlights: string[];
  specifications: CourseSpecification[];
  reviewsList: CourseReview[];
  relatedSlugs: string[];
}
