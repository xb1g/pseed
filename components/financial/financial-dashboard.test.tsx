import { fireEvent, render, screen } from "@testing-library/react";
import {
  DEFAULT_PARENT_FUNDED_ASSUMPTIONS,
  calculateParentFundedModel,
} from "@/lib/financial-model/parent-funded";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { FinancialFunnel } from "./FinancialFunnel";
import { FinancialModelDashboard } from "./FinancialModelDashboard";
import { FinancialSummary } from "./FinancialSummary";

describe("financial dashboard sections", () => {
  it("shows the base-case funnel, outcomes, and editable assumptions", () => {
    const model = calculateParentFundedModel(DEFAULT_PARENT_FUNDED_ASSUMPTIONS);

    render(
      <>
        <FinancialFunnel model={model} />
        <FinancialSummary model={model} />
        <AssumptionsPanel
          assumptions={DEFAULT_PARENT_FUNDED_ASSUMPTIONS}
          onChange={jest.fn()}
          onReset={jest.fn()}
        />
      </>,
    );

    expect(screen.getByText("20,000")).toBeInTheDocument();
    expect(screen.getByText("600")).toBeInTheDocument();
    expect(screen.getByText("฿1,952,400")).toBeInTheDocument();
    expect(screen.getByText("20 seats / month")).toBeInTheDocument();
    expect(screen.getByLabelText("Completed free plans per year")).toHaveValue(20_000);
  });

  it("lets the founder reset assumptions", () => {
    const onReset = jest.fn();

    render(
      <AssumptionsPanel
        assumptions={DEFAULT_PARENT_FUNDED_ASSUMPTIONS}
        onChange={jest.fn()}
        onReset={onReset}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reset base case" }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("recalculates the funnel and restores the base case", () => {
    render(<FinancialModelDashboard />);

    expect(screen.getByText("600")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Completed free plans per year"), {
      target: { value: "10000" },
    });

    expect(screen.getByText("300")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset base case" }));

    expect(screen.getByText("600")).toBeInTheDocument();
  });
});
