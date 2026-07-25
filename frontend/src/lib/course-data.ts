import type { Course } from "@/types/course";

export const courses: Course[] = [
  {
    id: "course-ai-fundamentals",
    slug: "ai-fundamentals",
    title: "AI Fundamentals for Students",
    category: "Artificial Intelligence",
    description: "Learn the building blocks of AI with practical lessons, quizzes, and project-based learning.",
    price: 49,
    rating: 4.8,
    reviews: 128,
    duration: "8 weeks",
    level: "Beginner",
    location: "Online",
    updatedAt: "2025-11-14",
    instructor: "Dr. Ayesha Khan",
    image: "https://images.unsplash.com/photo-1555949963-aa79dcee981d?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1555949963-aa79dcee981d?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=80",
    ],
    overview:
      "This course introduces students to core concepts in artificial intelligence, including machine learning, natural language processing, and responsible AI practices.",
    highlights: [
      "Hands-on AI labs and quizzes",
      "Personalized progress tracking",
      "Real-world case studies",
    ],
    specifications: [
      { label: "Course length", value: "8 weeks" },
      { label: "Skill level", value: "Beginner" },
      { label: "Lessons", value: "24" },
      { label: "Language", value: "English" },
    ],
    reviewsList: [
      {
        id: "review-1",
        name: "Samira",
        rating: 5,
        date: "2026-03-02",
        comment:
          "The step-by-step approach made AI easy to understand. The teacher support was excellent.",
      },
      {
        id: "review-2",
        name: "Rahim",
        rating: 4,
        date: "2026-02-19",
        comment: "Great course for beginners with clear examples and quizzes.",
      },
    ],
    relatedSlugs: ["python-for-data-science", "career-bootcamp"],
  },
  {
    id: "course-react-masterclass",
    slug: "react-masterclass",
    title: "React Masterclass",
    category: "Web Development",
    description: "Build modern web applications using React, TypeScript, and industry best practices.",
    price: 79,
    rating: 4.9,
    reviews: 214,
    duration: "10 weeks",
    level: "Intermediate",
    location: "Online",
    updatedAt: "2026-01-10",
    instructor: "Rohan Patel",
    image: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1a?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1517430816045-df4b7de11d1a?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80",
    ],
    overview:
      "Dive into React with a project-based course that covers hooks, state management, performance optimization, and component design.",
    highlights: [
      "Live project workshops",
      "TypeScript integration",
      "Deployment and testing guidance",
    ],
    specifications: [
      { label: "Course length", value: "10 weeks" },
      { label: "Skill level", value: "Intermediate" },
      { label: "Projects", value: "5" },
      { label: "Certificate", value: "Yes" },
    ],
    reviewsList: [
      {
        id: "review-3",
        name: "Nisha",
        rating: 5,
        date: "2026-02-25",
        comment:
          "React became much more intuitive after this course. The projects were exactly what I needed.",
      },
      {
        id: "review-4",
        name: "Imran",
        rating: 5,
        date: "2026-01-29",
        comment: "Excellent pacing and very helpful instructor feedback.",
      },
    ],
    relatedSlugs: ["design-systems", "web-accessibility"],
  },
  {
    id: "course-data-science-intro",
    slug: "data-science-intro",
    title: "Data Science Essentials",
    category: "Data Science",
    description: "Discover data analysis, visualization, and predictive modeling using Python and real datasets.",
    price: 59,
    rating: 4.7,
    reviews: 176,
    duration: "9 weeks",
    level: "Beginner",
    location: "Online",
    updatedAt: "2026-03-01",
    instructor: "Lina Kapur",
    image: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=700&q=80",
    ],
    overview:
      "Explore the essential tools of data science, including Python libraries, data cleaning, visualization, and machine learning fundamentals.",
    highlights: [
      "Interactive data labs",
      "Real-world datasets",
      "Career planning resources",
    ],
    specifications: [
      { label: "Course length", value: "9 weeks" },
      { label: "Skill level", value: "Beginner" },
      { label: "Tools", value: "Python, Pandas, Matplotlib" },
      { label: "Projects", value: "4" },
    ],
    reviewsList: [
      {
        id: "review-5",
        name: "Jay",
        rating: 4,
        date: "2026-02-18",
        comment: "I liked the hands-on datasets and the clear explanations for each library.",
      },
      {
        id: "review-6",
        name: "Sara",
        rating: 5,
        date: "2026-02-05",
        comment: "A strong introduction that helped me land a data analyst internship.",
      },
    ],
    relatedSlugs: ["ai-fundamentals", "python-for-data-science"],
  },
  {
    id: "course-ux-design",
    slug: "ux-design-basics",
    title: "UX Design Basics",
    category: "Design",
    description: "Create meaningful digital experiences with user research, wireframes, and design thinking.",
    price: 39,
    rating: 4.6,
    reviews: 98,
    duration: "6 weeks",
    level: "Beginner",
    location: "Online",
    updatedAt: "2025-12-12",
    instructor: "Mira Hasan",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=700&q=80",
    ],
    overview:
      "Build a strong foundation in UX design, usability principles, and prototyping for digital apps and platforms.",
    highlights: [
      "Design sprints and feedback loops",
      "User journey mapping",
      "Interactive prototyping tips",
    ],
    specifications: [
      { label: "Course length", value: "6 weeks" },
      { label: "Skill level", value: "Beginner" },
      { label: "Tools", value: "Figma, Miro" },
      { label: "Certificate", value: "Yes" },
    ],
    reviewsList: [
      {
        id: "review-7",
        name: "Zara",
        rating: 5,
        date: "2026-01-28",
        comment:
          "The UX assignments were practical and improved my design workflow immediately.",
      },
    ],
    relatedSlugs: ["career-bootcamp", "product-management"],
  },
  {
    id: "course-python-data-science",
    slug: "python-for-data-science",
    title: "Python for Data Science",
    category: "Programming",
    description: "Master Python fundamentals and apply them to data analysis, automation, and visualization.",
    price: 45,
    rating: 4.7,
    reviews: 160,
    duration: "7 weeks",
    level: "Beginner",
    location: "Online",
    updatedAt: "2026-02-08",
    instructor: "Farhan Ali",
    image: "https://images.unsplash.com/photo-1555949963-aa79dcee981d?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1555949963-aa79dcee981d?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=700&q=80",
    ],
    overview:
      "Learn Python from the ground up and practice with data science exercises, automation scripts, and visualization projects.",
    highlights: [
      "Coding exercises with feedback",
      "Data pipelines and scripting",
      "Visualization best practices",
    ],
    specifications: [
      { label: "Course length", value: "7 weeks" },
      { label: "Skill level", value: "Beginner" },
      { label: "Languages", value: "Python" },
      { label: "Assignments", value: "8" },
    ],
    reviewsList: [
      {
        id: "review-8",
        name: "Ravi",
        rating: 5,
        date: "2026-01-11",
        comment: "Perfect course for learning Python with real examples and datasets.",
      },
    ],
    relatedSlugs: ["data-science-intro", "ai-fundamentals"],
  },
  {
    id: "course-career-bootcamp",
    slug: "career-bootcamp",
    title: "Career Launch Bootcamp",
    category: "Career",
    description: "Prepare for interviews, build a portfolio, and learn how to position your skills to employers.",
    price: 69,
    rating: 4.5,
    reviews: 84,
    duration: "5 weeks",
    level: "All Levels",
    location: "Online",
    updatedAt: "2026-03-12",
    instructor: "Khalid Noor",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1555949963-aa79dcee981d?auto=format&fit=crop&w=700&q=80",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80",
    ],
    overview:
      "Get career-ready with interview prep, portfolio coaching, and expert advice for landing your first role in tech.",
    highlights: [
      "Mock interviews and feedback",
      "Resume and portfolio reviews",
      "Networking and career strategy",
    ],
    specifications: [
      { label: "Course length", value: "5 weeks" },
      { label: "Skill level", value: "All Levels" },
      { label: "Sessions", value: "12" },
      { label: "Career support", value: "Yes" },
    ],
    reviewsList: [
      {
        id: "review-9",
        name: "Aliyah",
        rating: 4,
        date: "2026-02-20",
        comment: "I felt more confident in interviews after the bootcamp coaching.",
      },
    ],
    relatedSlugs: ["ux-design-basics", "product-management"],
  },
];

export function getCourseBySlug(slug: string) {
  return courses.find((course) => course.slug === slug) ?? null;
}

export function getCoursesByCategory(category: string) {
  return courses.filter((course) => course.category === category);
}
