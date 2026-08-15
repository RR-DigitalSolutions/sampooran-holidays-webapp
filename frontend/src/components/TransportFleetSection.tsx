"use client";

import React, { useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { VehicleCard } from "@/components/VehicleCard";
import { useCarouselGuide } from "@/hooks/useCarouselGuide";

interface Vehicle {
  id: number;
  name: string;
  type: string;
  capacity: number;
  pricePerKm?: number;
  pricePerDay?: number;
  images?: string[];
  features?: string[];
  ownerName?: string;
}

interface TransportFleetSectionProps {
  vehicles?: Vehicle[];
}

const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: 101,
    name: "Innova Crysta",
    type: "SUV",
    capacity: 7,
    pricePerDay: 4500,
    images: ["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"],
    features: ["Leather Seats", "Dual AC", "Carrier", "Professional Driver"],
    ownerName: "Sampooran Fleet"
  },
  {
    id: 102,
    name: "Luxury Tempo",
    type: "Tempo",
    capacity: 12,
    pricePerDay: 7500,
    images: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"],
    features: ["Reclining Seats", "AC & Heater", "LED TV", "Premium Audio"],
    ownerName: "Sampooran Fleet"
  },
  {
    id: 103,
    name: "Urban Coach",
    type: "Coach",
    capacity: 27,
    pricePerDay: 14000,
    images: ["https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80"],
    features: ["Pantry", "Dual Aircon", "Reclining Seats", "Tour Guide"],
    ownerName: "Sampooran Fleet"
  }
];

export default function TransportFleetSection({ vehicles }: TransportFleetSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  const autoplayPlugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      containScroll: "trimSnaps",
      loop: true,
    },
    [autoplayPlugin.current]
  );

  const { showHint } = useCarouselGuide({ emblaRef: sectionRef, emblaApi, sectionId: "fleet", waitMs: 3000 });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Combine passed vehicles with default ones if empty or minimal
  const displayVehicles = vehicles && vehicles.length > 0
    ? [...vehicles, ...DEFAULT_VEHICLES].filter((v, i, self) => self.findIndex(t => t.name === v.name) === i).slice(0, 6)
    : DEFAULT_VEHICLES;

  return (
    <div ref={sectionRef} className="container mx-auto px-2 md:px-4 my-6">
      <section className="bg-white relative overflow-hidden rounded-md border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl p-2 md:p-2">
              <div className="flex items-center gap-2">
                <p className="text-accent font-bold text-[9px] md:text-[12px] uppercase tracking-[0.1em] font-sans">
                  Comfort on the road
                </p>
              </div>
              <h2 className="text-xl md:text-3xl font-serif font-bold text-primary leading-tight">
                Premium <span className="text-accent font-light">Transport Fleet</span>
              </h2>
              <p className="text-slate-500 text-[10px] sm:text-xs md:text-sm">
                Travel across the Himalayas in ultimate safety and luxury. Choose from our wide selection of sanitized SUVs, luxury tempo travellers, and premium coaches.
              </p>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-col items-end gap-6 pr-2 pb-2">
              <Link href="/transport" className="text-primary font-bold text-sm hover:text-accent flex items-center gap-1.5 group transition-colors">
                View All Fleet <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-2">
                <button aria-label="Previous Vehicle" title="Previous Vehicle" onClick={scrollPrev} className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary hover:shadow-sm transition-all focus:outline-none">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button aria-label="Next Vehicle" title="Next Vehicle" onClick={scrollNext} className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary hover:shadow-sm transition-all focus:outline-none">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Embla Carousel Container */}
          <div className="relative">
            {showHint && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <div className="flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce">
                  <span>Swipe to explore</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            )}
            <div className="overflow-hidden" ref={emblaRef}>
              <div
                className="flex -ml-2 md:-ml-3 pb-2 pt-4"
                onMouseEnter={() => autoplayPlugin.current.stop()}
                onMouseLeave={() => autoplayPlugin.current.play()}
              >
                {displayVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="flex-[0_0_82%] xs:flex-[0_0_80%] sm:flex-[0_0_48%] md:flex-[0_0_33.33%] lg:flex-[0_0_25%] min-w-0 pl-2 md:pl-3">
                    <VehicleCard vehicle={vehicle} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
