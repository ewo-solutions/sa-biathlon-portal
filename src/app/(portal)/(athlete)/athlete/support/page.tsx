import { Card } from "@/components/ui/card";

export default function AthleteSupportPage() {
  return (
    <div>
      <h1 className="tracked-caps mb-6 text-2xl font-black text-white">Support</h1>
      <Card>
        <p className="text-sm text-white/80">
          Need help with your membership, event sign-up, or results? Reach the SA Biathlon office
          at{" "}
          <a href="mailto:info@sabiathlon.co.za" className="text-gold hover:underline">
            info@sabiathlon.co.za
          </a>
          .
        </p>
      </Card>
    </div>
  );
}
