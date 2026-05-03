import { useMemo, useState } from "react";
import { Calculator, Euro, PiggyBank, Percent, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

interface MortgageCalculatorProps {
  propertyPrice: number;
}

const TAX_RATE = 0.10;
const DEFAULT_DOWN_PAYMENT_RATIO = 0.20;
const DEFAULT_INTEREST_RATE = 3.5;
const DEFAULT_YEARS = 30;

// Same intervals used in the neighborhood-results price filter (Venta)
const PRICE_STEPS: number[] = [
  0,
  60000, 70000, 80000, 90000, 100000, 110000, 120000, 130000, 140000, 150000,
  160000, 170000, 180000, 190000, 200000, 220000, 240000, 260000, 280000, 300000,
  320000, 340000, 360000, 380000, 400000, 450000, 500000, 550000, 600000, 650000,
  700000, 750000, 800000, 850000, 900000, 950000, 1000000, 1100000, 1200000,
  1300000, 1400000, 1500000, 1600000, 1700000, 1800000, 1900000, 2000000,
  2100000, 2200000, 2300000, 2400000, 2500000, 2600000, 2700000, 2800000,
  2900000, 3000000,
];

const formatEuro = (value: number): string => {
  if (!isFinite(value) || isNaN(value)) return "0 €";
  return `${Math.round(value).toLocaleString("es-ES")} €`;
};

// Find the index of the closest step <= value
const valueToIndex = (value: number): number => {
  let idx = 0;
  for (let i = 0; i < PRICE_STEPS.length; i++) {
    if (PRICE_STEPS[i] <= value) idx = i;
    else break;
  }
  return idx;
};

export function MortgageCalculator({ propertyPrice }: MortgageCalculatorProps) {
  const [price, setPrice] = useState<number>(propertyPrice || 0);
  const [savings, setSavings] = useState<number>(
    Math.round((propertyPrice || 0) * DEFAULT_DOWN_PAYMENT_RATIO),
  );
  const [interestRate, setInterestRate] = useState<number>(DEFAULT_INTEREST_RATE);
  const [years, setYears] = useState<number>(DEFAULT_YEARS);

  const breakdown = useMemo(() => {
    const safePrice = Math.max(0, price || 0);
    const safeSavings = Math.max(0, Math.min(savings || 0, safePrice));
    const loanAmount = Math.max(0, safePrice - safeSavings);
    const taxes = safePrice * TAX_RATE;
    const downPaymentPercent = safePrice > 0 ? (safeSavings / safePrice) * 100 : 0;

    const monthlyRate = (interestRate || 0) / 100 / 12;
    const totalPayments = (years || 0) * 12;

    let monthlyPayment = 0;
    if (loanAmount > 0 && totalPayments > 0) {
      if (monthlyRate === 0) {
        monthlyPayment = loanAmount / totalPayments;
      } else {
        const factor = Math.pow(1 + monthlyRate, totalPayments);
        monthlyPayment = (loanAmount * monthlyRate * factor) / (factor - 1);
      }
    }
    const totalInterest = Math.max(0, monthlyPayment * totalPayments - loanAmount);

    return { loanAmount, taxes, totalInterest, monthlyPayment, downPaymentPercent };
  }, [price, savings, interestRate, years]);

  const handleNumberChange = (
    setter: (n: number) => void,
    raw: string,
    allowDecimal = false,
  ) => {
    if (raw === "") {
      setter(0);
      return;
    }
    const parsed = allowDecimal ? parseFloat(raw.replace(",", ".")) : parseInt(raw, 10);
    if (isNaN(parsed)) return;
    setter(parsed);
  };

  const priceMax = PRICE_STEPS[PRICE_STEPS.length - 1];
  const savingsMax = Math.max(price, 0) || priceMax;
  const savingsSteps = useMemo(
    () => PRICE_STEPS.filter((v) => v <= savingsMax),
    [savingsMax],
  );

  const noSpinClass =
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className="border rounded-lg overflow-hidden" data-testid="mortgage-calculator">
      <div className="bg-blue-50/60 px-5 py-4 flex items-center gap-2 border-b">
        <Calculator className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Calculadora de Hipoteca</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6 p-5">
        {/* Inputs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mortgage-price" className="text-sm font-medium text-gray-700">
              Precio de la propiedad
            </Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="mortgage-price"
                type="number"
                inputMode="numeric"
                min={0}
                value={price || ""}
                onChange={(e) => handleNumberChange(setPrice, e.target.value)}
                className={`pl-9 ${noSpinClass}`}
                data-testid="input-mortgage-price"
              />
            </div>
            <Slider
              value={[valueToIndex(price)]}
              min={0}
              max={PRICE_STEPS.length - 1}
              step={1}
              onValueChange={([idx]) => setPrice(PRICE_STEPS[idx] ?? 0)}
              className="pt-1"
              data-testid="slider-mortgage-price"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mortgage-savings" className="text-sm font-medium text-gray-700">
              Ahorros / Entrada
            </Label>
            <div className="relative">
              <PiggyBank className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="mortgage-savings"
                type="number"
                inputMode="numeric"
                min={0}
                value={savings || ""}
                onChange={(e) => handleNumberChange(setSavings, e.target.value)}
                className={`pl-9 ${noSpinClass}`}
                data-testid="input-mortgage-savings"
              />
            </div>
            <Slider
              value={[Math.min(valueToIndex(savings), Math.max(savingsSteps.length - 1, 0))]}
              min={0}
              max={Math.max(savingsSteps.length - 1, 0)}
              step={1}
              onValueChange={([idx]) => setSavings(savingsSteps[idx] ?? 0)}
              className="pt-1"
              data-testid="slider-mortgage-savings"
            />
            <p className="text-xs text-gray-500" data-testid="text-down-payment-percent">
              {breakdown.downPaymentPercent.toFixed(1)}% del precio
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mortgage-rate" className="text-sm font-medium text-gray-700">
                Tasa de interés
              </Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="mortgage-rate"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min={0}
                  value={interestRate || ""}
                  onChange={(e) => handleNumberChange(setInterestRate, e.target.value, true)}
                  className="pl-9"
                  data-testid="input-mortgage-rate"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mortgage-years" className="text-sm font-medium text-gray-700">
                Años a pagar
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="mortgage-years"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={40}
                  value={years || ""}
                  onChange={(e) => handleNumberChange(setYears, e.target.value)}
                  className="pl-9"
                  data-testid="input-mortgage-years"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-blue-50/60 rounded-lg p-5 space-y-3">
          <h3 className="text-sm font-semibold text-blue-700 tracking-wide uppercase">
            Desglose estimado
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Monto del préstamo:</span>
              <span className="font-semibold text-gray-900" data-testid="text-loan-amount">
                {formatEuro(breakdown.loanAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Impuestos estimados (10%):</span>
              <span className="font-semibold text-gray-900" data-testid="text-taxes">
                {formatEuro(breakdown.taxes)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Total intereses (aprox):</span>
              <span className="font-semibold text-gray-900" data-testid="text-total-interest">
                {formatEuro(breakdown.totalInterest)}
              </span>
            </div>
          </div>

          <Separator className="bg-blue-200" />

          <div>
            <p className="text-sm font-semibold text-blue-700">Cuota mensual estimada</p>
            <p
              className="text-4xl font-bold text-blue-600 mt-1"
              data-testid="text-monthly-payment"
            >
              {formatEuro(breakdown.monthlyPayment)}
            </p>
            <p className="text-xs text-blue-600/80 mt-2">
              *Cálculo aproximado. No incluye seguros ni gastos de notaría.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
