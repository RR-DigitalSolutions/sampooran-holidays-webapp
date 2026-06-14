import type { LucideIcon } from "lucide-react";
import {
  Wifi, Waves, Utensils, Car, Dumbbell, Flame, Coffee, Umbrella, Tv,
  Wind, Bath, Maximize, Eye, Layers, Clock, Shield, Phone, Shirt,
  Droplet, Lightbulb, Home, Users, Accessibility, Zap, Lock,
  Monitor, Music, Gamepad2, ParkingSquare, Bike, Footprints,
  Trees, Snowflake, Sun, Mountain, UtensilsCrossed, Sofa, Armchair,
  Key, MapPin, Navigation, AlertCircle, Book, Camera, Heart, Star,
  Bed, Briefcase, CreditCard, Droplets, Fan, Headphones, Inbox,
  Landmark, Package, RotateCcw, Smile, TrendingUp, Baby,
  Pill, HeartHandshake, Tent, Compass, Airplay, Thermometer
} from "lucide-react";

export interface AmenityOption {
  key: string;
  label: string;
  category: string;
  icon: LucideIcon;
  description?: string;
}

/**
 * PREMIUM AMENITIES LIBRARY (60+ items)
 * 10 Strategic Categories - Essential amenities grouped for better organization
 * Perfect for all hotel segments from budget to 5-star luxury
 */
