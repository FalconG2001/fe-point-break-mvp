import React from "react";

interface PricingNotesProps {
  variant?: "default" | "list-only";
}

const PricingNotes: React.FC<PricingNotesProps> = ({ variant = "default" }) => {
  const content = (
    <ul className="space-y-3 text-amber-800">
      <li className="flex gap-2">
        <span className="font-bold">•</span>
        <span>
          Pricing may vary depending on whether the console is switched in
          between a single session.
        </span>
      </li>
      <li className="flex gap-2">
        <span className="font-bold">•</span>
        <span>
          <strong>Grace Period:</strong> A 5-minute grace period is provided if
          there is no subsequent booking in the next time slot.
        </span>
      </li>
      <li className="flex gap-2">
        <span className="font-bold">•</span>
        <span>
          <strong>Overtime Charge:</strong> If the session exceeds the 5-minute
          grace period, a strictly enforced charge of{" "}
          <strong>₹10 per player</strong> will be added to the final total.
        </span>
      </li>
      <li className="flex gap-2 font-semibold">
        <span className="font-bold">•</span>
        <span>
          <strong>Damage Policy:</strong> Players are responsible for any
          intentional damage to controllers, consoles, or screens. A
          repair/replacement fee will be charged.
        </span>
      </li>
      <li className="flex gap-2 font-semibold">
        <span className="font-bold">•</span>
        <span>
          <strong>Outside Food/Drinks:</strong> Outside food and drinks are not
          allowed inside the gaming area to prevent spills and damage.
        </span>
      </li>
      <li className="flex gap-2 font-semibold">
        <span className="font-bold">•</span>
        <span>
          <strong>Age Restriction:</strong> Children under 12 must be
          accompanied by an adult.
        </span>
      </li>
      <li className="flex gap-2 font-semibold">
        <span className="font-bold">•</span>
        <span>
          <strong>Behavioral Code:</strong> Abusive language or harassment of
          other players/staff will lead to immediate cancellation of the session
          without refund.
        </span>
      </li>
      <li className="flex gap-2 font-semibold">
        <span className="font-bold">•</span>
        <span>
          <strong>Game Availability:</strong> Specific games are subject to
          availability and updates.
        </span>
      </li>
      <li className="flex gap-2 text-sm italic mt-4 text-amber-700">
        <span>
          * We recommend arriving 5-10 minutes early to ensure you get your full
          playtime.
        </span>
      </li>
    </ul>
  );

  if (variant === "list-only") {
    return content;
  }

  return (
    <section className="rounded-2xl bg-amber-50 p-8 border border-amber-200">
      <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-amber-600"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        Important Notes & Conditions
      </h2>
      {content}
    </section>
  );
};

export default PricingNotes;
