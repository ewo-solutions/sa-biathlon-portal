import { Card } from "@/components/ui/card";

export default function AthleteSupportPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink-950">Support</h1>
      <Card>
        <p className="text-sm text-ink-600">
          Need help with your membership, event sign-up, or results? Reach the SA Biathlon office
          at{" "}
          <a href="mailto:info@sabiathlon.co.za" className="text-brand-600 hover:underline">
            info@sabiathlon.co.za
          </a>
          .
        </p>
      </Card>
    </div>
  );
}
