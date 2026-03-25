import { useParams } from "react-router-dom";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

const OnboardPage = () => {
  const { slug } = useParams<{ slug: string }>();

  // TODO: Fetch operator data from Supabase by slug
  // For now, show demo flow
  return (
    <OnboardingFlow
      operatorName="Incoming Operator"
      operatorId={slug || "unknown"}
    />
  );
};

export default OnboardPage;
