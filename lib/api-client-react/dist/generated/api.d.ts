import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { BlogPost, DestinationDetail, GetFeaturedDestinations200, GetFeaturedPackages200, GetTrendingPackages200, HealthStatus, Inquiry, InquiryInput, ListBlogPosts200, ListBlogPostsParams, ListCountries200, ListDestinations200, ListDestinationsParams, ListPackages200, ListPackagesParams, ListPopularRoutes200, ListStates200, ListStatesParams, ListTestimonials200, ListTestimonialsParams, ListTransportServices200, ListTransportServicesParams, PackageDetail, PackageStats } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * Returns server health status
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List all destinations
 */
export declare const getListDestinationsUrl: (params?: ListDestinationsParams) => string;
export declare const listDestinations: (params?: ListDestinationsParams, options?: RequestInit) => Promise<ListDestinations200>;
export declare const getListDestinationsQueryKey: (params?: ListDestinationsParams) => readonly ["/api/destinations", ...ListDestinationsParams[]];
export declare const getListDestinationsQueryOptions: <TData = Awaited<ReturnType<typeof listDestinations>>, TError = ErrorType<unknown>>(params?: ListDestinationsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDestinations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listDestinations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListDestinationsQueryResult = NonNullable<Awaited<ReturnType<typeof listDestinations>>>;
export type ListDestinationsQueryError = ErrorType<unknown>;
/**
 * @summary List all destinations
 */
export declare function useListDestinations<TData = Awaited<ReturnType<typeof listDestinations>>, TError = ErrorType<unknown>>(params?: ListDestinationsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDestinations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get featured destinations for homepage
 */
export declare const getGetFeaturedDestinationsUrl: () => string;
export declare const getFeaturedDestinations: (options?: RequestInit) => Promise<GetFeaturedDestinations200>;
export declare const getGetFeaturedDestinationsQueryKey: () => readonly ["/api/destinations/featured"];
export declare const getGetFeaturedDestinationsQueryOptions: <TData = Awaited<ReturnType<typeof getFeaturedDestinations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFeaturedDestinations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getFeaturedDestinations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetFeaturedDestinationsQueryResult = NonNullable<Awaited<ReturnType<typeof getFeaturedDestinations>>>;
export type GetFeaturedDestinationsQueryError = ErrorType<unknown>;
/**
 * @summary Get featured destinations for homepage
 */
export declare function useGetFeaturedDestinations<TData = Awaited<ReturnType<typeof getFeaturedDestinations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFeaturedDestinations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List all available countries
 */
export declare const getListCountriesUrl: () => string;
export declare const listCountries: (options?: RequestInit) => Promise<ListCountries200>;
export declare const getListCountriesQueryKey: () => readonly ["/api/destinations/countries"];
export declare const getListCountriesQueryOptions: <TData = Awaited<ReturnType<typeof listCountries>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCountries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCountries>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCountriesQueryResult = NonNullable<Awaited<ReturnType<typeof listCountries>>>;
export type ListCountriesQueryError = ErrorType<unknown>;
/**
 * @summary List all available countries
 */
export declare function useListCountries<TData = Awaited<ReturnType<typeof listCountries>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCountries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List states, optionally filtered by country
 */
export declare const getListStatesUrl: (params?: ListStatesParams) => string;
export declare const listStates: (params?: ListStatesParams, options?: RequestInit) => Promise<ListStates200>;
export declare const getListStatesQueryKey: (params?: ListStatesParams) => readonly ["/api/destinations/states", ...ListStatesParams[]];
export declare const getListStatesQueryOptions: <TData = Awaited<ReturnType<typeof listStates>>, TError = ErrorType<unknown>>(params?: ListStatesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listStates>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listStates>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListStatesQueryResult = NonNullable<Awaited<ReturnType<typeof listStates>>>;
export type ListStatesQueryError = ErrorType<unknown>;
/**
 * @summary List states, optionally filtered by country
 */
export declare function useListStates<TData = Awaited<ReturnType<typeof listStates>>, TError = ErrorType<unknown>>(params?: ListStatesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listStates>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get destination by slug
 */
export declare const getGetDestinationUrl: (slug: string) => string;
export declare const getDestination: (slug: string, options?: RequestInit) => Promise<DestinationDetail>;
export declare const getGetDestinationQueryKey: (slug: string) => readonly [`/api/destinations/${string}`];
export declare const getGetDestinationQueryOptions: <TData = Awaited<ReturnType<typeof getDestination>>, TError = ErrorType<void>>(slug: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDestination>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDestination>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDestinationQueryResult = NonNullable<Awaited<ReturnType<typeof getDestination>>>;
export type GetDestinationQueryError = ErrorType<void>;
/**
 * @summary Get destination by slug
 */
export declare function useGetDestination<TData = Awaited<ReturnType<typeof getDestination>>, TError = ErrorType<void>>(slug: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDestination>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List holiday packages
 */
export declare const getListPackagesUrl: (params?: ListPackagesParams) => string;
export declare const listPackages: (params?: ListPackagesParams, options?: RequestInit) => Promise<ListPackages200>;
export declare const getListPackagesQueryKey: (params?: ListPackagesParams) => readonly ["/api/packages", ...ListPackagesParams[]];
export declare const getListPackagesQueryOptions: <TData = Awaited<ReturnType<typeof listPackages>>, TError = ErrorType<unknown>>(params?: ListPackagesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPackages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPackages>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPackagesQueryResult = NonNullable<Awaited<ReturnType<typeof listPackages>>>;
export type ListPackagesQueryError = ErrorType<unknown>;
/**
 * @summary List holiday packages
 */
export declare function useListPackages<TData = Awaited<ReturnType<typeof listPackages>>, TError = ErrorType<unknown>>(params?: ListPackagesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPackages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get featured packages for homepage
 */
export declare const getGetFeaturedPackagesUrl: () => string;
export declare const getFeaturedPackages: (options?: RequestInit) => Promise<GetFeaturedPackages200>;
export declare const getGetFeaturedPackagesQueryKey: () => readonly ["/api/packages/featured"];
export declare const getGetFeaturedPackagesQueryOptions: <TData = Awaited<ReturnType<typeof getFeaturedPackages>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFeaturedPackages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getFeaturedPackages>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetFeaturedPackagesQueryResult = NonNullable<Awaited<ReturnType<typeof getFeaturedPackages>>>;
export type GetFeaturedPackagesQueryError = ErrorType<unknown>;
/**
 * @summary Get featured packages for homepage
 */
export declare function useGetFeaturedPackages<TData = Awaited<ReturnType<typeof getFeaturedPackages>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFeaturedPackages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get trending/popular packages
 */
export declare const getGetTrendingPackagesUrl: () => string;
export declare const getTrendingPackages: (options?: RequestInit) => Promise<GetTrendingPackages200>;
export declare const getGetTrendingPackagesQueryKey: () => readonly ["/api/packages/trending"];
export declare const getGetTrendingPackagesQueryOptions: <TData = Awaited<ReturnType<typeof getTrendingPackages>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTrendingPackages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTrendingPackages>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTrendingPackagesQueryResult = NonNullable<Awaited<ReturnType<typeof getTrendingPackages>>>;
export type GetTrendingPackagesQueryError = ErrorType<unknown>;
/**
 * @summary Get trending/popular packages
 */
export declare function useGetTrendingPackages<TData = Awaited<ReturnType<typeof getTrendingPackages>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTrendingPackages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get package statistics for homepage showcase
 */
export declare const getGetPackageStatsUrl: () => string;
export declare const getPackageStats: (options?: RequestInit) => Promise<PackageStats>;
export declare const getGetPackageStatsQueryKey: () => readonly ["/api/packages/stats"];
export declare const getGetPackageStatsQueryOptions: <TData = Awaited<ReturnType<typeof getPackageStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPackageStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPackageStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPackageStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getPackageStats>>>;
export type GetPackageStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get package statistics for homepage showcase
 */
export declare function useGetPackageStats<TData = Awaited<ReturnType<typeof getPackageStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPackageStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get package detail by slug
 */
export declare const getGetPackageUrl: (slug: string) => string;
export declare const getPackage: (slug: string, options?: RequestInit) => Promise<PackageDetail>;
export declare const getGetPackageQueryKey: (slug: string) => readonly [`/api/packages/${string}`];
export declare const getGetPackageQueryOptions: <TData = Awaited<ReturnType<typeof getPackage>>, TError = ErrorType<void>>(slug: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPackage>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPackage>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPackageQueryResult = NonNullable<Awaited<ReturnType<typeof getPackage>>>;
export type GetPackageQueryError = ErrorType<void>;
/**
 * @summary Get package detail by slug
 */
export declare function useGetPackage<TData = Awaited<ReturnType<typeof getPackage>>, TError = ErrorType<void>>(slug: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPackage>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List transport services
 */
export declare const getListTransportServicesUrl: (params?: ListTransportServicesParams) => string;
export declare const listTransportServices: (params?: ListTransportServicesParams, options?: RequestInit) => Promise<ListTransportServices200>;
export declare const getListTransportServicesQueryKey: (params?: ListTransportServicesParams) => readonly ["/api/transport", ...ListTransportServicesParams[]];
export declare const getListTransportServicesQueryOptions: <TData = Awaited<ReturnType<typeof listTransportServices>>, TError = ErrorType<unknown>>(params?: ListTransportServicesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTransportServices>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listTransportServices>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListTransportServicesQueryResult = NonNullable<Awaited<ReturnType<typeof listTransportServices>>>;
export type ListTransportServicesQueryError = ErrorType<unknown>;
/**
 * @summary List transport services
 */
export declare function useListTransportServices<TData = Awaited<ReturnType<typeof listTransportServices>>, TError = ErrorType<unknown>>(params?: ListTransportServicesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTransportServices>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get popular transport routes
 */
export declare const getListPopularRoutesUrl: () => string;
export declare const listPopularRoutes: (options?: RequestInit) => Promise<ListPopularRoutes200>;
export declare const getListPopularRoutesQueryKey: () => readonly ["/api/transport/routes"];
export declare const getListPopularRoutesQueryOptions: <TData = Awaited<ReturnType<typeof listPopularRoutes>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPopularRoutes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPopularRoutes>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPopularRoutesQueryResult = NonNullable<Awaited<ReturnType<typeof listPopularRoutes>>>;
export type ListPopularRoutesQueryError = ErrorType<unknown>;
/**
 * @summary Get popular transport routes
 */
export declare function useListPopularRoutes<TData = Awaited<ReturnType<typeof listPopularRoutes>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPopularRoutes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Submit a holiday/transport inquiry
 */
export declare const getSubmitInquiryUrl: () => string;
export declare const submitInquiry: (inquiryInput: InquiryInput, options?: RequestInit) => Promise<Inquiry>;
export declare const getSubmitInquiryMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitInquiry>>, TError, {
        data: BodyType<InquiryInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof submitInquiry>>, TError, {
    data: BodyType<InquiryInput>;
}, TContext>;
export type SubmitInquiryMutationResult = NonNullable<Awaited<ReturnType<typeof submitInquiry>>>;
export type SubmitInquiryMutationBody = BodyType<InquiryInput>;
export type SubmitInquiryMutationError = ErrorType<void>;
/**
 * @summary Submit a holiday/transport inquiry
 */
export declare const useSubmitInquiry: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitInquiry>>, TError, {
        data: BodyType<InquiryInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof submitInquiry>>, TError, {
    data: BodyType<InquiryInput>;
}, TContext>;
/**
 * @summary List customer testimonials
 */
export declare const getListTestimonialsUrl: (params?: ListTestimonialsParams) => string;
export declare const listTestimonials: (params?: ListTestimonialsParams, options?: RequestInit) => Promise<ListTestimonials200>;
export declare const getListTestimonialsQueryKey: (params?: ListTestimonialsParams) => readonly ["/api/testimonials", ...ListTestimonialsParams[]];
export declare const getListTestimonialsQueryOptions: <TData = Awaited<ReturnType<typeof listTestimonials>>, TError = ErrorType<unknown>>(params?: ListTestimonialsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTestimonials>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listTestimonials>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListTestimonialsQueryResult = NonNullable<Awaited<ReturnType<typeof listTestimonials>>>;
export type ListTestimonialsQueryError = ErrorType<unknown>;
/**
 * @summary List customer testimonials
 */
export declare function useListTestimonials<TData = Awaited<ReturnType<typeof listTestimonials>>, TError = ErrorType<unknown>>(params?: ListTestimonialsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTestimonials>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List blog posts / travel tips
 */
export declare const getListBlogPostsUrl: (params?: ListBlogPostsParams) => string;
export declare const listBlogPosts: (params?: ListBlogPostsParams, options?: RequestInit) => Promise<ListBlogPosts200>;
export declare const getListBlogPostsQueryKey: (params?: ListBlogPostsParams) => readonly ["/api/blog", ...ListBlogPostsParams[]];
export declare const getListBlogPostsQueryOptions: <TData = Awaited<ReturnType<typeof listBlogPosts>>, TError = ErrorType<unknown>>(params?: ListBlogPostsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBlogPosts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listBlogPosts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListBlogPostsQueryResult = NonNullable<Awaited<ReturnType<typeof listBlogPosts>>>;
export type ListBlogPostsQueryError = ErrorType<unknown>;
/**
 * @summary List blog posts / travel tips
 */
export declare function useListBlogPosts<TData = Awaited<ReturnType<typeof listBlogPosts>>, TError = ErrorType<unknown>>(params?: ListBlogPostsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBlogPosts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get blog post by slug
 */
export declare const getGetBlogPostUrl: (slug: string) => string;
export declare const getBlogPost: (slug: string, options?: RequestInit) => Promise<BlogPost>;
export declare const getGetBlogPostQueryKey: (slug: string) => readonly [`/api/blog/${string}`];
export declare const getGetBlogPostQueryOptions: <TData = Awaited<ReturnType<typeof getBlogPost>>, TError = ErrorType<void>>(slug: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBlogPost>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBlogPost>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBlogPostQueryResult = NonNullable<Awaited<ReturnType<typeof getBlogPost>>>;
export type GetBlogPostQueryError = ErrorType<void>;
/**
 * @summary Get blog post by slug
 */
export declare function useGetBlogPost<TData = Awaited<ReturnType<typeof getBlogPost>>, TError = ErrorType<void>>(slug: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBlogPost>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map