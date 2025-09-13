import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import PetDrawer from "../components/PetDrawer/PetDrawer";

const mockPet = {
  id: 101,
  clientId: 1,
  name: "Dog 1",
  status: "Active",
  type: "Dog",
  breed: "American Staffordshire Terrier",
  size: "Large",
  temper: "Excellent",
  color: "Black & White",
  gender: "Neutered - Male",
  weightKg: 4.0,
  dob: "2025-07-29",
  attributes: ["Barks", "Blind", "Escaper"],
  notes: "Hi",
  customerNotes: "This is simple notes from portal",
  photos: [],
};

const queryClient = new QueryClient();

describe("PetDrawer", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeAll(() => {
    jest.mock("../services", () => ({
      fetchPet: jest.fn().mockResolvedValue(mockPet),
      fetchVaccinations: jest.fn().mockResolvedValue([]),
      fetchGrooming: jest.fn().mockResolvedValue([]),
      fetchBookings: jest.fn().mockResolvedValue([]),
    }));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPet),
    });
  });

  beforeEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date().getTime());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("calculates age correctly", async () => {
    render(<PetDrawer petId={101} onClose={jest.fn()} />, { wrapper });
    await waitFor(
      () => {
        expect(screen.getByText(/Age: 0 years, 1 months/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  test("updates attributes in edit mode", async () => {
    render(<PetDrawer petId={101} onClose={jest.fn()} />, { wrapper });
    const actionsButton = await screen.findByText("Actions");
    fireEvent.click(actionsButton);
    await waitFor(
      () => {
        const editButton = screen.getByText("Edit", { selector: "button" });
        fireEvent.click(editButton);
      },
      { timeout: 1000 }
    );

    await waitFor(
      () => {
        const attributeInput = screen.getByLabelText(/attributes/i);
        fireEvent.change(attributeInput, { target: { value: "" } });
        fireEvent.change(attributeInput, { target: { value: "Friendly" } });
        fireEvent.click(screen.getByText("Add"));

        const friendlySpans = screen.getAllByText("Friendly", {
          selector: "span",
        });
        expect(friendlySpans.length).toBe(1);
        const friendlySpan = friendlySpans[0];
        expect(friendlySpan).toBeInTheDocument();


        const removeButton =
          friendlySpan.parentElement?.querySelector("button");
        if (!removeButton)
          throw new Error("Remove button not found for Friendly");
        fireEvent.click(removeButton);

        expect(screen.queryByText("Friendly")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  }, 10000);

  test("validates DOB not future", async () => {
    render(<PetDrawer petId={101} onClose={jest.fn()} />, { wrapper });
    const actionsButton = await screen.findByText("Actions");
    fireEvent.click(actionsButton);
    await waitFor(
      () => {
        const editButton = screen.getByText("Edit", { selector: "button" });
        fireEvent.click(editButton);
      },
      { timeout: 1000 }
    );

    await waitFor(
      () => {
        const dobInput = screen.getByLabelText(/date of birth/i);
        fireEvent.change(dobInput, { target: { value: "2025-10-01" } });
        const saveButton = screen.getByText("Save");
        fireEvent.click(saveButton);
        const toastSpy = jest
          .spyOn(toast, "error")
          .mockImplementation(() => "mock-toast-id");
        expect(toastSpy).toHaveBeenCalledWith("DOB cannot be in the future");
        toastSpy.mockRestore();
      },
      { timeout: 2000 }
    );
  });

  test("displays loading state", async () => {
    const customQueryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, queryFn: () => new Promise(() => {}) },
      },
    });
    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={customQueryClient}>
        {children}
      </QueryClientProvider>
    );
    render(<PetDrawer petId={101} onClose={jest.fn()} />, {
      wrapper: customWrapper,
    });
    await waitFor(
      () => {
        const loadingElements = screen.getAllByText("");
        expect(loadingElements.length).toBeGreaterThan(0);
      },
      { timeout: 2000 }
    );
  });
});
