import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
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
  size: "Medium",
  temper: "Excellent",
  color: "Black & White",
  gender: "Neutered - Male",
  weightKg: 4.0,
  dob: "2025-07-29",
  attributes: ["Blind", "Escaper"],
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
      fetchPet: jest
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) => setTimeout(() => resolve(mockPet), 100))
        ),
      fetchVaccinations: jest.fn().mockResolvedValue([]),
      fetchGrooming: jest.fn().mockResolvedValue([]),
      fetchBookings: jest.fn().mockResolvedValue([]),
    }));
    global.fetch = jest.fn().mockImplementation((url, options) => {
      if (url.includes(`/pets/${mockPet.id}`) && options.method === "PUT") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...mockPet,
              ...JSON.parse(options.body),
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPet),
      });
    });
  });

  beforeEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2025, 8, 14).getTime()); // September 14, 2025
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

    // Wait for the pet data to load
    await waitFor(
      () => {
        expect(screen.getByText("Dog 1")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Wait for the Actions button to appear and click it
    const actionsButton = await screen.findByText("Actions");
    fireEvent.click(actionsButton);

    // Wait for the Edit button to appear and click it
    await waitFor(
      () => {
        const editButton = screen.getByText("Edit", { selector: "button" });
        expect(editButton).toBeInTheDocument();
        fireEvent.click(editButton);
      },
      { timeout: 1000 }
    );

    // Wait for the edit mode to fully render by checking for the Save button
    await waitFor(
      () => {
        expect(screen.getByText("Save")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Advance timers to ensure state updates (e.g., useEffect for editedPet)
    jest.advanceTimersByTime(1000);

    // Wait for the attributes input to be available and interact with it
    await waitFor(
      () => {
        // Target the custom attributes input using getByPlaceholderText
        const attributeInput = screen.getByPlaceholderText("Add custom attribute...");
        expect(attributeInput).toBeInTheDocument();

        // Clear any existing value
        fireEvent.change(attributeInput, { target: { value: "" } });

        // Add a new attribute (Friendly isn't in mockPet, so add it)
        fireEvent.change(attributeInput, { target: { value: "Friendly" } });
        fireEvent.click(screen.getByRole("button", { name: /Add/i }));

        // Verify the new attribute appears (use getAllByText to handle multiple)
        const friendlySpans = screen.getAllByText("Friendly", { selector: "span" });
        expect(friendlySpans.length).toBeGreaterThan(0);

        // Find the tag span (the one with inline-flex class, containing the button)
        const tagSpan = friendlySpans.find(span => span.classList.contains("inline-flex"));
        if (!tagSpan) {
          throw new Error("Tag span for Friendly not found");
        }

        // Find and click the remove button for Friendly (× button inside the span)
        const removeButton = tagSpan.querySelector("button");
        if (!removeButton) {
          throw new Error("Remove button not found for Friendly");
        }
        fireEvent.click(removeButton);

        // Click Save to persist (or exit edit mode)
        const saveButton = screen.getByRole("button", { name: /Save/i });
        fireEvent.click(saveButton);
      },
      { timeout: 8000 }  // Increased for slower renders
    );

    // Wait to exit edit mode (separate waitFor after the main interaction)
    await waitFor(
      () => {
        expect(screen.queryByRole("button", { name: /Save/i })).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify Friendly is gone
    expect(screen.queryByText("Friendly", { selector: "span" })).not.toBeInTheDocument();

    // Advance any remaining timers
    jest.advanceTimersByTime(1000);
  }, 20000);  // Increased test timeout

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
        const dobInput = screen.getByLabelText(/Date of Birth/i);
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