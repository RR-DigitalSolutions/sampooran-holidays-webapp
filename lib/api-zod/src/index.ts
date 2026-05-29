import { z } from "zod";

// Health
export const HealthCheckResponse = z.object({
  status: z.string(),
});
export type HealthCheckResponse = z.infer<typeof HealthCheckResponse>;

// Common pagination
const paginationParams = {
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
};

// Packages
export const ListPackagesQueryParams = z.object({
  ...paginationParams,
  destinationSlug: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  category: z.string().optional(),
  minDays: z.coerce.number().optional(),
  maxDays: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  type: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  search: z.string().optional(),
});
export type ListPackagesQueryParams = z.infer<typeof ListPackagesQueryParams>;

export const GetPackageParams = z.object({
  slug: z.string(),
});
export type GetPackageParams = z.infer<typeof GetPackageParams>;

// Destinations
export const ListDestinationsQueryParams = z.object({
  ...paginationParams,
  country: z.string().optional(),
  state: z.string().optional(),
  featured: z.coerce.boolean().optional(),
});
export type ListDestinationsQueryParams = z.infer<typeof ListDestinationsQueryParams>;

export const GetDestinationParams = z.object({
  slug: z.string(),
});
export type GetDestinationParams = z.infer<typeof GetDestinationParams>;

// Testimonials
export const ListTestimonialsQueryParams = z.object({
  ...paginationParams,
  featured: z.coerce.boolean().optional(),
});
export type ListTestimonialsQueryParams = z.infer<typeof ListTestimonialsQueryParams>;

// Transport
export const ListTransportServicesQueryParams = z.object({
  ...paginationParams,
  type: z.string().optional(),
});
export type ListTransportServicesQueryParams = z.infer<typeof ListTransportServicesQueryParams>;

// Blog
export const ListBlogPostsQueryParams = z.object({
  ...paginationParams,
  tag: z.string().optional(),
});
export type ListBlogPostsQueryParams = z.infer<typeof ListBlogPostsQueryParams>;

export const GetBlogPostParams = z.object({
  slug: z.string(),
});
export type GetBlogPostParams = z.infer<typeof GetBlogPostParams>;

// Inquiries
export const SubmitInquiryBody = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  destination: z.string().optional(),
  packageId: z.coerce.number().optional(),
  travelDate: z.string().optional(),
  adults: z.coerce.number().optional(),
  children: z.coerce.number().optional(),
  budget: z.string().optional(),
  message: z.string().optional(),
  inquiryType: z.string().optional(),
  vendorId: z.coerce.number().optional(),
  hotelId: z.coerce.number().optional(),
  transportId: z.coerce.number().optional(),
});
export type SubmitInquiryBody = z.infer<typeof SubmitInquiryBody>;
