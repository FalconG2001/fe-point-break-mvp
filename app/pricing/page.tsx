import React from "react";
import PricingTable from "@/components/PricingTable";
import PricingNotes from "@/components/PricingNotes";
import { getPricing } from "@/lib/pricing-actions";
import { CENTRE_NAME } from "@/lib/config";

export const revalidate = 3600; // Revalidate every hour

export default async function PricingPage() {
  const allPricing = await getPricing("session");

  const normalPricing = allPricing.filter((p: any) => p.userType === "normal");
  const studentPricing = allPricing.filter(
    (p: any) => p.userType === "student",
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 ">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Pricing Plans
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-gray-500 ">
            Choose the perfect duration for your gaming session at {CENTRE_NAME}
            .
          </p>
        </div>

        <div className="mt-16 space-y-16">
          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 ">
                Normal Pricing
              </h2>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800 ">
                Standard
              </span>
            </div>
            <PricingTable title="Session Rates" pricingData={normalPricing} />
          </section>

          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 ">
                Student Pricing
              </h2>
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800 ">
                Special Discount
              </span>
            </div>
            <PricingTable title="Session Rates" pricingData={studentPricing} />
            <p className="mt-4 text-sm text-gray-500 ">
              * Valid student ID required for student pricing.
            </p>
          </section>

          <PricingNotes />
        </div>
      </div>
    </div>
  );
}
