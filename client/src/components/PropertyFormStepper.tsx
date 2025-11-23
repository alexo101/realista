import { Check } from "lucide-react";

interface Step {
  id: number;
  name: string;
  completed: boolean;
}

interface PropertyFormStepperProps {
  currentStep: number;
  steps: Step[];
  completionPercentage: number;
}

export function PropertyFormStepper({
  currentStep,
  steps,
  completionPercentage,
}: PropertyFormStepperProps) {
  return (
    <div className="w-full mb-8">
      {/* Progress bar header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-gray-700">Progreso total</span>
        <span className="text-sm font-medium text-gray-700">
          {completionPercentage}% completado
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between items-start">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = step.completed;
          const isPast = step.id < currentStep;

          return (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                index < steps.length - 1 ? "flex-1" : ""
              }`}
            >
              {/* Step circle */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm
                    transition-all duration-200
                    ${
                      isCompleted
                        ? "bg-primary text-white"
                        : isActive
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-500"
                    }
                  `}
                  data-testid={`step-indicator-${step.id}`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" data-testid={`step-check-${step.id}`} />
                  ) : (
                    step.id
                  )}
                </div>
              </div>

              {/* Step label */}
              <span
                className={`
                  mt-2 text-xs text-center max-w-[100px]
                  ${isActive || isCompleted ? "text-primary font-medium" : "text-gray-500"}
                `}
              >
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