export const COMPREHENSIVE_AMENITIES: AmenityOption[] = [
  // ─── ROOM ESSENTIALS (8 items) ───────────────────────────────────
  { key: "WIFI", label: "Free Wi-Fi", category: "room-essentials", icon: Wifi, description: "High-speed internet" },
  { key: "AC", label: "Air Conditioning", category: "room-essentials", icon: Wind, description: "Climate control" },
  { key: "HEATING", label: "Heating System", category: "room-essentials", icon: Thermometer, description: "Room heating" },
  { key: "TV", label: "Flat-Screen TV", category: "room-essentials", icon: Tv, description: "Smart TV" },
  { key: "PREMIUM_BEDDING", label: "Premium Bedding", category: "room-essentials", icon: Bed, description: "Luxury linens" },
  { key: "SAFE", label: "In-Room Safe", category: "room-essentials", icon: Shield, description: "Secure storage" },
  { key: "MINIBAR", label: "Minibar", category: "room-essentials", icon: Coffee, description: "Mini refrigerator" },
  { key: "BLACKOUT_CURTAINS", label: "Blackout Curtains", category: "room-essentials", icon: Eye, description: "Light-blocking" },

  // ─── BATHROOM AMENITIES (7 items) ────────────────────────────────
  { key: "SHOWER", label: "Shower/Bathtub Combo", category: "bathroom", icon: Bath, description: "Modern facilities" },
  { key: "HOT_WATER", label: "Hot Water 24/7", category: "bathroom", icon: Droplet, description: "Round-the-clock" },
  { key: "TOILETRIES", label: "Premium Toiletries", category: "bathroom", icon: Droplets, description: "Amenity set" },
  { key: "HAIRDRYER", label: "Hair Dryer", category: "bathroom", icon: Wind, description: "Complimentary" },
  { key: "BATH_ROBES", label: "Bathrobes & Slippers", category: "bathroom", icon: Shirt, description: "Luxury items" },
  { key: "RAIN_SHOWER", label: "Rain Shower Head", category: "bathroom", icon: Droplets, description: "Premium shower" },
  { key: "HEATED_BATHROOM", label: "Bathroom Heater", category: "bathroom", icon: Thermometer, description: "Comfort heating" },

  // ─── TECH & ENTERTAINMENT (7 items) ──────────────────────────────
  { key: "SMART_TV", label: "Smart TV", category: "tech-entertainment", icon: Monitor, description: "Apps & streaming" },
  { key: "USB_CHARGING", label: "USB Charging Ports", category: "tech-entertainment", icon: Zap, description: "Multiple ports" },
  { key: "WIRELESS_CHARGING", label: "Wireless Charging", category: "tech-entertainment", icon: Zap, description: "Qi-enabled" },
  { key: "NETFLIX", label: "Streaming Services", category: "tech-entertainment", icon: Tv, description: "Netflix & Prime" },
  { key: "MUSIC_SYSTEM", label: "Music System", category: "tech-entertainment", icon: Music, description: "Audio system" },
  { key: "GAMING_CONSOLE", label: "Gaming Console", category: "tech-entertainment", icon: Gamepad2, description: "Entertainment" },
  { key: "SMART_SPEAKER", label: "Smart Speaker", category: "tech-entertainment", icon: Monitor, description: "Voice-controlled" },

  // ─── DINING & BEVERAGES (6 items) ────────────────────────────────
  { key: "RESTAURANT", label: "In-House Restaurant", category: "dining", icon: Utensils, description: "Fine dining" },
  { key: "BAR", label: "Bar & Lounge", category: "dining", icon: Coffee, description: "Beverages & drinks" },
  { key: "ROOM_SERVICE", label: "24/7 Room Service", category: "dining", icon: UtensilsCrossed, description: "Anytime dining" },
  { key: "BREAKFAST", label: "Breakfast Included", category: "dining", icon: Coffee, description: "Complimentary meal" },
  { key: "SPECIAL_DIET", label: "Special Diet Menu", category: "dining", icon: Utensils, description: "Dietary options" },
  { key: "COFFEE_MACHINE", label: "Coffee/Tea Maker", category: "dining", icon: Coffee, description: "In-room beverage" },

  // ─── RECREATION & WELLNESS (8 items) ──────────────────────────────
  { key: "POOL", label: "Swimming Pool", category: "recreation-wellness", icon: Waves, description: "Outdoor pool" },
  { key: "GYM", label: "Fitness Center", category: "recreation-wellness", icon: Dumbbell, description: "Equipped gym" },
  { key: "YOGA", label: "Yoga Classes", category: "recreation-wellness", icon: Wind, description: "Wellness programs" },
  { key: "SPA", label: "Spa & Massage", category: "recreation-wellness", icon: Heart, description: "Relaxation services" },
  { key: "SAUNA", label: "Sauna", category: "recreation-wellness", icon: Flame, description: "Steam room" },
  { key: "JACUZZI", label: "Hot Tub/Jacuzzi", category: "recreation-wellness", icon: Droplets, description: "Hydrotherapy" },
  { key: "SPORTS_FACILITIES", label: "Sports Facilities", category: "recreation-wellness", icon: Compass, description: "Activity options" },
  { key: "GARDEN", label: "Garden & Outdoor", category: "recreation-wellness", icon: Trees, description: "Scenic spaces" },

  // ─── SERVICES & STAFF (6 items) ───────────────────────────────────
  { key: "CONCIERGE", label: "Concierge Service", category: "services", icon: Briefcase, description: "Guest assistance" },
  { key: "LAUNDRY", label: "Laundry Service", category: "services", icon: Shirt, description: "Cleaning available" },
  { key: "HOUSEKEEPING", label: "Daily Housekeeping", category: "services", icon: Home, description: "Room cleaning" },
  { key: "BELL_SERVICE", label: "Bell Desk", category: "services", icon: Package, description: "Baggage handling" },
  { key: "BUSINESS_CENTER", label: "Business Center", category: "services", icon: Monitor, description: "Work facilities" },
  { key: "TRAVEL_DESK", label: "Travel Desk", category: "services", icon: Navigation, description: "Tour assistance" },

  // ─── ACCESSIBILITY (5 items) ─────────────────────────────────────
  { key: "WHEELCHAIR_ACCESS", label: "Wheelchair Accessible", category: "accessibility", icon: Accessibility, description: "Full access" },
  { key: "ELEVATOR", label: "Elevator Access", category: "accessibility", icon: Maximize, description: "Easy mobility" },
  { key: "ACCESSIBLE_BATHROOM", label: "Accessible Bathroom", category: "accessibility", icon: Bath, description: "ADA compliant" },
  { key: "BRAILLE_SIGNAGE", label: "Braille Signage", category: "accessibility", icon: Layers, description: "Blind assistance" },
  { key: "HEARING_AID", label: "Hearing Loops", category: "accessibility", icon: Headphones, description: "Audio assistance" },

  // ─── SECURITY & SAFETY (6 items) ──────────────────────────────────
  { key: "CCTV", label: "CCTV Surveillance", category: "security", icon: Camera, description: "Security cameras" },
  { key: "SECURITY_24HR", label: "24/7 Security", category: "security", icon: Shield, description: "Security staff" },
  { key: "KEYCARD_ENTRY", label: "Keycard Entry", category: "security", icon: Lock, description: "Electronic access" },
  { key: "FIRE_SAFETY", label: "Fire Safety", category: "security", icon: Flame, description: "Safety systems" },
  { key: "SAFE_DEPOSIT", label: "Safe Deposit Boxes", category: "security", icon: Shield, description: "Secure storage" },
  { key: "SECURE_PAYMENT", label: "Secure Payment", category: "security", icon: CreditCard, description: "Safe transactions" },

  // ─── FAMILY & KIDS (6 items) ──────────────────────────────────────
  { key: "KIDS_CLUB", label: "Kids Club", category: "family", icon: Baby, description: "Activity center" },
  { key: "KIDS_MENU", label: "Kids Menu", category: "family", icon: Utensils, description: "Child meals" },
  { key: "PLAYGROUND", label: "Play Area", category: "family", icon: Gamepad2, description: "Play space" },
  { key: "BABYSITTING", label: "Babysitting Service", category: "family", icon: Baby, description: "Professional care" },
  { key: "FAMILY_ROOMS", label: "Family Rooms", category: "family", icon: Home, description: "Multi-room suites" },
  { key: "CRIB_SERVICE", label: "Crib & High Chair", category: "family", icon: Baby, description: "Baby furniture" },

  // ─── PARKING & OUTDOORS (6 items) ────────────────────────────────
  { key: "PARKING", label: "Free Parking", category: "parking-outdoors", icon: Car, description: "Complimentary" },
  { key: "VALET_PARKING", label: "Valet Parking", category: "parking-outdoors", icon: Car, description: "Valet service" },
  { key: "EV_CHARGING", label: "EV Charging Station", category: "parking-outdoors", icon: Zap, description: "Electric vehicle" },
  { key: "BIKE_RENTAL", label: "Bike Rental", category: "parking-outdoors", icon: Bike, description: "Cycling available" },
  { key: "MOUNTAIN_VIEW", label: "Mountain View", category: "parking-outdoors", icon: Mountain, description: "Scenic views" },
  { key: "VALLEY_VIEW", label: "Valley View", category: "parking-outdoors", icon: Trees, description: "Natural views" },
];

