import { z } from "zod";
export declare const HealthCheckResponse: z.ZodObject<{
    status: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: string;
}, {
    status: string;
}>;
export type HealthCheckResponse = z.infer<typeof HealthCheckResponse>;
export declare const ListPackagesQueryParams: z.ZodObject<{
    destinationSlug: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    minDays: z.ZodOptional<z.ZodNumber>;
    maxDays: z.ZodOptional<z.ZodNumber>;
    minPrice: z.ZodOptional<z.ZodNumber>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodString>;
    featured: z.ZodOptional<z.ZodBoolean>;
    trending: z.ZodOptional<z.ZodBoolean>;
    search: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type?: string | undefined;
    destinationSlug?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    category?: string | undefined;
    minDays?: number | undefined;
    maxDays?: number | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    featured?: boolean | undefined;
    trending?: boolean | undefined;
    search?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}, {
    type?: string | undefined;
    destinationSlug?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    category?: string | undefined;
    minDays?: number | undefined;
    maxDays?: number | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    featured?: boolean | undefined;
    trending?: boolean | undefined;
    search?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export type ListPackagesQueryParams = z.infer<typeof ListPackagesQueryParams>;
export declare const GetPackageParams: z.ZodObject<{
    slug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    slug: string;
}, {
    slug: string;
}>;
export type GetPackageParams = z.infer<typeof GetPackageParams>;
export declare const ListDestinationsQueryParams: z.ZodObject<{
    country: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    featured: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    state?: string | undefined;
    country?: string | undefined;
    featured?: boolean | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}, {
    state?: string | undefined;
    country?: string | undefined;
    featured?: boolean | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export type ListDestinationsQueryParams = z.infer<typeof ListDestinationsQueryParams>;
export declare const GetDestinationParams: z.ZodObject<{
    slug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    slug: string;
}, {
    slug: string;
}>;
export type GetDestinationParams = z.infer<typeof GetDestinationParams>;
export declare const ListTestimonialsQueryParams: z.ZodObject<{
    featured: z.ZodOptional<z.ZodBoolean>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    featured?: boolean | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}, {
    featured?: boolean | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export type ListTestimonialsQueryParams = z.infer<typeof ListTestimonialsQueryParams>;
export declare const ListTransportServicesQueryParams: z.ZodObject<{
    type: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}, {
    type?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export type ListTransportServicesQueryParams = z.infer<typeof ListTransportServicesQueryParams>;
export declare const ListBlogPostsQueryParams: z.ZodObject<{
    tag: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
    offset?: number | undefined;
    tag?: string | undefined;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
    tag?: string | undefined;
}>;
export type ListBlogPostsQueryParams = z.infer<typeof ListBlogPostsQueryParams>;
export declare const GetBlogPostParams: z.ZodObject<{
    slug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    slug: string;
}, {
    slug: string;
}>;
export type GetBlogPostParams = z.infer<typeof GetBlogPostParams>;
export declare const SubmitInquiryBody: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    destination: z.ZodOptional<z.ZodString>;
    packageId: z.ZodOptional<z.ZodNumber>;
    travelDate: z.ZodOptional<z.ZodString>;
    adults: z.ZodOptional<z.ZodNumber>;
    children: z.ZodOptional<z.ZodNumber>;
    budget: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    inquiryType: z.ZodOptional<z.ZodString>;
    vendorId: z.ZodOptional<z.ZodNumber>;
    hotelId: z.ZodOptional<z.ZodNumber>;
    transportId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    message?: string | undefined;
    phone?: string | undefined;
    destination?: string | undefined;
    packageId?: number | undefined;
    travelDate?: string | undefined;
    adults?: number | undefined;
    children?: number | undefined;
    budget?: string | undefined;
    inquiryType?: string | undefined;
    vendorId?: number | undefined;
    hotelId?: number | undefined;
    transportId?: number | undefined;
}, {
    name: string;
    email: string;
    message?: string | undefined;
    phone?: string | undefined;
    destination?: string | undefined;
    packageId?: number | undefined;
    travelDate?: string | undefined;
    adults?: number | undefined;
    children?: number | undefined;
    budget?: string | undefined;
    inquiryType?: string | undefined;
    vendorId?: number | undefined;
    hotelId?: number | undefined;
    transportId?: number | undefined;
}>;
export type SubmitInquiryBody = z.infer<typeof SubmitInquiryBody>;
//# sourceMappingURL=index.d.ts.map