"use client";


import {  } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="min-h-screen">
      
      
      <div className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">About Sampooran Holidays</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">Your trusted partner for authentic Himalayan adventures.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <h2>Our Story</h2>
          <p>
            Founded in Manali, Himachal Pradesh, Sampooran Holidays began with a simple mission: to share the authentic beauty of the Himalayas with the world. Over the years, we have grown into a premier travel company offering customized B2B and B2C holiday packages, but our core philosophy remains unchanged.
          </p>
          <p>
            We believe that travel is not just about visiting places, but about creating memories that last a lifetime. Our team of local experts ensures that every itinerary is crafted with care, offering a perfect blend of adventure, culture, and relaxation.
          </p>

          <h2>Why Choose Us?</h2>
          <ul>
            <li><strong>Local Expertise:</strong> Being based in Himachal, we know the mountains better than anyone else.</li>
            <li><strong>Customized Itineraries:</strong> We tailor every trip to suit your preferences and budget.</li>
            <li><strong>Reliable Transport:</strong> Our fleet of well-maintained taxis, tempo travellers, and buses ensures a comfortable journey.</li>
            <li><strong>24/7 Support:</strong> Our dedicated team is always available to assist you during your trip.</li>
          </ul>

          <div className="mt-10 text-center">
            <Link href="/contact">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">Contact Us Today</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
