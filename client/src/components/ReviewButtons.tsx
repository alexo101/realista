import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AgentReview } from "./AgentReview";

export function ReviewButtons() {
  const [isAgentReviewOpen, setIsAgentReviewOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        className="w-full"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsAgentReviewOpen(true);
        }}
      >
        <Pencil className="h-4 w-4 mr-2" />
        Deja una reseña a tu agente
      </Button>
      <Button 
        variant="outline" 
        className="w-full"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Pencil className="h-4 w-4 mr-2" />
        Deja una reseña a tu agencia
      </Button>

      {isAgentReviewOpen && (
        <AgentReview onClose={() => setIsAgentReviewOpen(false)} />
      )}
    </div>
  );
}