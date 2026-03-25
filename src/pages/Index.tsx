import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

const Index = () => {
  // Demo mode — shows the onboarding flow with a sample operator
  return (
    <OnboardingFlow
      operatorName="Demo Operator"
      operatorId="demo"
    />
  );
};

export default Index;
