import { useState } from "react";
import { AgentReview } from "./AgentReview";

export function ReviewButtons() {
  const [isAgentReviewOpen, setIsAgentReviewOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {isAgentReviewOpen && (
        <AgentReview onClose={() => setIsAgentReviewOpen(false)} />
      )}
    </div>
  );
}