/**
 * Category metadata for UI display with 10 strategic categories
 */
export const CATEGORY_METADATA: Record<string, { label: string; color: string; bgColor: string }> = {
  "room-essentials": { label: "Room Essentials", color: "text-blue-700", bgColor: "bg-blue-50" },
  "bathroom": { label: "Bathroom", color: "text-cyan-700", bgColor: "bg-cyan-50" },
  "tech-entertainment": { label: "Tech & Entertainment", color: "text-purple-700", bgColor: "bg-purple-50" },
  "dining": { label: "Dining & Beverages", color: "text-orange-700", bgColor: "bg-orange-50" },
  "recreation-wellness": { label: "Recreation & Wellness", color: "text-green-700", bgColor: "bg-green-50" },
  "services": { label: "Services & Staff", color: "text-amber-700", bgColor: "bg-amber-50" },
  "accessibility": { label: "Accessibility", color: "text-teal-700", bgColor: "bg-teal-50" },
  "security": { label: "Security & Safety", color: "text-red-700", bgColor: "bg-red-50" },
  "family": { label: "Family & Kids", color: "text-pink-700", bgColor: "bg-pink-50" },
  "parking-outdoors": { label: "Parking & Outdoors", color: "text-sky-700", bgColor: "bg-sky-50" },
};

/**
 * Categorized amenities for organized display
 */
export const AMENITIES_BY_CATEGORY = COMPREHENSIVE_AMENITIES.reduce((acc, amenity) => {
  if (!acc[amenity.category]) {
    acc[amenity.category] = [];
  }
  acc[amenity.category].push(amenity);
  return acc;
}, {} as Record<string, AmenityOption[]>);

/**
 * Get all categories in proper order (10 strategic categories)
 */
export const AMENITY_CATEGORIES = [
  "room-essentials",
  "bathroom",
  "tech-entertainment",
  "dining",
  "recreation-wellness",
  "services",
  "accessibility",
  "security",
  "family",
  "parking-outdoors",
];

/**
 * Helper functions
 */
export const getAmenityInfo = (key: string): AmenityOption | undefined => {
  return COMPREHENSIVE_AMENITIES.find(a => a.key === key);
};

export const getAmenityIcon = (key: string): LucideIcon | undefined => {
  return getAmenityInfo(key)?.icon;
};

/**
 * Most popular amenities for quick selection
 */
export const POPULAR_AMENITIES = [
  "WIFI",
  "PARKING",
  "RESTAURANT",
  "POOL",
  "GYM",
  "AC",
  "HOT_WATER",
  "COMPLIMENTARY_BREAKFAST",
  "ROOM_SERVICE",
  "TV",
  "LAUNDRY",
  "SPA",
  "MASSAGE",
];
